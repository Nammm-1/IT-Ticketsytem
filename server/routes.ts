import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { emailService } from "./emailService";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertTicketSchema, insertCommentSchema, insertKnowledgeArticleSchema, insertAttachmentSchema } from "@shared/schema";
import { z } from "z";
import multer from "multer";
import path from "path";
import fs from "fs";
import { db } from "./db";
import { sql } from "drizzle-orm";
import { eq } from "drizzle-orm";
import { users } from "../shared/schema";

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
  // Simple Server-Sent Events (SSE) hub
  const sseClients = new Set<any>();
  const sseBroadcast = (event: any) => {
    const payload = `data: ${JSON.stringify(event)}\n\n`;
    for (const client of sseClients) {
      try { client.write(payload); } catch {}
    }
  };

  // Auth middleware
  await setupAuth(app);
  // Realtime events stream (SSE)
  app.get('/api/events', isAuthenticated, (req: any, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();
    res.write(`data: ${JSON.stringify({ type: 'connected' })}\n\n`);
    sseClients.add(res);
    req.on('close', () => {
      sseClients.delete(res);
      try { res.end(); } catch {}
    });
  });

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
      // Broadcast ticket created
      sseBroadcast({ type: 'ticket_created', ticketId: ticket.id });
      // Notify creator
      try {
        await storage.createNotification({
          userId,
          type: 'ticket_created',
          title: 'Ticket Created',
          message: `Your ticket "${ticket.title}" was created successfully`,
          data: { ticketId: ticket.id },
        } as any);
        sseBroadcast({ type: 'notification', userId, ticketId: ticket.id });
        // Email creator
        const creator = await storage.getUser(userId);
        if (creator?.email) {
          const ticketUrl = `${req.protocol}://${req.get('host')}/ticket/${ticket.id}`;
          await emailService.sendTicketCreatedEmail({
            to: creator.email,
            ticketTitle: ticket.title,
            ticketId: ticket.id,
            ticketUrl,
          });
        }
        // Notify all IT staff (email + in-app), so anyone can pick it up
        try {
          const allUsers = await storage.getAllUsers();
          const itStaff = allUsers.filter(u => u.role === 'it_staff' && u.email);
          const ticketUrlForStaff = `${req.protocol}://${req.get('host')}/ticket/${ticket.id}`;
          for (const staff of itStaff) {
            if (staff.id !== userId) {
              await storage.createNotification({
                userId: staff.id,
                type: 'ticket_new_unassigned',
                title: 'New Ticket Submitted',
                message: `New ticket "${ticket.title}" requires triage`,
                data: { ticketId: ticket.id },
              } as any);
              sseBroadcast({ type: 'notification', userId: staff.id, ticketId: ticket.id });
              await emailService.sendTicketCreatedEmail({
                to: staff.email!,
                ticketTitle: ticket.title,
                ticketId: ticket.id,
                ticketUrl: ticketUrlForStaff,
              });
            }
          }
        } catch (e) { console.warn('Notify IT staff failed:', e); }
      } catch (e) { console.warn('Notif ticket_created failed:', e); }
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
      sseBroadcast({ type: 'ticket_assigned', ticketId: ticket.id, assignedToId });
      // Notify assignee and creator
      try {
        await storage.createNotification({
          userId: assignedToId,
          type: 'ticket_assigned',
          title: 'New Ticket Assigned',
          message: `You have been assigned ticket "${ticket.title}"`,
          data: { ticketId: ticket.id },
        } as any);
        sseBroadcast({ type: 'notification', userId: assignedToId, ticketId: ticket.id });
        await storage.createNotification({
          userId: ticket.createdById,
          type: 'ticket_assigned_creator',
          title: 'Ticket Assigned',
          message: `Your ticket "${ticket.title}" was assigned to ${assignedUser.firstName || assignedUser.email}`,
          data: { ticketId: ticket.id },
        } as any);
        sseBroadcast({ type: 'notification', userId: ticket.createdById, ticketId: ticket.id });
        // Emails
        const ticketUrl = `${req.protocol}://${req.get('host')}/ticket/${ticket.id}`;
        const assignee = await storage.getUser(assignedToId);
        if (assignee?.email) {
          await emailService.sendTicketAssignedEmail({ to: assignee.email, ticketTitle: ticket.title, ticketId: ticket.id, ticketUrl });
        }
        const creator = await storage.getUser(ticket.createdById);
        if (creator?.email) {
          const assigneeName = assignee?.firstName || assignee?.email || 'IT Staff';
          await emailService.sendTicketAssignedEmail({ to: creator.email, ticketTitle: ticket.title, ticketId: ticket.id, ticketUrl, assigneeName });
        }
      } catch (e) { console.warn('Notif ticket_assigned failed:', e); }
      
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
      sseBroadcast({ type: 'ticket_commented', ticketId: ticket.id });
      // Notify creator and assignee (if different than commenter)
      try {
        const targets = new Set<string>();
        if (ticket.createdById) targets.add(ticket.createdById);
        if (ticket.assignedToId) targets.add(ticket.assignedToId);
        targets.delete(userId);
        for (const targetUserId of targets) {
          await storage.createNotification({
            userId: targetUserId,
            type: 'ticket_commented',
            title: 'New Comment',
            message: `New comment on ticket "${ticket.title}"`,
            data: { ticketId: ticket.id },
          } as any);
          sseBroadcast({ type: 'notification', userId: targetUserId, ticketId: ticket.id });
          const targetUser = await storage.getUser(targetUserId);
          if (targetUser?.email) {
            const commenter = await storage.getUser(userId);
            const commenterName = commenter?.firstName || commenter?.email;
            const ticketUrl = `${req.protocol}://${req.get('host')}/ticket/${ticket.id}`;
            await emailService.sendTicketCommentEmail({ to: targetUser.email, ticketTitle: ticket.title, ticketId: ticket.id, ticketUrl, commenterName });
          }
        }
      } catch (e) { console.warn('Notif ticket_commented failed:', e); }
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

  app.put('/api/knowledge-base/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const user = await storage.getUser(userId);
      
      // Only IT staff, managers, and admins can edit knowledge articles
      if (!user || !['it_staff', 'manager', 'admin'].includes(user.role)) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const articleId = req.params.id;
      const existingArticle = await storage.getKnowledgeArticle(articleId);
      
      if (!existingArticle) {
        return res.status(404).json({ message: "Article not found" });
      }
      
      const articleData = insertKnowledgeArticleSchema.partial().parse({
        ...req.body,
        updatedAt: new Date(),
      });
      
      const updatedArticle = await storage.updateKnowledgeArticle(articleId, articleData);
      res.json(updatedArticle);
    } catch (error) {
      console.error("Error updating knowledge article:", error);
      res.status(400).json({ message: "Failed to update knowledge article" });
    }
  });

  app.delete('/api/knowledge-base/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const user = await storage.getUser(userId);
      
      // Only IT staff, managers, and admins can delete knowledge articles
      if (!user || !['it_staff', 'manager', 'admin'].includes(user.role)) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const articleId = req.params.id;
      const existingArticle = await storage.getKnowledgeArticle(articleId);
      
      if (!existingArticle) {
        return res.status(404).json({ message: "Article not found" });
      }
      
      await storage.deleteKnowledgeArticle(articleId);
      res.json({ message: "Article deleted successfully" });
    } catch (error) {
      console.error("Error deleting knowledge article:", error);
      res.status(500).json({ message: "Failed to delete knowledge article" });
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

  // Notifications API
  app.get('/api/notifications', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const onlyUnread = (req.query.unread === 'true');
      const notifications = await storage.getUserNotifications(userId, onlyUnread, 50);
      res.json(notifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      res.status(500).json({ message: 'Failed to fetch notifications' });
    }
  });

  app.post('/api/notifications/:id/read', isAuthenticated, async (req: any, res) => {
    try {
      const notificationId = req.params.id;
      await storage.markNotificationRead(notificationId);
      res.json({ success: true });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      res.status(500).json({ message: 'Failed to update notification' });
    }
  });

  app.delete('/api/notifications/clear', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      await storage.clearUserNotifications(userId);
      res.json({ success: true, message: 'All notifications cleared' });
    } catch (error) {
      console.error('Error clearing notifications:', error);
      res.status(500).json({ message: 'Failed to clear notifications' });
    }
  });

  // User Management API
  app.get('/api/users', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const user = await storage.getUser(userId);
      
      // Only admins can view all users
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied. Admin role required." });
      }
      
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ message: 'Failed to fetch users' });
    }
  });

  app.post('/api/users', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const user = await storage.getUser(userId);
      
      // Only admins can create users
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied. Admin role required." });
      }
      
      const { firstName, lastName, email, role, is_active = true } = req.body;
      
      // Validate required fields
      if (!firstName || !lastName || !email || !role) {
        return res.status(400).json({ message: "All fields are required" });
      }
      
      // Create user
      const newUser = await storage.createUser({
        firstName,
        lastName,
        email,
        role,
        is_active
      });
      
      // Send welcome email using the correct method
      let emailResult = { success: false, message: "Email service not available" };
      try {
        emailResult = await emailService.sendUserCreationEmail({
          to: email,
          firstName,
          lastName,
          email,
          tempPassword: "temp123", // This should be generated properly
          loginUrl: `${req.protocol}://${req.get('host')}/api/login`
        });
      } catch (emailError) {
        console.error('Email service error:', emailError);
        emailResult = { success: false, message: "Failed to send welcome email" };
      }
      
      res.status(201).json({
        ...newUser,
        emailResult
      });
    } catch (error) {
      console.error('Error creating user:', error);
      res.status(500).json({ message: 'Failed to create user' });
    }
  });

  app.put('/api/users/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const user = await storage.getUser(userId);
      
      // Only admins can update users
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied. Admin role required." });
      }
      
      const targetUserId = req.params.id;
      const updateData = req.body;
      
      console.log(`API: Updating user ${targetUserId}`);
      console.log(`API: Raw request body:`, req.body);
      console.log(`API: Parsed updateData:`, updateData);
      console.log(`API: updateData keys:`, Object.keys(updateData));
      console.log(`API: is_active value:`, updateData.is_active);
      console.log(`API: Type of is_active:`, typeof updateData.is_active);
      console.log(`API: Action type:`, updateData._action);
      
      // If this is a toggle request, ensure is_active is included
      if (updateData._action === 'toggle_status') {
        console.log(`API: Processing toggle status request for user ${targetUserId}`);
        if (typeof updateData.is_active === 'undefined') {
          console.log(`API: ERROR: is_active field missing from toggle request!`);
          return res.status(400).json({ message: 'Missing is_active field for toggle request' });
        }
        console.log(`API: Toggle request validated - is_active: ${updateData.is_active}`);
      }
      
      // Remove the action marker before updating
      const cleanUpdateData = { ...updateData };
      delete cleanUpdateData._action;
      
      // Update user
      const updatedUser = await storage.updateUser(targetUserId, cleanUpdateData);
      console.log(`API: User ${targetUserId} updated successfully:`, updatedUser);
      
      res.json(updatedUser);
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(500).json({ message: 'Failed to update user' });
    }
  });

  // Dedicated endpoint for toggling user status (bypasses broken update logic)
  app.patch('/api/users/:id/toggle-status', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const adminUser = await storage.getUser(userId);
      
      // Only admins can toggle user status
      if (!adminUser || adminUser.role !== 'admin') {
        return res.status(403).json({ message: "Access denied. Admin role required." });
      }
      
      const targetUserId = req.params.id;
      const targetUser = await storage.getUser(targetUserId);
      
      if (!targetUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Toggle the status
      const newStatus = targetUser.is_active === 1 ? 0 : 1;
      
      console.log(`🔧 TOGGLE STATUS: User ${targetUser.email} status changing from ${targetUser.is_active} to ${newStatus}`);
      
      // Use direct Drizzle update to bypass the broken update logic
      const [updatedUser] = await db
        .update(users)
        .set({ 
          is_active: newStatus, 
          updatedAt: new Date() 
        })
        .where(eq(users.id, targetUserId))
        .returning();
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      console.log(`🔧 TOGGLE STATUS: Successfully updated user ${targetUser.email} to status ${newStatus}`);
      
      res.json({
        success: true,
        message: `User ${targetUser.email} is now ${newStatus === 1 ? 'active' : 'inactive'}`,
        user: updatedUser,
        newStatus: newStatus
      });
      
    } catch (error) {
      console.error('Error toggling user status:', error);
      res.status(500).json({ message: 'Failed to toggle user status' });
    }
  });

  app.delete('/api/users/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const user = await storage.getUser(userId);
      
      // Only admins can delete users
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied. Admin role required." });
      }
      
      const targetUserId = req.params.id;
      
      // Delete user completely
      await storage.deleteUser(targetUserId);
      res.json({ success: true, message: "User deleted successfully" });
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({ message: 'Failed to delete user' });
    }
  });

  // Get user by ID (users can only access their own data)
  app.get('/api/users/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      console.log('GET /api/users/:id - Session userId:', userId, 'Requested id:', req.params.id);
      
      const requestingUser = await storage.getUser(userId);
      console.log('Requesting user found:', !!requestingUser, 'User ID:', requestingUser?.id);
      
      // Users can only access their own data
      if (!requestingUser || requestingUser.id !== req.params.id) {
        console.log('Access denied - ID mismatch:', { sessionId: userId, requestedId: req.params.id, userDbId: requestingUser?.id });
        return res.status(403).json({ message: "Access denied. You can only view your own data." });
      }
      
      const userData = await storage.getUser(req.params.id);
      if (!userData) {
        console.log('User not found in database for ID:', req.params.id);
        return res.status(404).json({ message: "User not found" });
      }
      
      console.log('Successfully returning user data for ID:', req.params.id);
      res.json(userData);
    } catch (error) {
      console.error('Error fetching user:', error);
      res.status(500).json({ message: 'Failed to fetch user data' });
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

  // User Settings Routes
  app.get('/api/users/:id/settings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      console.log('GET /api/users/:id/settings - Session userId:', userId, 'Requested id:', req.params.id);
      
      const requestingUser = await storage.getUser(userId);
      console.log('Requesting user found:', !!requestingUser, 'User ID:', requestingUser?.id);
      
      // Users can only access their own settings
      if (!requestingUser || requestingUser.id !== req.params.id) {
        console.log('Access denied - ID mismatch:', { sessionId: userId, requestedId: req.params.id, userDbId: requestingUser?.id });
        return res.status(403).json({ message: "Access denied. You can only view your own settings." });
      }
      
      const userSettings = await storage.getUserSettings(req.params.id);
      if (!userSettings) {
        console.log('User settings not found in database for ID:', req.params.id);
        return res.status(404).json({ message: "User not found" });
      }
      
      console.log('Successfully returning user settings for ID:', req.params.id);
      res.json(userSettings);
    } catch (error) {
      console.error('Error fetching user settings:', error);
      res.status(500).json({ message: 'Failed to fetch user settings' });
    }
  });

  app.put('/api/users/:id/settings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const requestingUser = await storage.getUser(userId);
      
      // Users can only update their own settings
      if (!requestingUser || requestingUser.id !== req.params.id) {
        return res.status(403).json({ message: "Access denied. You can only update your own settings." });
      }
      
      const updateData = req.body;
      
      // Only allow updating specific settings fields
      const allowedFields = [
        'firstName', 'lastName', 'email', 'phone', 'timezone', 'language', 
        'theme', 'compactMode', 'emailNotifications', 'pushNotifications', 'smsNotifications'
      ];
      
      const filteredUpdates: any = {};
      allowedFields.forEach(field => {
        if (updateData.hasOwnProperty(field)) {
          // Convert boolean fields to integers for database
          if (['compactMode', 'emailNotifications', 'pushNotifications', 'smsNotifications'].includes(field)) {
            filteredUpdates[field] = updateData[field] ? 1 : 0;
          } else {
            filteredUpdates[field] = updateData[field];
          }
        }
      });
      
      if (Object.keys(filteredUpdates).length === 0) {
        return res.status(400).json({ message: "No valid fields to update" });
      }
      
      const updatedUser = await storage.updateUserSettings(req.params.id, filteredUpdates);
      res.json(updatedUser);
    } catch (error) {
      console.error('Error updating user settings:', error);
      res.status(500).json({ message: 'Failed to update user settings' });
    }
  });

  app.put('/api/users/:id/password', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const requestingUser = await storage.getUser(userId);
      
      // Users can only change their own password
      if (!requestingUser || requestingUser.id !== req.params.id) {
        return res.status(403).json({ message: "Access denied. You can only change your own password." });
      }
      
      const { currentPassword, newPassword } = req.body;
      
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Current password and new password are required" });
      }
      
      if (newPassword.length < 8) {
        return res.status(400).json({ message: "New password must be at least 8 characters long" });
      }
      
      // In a real app, you would verify the current password here
      // For now, we'll simulate successful password change
      const success = await storage.updateUserPassword(req.params.id, currentPassword, newPassword);
      
      if (success) {
        res.json({ message: "Password updated successfully" });
      } else {
        res.status(400).json({ message: "Failed to update password" });
      }
    } catch (error) {
      console.error('Error changing password:', error);
      res.status(500).json({ message: 'Failed to change password' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
