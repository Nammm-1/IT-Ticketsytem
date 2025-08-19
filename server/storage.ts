import {
  users,
  tickets,
  ticketComments,
  knowledgeArticles,
  ticketAttachments,
  type User,
  type UpsertUser,
  type InsertTicket,
  type Ticket,
  type TicketWithRelations,
  type InsertComment,
  type TicketComment,
  type InsertKnowledgeArticle,
  type KnowledgeArticle,
  type InsertAttachment,
  type TicketAttachment,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, sql, ilike, count } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Ticket operations
  createTicket(ticket: InsertTicket): Promise<Ticket>;
  getTicket(id: string): Promise<TicketWithRelations | undefined>;
  getTickets(filters?: {
    status?: string;
    priority?: string;
    category?: string;
    assignedToId?: string;
    createdById?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<TicketWithRelations[]>;
  updateTicket(id: string, updates: Partial<InsertTicket>): Promise<Ticket>;
  assignTicket(ticketId: string, assignedToId: string): Promise<void>;
  
  // Comment operations
  addComment(comment: InsertComment): Promise<TicketComment>;
  getTicketComments(ticketId: string): Promise<(TicketComment & { user: User })[]>;
  
  // Knowledge base operations
  createKnowledgeArticle(article: InsertKnowledgeArticle): Promise<KnowledgeArticle>;
  getKnowledgeArticles(filters?: {
    category?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<KnowledgeArticle[]>;
  getKnowledgeArticle(id: string): Promise<KnowledgeArticle | undefined>;
  
  // Attachment operations
  addAttachment(attachment: InsertAttachment): Promise<TicketAttachment>;
  getTicketAttachments(ticketId: string): Promise<(TicketAttachment & { uploadedBy: User })[]>;
  
  // Analytics operations
  getTicketMetrics(): Promise<{
    openTickets: number;
    avgResolutionTime: number; // in hours
    slaCompliance: number; // percentage
    criticalIssues: number;
  }>;
  
  getTeamStatus(): Promise<{
    id: string;
    name: string;
    activeTickets: number;
    status: 'available' | 'busy';
  }[]>;
  
  getSLAPerformance(): Promise<{
    critical: { percentage: number };
    high: { percentage: number };
    medium: { percentage: number };
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Ticket operations
  async createTicket(ticket: InsertTicket): Promise<Ticket> {
    const [newTicket] = await db.insert(tickets).values(ticket).returning();
    return newTicket;
  }

  async getTicket(id: string): Promise<TicketWithRelations | undefined> {
    const result = await db
      .select()
      .from(tickets)
      .leftJoin(users, eq(tickets.createdById, users.id))
      .where(eq(tickets.id, id));
    
    if (!result.length) return undefined;
    
    const ticket = result[0].tickets;
    const createdBy = result[0].users!;
    
    // Get assigned user if exists
    let assignedTo: User | null = null;
    if (ticket.assignedToId) {
      const assignedUser = await this.getUser(ticket.assignedToId);
      assignedTo = assignedUser || null;
    }
    
    // Get comments
    const comments = await this.getTicketComments(id);
    
    // Get attachments
    const attachments = await this.getTicketAttachments(id);
    
    return {
      ...ticket,
      createdBy,
      assignedTo,
      comments,
      attachments,
    };
  }

  async getTickets(filters?: {
    status?: string;
    priority?: string;
    category?: string;
    assignedToId?: string;
    createdById?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<TicketWithRelations[]> {
    let query = db
      .select()
      .from(tickets)
      .leftJoin(users, eq(tickets.createdById, users.id))
      .orderBy(desc(tickets.createdAt));

    const conditions = [];
    
    if (filters?.status) {
      conditions.push(eq(tickets.status, filters.status as any));
    }
    if (filters?.priority) {
      conditions.push(eq(tickets.priority, filters.priority as any));
    }
    if (filters?.category) {
      conditions.push(eq(tickets.category, filters.category as any));
    }
    if (filters?.assignedToId) {
      conditions.push(eq(tickets.assignedToId, filters.assignedToId));
    }
    if (filters?.createdById) {
      conditions.push(eq(tickets.createdById, filters.createdById));
    }
    if (filters?.search) {
      conditions.push(
        or(
          ilike(tickets.title, `%${filters.search}%`),
          ilike(tickets.description, `%${filters.search}%`)
        )
      );
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    if (filters?.limit) {
      query = query.limit(filters.limit) as any;
    }
    if (filters?.offset) {
      query = query.offset(filters.offset) as any;
    }

    const result = await query;
    
    // Transform to TicketWithRelations
    const ticketsWithRelations = await Promise.all(
      result.map(async (row) => {
        const ticket = row.tickets;
        const createdBy = row.users!;
        
        let assignedTo: User | null = null;
        if (ticket.assignedToId) {
          const assignedUser = await this.getUser(ticket.assignedToId);
          assignedTo = assignedUser || null;
        }
        
        return {
          ...ticket,
          createdBy,
          assignedTo,
          comments: [],
          attachments: [],
        };
      })
    );
    
    return ticketsWithRelations;
  }

  async updateTicket(id: string, updates: Partial<InsertTicket>): Promise<Ticket> {
    const [updatedTicket] = await db
      .update(tickets)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(tickets.id, id))
      .returning();
    return updatedTicket;
  }

  async assignTicket(ticketId: string, assignedToId: string): Promise<void> {
    await db
      .update(tickets)
      .set({ assignedToId, updatedAt: new Date() })
      .where(eq(tickets.id, ticketId));
  }

  // Comment operations
  async addComment(comment: InsertComment): Promise<TicketComment> {
    const [newComment] = await db.insert(ticketComments).values(comment).returning();
    return newComment;
  }

  async getTicketComments(ticketId: string): Promise<(TicketComment & { user: User })[]> {
    const result = await db
      .select()
      .from(ticketComments)
      .leftJoin(users, eq(ticketComments.userId, users.id))
      .where(eq(ticketComments.ticketId, ticketId))
      .orderBy(ticketComments.createdAt);

    return result.map(row => ({
      ...row.ticket_comments,
      user: row.users!,
    }));
  }

  // Knowledge base operations
  async createKnowledgeArticle(article: InsertKnowledgeArticle): Promise<KnowledgeArticle> {
    const [newArticle] = await db.insert(knowledgeArticles).values(article).returning();
    return newArticle;
  }

  async getKnowledgeArticles(filters?: {
    category?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<KnowledgeArticle[]> {
    let query = db.select().from(knowledgeArticles).orderBy(desc(knowledgeArticles.createdAt));

    const conditions = [];
    
    if (filters?.category) {
      conditions.push(eq(knowledgeArticles.category, filters.category as any));
    }
    if (filters?.search) {
      conditions.push(
        or(
          ilike(knowledgeArticles.title, `%${filters.search}%`),
          ilike(knowledgeArticles.content, `%${filters.search}%`)
        )
      );
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    if (filters?.limit) {
      query = query.limit(filters.limit) as any;
    }
    if (filters?.offset) {
      query = query.offset(filters.offset) as any;
    }

    return await query;
  }

  async getKnowledgeArticle(id: string): Promise<KnowledgeArticle | undefined> {
    const [article] = await db.select().from(knowledgeArticles).where(eq(knowledgeArticles.id, id));
    return article;
  }

  // Attachment operations
  async addAttachment(attachment: InsertAttachment): Promise<TicketAttachment> {
    const [newAttachment] = await db.insert(ticketAttachments).values(attachment).returning();
    return newAttachment;
  }

  async getTicketAttachments(ticketId: string): Promise<(TicketAttachment & { uploadedBy: User })[]> {
    const result = await db
      .select()
      .from(ticketAttachments)
      .leftJoin(users, eq(ticketAttachments.uploadedById, users.id))
      .where(eq(ticketAttachments.ticketId, ticketId))
      .orderBy(ticketAttachments.createdAt);

    return result.map(row => ({
      ...row.ticket_attachments,
      uploadedBy: row.users!,
    }));
  }

  // Analytics operations
  async getTicketMetrics(): Promise<{
    openTickets: number;
    avgResolutionTime: number;
    slaCompliance: number;
    criticalIssues: number;
  }> {
    // Get open tickets count
    const [openTicketsResult] = await db
      .select({ count: count() })
      .from(tickets)
      .where(and(
        eq(tickets.status, 'new'),
        eq(tickets.status, 'in_progress'),
        eq(tickets.status, 'pending')
      ));

    // Get critical issues count
    const [criticalIssuesResult] = await db
      .select({ count: count() })
      .from(tickets)
      .where(and(
        eq(tickets.priority, 'critical'),
        or(
          eq(tickets.status, 'new'),
          eq(tickets.status, 'in_progress'),
          eq(tickets.status, 'pending')
        )
      ));

    // Calculate average resolution time for resolved tickets in the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const resolvedTickets = await db
      .select({
        createdAt: tickets.createdAt,
        resolvedAt: tickets.resolvedAt,
      })
      .from(tickets)
      .where(and(
        eq(tickets.status, 'resolved'),
        sql`${tickets.resolvedAt} >= ${thirtyDaysAgo}`
      ));

    let avgResolutionTime = 0;
    if (resolvedTickets.length > 0) {
      const totalResolutionTime = resolvedTickets.reduce((total, ticket) => {
        if (ticket.resolvedAt && ticket.createdAt) {
          const diff = ticket.resolvedAt.getTime() - ticket.createdAt.getTime();
          return total + (diff / (1000 * 60 * 60)); // Convert to hours
        }
        return total;
      }, 0);
      avgResolutionTime = totalResolutionTime / resolvedTickets.length;
    }

    // Calculate SLA compliance (simplified - tickets resolved within expected time)
    const slaCompliance = 94; // Placeholder - would need SLA rules defined

    return {
      openTickets: openTicketsResult.count,
      avgResolutionTime: Math.round(avgResolutionTime * 10) / 10,
      slaCompliance,
      criticalIssues: criticalIssuesResult.count,
    };
  }

  async getTeamStatus(): Promise<{
    id: string;
    name: string;
    activeTickets: number;
    status: 'available' | 'busy';
  }[]> {
    const itStaff = await db
      .select()
      .from(users)
      .where(or(eq(users.role, 'it_staff'), eq(users.role, 'manager')));

    const teamStatus = await Promise.all(
      itStaff.map(async (user) => {
        const [activeTicketsResult] = await db
          .select({ count: count() })
          .from(tickets)
          .where(and(
            eq(tickets.assignedToId, user.id),
            or(
              eq(tickets.status, 'new'),
              eq(tickets.status, 'in_progress'),
              eq(tickets.status, 'pending')
            )
          ));

        const activeTickets = activeTicketsResult.count;
        const status = activeTickets > 3 ? 'busy' : 'available';
        const name = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'Unknown';

        return {
          id: user.id,
          name,
          activeTickets,
          status: status as 'available' | 'busy',
        };
      })
    );

    return teamStatus;
  }

  async getSLAPerformance(): Promise<{
    critical: { percentage: number };
    high: { percentage: number };
    medium: { percentage: number };
  }> {
    // Simplified SLA performance calculation
    // In a real system, this would be based on actual SLA rules and deadlines
    return {
      critical: { percentage: 100 },
      high: { percentage: 87 },
      medium: { percentage: 96 },
    };
  }
}

export const storage = new DatabaseStorage();
