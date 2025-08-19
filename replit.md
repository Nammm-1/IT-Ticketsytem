# IT Department Ticketing System

## Overview

This is a comprehensive IT Department Ticketing System built as a full-stack web application. The system enables organizations to streamline their IT support process by providing a centralized platform for creating, tracking, and resolving IT-related issues. The application supports role-based access control with different user types (end users, IT staff, managers, and admins) and includes features like ticket management, knowledge base, analytics dashboards, and SLA tracking.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The frontend is built using **React 18** with **TypeScript** and follows a modern component-based architecture:

- **UI Framework**: Utilizes **shadcn/ui** components built on top of **Radix UI** primitives for accessible, customizable components
- **Styling**: **Tailwind CSS** with CSS variables for theming and dark mode support
- **Routing**: **Wouter** for lightweight client-side routing
- **State Management**: **TanStack Query (React Query)** for server state management and caching
- **Form Handling**: **React Hook Form** with **Zod** validation schemas
- **Build Tool**: **Vite** for fast development and optimized production builds

The application uses a page-based architecture with main sections for dashboard, tickets, ticket creation, and knowledge base. Components are organized in a modular structure with reusable UI components, layout components, and feature-specific components.

### Backend Architecture
The backend follows a **Node.js/Express** architecture pattern:

- **Runtime**: **Node.js** with **TypeScript** and **ESM** modules
- **Web Framework**: **Express.js** for REST API endpoints
- **Database ORM**: **Drizzle ORM** with **PostgreSQL** (configured for Neon serverless)
- **Authentication**: **Replit Auth** with **OpenID Connect** integration using Passport.js
- **Session Management**: **PostgreSQL-backed sessions** using connect-pg-simple
- **API Structure**: RESTful endpoints organized by feature (tickets, auth, analytics, knowledge base)

The server implements a storage abstraction layer that encapsulates all database operations, making it easy to maintain and test. Route handlers are separated into logical groups with proper middleware for authentication and error handling.

### Data Storage Architecture
The system uses **PostgreSQL** as the primary database with the following key design decisions:

- **Schema Management**: **Drizzle Kit** for database migrations and schema management
- **Type Safety**: Generated TypeScript types from database schema using Drizzle
- **Connection Handling**: **Neon serverless** driver with WebSocket support for edge deployments
- **Session Storage**: Dedicated sessions table for secure authentication state

The database schema includes tables for users, tickets, comments, knowledge articles, attachments, and sessions. Enums are used for standardized values like ticket status, priority, and categories.

### Authentication and Authorization
The system implements enterprise-grade authentication:

- **Identity Provider**: **Replit Auth** with OpenID Connect for secure authentication
- **Session Management**: Server-side sessions stored in PostgreSQL with configurable TTL
- **Role-Based Access Control**: Four user roles (end_user, it_staff, manager, admin) with different permissions
- **API Security**: All API endpoints protected with authentication middleware
- **Error Handling**: Graceful handling of unauthorized access with automatic re-authentication

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL database connection for serverless environments
- **drizzle-orm**: Type-safe ORM for database operations
- **express**: Web application framework for the backend API
- **passport**: Authentication middleware with OpenID Connect strategy

### Frontend Dependencies
- **@tanstack/react-query**: Server state management and caching
- **@radix-ui/***: Accessible UI primitive components
- **tailwindcss**: Utility-first CSS framework
- **wouter**: Lightweight routing library
- **react-hook-form**: Form handling and validation
- **zod**: Schema validation library

### Development Dependencies
- **vite**: Frontend build tool and development server
- **typescript**: Type safety across the entire application
- **tsx**: TypeScript execution for Node.js development
- **esbuild**: Fast bundling for production builds

### Third-Party Services
- **Replit Authentication**: External OAuth provider for user authentication
- **Neon Database**: Serverless PostgreSQL hosting service
- **Replit Deployment**: Platform-specific deployment and runtime environment

The system is designed to be easily deployable on Replit's platform while maintaining compatibility with other cloud providers through its modular architecture and environment-based configuration.