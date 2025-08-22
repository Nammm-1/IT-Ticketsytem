import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from 'drizzle-orm';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User roles enum
export const userRoleEnum = pgEnum('user_role', ['end_user', 'it_staff', 'manager', 'admin']);

// Ticket categories enum
export const ticketCategoryEnum = pgEnum('ticket_category', ['hardware', 'software', 'network', 'access', 'other']);

// Ticket priorities enum
export const ticketPriorityEnum = pgEnum('ticket_priority', ['low', 'medium', 'high', 'critical']);

// Ticket statuses enum
export const ticketStatusEnum = pgEnum('ticket_status', ['new', 'in_progress', 'pending', 'resolved', 'closed']);

// User storage table (required for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  password: varchar("password"), // Store hashed passwords
  role: userRoleEnum('role').default('end_user').notNull(),
  is_active: integer('is_active').default(1).notNull(),
  // Password reset fields
  resetToken: varchar("reset_token"),
  resetTokenExpiry: timestamp("reset_token_expiry"),
  // User account settings
  phone: varchar("phone"),
  timezone: varchar("timezone").default('UTC'),
  language: varchar("language").default('en'),
  theme: varchar("theme").default('auto'),
  compactMode: integer("compact_mode").default(0), // 0 = false, 1 = true
  emailNotifications: integer("email_notifications").default(1), // 0 = false, 1 = true
  pushNotifications: integer("push_notifications").default(1), // 0 = false, 1 = true
  smsNotifications: integer("sms_notifications").default(0), // 0 = false, 1 = true
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Contact preference enum
export const contactPreferenceEnum = pgEnum('contact_preference', ['email', 'phone', 'both']);

// Tickets table
export const tickets = pgTable("tickets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  category: ticketCategoryEnum('category').notNull(),
  priority: ticketPriorityEnum('priority').notNull(),
  status: ticketStatusEnum('status').default('new').notNull(),
  createdById: varchar("created_by_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  assignedToId: varchar("assigned_to_id").references(() => users.id, { onDelete: 'set null' }),
  // Contact Information Fields
  contactPhone: varchar("contact_phone", { length: 20 }),
  contactPreference: contactPreferenceEnum('contact_preference').default('email'),
  bestTimeToContact: varchar("best_time_to_contact", { length: 100 }),
  location: varchar("location", { length: 100 }),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Ticket comments table
export const ticketComments = pgTable("ticket_comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ticketId: varchar("ticket_id").notNull().references(() => tickets.id, { onDelete: 'cascade' }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  content: text("content").notNull(),
  isInternal: integer("is_internal").default(0).notNull(), // 0 = public, 1 = internal note
  createdAt: timestamp("created_at").defaultNow(),
});

// Knowledge base articles table
export const knowledgeArticles = pgTable("knowledge_articles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  category: ticketCategoryEnum('category').notNull(),
  tags: text("tags").array(),
  createdById: varchar("created_by_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Ticket attachments table
export const ticketAttachments = pgTable("ticket_attachments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ticketId: varchar("ticket_id").notNull().references(() => tickets.id, { onDelete: 'cascade' }),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  filePath: varchar("file_path", { length: 500 }).notNull(),
  fileSize: integer("file_size").notNull(),
  mimeType: varchar("mime_type", { length: 100 }).notNull(),
  uploadedById: varchar("uploaded_by_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp("created_at").defaultNow(),
});

// In-app notifications table
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: varchar("type", { length: 50 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  data: jsonb("data"),
  isRead: integer("is_read").default(0).notNull(), // 0 = unread, 1 = read
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  createdTickets: many(tickets, { relationName: "createdTickets" }),
  assignedTickets: many(tickets, { relationName: "assignedTickets" }),
  comments: many(ticketComments),
  knowledgeArticles: many(knowledgeArticles),
  attachments: many(ticketAttachments),
}));

export const ticketsRelations = relations(tickets, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [tickets.createdById],
    references: [users.id],
    relationName: "createdTickets",
  }),
  assignedTo: one(users, {
    fields: [tickets.assignedToId],
    references: [users.id],
    relationName: "assignedTickets",
  }),
  comments: many(ticketComments),
  attachments: many(ticketAttachments),
}));

export const ticketCommentsRelations = relations(ticketComments, ({ one }) => ({
  ticket: one(tickets, {
    fields: [ticketComments.ticketId],
    references: [tickets.id],
  }),
  user: one(users, {
    fields: [ticketComments.userId],
    references: [users.id],
  }),
}));

export const knowledgeArticlesRelations = relations(knowledgeArticles, ({ one }) => ({
  createdBy: one(users, {
    fields: [knowledgeArticles.createdById],
    references: [users.id],
  }),
}));

export const ticketAttachmentsRelations = relations(ticketAttachments, ({ one }) => ({
  ticket: one(tickets, {
    fields: [ticketAttachments.ticketId],
    references: [tickets.id],
  }),
  uploadedBy: one(users, {
    fields: [ticketAttachments.uploadedById],
    references: [users.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertTicketSchema = createInsertSchema(tickets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  resolvedAt: true,
});

export const insertCommentSchema = createInsertSchema(ticketComments).omit({
  id: true,
  createdAt: true,
});

export const insertKnowledgeArticleSchema = createInsertSchema(knowledgeArticles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAttachmentSchema = createInsertSchema(ticketAttachments).omit({
  id: true,
  createdAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertTicket = z.infer<typeof insertTicketSchema>;
export type Ticket = typeof tickets.$inferSelect;
export type InsertComment = z.infer<typeof insertCommentSchema>;
export type TicketComment = typeof ticketComments.$inferSelect;
export type InsertKnowledgeArticle = z.infer<typeof insertKnowledgeArticleSchema>;
export type KnowledgeArticle = typeof knowledgeArticles.$inferSelect;
export type InsertAttachment = z.infer<typeof insertAttachmentSchema>;
export type TicketAttachment = typeof ticketAttachments.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;

// Ticket with relations type
export type TicketWithRelations = Ticket & {
  createdBy: User;
  assignedTo?: User | null;
  comments: (TicketComment & { user: User })[];
  attachments: (TicketAttachment & { uploadedBy: User })[];
};
