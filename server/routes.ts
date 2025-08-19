import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertTicketSchema, insertCommentSchema, insertKnowledgeArticleSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      const filters: any = {};
      
      // Apply role-based filtering
      if (user?.role === 'end_user') {
        filters.createdById = userId;
      }
      
      // Apply query filters
      if (req.query.status) filters.status = req.query.status;
      if (req.query.priority) filters.priority = req.query.priority;
      if (req.query.category) filters.category = req.query.category;
      if (req.query.assignedToId) filters.assignedToId = req.query.assignedToId;
      if (req.query.search) filters.search = req.query.search;
      if (req.query.limit) filters.limit = parseInt(req.query.limit as string);
      if (req.query.offset) filters.offset = parseInt(req.query.offset as string);
      
      const tickets = await storage.getTickets(filters);
      res.json(tickets);
    } catch (error) {
      console.error("Error fetching tickets:", error);
      res.status(500).json({ message: "Failed to fetch tickets" });
    }
  });

  app.get('/api/tickets/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
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

  app.post('/api/tickets/:id/assign', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      // Only IT staff, managers, and admins can assign tickets
      if (!user || !['it_staff', 'manager', 'admin'].includes(user.role)) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const { assignedToId } = req.body;
      await storage.assignTicket(req.params.id, assignedToId);
      res.json({ message: "Ticket assigned successfully" });
    } catch (error) {
      console.error("Error assigning ticket:", error);
      res.status(400).json({ message: "Failed to assign ticket" });
    }
  });

  // Comment routes
  app.post('/api/tickets/:id/comments', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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

  // Knowledge base routes
  app.get('/api/knowledge-base', async (req, res) => {
    try {
      const filters: any = {};
      if (req.query.category) filters.category = req.query.category;
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
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
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
