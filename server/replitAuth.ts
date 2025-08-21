import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";
import { DatabaseStorage, IStorage } from "./storage";
import { emailService } from "./emailService";

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true, // Ensure sessions table is created
    ttl: sessionTtl,
    tableName: "sessions",
  });
  
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: !isDevelopment, // Use secure cookies only in production
      maxAge: sessionTtl,
    },
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());
  console.log('🔧 Using session-based authentication');

  app.get("/api/login", (req, res) => {
      res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>HelpDesk - Sign In</title>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body {
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background: #f9fafb;
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 20px;
            }
            
            .login-container {
              background: #ffffff;
              border: 2px solid #e5e7eb;
              border-radius: 24px;
              box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
              padding: 48px;
              width: 100%;
              max-width: 420px;
              position: relative;
              overflow: hidden;
            }
            
            .login-container::before {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              height: 4px;
              background: #374151;
            }
            
            .logo {
              text-align: center;
              margin-bottom: 32px;
            }
            
            .logo-icon {
              width: 64px;
              height: 64px;
              background: #374151;
              border-radius: 16px;
              display: flex;
              align-items: center;
              justify-content: center;
              margin: 0 auto 16px;
              box-shadow: 0 8px 32px rgba(55, 65, 81, 0.3);
            }
            
            .logo-icon svg {
              width: 32px;
              height: 32px;
              fill: white;
            }
            
            .logo h1 {
              color: #1f2937;
              font-size: 28px;
              font-weight: 700;
              margin-bottom: 4px;
            }
            
            .logo p {
              color: #6b7280;
              font-size: 16px;
              font-weight: 400;
            }
            
            .form-group {
              margin-bottom: 24px;
            }
            
            .form-group label {
              display: block;
              color: #1f2937;
              font-size: 14px;
              font-weight: 500;
              margin-bottom: 8px;
            }
            
            .form-group input {
              width: 100%;
              padding: 16px;
              border: 2px solid #e5e7eb;
              border-radius: 12px;
              font-size: 16px;
              font-family: inherit;
              transition: all 0.2s ease;
              background: #ffffff;
            }
            
            .form-group input:focus {
              outline: none;
              border-color: #374151;
              box-shadow: 0 0 0 3px rgba(55, 65, 81, 0.1);
            }
            
            .form-group input::placeholder {
              color: #ffffff;
            }
            
            .submit-btn {
              width: 100%;
              padding: 16px;
              background: #374151;
              color: #ffffff;
              border: none;
              border-radius: 12px;
              font-size: 16px;
              font-weight: 600;
              font-family: inherit;
              cursor: pointer;
              transition: all 0.2s ease;
              margin-bottom: 24px;
            }
            
            .submit-btn:hover {
              transform: translateY(-2px);
              box-shadow: 0 8px 25px rgba(55, 65, 81, 0.4);
              background: #4b5563;
            }
            
            .submit-btn:active {
              transform: translateY(0);
            }
            
            .credentials-info {
              background: #f3f4f6;
              border-radius: 12px;
              padding: 20px;
              text-align: center;
              border: 1px solid #e5e7eb;
            }
            
            .credentials-info h3 {
              color: #1f2937;
              font-size: 16px;
              font-weight: 600;
              margin-bottom: 12px;
            }
            
            .credentials-info p {
              color: #6b7280;
              font-size: 14px;
              margin-bottom: 8px;
            }
            
            .credentials-info .credential {
              background: #374151;
              border: 2px solid #1f2937;
              border-radius: 8px;
              padding: 8px 12px;
              margin: 4px;
              display: inline-block;
              font-family: 'Monaco', 'Menlo', monospace;
              font-size: 13px;
              color: #ffffff;
            }
            
            .signup-link {
              text-align: center;
              margin: 24px 0;
              color: #6b7280;
              font-size: 14px;
            }
            
            .signup-link a {
              color: #1f2937;
              text-decoration: none;
              font-weight: 500;
            }
            
            .signup-link a:hover {
              text-decoration: underline;
            }
            
            .footer {
              text-align: center;
              margin-top: 24px;
              color: #9ca3af;
              font-size: 14px;
            }
            
            .footer a {
              color: #1f2937;
              text-decoration: none;
              font-weight: 500;
            }
            
            .footer a:hover {
              text-decoration: underline;
            }
            
            @media (max-width: 480px) {
              .login-container {
                padding: 32px 24px;
                margin: 20px;
              }
              
              .logo h1 {
                font-size: 24px;
              }
            }
            
            /* Animation for page load */
            .login-container {
              animation: slideUp 0.6s ease-out;
            }
            
            @keyframes slideUp {
              from {
                opacity: 0;
                transform: translateY(30px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
            
            /* Hover effects */
            .form-group input:hover {
              border-color: #d1d5db;
            }
            
            .submit-btn:disabled {
              opacity: 0.6;
              cursor: not-allowed;
              transform: none;
            }
          </style>
        </head>
        <body>
          <div class="login-container">
            <div class="logo">
              <div class="logo-icon">
                <svg viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              </div>
              <h1>HelpDesk</h1>
              <p>Support Ticket Management System</p>
            </div>
            
            <form action="/api/login" method="post" id="loginForm">
              <div class="form-group">
                <label for="email">Email</label>
                <input 
                  type="email" 
                  id="email" 
                  name="email" 
                  placeholder="Enter your email address"
                  required
                  autocomplete="email"
                >
              </div>
              
              <div class="form-group">
                <label for="password">Password</label>
                <input 
                  type="password" 
                  id="password" 
                  name="password" 
                  placeholder="Enter your password"
                  required
                  autocomplete="current-password"
                >
              </div>
              
              <button type="submit" class="submit-btn" id="submitBtn">
                Sign In
              </button>
            </form>
            
            <div class="credentials-info">
              <h3>🔧 Development Mode</h3>
              <p>Use any email and password for testing:</p>
              <div>
                <span class="credential">Email: admin@example.com</span>
                <span class="credential">Password: any</span>
              </div>
            </div>
            
            <div class="signup-link">
              <p>Don't have an account? <a href="/api/signup">Create one here</a></p>
            </div>
            
            <div class="footer">
              <p>This is a development environment</p>
              <p>For production, configure <a href="#" onclick="alert('See AUTH0_SETUP.md for production configuration')">OIDC authentication</a></p>
            </div>
          </div>
          
          <script>
            // Form handling with loading state
            const form = document.getElementById('loginForm');
            const submitBtn = document.getElementById('submitBtn');
            
            form.addEventListener('submit', function(e) {
              submitBtn.disabled = true;
              submitBtn.textContent = 'Signing In...';
              
              // Add loading animation
              submitBtn.style.background = 'linear-gradient(135deg, #9ca3af, #6b7280)';
            });
            
            // Auto-focus email field
            document.getElementById('email').focus();
            
            // Enter key navigation
            document.getElementById('email').addEventListener('keypress', function(e) {
              if (e.key === 'Enter') {
                document.getElementById('password').focus();
              }
            });
            
            document.getElementById('password').addEventListener('keypress', function(e) {
              if (e.key === 'Enter') {
                form.submit();
              }
            });
          </script>
        </body>
        </html>
      `);
  });

  // Development authentication (for testing)
  if (process.env.NODE_ENV === 'development' && process.env.DEV_AUTH === 'true') {
    console.log('🔧 Using development authentication');
    
    app.post('/api/login', async (req, res) => {
      try {
        const { email, password } = req.body;
        
        if (!email || !password) {
          return res.status(400).json({ message: 'Email and password are required' });
        }
        
        // Find user by email (case-insensitive)
        const user = await storage.getUserByEmail(email);
        
        if (!user) {
          return res.status(401).json({ message: 'Invalid credentials' });
        }
        
        // CRITICAL SECURITY CHECK: Block deactivated users
        if (user.is_active === 0) {
          console.log(`🚫 LOGIN BLOCKED: Deactivated user ${email} attempted to login via dev auth`);
          return res.status(401).json({ 
            message: "Account is deactivated. Please contact an administrator to reactivate your account.",
            code: "ACCOUNT_DEACTIVATED"
          });
        }
        
        // Check if user has a stored password or use development passwords
        if (user.password === password || password === 'dev123' || password === 'temp123') {
          // Set up session
          (req.session as any).userId = user.id;
          (req.session as any).userRole = user.role;
          (req.session as any).userEmail = user.email;
          
          await new Promise<void>((resolve, reject) => {
            req.session.save((err) => {
              if (err) reject(err);
              else resolve();
            });
          });
          
          console.log(`✅ Login successful: ${email} (${user.role})`);
          
          // Redirect to dashboard (root path in React app)
          res.redirect('/');
        } else {
          res.status(401).json({ message: 'Invalid credentials' });
        }
      } catch (error) {
        console.error('Development login error:', error);
        res.status(500).json({ message: 'Internal server error' });
      }
    });
  }

  // Middleware to check if user is active (can be used to protect other routes)
  const checkUserActive = async (req: any, res: any, next: any) => {
    try {
      const userId = (req.session as any).userId;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        req.session.destroy(() => {});
        return res.status(401).json({ message: "User not found" });
      }
      
      // Check if user is active
      if (user.is_active === 0) {
        console.log(`🚫 ACCESS BLOCKED: Deactivated user ${user.email} attempted to access protected route`);
        req.session.destroy(() => {});
        return res.status(401).json({ 
          message: "Account is deactivated. Please contact an administrator to reactivate your account.",
          code: "ACCOUNT_DEACTIVATED"
        });
      }
      
      // Add user info to request for use in route handlers
      (req as any).user = user;
      next();
    } catch (error) {
      console.error('Error in checkUserActive middleware:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  };

  // Test endpoint to manually deactivate a user (for testing security)
  app.post("/api/test/deactivate-user/:email", async (req, res) => {
    try {
      const { email } = req.params;
      console.log(`🧪 TEST: Attempting to deactivate user: ${email}`);
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Manually set user to inactive
      const updatedUser = await storage.updateUser(user.id, {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        is_active: 0
      });
      
      console.log(`🧪 TEST: User ${email} deactivated successfully`);
      res.json({ 
        message: "User deactivated for testing",
        user: updatedUser
      });
    } catch (error) {
      console.error('Error deactivating user:', error);
      res.status(500).json({ message: "Failed to deactivate user" });
    }
  });

  // Test endpoint to manually reactivate a user (for testing security)
  app.post("/api/test/reactivate-user/:email", async (req, res) => {
    try {
      const { email } = req.params;
      console.log(`🧪 TEST: Attempting to reactivate user: ${email}`);
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Manually set user to active
      const updatedUser = await storage.updateUser(user.id, {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        is_active: 1
      });
      
      console.log(`🧪 TEST: User ${email} reactivated successfully`);
      res.json({ 
        message: "User reactivated for testing",
        user: updatedUser
      });
    } catch (error) {
      console.error('Error reactivating user:', error);
      res.status(500).json({ message: "Failed to reactivate user" });
    }
  });

  // Session authentication endpoint
  app.post("/api/login", async (req, res) => {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      // For development, accept any email/password combination
      // In production, this would validate against the database
      
      try {
        // Check if user already exists in database
        const existingUser = await storage.getUserByEmail(email);
        
        let devUser;
        if (existingUser) {
          // CRITICAL SECURITY CHECK: Block deactivated users
          if (existingUser.is_active === 0) {
            console.log(`🚫 LOGIN BLOCKED: Deactivated user ${email} attempted to login`);
            return res.status(401).json({ 
              message: "Account is deactivated. Please contact an administrator to reactivate your account.",
              code: "ACCOUNT_DEACTIVATED"
            });
          }
          
          // Use existing user's data and role
          devUser = {
            id: existingUser.id,
            email: existingUser.email,
            firstName: existingUser.firstName,
            lastName: existingUser.lastName,
            role: existingUser.role,
            createdAt: existingUser.createdAt,
            updatedAt: existingUser.updatedAt
          };
          console.log(`Using existing user: ${email} with role: ${existingUser.role}`);
        } else {
          // Create new user with default role
          devUser = {
            id: email, // Use email as ID for development
            email: email,
            firstName: email.split('@')[0], // Extract name from email
            lastName: 'User',
            role: 'end_user' as const, // Default to end_user for new users
            createdAt: new Date(),
            updatedAt: new Date()
          };
          console.log(`Creating new user: ${email} with default role: end_user`);
        }

        // Create session using the correct session properties
        (req.session as any).userId = devUser.id;
        (req.session as any).userEmail = devUser.email;
        (req.session as any).userRole = devUser.role;

        // Set up the user object with claims that match the OIDC format
        (req as any).user = {
          claims: {
            sub: devUser.id,
            email: devUser.email,
            given_name: devUser.firstName,
            family_name: devUser.lastName,
            role: devUser.role
          },
          expires_at: Math.floor(Date.now() / 1000) + (3600 * 24 * 7) // 7 days
        };

        // Save the session before redirecting
        req.session.save((err) => {
          if (err) {
            console.error('Error saving session:', err);
            return res.status(500).json({ message: "Login failed" });
          }
          
          console.log(`Development login successful: ${email} (${devUser.role})`);
          
          // Redirect to dashboard
          res.redirect('/');
        });
      } catch (error) {
        console.error('Error during development login:', error);
        res.status(500).json({ message: "Login failed" });
      }
  });

  // Authentication check endpoint
  app.get("/api/auth/user", async (req, res) => {
      // Check if user is logged in via session
      const userId = (req.session as any).userId;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      try {
        // Get user from database to check if they're still active
        const user = await storage.getUser(userId);
        if (!user) {
          // Clear invalid session
          req.session.destroy(() => {});
          return res.status(401).json({ message: "User not found" });
        }
        
        // CRITICAL SECURITY CHECK: Block deactivated users from accessing protected routes
        if (user.is_active === 0) {
          console.log(`🚫 ACCESS BLOCKED: Deactivated user ${user.email} attempted to access protected route`);
          // Clear the session
          req.session.destroy(() => {});
          return res.status(401).json({ 
            message: "Account is deactivated. Please contact an administrator to reactivate your account.",
            code: "ACCOUNT_DEACTIVATED"
          });
        }

        // Return user information from database (not just session)
        const userInfo = {
          id: user.id,
          email: user.email,
          firstName: user.firstName || user.email?.split('@')[0] || 'User',
          lastName: user.lastName || 'User',
          role: user.role || (req.session as any).userRole || 'admin',
          createdAt: user.createdAt || new Date(),
          updatedAt: user.updatedAt || new Date()
        };

        res.json(userInfo);
      } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ message: "Failed to fetch user" });
      }
  });

    // Test endpoint to verify role logic
  app.get("/api/test-role/:email", async (req, res) => {

      const { email } = req.params;
      
      try {
        // Check if user already exists in database
        const existingUser = await storage.getUserByEmail(email);
        
        if (existingUser) {
          res.json({
            message: "User found",
            user: {
              id: existingUser.id,
              email: existingUser.email,
              firstName: existingUser.firstName,
              lastName: existingUser.lastName,
              role: existingUser.role
            }
          });
        } else {
          res.json({
            message: "User not found, would create with default role: end_user",
            defaultRole: 'end_user'
          });
        }
      } catch (error) {
        console.error('Error testing role logic:', error);
        res.status(500).json({ message: "Error testing role logic" });
      }
  });

  app.get("/api/signup", (req, res) => {
      res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>HelpDesk - Sign Up</title>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body {
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background: #f9fafb;
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 20px;
            }
            
            .signup-container {
              background: #ffffff;
              border: 2px solid #e5e7eb;
              border-radius: 24px;
              box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
              padding: 48px;
              width: 100%;
              max-width: 480px;
              position: relative;
              overflow: hidden;
            }
            
            .signup-container::before {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              height: 4px;
              background: #374151;
            }
            
            .logo {
              text-align: center;
              margin-bottom: 32px;
            }
            
            .logo-icon {
              width: 64px;
              height: 64px;
              background: #374151;
              border-radius: 16px;
              display: flex;
              align-items: center;
              justify-content: center;
              margin: 0 auto 16px;
              box-shadow: 0 8px 32px rgba(55, 65, 81, 0.3);
            }
            
            .logo-icon svg {
              width: 32px;
              height: 32px;
              fill: white;
            }
            
            .logo h1 {
              color: #1f2937;
              font-size: 28px;
              font-weight: 700;
              margin-bottom: 4px;
            }
            
            .logo p {
              color: #6b7280;
              font-size: 16px;
              font-weight: 400;
            }
            
            .form-group {
              margin-bottom: 20px;
            }
            
            .form-row {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 16px;
            }
            
            .form-group label {
              display: block;
              color: #1f2937;
              font-size: 14px;
              font-weight: 500;
              margin-bottom: 8px;
            }
            
            .form-group input, .form-group select {
              width: 100%;
              padding: 16px;
              border: 2px solid #e5e7eb;
              border-radius: 12px;
              font-size: 16px;
              font-family: inherit;
              transition: all 0.2s ease;
              background: #ffffff;
            }
            
            .form-group input:focus, .form-group select:focus {
              outline: none;
              border-color: #374151;
              box-shadow: 0 0 0 3px rgba(55, 65, 81, 0.1);
            }
            
            .form-group input::placeholder {
              color: #6b7280;
            }
            
            .submit-btn {
              width: 100%;
              padding: 16px;
              background: #374151;
              color: #ffffff;
              border: none;
              border-radius: 12px;
              font-size: 16px;
              font-weight: 600;
              font-family: inherit;
              cursor: pointer;
              transition: all 0.2s ease;
              margin-bottom: 24px;
            }
            
            .submit-btn:hover {
              transform: translateY(-2px);
              box-shadow: 0 8px 25px rgba(55, 65, 81, 0.4);
              background: #4b5563;
            }
            
            .submit-btn:active {
              transform: translateY(0);
            }
            
            .login-link {
              text-align: center;
              margin-top: 24px;
              color: #6b7280;
              font-size: 14px;
            }
            
            .login-link a {
              color: #1f2937;
              text-decoration: none;
              font-weight: 500;
            }
            
            .login-link a:hover {
              text-decoration: underline;
            }
            
            .footer {
              text-align: center;
              margin-top: 24px;
              color: #9ca3af;
              font-size: 14px;
            }
            
            @media (max-width: 480px) {
              .signup-container {
                padding: 32px 24px;
                margin: 20px;
              }
              
              .form-row {
                grid-template-columns: 1fr;
                gap: 0;
              }
              
              .logo h1 {
                font-size: 24px;
              }
            }
            
            /* Animation for page load */
            .signup-container {
              animation: slideUp 0.6s ease-out;
            }
            
            @keyframes slideUp {
              from {
                opacity: 0;
                transform: translateY(30px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
            
            /* Hover effects */
            .form-group input:hover, .form-group select:hover {
              border-color: #d1d5db;
            }
            
            .submit-btn:disabled {
              opacity: 0.6;
              cursor: not-allowed;
              transform: none;
            }
            
            .error-message {
              background: #fef2f2;
              border: 1px solid #fecaca;
              color: #dc2626;
              padding: 12px;
              border-radius: 8px;
              margin-bottom: 20px;
              font-size: 14px;
              display: none;
            }
            
            .success-message {
              background: #f0fdf4;
              border: 1px solid #bbf7d0;
              color: #16a34a;
              padding: 12px;
              border-radius: 8px;
              margin-bottom: 20px;
              font-size: 14px;
              display: none;
            }
          </style>
        </head>
        <body>
          <div class="signup-container">
            <div class="logo">
              <div class="logo-icon">
                <svg viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              </div>
              <h1>Create Account</h1>
              <p>Join HelpDesk Support System</p>
            </div>
            
            <div id="errorMessage" class="error-message"></div>
            <div id="successMessage" class="success-message"></div>
            
            <form id="signupForm">
              <div class="form-row">
                <div class="form-group">
                  <label for="firstName">First Name</label>
                  <input 
                    type="text" 
                    id="firstName" 
                    name="firstName" 
                    placeholder="Enter first name"
                    required
                  >
                </div>
                
                <div class="form-group">
                  <label for="lastName">Last Name</label>
                  <input 
                    type="text" 
                    id="lastName" 
                    name="lastName" 
                    placeholder="Enter last name"
                    required
                  >
                </div>
              </div>
              
              <div class="form-group">
                <label for="email">Email Address</label>
                <input 
                  type="email" 
                  id="email" 
                  name="email" 
                  placeholder="Enter your email"
                  required
                >
              </div>
              
              <div class="form-group">
                <label for="password">Password</label>
                <input 
                  type="password" 
                  id="password" 
                  name="password" 
                  placeholder="Create a password"
                  required
                  minlength="6"
                >
              </div>
              
              <div class="form-group">
                <label for="confirmPassword">Confirm Password</label>
                <input 
                  type="password" 
                  id="confirmPassword" 
                  name="confirmPassword" 
                  placeholder="Confirm your password"
                  required
                  minlength="6"
                >
              </div>
              
              <div class="form-group">
                <label for="role">Role</label>
                <select id="role" name="role" required>
                  <option value="">Select your role</option>
                  <option value="end_user">End User</option>
                  <option value="it_staff">IT Staff</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
              
              <button type="submit" class="submit-btn" id="submitBtn">
                Create Account
              </button>
            </form>
            
            <div class="login-link">
              Already have an account? <a href="/api/login">Sign In</a>
            </div>
            
            <div class="footer">
              <p>This is a development environment</p>
              <p><a href="/api/users" target="_blank">View All Users</a> | <a href="/api/login">Back to Login</a></p>
            </div>
          </div>
          
          <script>
            const form = document.getElementById('signupForm');
            const submitBtn = document.getElementById('submitBtn');
            const errorMessage = document.getElementById('errorMessage');
            const successMessage = document.getElementById('successMessage');
            
            function showMessage(element, message) {
              element.textContent = message;
              element.style.display = 'block';
              setTimeout(() => {
                element.style.display = 'none';
              }, 5000);
            }
            
            function validateForm() {
              const password = document.getElementById('password').value;
              const confirmPassword = document.getElementById('confirmPassword').value;
              
              if (password !== confirmPassword) {
                showMessage(errorMessage, 'Passwords do not match');
                return false;
              }
              
              if (password.length < 6) {
                showMessage(errorMessage, 'Password must be at least 6 characters long');
                return false;
              }
              
              return true;
            }
            
            form.addEventListener('submit', async function(e) {
              e.preventDefault();
              
              if (!validateForm()) {
                return;
              }
              
              submitBtn.disabled = true;
              submitBtn.textContent = 'Creating Account...';
              
              const formData = new FormData(form);
              const userData = {
                firstName: formData.get('firstName'),
                lastName: formData.get('lastName'),
                email: formData.get('email'),
                password: formData.get('password'),
                role: formData.get('role')
              };
              
              try {
                const response = await fetch('/api/signup', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify(userData)
                });
                
                const result = await response.json();
                
                if (response.ok) {
                  showMessage(successMessage, 'Account created successfully! Redirecting to login...');
                  setTimeout(() => {
                    window.location.href = '/api/login';
                  }, 2000);
                } else {
                  showMessage(errorMessage, result.message || 'Failed to create account');
                }
              } catch (error) {
                showMessage(errorMessage, 'An error occurred. Please try again.');
              } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Create Account';
              }
            });
            
            // Auto-focus first field
            document.getElementById('firstName').focus();
          </script>
        </body>
        </html>
      `);
  });

    // Development signup endpoint
  app.post("/api/signup", async (req, res) => {

      const { email, password, firstName, lastName, role } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      try {
        // Check if user already exists
        const existingUser = await storage.getUserByEmail(email);
        if (existingUser) {
          return res.status(409).json({ message: "User with this email already exists" });
        }

        // Create new user with email as ID for simplicity in dev mode
        const newUser = {
          id: email, // Use email as ID for easy login
          email,
          firstName: firstName || email.split('@')[0],
          lastName: lastName || 'User',
          role: role || 'end_user',
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        await storage.upsertUser(newUser);
        
        console.log(`New user created: ${email} with role: ${newUser.role}`);
        
        const loginUrl = `${req.protocol}://${req.get('host')}/login`;
        const emailResult = await emailService.sendUserCreationEmail({
          to: email,
          firstName,
          lastName,
          email,
          tempPassword: '', // Will be generated by email service
          loginUrl
        });
        // In-app notification for the new user
        try {
          await storage.createNotification({
            userId: newUser.id,
            type: 'welcome',
            title: 'Welcome to IT Support',
            message: `Your account has been created. A temporary password has been sent to ${email}.`,
            data: { email },
          } as any);
        } catch (e) {
          console.warn('Failed to create welcome notification:', e);
        }
        
        // Return user data with email result
        res.status(201).json({
          ...newUser,
          emailResult: {
            success: emailResult.success,
            message: emailResult.message,
            tempPassword: emailResult.tempPassword
          }
        });
      } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ message: "Failed to create user" });
      }
  });

    // Development user management endpoint
  app.get("/api/users", async (req, res) => {
      try {
        // Get all users from the database
        const allUsers = await storage.getAllUsers();
        res.json(allUsers);
      } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: "Failed to fetch users" });
      }
  });

    // Update user endpoint
  app.put("/api/users/:userId", async (req, res) => {
      try {
        const { userId } = req.params;
        const { firstName, lastName, email, role, is_active } = req.body;
        
        // Validate required fields
        if (!firstName || !lastName || !email || !role) {
          return res.status(400).json({ message: "Missing required fields" });
        }
        
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          return res.status(400).json({ message: "Invalid email format" });
        }
        
        // Validate role
        const validRoles = ['admin', 'manager', 'it_staff', 'end_user'];
        if (!validRoles.includes(role)) {
          return res.status(400).json({ message: "Invalid role" });
        }
        
        // Update user in database
        const updatedUser = await storage.updateUser(userId, {
          firstName,
          lastName,
          email,
          role
        });
        
        res.json(updatedUser);
      } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ message: "Failed to update user" });
      }
  });

  // Hard delete (completely remove) user
  app.delete("/api/users/:userId", async (req, res) => {
      try {
        const { userId } = req.params;
        console.log(`Attempting to delete user: ${userId}`);
        
        const adminId = (req.session as any).userId;
        console.log(`Admin ID from session: ${adminId}`);
        
        const adminUser = await storage.getUser(adminId);
        console.log(`Admin user found:`, adminUser ? { id: adminUser.id, role: adminUser.role } : 'Not found');
        
        if (!adminUser || adminUser.role !== 'admin') {
          console.log('Access denied - not admin');
          return res.status(403).json({ message: 'Access denied' });
        }
        
        const user = await storage.getUser(userId);
        console.log(`Target user found:`, user ? { id: user.id, email: user.email } : 'Not found');
        
        if (!user) {
          console.log('User not found');
          return res.status(404).json({ message: 'User not found' });
        }
        
        // Prevent admin from deleting themselves
        if (userId === adminId) {
          console.log('Cannot delete own account');
          return res.status(400).json({ message: 'Cannot delete your own account' });
        }
        
        console.log('Attempting to delete user from database...');
        // Completely remove the user from the database
        await storage.deleteUser(userId);
        console.log('User successfully deleted from database');
        
        res.json({ success: true, message: 'User completely removed from system' });
      } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ message: 'Failed to delete user', error: error instanceof Error ? error.message : String(error) });
      }
  });

    // Create user endpoint
  app.post("/api/users", async (req, res) => {
      try {
        const { firstName, lastName, email, role, is_active } = req.body;
        
        // Validate required fields
        if (!firstName || !lastName || !email || !role) {
          return res.status(400).json({ message: "Missing required fields" });
        }
        
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          return res.status(400).json({ message: "Invalid email format" });
        }
        
        // Validate role
        const validRoles = ['admin', 'manager', 'it_staff', 'end_user'];
        if (!validRoles.includes(role)) {
          return res.status(400).json({ message: "Invalid role" });
        }
        
        // Check if user with this email already exists
        const existingUser = await storage.getUserByEmail(email);
        if (existingUser) {
          return res.status(409).json({ message: "User with this email already exists" });
        }
        
        // Generate a unique ID for the new user
        const userId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        // Create user in database
        const newUser = await storage.createUser({
          id: userId,
          firstName,
          lastName,
          email,
          role
        });
        
        // Send welcome email with temporary password
        const loginUrl = `${req.protocol}://${req.get('host')}/login`;
        const emailResult = await emailService.sendUserCreationEmail({
          to: email,
          firstName,
          lastName,
          email,
          tempPassword: '', // Will be generated by email service
          loginUrl
        });
        
        // Return user data with email result
        res.status(201).json({
          ...newUser,
          emailResult: {
            success: emailResult.success,
            message: emailResult.message,
            tempPassword: emailResult.tempPassword
          }
        });
      } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ message: "Failed to create user" });
      }
  });

    // Reset password endpoint - accepts either user ID in path or email in body
  app.post("/api/users/:userId/reset-password", async (req, res) => {
      try {
        const { userId } = req.params;

        // Accept either a database user ID or an email address in the path param
        // If it looks like an email (has an @), resolve by email; otherwise treat as ID
        let user: any | undefined;
        if (userId && userId.includes('@')) {
          user = await storage.getUserByEmail(userId);
        } else {
          user = await storage.getUser(userId);
        }
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }
        
        // Generate new temporary password
        const tempPassword = 'reset123'; // In production, generate a random secure password
        const loginUrl = `${req.protocol}://${req.get('host')}/login`;
        const emailResult = await emailService.sendPasswordResetEmail({
          to: user.email || '',
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          email: user.email || '',
          tempPassword: tempPassword,
          loginUrl
        });
        
        // Update the user's password in the database
        await storage.updateUser(user.id, { password: tempPassword });
        // In-app notification
        try {
          await storage.createNotification({
            userId: user.id,
            type: 'password_reset',
            title: 'Password Reset',
            message: 'Your password has been reset. Check your email for the temporary password.',
            data: {},
          } as any);
        } catch (e) {
          console.warn('Failed to create password reset notification:', e);
        }
        
        // Return result
        res.json({
          success: true,
          message: "Password reset email sent successfully",
          emailResult: {
            success: emailResult.success,
            message: emailResult.message,
            tempPassword: emailResult.tempPassword
          }
        });
      } catch (error) {
        console.error('Error resetting password:', error);
        res.status(500).json({ message: "Failed to reset password" });
      }
  });

    // New robust password reset endpoint - accepts email in JSON body
  app.post("/api/users/reset-password", async (req, res) => {
      try {
        const { email } = req.body;
        
        if (!email) {
          return res.status(400).json({ message: "Email is required" });
        }
        
        // Get user from database by email
        const user = await storage.getUserByEmail(email);
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }
        
        // Generate new temporary password
        const tempPassword = 'reset123'; // In production, generate a random secure password
        const loginUrl = `${req.protocol}://${req.get('host')}/login`;
        const emailResult = await emailService.sendPasswordResetEmail({
          to: user.email || '',
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          email: user.email || '',
          tempPassword: tempPassword,
          loginUrl
        });
        
        // Update the user's password in the database
        await storage.updateUser(user.id, { password: tempPassword });
        
        // In-app notification
        try {
          await storage.createNotification({
            userId: user.id,
            type: 'password_reset',
            title: 'Password Reset',
            message: 'Your password has been reset. Check your email for the temporary password.',
            data: {},
          } as any);
        } catch (e) {
          console.warn('Failed to create password reset notification:', e);
        }
        
        // Return result
        res.json({
          success: true,
          message: "Password reset email sent successfully",
          emailResult: {
            success: emailResult.success,
            message: emailResult.message,
            tempPassword: emailResult.tempPassword
          }
        });
      } catch (error) {
        console.error('Error resetting password:', error);
        res.status(500).json({ message: "Failed to reset password" });
      }
  });

    // Test email connection endpoint
  app.post("/api/test-email", async (req, res) => {
      try {
        const testResult = await emailService.testConnection();
        res.json({
          success: true,
          emailConfigured: testResult,
          message: testResult ? "Email service is working correctly" : "Email service is not configured"
        });
      } catch (error) {
        console.error('Error testing email connection:', error);
        res.status(500).json({ 
          success: false, 
          message: "Failed to test email connection",
          error: error instanceof Error ? error.message : "Unknown error"
        });
      }
  });

  app.get("/api/logout", (req, res) => {
    req.logout(() => res.redirect("/"));
  });
  
  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  // Session-based authentication only
  const userId = (req.session as any).userId;
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  return next();
};
