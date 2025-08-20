import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertTicketSchema, insertCommentSchema, insertKnowledgeArticleSchema, insertAttachmentSchema } from "@shared/schema";
import { z } from "z";
import multer from "multer";
import path from "path";
import fs from "fs";

// Configure multer for file uploads
const storageConfig = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storageConfig,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
      'text/plain',
      'text/csv',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/log'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images, documents, and text files are allowed.'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Helper: get user ID from session (session-based auth only)
  const getUserId = (req: any): string => {
    const sessionUserId = (req.session as any).userId;
    if (sessionUserId) return sessionUserId;
    // Fallback if any legacy middleware set req.user
    return req.user?.claims?.sub;
  };

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Ticket routes
  app.post('/api/tickets', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const ticketData = insertTicketSchema.parse({
        ...req.body,
        createdById: userId,
      });
      
      const ticket = await storage.createTicket(ticketData);
      res.json(ticket);
    } catch (error) {
      console.error("Error creating ticket:", error);
      res.status(400).json({ message: "Failed to create ticket" });
    }
  });

  app.get('/api/tickets', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const user = await storage.getUser(userId);
      
      console.log('User requesting tickets:', { userId, userRole: user?.role, userEmail: user?.email });
      
      const filters: any = {};
      
      // Apply role-based filtering
      if (user?.role === 'end_user') {
        filters.createdById = userId;
        console.log('Applying end_user filter - only showing tickets created by:', userId);
      } else {
        console.log('User has elevated role, showing all tickets');
      }
      
      // Apply query filters
      if (req.query.status && req.query.status !== 'all') filters.status = req.query.status;
      if (req.query.priority && req.query.priority !== 'all') filters.priority = req.query.priority;
      if (req.query.category && req.query.category !== 'all') filters.category = req.query.category;
      if (req.query.assignedToId) filters.assignedToId = req.query.assignedToId;
      if (req.query.search) filters.search = req.query.search;
      if (req.query.limit) filters.limit = parseInt(req.query.limit as string);
      if (req.query.offset) filters.offset = parseInt(req.query.offset as string);
      
      console.log('Final filters applied:', filters);
      
      const tickets = await storage.getTickets(filters);
      console.log('Tickets returned:', tickets.length);
      
      res.json(tickets);
    } catch (error) {
      console.error("Error fetching tickets:", error);
      res.status(500).json({ message: "Failed to fetch tickets" });
    }
  });

  app.get('/api/tickets/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const user = await storage.getUser(userId);
      const ticket = await storage.getTicket(req.params.id);
      
      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }
      
      // Check permissions
      if (user?.role === 'end_user' && ticket.createdById !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      res.json(ticket);
    } catch (error) {
      console.error("Error fetching ticket:", error);
      res.status(500).json({ message: "Failed to fetch ticket" });
    }
  });

  app.patch('/api/tickets/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const user = await storage.getUser(userId);
      
      // Only IT staff, managers, and admins can update tickets
      if (!user || !['it_staff', 'manager', 'admin'].includes(user.role)) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const updates = req.body;
      if (updates.status === 'resolved') {
        updates.resolvedAt = new Date();
      }
      
      const ticket = await storage.updateTicket(req.params.id, updates);
      res.json(ticket);
    } catch (error) {
      console.error("Error updating ticket:", error);
      res.status(400).json({ message: "Failed to update ticket" });
    }
  });

  app.delete('/api/tickets/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const user = await storage.getUser(userId);
      const ticket = await storage.getTicket(req.params.id);
      
      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }
      
      // Check permissions - users can only delete their own tickets if they're new
      if (user?.role === 'end_user') {
        if (ticket.createdById !== userId) {
          return res.status(403).json({ message: "You can only delete your own tickets" });
        }
        if (ticket.status !== 'new') {
          return res.status(403).json({ message: "You can only delete new tickets" });
        }
      } else if (!['it_staff', 'manager', 'admin'].includes(user?.role || '')) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Delete the ticket (this will cascade delete comments and attachments)
      await storage.deleteTicket(req.params.id);
      
      res.json({ message: "Ticket deleted successfully" });
    } catch (error) {
      console.error("Error deleting ticket:", error);
      res.status(500).json({ message: "Failed to delete ticket" });
    }
  });

  // Ticket assignment endpoint
  app.post('/api/tickets/:id/assign', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const user = await storage.getUser(userId);
      
      // Only IT staff, managers, and admins can assign tickets
      if (!user || !['it_staff', 'manager', 'admin'].includes(user.role)) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const { assignedToId } = req.body;
      if (!assignedToId) {
        return res.status(400).json({ message: "assignedToId is required" });
      }
      
      // Verify the assigned user exists and has appropriate role
      const assignedUser = await storage.getUser(assignedToId);
      if (!assignedUser) {
        return res.status(404).json({ message: "Assigned user not found" });
      }
      
      if (!['it_staff', 'manager', 'admin'].includes(assignedUser.role)) {
        return res.status(400).json({ message: "Can only assign tickets to IT staff, managers, or admins" });
      }
      
      const ticket = await storage.updateTicket(req.params.id, { 
        assignedToId,
        status: 'in_progress' // Automatically change status when assigned
      });
      
      res.json(ticket);
    } catch (error) {
      console.error("Error assigning ticket:", error);
      res.status(500).json({ message: "Failed to assign ticket" });
    }
  });



  // Comment routes
  app.post('/api/tickets/:id/comments', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const user = await storage.getUser(userId);
      const ticket = await storage.getTicket(req.params.id);
      
      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }
      
      // Check permissions for internal notes
      const isInternal = req.body.isInternal ? 1 : 0;
      if (isInternal && user?.role === 'end_user') {
        return res.status(403).json({ message: "Cannot create internal notes" });
      }
      
      const commentData = insertCommentSchema.parse({
        ticketId: req.params.id,
        userId,
        content: req.body.content,
        isInternal,
      });
      
      const comment = await storage.addComment(commentData);
      res.json(comment);
    } catch (error) {
      console.error("Error adding comment:", error);
      res.status(400).json({ message: "Failed to add comment" });
    }
  });

  // Attachment routes
  app.post('/api/tickets/:id/attachments', isAuthenticated, upload.array('attachments', 10), async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const ticketId = req.params.id;
      
      // Check if ticket exists
      const ticket = await storage.getTicket(ticketId);
      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }
      
      // Check permissions
      if (ticket.createdById !== userId && !['it_staff', 'manager', 'admin'].includes(ticket.assignedTo?.role || '')) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: "No files uploaded" });
      }
      
      const attachments = [];
      for (const file of req.files as Express.Multer.File[]) {
        const attachmentData = insertAttachmentSchema.parse({
          ticketId,
          fileName: file.originalname,
          filePath: file.path,
          fileSize: file.size,
          mimeType: file.mimetype,
          uploadedById: userId,
        });
        
        const attachment = await storage.addAttachment(attachmentData);
        attachments.push(attachment);
      }
      
      res.json({ message: "Attachments uploaded successfully", attachments });
    } catch (error) {
      console.error("Error uploading attachments:", error);
      res.status(400).json({ message: "Failed to upload attachments" });
    }
  });

  app.get('/api/tickets/:id/attachments/:attachmentId/download', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const ticketId = req.params.id;
      const attachmentId = req.params.attachmentId;
      
      // Check if ticket exists
      const ticket = await storage.getTicket(ticketId);
      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }
      
      // Check permissions
      if (ticket.createdById !== userId && !['it_staff', 'manager', 'admin'].includes(ticket.assignedTo?.role || '')) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Get attachment
      const attachment = await storage.getAttachment(attachmentId);
      if (!attachment || attachment.ticketId !== ticketId) {
        return res.status(404).json({ message: "Attachment not found" });
      }
      
      // Check if file exists
      if (!fs.existsSync(attachment.filePath)) {
        return res.status(404).json({ message: "File not found" });
      }
      
      // Set headers and send file
      res.setHeader('Content-Type', attachment.mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${attachment.fileName}"`);
      res.sendFile(attachment.filePath);
    } catch (error) {
      console.error("Error downloading attachment:", error);
      res.status(500).json({ message: "Failed to download attachment" });
    }
  });

  app.delete('/api/tickets/:id/attachments/:attachmentId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const ticketId = req.params.id;
      const attachmentId = req.params.attachmentId;
      
      // Check if ticket exists
      const ticket = await storage.getTicket(ticketId);
      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }
      
      // Check permissions
      if (ticket.createdById !== userId && !['it_staff', 'manager', 'admin'].includes(ticket.assignedTo?.role || '')) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Get attachment
      const attachment = await storage.getAttachment(attachmentId);
      if (!attachment || attachment.ticketId !== ticketId) {
        return res.status(404).json({ message: "Attachment not found" });
      }
      
      // Delete file from filesystem
      if (fs.existsSync(attachment.filePath)) {
        fs.unlinkSync(attachment.filePath);
      }
      
      // Delete from database
      await storage.deleteAttachment(attachmentId);
      
      res.json({ message: "Attachment deleted successfully" });
    } catch (error) {
      console.error("Error deleting attachment:", error);
      res.status(500).json({ message: "Failed to delete attachment" });
    }
  });

  // Knowledge base routes
  app.get('/api/knowledge-base', async (req, res) => {
    try {
      const filters: any = {};
      if (req.query.category && req.query.category !== 'all') filters.category = req.query.category;
      if (req.query.search) filters.search = req.query.search;
      if (req.query.limit) filters.limit = parseInt(req.query.limit as string);
      if (req.query.offset) filters.offset = parseInt(req.query.offset as string);
      
      const articles = await storage.getKnowledgeArticles(filters);
      res.json(articles);
    } catch (error) {
      console.error("Error fetching knowledge articles:", error);
      res.status(500).json({ message: "Failed to fetch knowledge articles" });
    }
  });

  app.get('/api/knowledge-base/:id', async (req, res) => {
    try {
      const article = await storage.getKnowledgeArticle(req.params.id);
      if (!article) {
        return res.status(404).json({ message: "Article not found" });
      }
      res.json(article);
    } catch (error) {
      console.error("Error fetching knowledge article:", error);
      res.status(500).json({ message: "Failed to fetch knowledge article" });
    }
  });

  app.post('/api/knowledge-base', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const user = await storage.getUser(userId);
      
      // Only IT staff, managers, and admins can create knowledge articles
      if (!user || !['it_staff', 'manager', 'admin'].includes(user.role)) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const articleData = insertKnowledgeArticleSchema.parse({
        ...req.body,
        createdById: userId,
      });
      
      const article = await storage.createKnowledgeArticle(articleData);
      res.json(article);
    } catch (error) {
      console.error("Error creating knowledge article:", error);
      res.status(400).json({ message: "Failed to create knowledge article" });
    }
  });

  // Analytics routes
  app.get('/api/analytics/metrics', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const user = await storage.getUser(userId);
      
      // Only IT staff, managers, and admins can view analytics
      if (!user || !['it_staff', 'manager', 'admin'].includes(user.role)) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const metrics = await storage.getTicketMetrics();
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching metrics:", error);
      res.status(500).json({ message: "Failed to fetch metrics" });
    }
  });

  app.get('/api/analytics/team-status', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const user = await storage.getUser(userId);
      
      // Only IT staff, managers, and admins can view team status
      if (!user || !['it_staff', 'manager', 'admin'].includes(user.role)) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const teamStatus = await storage.getTeamStatus();
      res.json(teamStatus);
    } catch (error) {
      console.error("Error fetching team status:", error);
      res.status(500).json({ message: "Failed to fetch team status" });
    }
  });

  app.get('/api/analytics/sla-performance', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const user = await storage.getUser(userId);
      
      // Only IT staff, managers, and admins can view SLA performance
      if (!user || !['it_staff', 'manager', 'admin'].includes(user.role)) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const slaPerformance = await storage.getSLAPerformance();
      res.json(slaPerformance);
    } catch (error) {
      console.error("Error fetching SLA performance:", error);
      res.status(500).json({ message: "Failed to fetch SLA performance" });
    }
  });

  // Get IT staff for assignment
  app.get('/api/users/it-staff', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const user = await storage.getUser(userId);
      
      // Only IT staff, managers, and admins can view staff list
      if (!user || !['it_staff', 'manager', 'admin'].includes(user.role)) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const teamStatus = await storage.getTeamStatus();
      res.json(teamStatus);
    } catch (error) {
      console.error("Error fetching IT staff:", error);
      res.status(500).json({ message: "Failed to fetch IT staff" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
