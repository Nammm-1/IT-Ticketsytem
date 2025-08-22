export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  createdAt?: string;
  updatedAt?: string;
  last_login?: string;
  is_active?: boolean | number;
}

export interface Ticket {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  category: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  createdBy: {
    id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
  };
  assignedTo?: {
    id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    role?: string;
  };
  // Contact Information
  contactPhone?: string;
  contactPreference?: string;
  bestTimeToContact?: string;
  location?: string;
  comments: Comment[];
  attachments: Attachment[];
}

export interface Comment {
  id: string;
  content: string;
  createdAt: string;
  createdBy: {
    id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
  };
}

export interface Attachment {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  createdAt: string;
  url: string;
}

export interface AnalyticsMetrics {
  openTickets: number;
  avgResolutionTime: number;
  slaCompliance: number;
  criticalIssues: number;
}

export interface SLAPerformance {
  critical: { percentage: number };
  high: { percentage: number };
  medium: { percentage: number };
  low: { percentage: number };
}

export interface TeamMember {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  role: string;
  ticketsAssigned: number;
  ticketsResolved: number;
  ticketsInProgress: number;
  ticketsPending: number;
  avgResolutionTime: number;
  workloadPercentage: number;
  lastActive: string;
}

export interface WorkloadMetrics {
  totalTeamMembers: number;
  totalTickets: number;
  avgWorkload: number;
  overloadedMembers: number;
  underutilizedMembers: number;
  balancedWorkload: number;
}

export interface TicketDistribution {
  status: string;
  count: number;
  percentage: number;
  color: string;
}

export interface KnowledgeArticle {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
  };
}
