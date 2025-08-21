# 🎫 Bowie State University - IT Support Ticketing System

A comprehensive, full-stack IT support ticketing system built with modern web technologies for Bowie State University. Streamline your IT support process with a centralized platform for creating, tracking, and resolving IT-related issues.

## ✨ Features

- **🎫 Ticket Management**: Create, assign, track, and resolve IT support tickets
- **👥 Role-Based Access Control**: Four user roles with different permissions
- **📊 Analytics Dashboard**: Real-time metrics, SLA tracking, and team performance
- **📚 Knowledge Base**: Centralized repository for IT documentation
- **📧 Email Notifications**: Automated welcome emails and password resets
- **🔒 Secure Authentication**: Session-based auth with role-based permissions
- **📱 Responsive Design**: Mobile-friendly interface
- **🔍 Advanced Filtering**: Search and filter tickets by various criteria
- **📎 File Attachments**: Support for ticket-related files
- **💬 Comments & Notes**: Internal and public communication system

## 🏗️ Architecture

### Frontend
- **React 18** with **TypeScript**
- **shadcn/ui** components built on **Radix UI** primitives
- **Tailwind CSS** with dark mode support
- **Wouter** for lightweight routing
- **TanStack Query** for state management
- **React Hook Form** with **Zod** validation
- **Vite** for fast development

### Backend
- **Node.js** with **TypeScript** and **ESM** modules
- **Express.js** for REST API endpoints
- **Drizzle ORM** with **PostgreSQL**
- **Session-based authentication** with role-based access control
- **PostgreSQL-backed sessions**

### Database
- **PostgreSQL** with **Drizzle ORM**
- **TypeScript type generation** from database schema
- **Drizzle Kit** for migrations and schema management
- **Neon serverless** PostgreSQL support

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL database
- SMTP email service (Gmail, Outlook, etc.)

### Installation

1. **Clone and install**
```bash
git clone <repository-url>
cd HelpDesk
npm install
```

2. **Environment setup**
```bash
# Copy example environment file
cp .env.example .env

# Configure your settings
DATABASE_URL=postgres://username:password@localhost:5432/helpdesk
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

3. **Database setup**
```bash
npm run db:push
```

4. **Start development server**
```bash
npm run dev
```

5. **Start with ngrok tunnel (optional)**
```bash
npm run dev:tunnel
```

## 📋 Available Scripts

- `npm run dev` - Start development server
- `npm run dev:tunnel` - Start server with ngrok tunnel
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run db:push` - Push database schema changes
- `npm run check` - TypeScript type checking

## 👥 User Roles & Permissions

### 🔴 End User
- Create and manage own tickets
- View ticket status and updates
- Access knowledge base articles
- Add comments to tickets

### 🟡 IT Staff
- All end user permissions
- Assign and resolve tickets
- Access to team analytics
- Manage ticket priorities
- Internal notes and comments

### 🟠 Manager
- All IT staff permissions
- Team performance oversight
- SLA monitoring and reporting
- User management capabilities

### 🟢 Admin
- All system permissions
- User creation and management
- System configuration
- Full database access
- Account activation/deactivation

## 🔧 Configuration

### Email Setup (Gmail Recommended)

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate App Password**:
   - Go to Google Account Settings → Security
   - Under "2-Step Verification", click "App passwords"
   - Generate new app password for "Mail"
   - Copy the 16-character password

3. **Add to `.env`**:
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-char-app-password
```

### Database Configuration

```bash
# PostgreSQL connection string
DATABASE_URL=postgres://username:password@localhost:5432/helpdesk

# Session storage
SESSION_SECRET=your-secret-key-here
```

## 🎯 Core System Components

### Dashboard
- Real-time ticket metrics
- Team performance analytics
- SLA compliance tracking
- Recent activity feed
- User statistics

### Ticket Management
- Multi-priority system (Low, Medium, High, Critical)
- Category-based organization (Hardware, Software, Network, Access, Other)
- Status tracking (New, In Progress, Pending, Resolved, Closed)
- File attachment support
- Internal notes and public comments
- Assignment and escalation

### Knowledge Base
- Article categorization
- Rich text editing
- Search functionality
- Version control
- Author attribution

### User Management
- Role assignment and management
- Account activation/deactivation
- Password management and resets
- User statistics and activity tracking
- Bulk operations for admins

## 🔒 Security Features

- **Session-based authentication** with PostgreSQL storage
- **Role-based access control** for all endpoints
- **Account deactivation** system for security
- **Secure password handling** with temporary passwords
- **Protected API routes** with authentication middleware
- **CSRF protection** and secure headers
- **Input validation** with Zod schemas

## 📊 Performance & Scalability

- **Optimized database queries** with Drizzle ORM
- **Efficient caching** with TanStack Query
- **Real-time updates** with WebSocket support
- **Responsive UI** with Tailwind CSS
- **Type safety** across the entire stack
- **Database connection pooling**
- **Optimized file uploads**

## 🛠️ Development

### Project Structure
```
HelpDesk/
├── client/              # React frontend
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── pages/       # Page components
│   │   ├── hooks/       # Custom React hooks
│   │   └── types/       # TypeScript type definitions
├── server/              # Node.js backend
│   ├── routes/          # API route handlers
│   ├── storage/         # Database operations
│   └── middleware/      # Express middleware
├── shared/              # Shared types and schemas
├── scripts/             # Development scripts
└── uploads/             # File uploads
```

### Key Technologies
- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express, Drizzle ORM
- **Database**: PostgreSQL with Neon serverless support
- **Authentication**: Session-based with role management
- **Email**: Nodemailer with SMTP support
- **Build Tools**: Vite, esbuild, TypeScript

## 🚨 Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Find process using port 5001
lsof -ti:5001

# Kill the process
kill -9 $(lsof -ti:5001)

# Or use different port
PORT=5002 npm run dev
```

#### Email Not Sending
1. **Check SMTP configuration** in `.env`
2. **Verify Gmail app password** is correct
3. **Ensure 2-Factor Authentication** is enabled
4. **Check server logs** for SMTP errors

#### Database Connection Issues
1. **Verify DATABASE_URL** in `.env`
2. **Check PostgreSQL service** is running
3. **Run database migrations**: `npm run db:push`
4. **Check connection permissions**

#### Authentication Problems
1. **Verify session configuration**
2. **Check database connection**
3. **Clear browser cookies/cache**
4. **Check server logs** for auth errors

### Debug Tools
- **Server logs** with detailed request/response information
- **Database query logging** with Drizzle ORM
- **Email service status** indicators
- **Authentication flow** tracking
- **Browser console** logging for frontend issues

## 🔮 Future Enhancements

- **Real-time notifications** with WebSocket
- **Advanced reporting** and analytics
- **Mobile app** development
- **API rate limiting** and security
- **Multi-tenant support**
- **Advanced workflow automation**
- **Integration APIs** for third-party tools
- **Advanced search** and filtering
- **Bulk operations** and batch processing

## 📝 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Support

### Getting Help
- Check the troubleshooting section above
- Review server logs for error details
- Verify environment configuration
- Test individual system components

### Development Support
- **TypeScript errors**: Run `npm run check`
- **Database issues**: Check Drizzle migrations
- **Build problems**: Clear `node_modules` and reinstall
- **Port conflicts**: Use different ports or kill existing processes

## 🎉 Getting Started Checklist

- [ ] Install Node.js 18+
- [ ] Set up PostgreSQL database
- [ ] Configure environment variables
- [ ] Install dependencies (`npm install`)
- [ ] Set up database schema (`npm run db:push`)
- [ ] Configure email service
- [ ] Start development server (`npm run dev`)
- [ ] Create first admin user
- [ ] Test ticket creation and management
- [ ] Verify email notifications
- [ ] Test user roles and permissions

---

