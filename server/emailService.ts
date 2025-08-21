import nodemailer from 'nodemailer';

export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  connectionTimeout?: number;
  greetingTimeout?: number;
  socketTimeout?: number;
  tls?: {
    rejectUnauthorized: boolean;
  };
}

export interface UserCreationEmail {
  to: string;
  firstName: string;
  lastName: string;
  email: string;
  tempPassword: string;
  loginUrl: string;
}

export interface PasswordResetEmail {
  to: string;
  firstName: string;
  lastName: string;
  email: string;
  tempPassword: string;
  loginUrl: string;
}

export class EmailService {
  private transporter!: nodemailer.Transporter;
  private isConfigured: boolean = false;

  constructor() {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    // Check if email configuration is available
    const emailConfig = this.getEmailConfig();
    
    if (emailConfig) {
      this.transporter = nodemailer.createTransport(emailConfig);
      this.isConfigured = true;
      console.log('✅ Email service configured successfully');
    } else {
      console.log('⚠️ Email service not configured - using console fallback');
      this.isConfigured = false;
    }
  }

  private getEmailConfig(): EmailConfig | null {
    // Check for environment variables
    const host = process.env.SMTP_HOST;
    const port = process.env.SMTP_PORT;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (host && port && user && pass) {
      return {
        host,
        port: parseInt(port),
        secure: port === '465', // Use SSL for port 465
        auth: { user, pass },
        // Add connection timeout and retry settings for Gmail
        connectionTimeout: 60000, // 60 seconds
        greetingTimeout: 30000,   // 30 seconds
        socketTimeout: 60000,     // 60 seconds
        // Gmail specific settings
        tls: {
          rejectUnauthorized: false
        }
      };
    }

    return null;
  }

  private generateSecurePassword(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    
    // Ensure at least one of each type
    password += chars[Math.floor(Math.random() * 26)]; // Uppercase
    password += chars[26 + Math.floor(Math.random() * 26)]; // Lowercase
    password += chars[52 + Math.floor(Math.random() * 10)]; // Number
    password += chars[62 + Math.floor(Math.random() * 8)]; // Special char
    
    // Fill the rest randomly
    for (let i = 4; i < 12; i++) {
      password += chars[Math.floor(Math.random() * chars.length)];
    }
    
    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }

  async sendUserCreationEmail(emailData: UserCreationEmail): Promise<{ success: boolean; message: string; tempPassword?: string }> {
    const tempPassword = this.generateSecurePassword();
    
    const emailContent = this.createUserCreationEmailTemplate({
      ...emailData,
      tempPassword
    });

    try {
      if (this.isConfigured) {
        // Send actual email
        await this.transporter.sendMail({
          from: `"IT Support System" <${process.env.SMTP_USER}>`,
          to: emailData.email,
          subject: "Welcome to IT Support System - Your Account Details",
          html: emailContent.html,
          text: emailContent.text
        });

        console.log(`✅ Welcome email sent to ${emailData.email}`);
        return {
          success: true,
          message: "Welcome email sent successfully",
          tempPassword
        };
      } else {
        // Console fallback for development
        console.log('\n📧 === EMAIL NOTIFICATION (Console Fallback) ===');
        console.log(`To: ${emailData.email}`);
        console.log(`Subject: Welcome to IT Support System - Your Account Details`);
        console.log(`\n${emailContent.text}`);
        console.log('\n===============================================\n');

        return {
          success: true,
          message: "User created with console notification (email service not configured)",
          tempPassword
        };
      }
    } catch (error) {
      console.error('❌ Failed to send email:', error);
      
      // Fallback: return password for admin to share manually
      return {
        success: false,
        message: "Failed to send email, but user created successfully. Please share credentials manually.",
        tempPassword
      };
    }
  }

  async sendPasswordResetEmail(emailData: PasswordResetEmail): Promise<{ success: boolean; message: string; tempPassword?: string }> {
    const tempPassword = this.generateSecurePassword();
    
    const emailContent = this.createPasswordResetEmailTemplate({
      ...emailData,
      tempPassword
    });

    try {
      if (this.isConfigured) {
        // Send actual email
        await this.transporter.sendMail({
          from: `"IT Support System" <${process.env.SMTP_USER}>`,
          to: emailData.email,
          subject: "Password Reset - IT Support System",
          html: emailContent.html,
          text: emailContent.text
        });

        console.log(`✅ Password reset email sent to ${emailData.email}`);
        return {
          success: true,
          message: "Password reset email sent successfully",
          tempPassword
        };
      } else {
        // Console fallback for development
        console.log('\n📧 === PASSWORD RESET EMAIL (Console Fallback) ===');
        console.log(`To: ${emailData.email}`);
        console.log(`Subject: Password Reset - IT Support System`);
        console.log(`\n${emailContent.text}`);
        console.log('\n===============================================\n');

        return {
          success: true,
          message: "Password reset with console notification (email service not configured)",
          tempPassword
        };
      }
    } catch (error) {
      console.error('❌ Failed to send password reset email:', error);
      
      // Fallback: return password for admin to share manually
      return {
        success: false,
        message: "Failed to send password reset email, but password was generated. Please share credentials manually.",
        tempPassword
      };
    }
  }

  // Ticket event emails
  async sendTicketCreatedEmail(params: { to: string; ticketTitle: string; ticketId: string; ticketUrl: string }): Promise<{ success: boolean; message: string }> {
    const { to, ticketTitle, ticketId, ticketUrl } = params;
    const subject = `Ticket Created: ${ticketTitle}`;
    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2 style="background:#2563eb;color:#fff;padding:12px 16px;border-radius:8px 8px 0 0;">Ticket Created</h2>
        <div style="background:#f8fafc;padding:16px;border-radius:0 0 8px 8px;">
          <p>Your ticket <strong>${ticketTitle}</strong> has been created.</p>
          <p><a href="${ticketUrl}" style="display:inline-block;background:#2563eb;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none;">View Ticket</a></p>
          <p style="color:#64748b;font-size:12px;">Ticket ID: ${ticketId}</p>
        </div>
      </div>
    `;
    const text = `Ticket Created\n\nYour ticket "${ticketTitle}" has been created.\n\nOpen: ${ticketUrl}\nTicket ID: ${ticketId}`;
    return this.sendGeneric(to, subject, html, text);
  }

  async sendTicketAssignedEmail(params: { to: string; ticketTitle: string; ticketId: string; ticketUrl: string; assigneeName?: string }): Promise<{ success: boolean; message: string }> {
    const { to, ticketTitle, ticketId, ticketUrl, assigneeName } = params;
    const subject = `Ticket Assigned: ${ticketTitle}`;
    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2 style="background:#0ea5e9;color:#fff;padding:12px 16px;border-radius:8px 8px 0 0;">Ticket Assigned</h2>
        <div style="background:#f8fafc;padding:16px;border-radius:0 0 8px 8px;">
          <p>${assigneeName ? `${assigneeName} has been assigned` : 'You have been assigned'} to ticket <strong>${ticketTitle}</strong>.</p>
          <p><a href="${ticketUrl}" style="display:inline-block;background:#0ea5e9;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none;">View Ticket</a></p>
          <p style="color:#64748b;font-size:12px;">Ticket ID: ${ticketId}</p>
        </div>
      </div>
    `;
    const text = `Ticket Assigned\n\nTicket: "${ticketTitle}"\n${assigneeName ? `${assigneeName} has been assigned.` : 'You have been assigned.'}\n\nOpen: ${ticketUrl}\nTicket ID: ${ticketId}`;
    return this.sendGeneric(to, subject, html, text);
  }

  async sendTicketCommentEmail(params: { to: string; ticketTitle: string; ticketId: string; ticketUrl: string; commenterName?: string }): Promise<{ success: boolean; message: string }> {
    const { to, ticketTitle, ticketId, ticketUrl, commenterName } = params;
    const subject = `New Comment: ${ticketTitle}`;
    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2 style="background:#16a34a;color:#fff;padding:12px 16px;border-radius:8px 8px 0 0;">New Comment</h2>
        <div style="background:#f8fafc;padding:16px;border-radius:0 0 8px 8px;">
          <p>${commenterName ? `<strong>${commenterName}</strong> added a comment` : 'A new comment was added'} on <strong>${ticketTitle}</strong>.</p>
          <p><a href="${ticketUrl}" style="display:inline-block;background:#16a34a;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none;">View Ticket</a></p>
          <p style="color:#64748b;font-size:12px;">Ticket ID: ${ticketId}</p>
        </div>
      </div>
    `;
    const text = `New Comment\n\n${commenterName ? `${commenterName} added a comment` : 'A new comment was added'} on "${ticketTitle}".\n\nOpen: ${ticketUrl}\nTicket ID: ${ticketId}`;
    return this.sendGeneric(to, subject, html, text);
  }

  private async sendGeneric(to: string, subject: string, html: string, text: string): Promise<{ success: boolean; message: string }> {
    try {
      if (this.isConfigured) {
        await this.transporter.sendMail({
          from: `"IT Support System" <${process.env.SMTP_USER}>`,
          to,
          subject,
          html,
          text,
        });
        return { success: true, message: 'Email sent' };
      } else {
        console.log('\n📧 === EMAIL (Console Fallback) ===');
        console.log(`To: ${to}`);
        console.log(`Subject: ${subject}`);
        console.log(`\n${text}`);
        console.log('===================================\n');
        return { success: true, message: 'Console email logged' };
      }
    } catch (error) {
      console.error('❌ Failed to send ticket email:', error);
      return { success: false, message: 'Failed to send email' };
    }
  }

  private createUserCreationEmailTemplate(emailData: UserCreationEmail & { tempPassword: string }) {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to IT Support System</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f8fafc; padding: 20px; border-radius: 0 0 8px 8px; }
          .credentials { background: #e0e7ff; border: 1px solid #c7d2fe; padding: 15px; border-radius: 6px; margin: 20px 0; }
          .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .warning { background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Welcome to IT Support System!</h1>
          </div>
          
          <div class="content">
            <p>Hello ${emailData.firstName} ${emailData.lastName},</p>
            
            <p>Your account has been successfully created in our IT Support System. You can now access the system to create and manage support tickets.</p>
            
            <div class="credentials">
              <h3>🔑 Your Login Credentials:</h3>
              <p><strong>Email:</strong> ${emailData.email}</p>
              <p><strong>Temporary Password:</strong> <code style="background: #f1f5f9; padding: 4px 8px; border-radius: 4px; font-family: monospace;">${emailData.tempPassword}</code></p>
            </div>
            
            <div class="warning">
              <h4>⚠️ Important Security Notice:</h4>
              <p>This is a temporary password. For security reasons, you will be required to change it on your first login.</p>
            </div>
            
            <p><strong>Next Steps:</strong></p>
            <ol>
              <li>Click the login button below to access the system</li>
              <li>Use your email and the temporary password above</li>
              <li>You will be prompted to create a new password</li>
              <li>Start using the system to create and track support tickets</li>
            </ol>
            
            <a href="${emailData.loginUrl}" class="button">🚀 Login to IT Support System</a>
            
            <p>If you have any questions or need assistance, please contact your IT administrator.</p>
            
            <div class="footer">
              <p>This is an automated message from the IT Support System.</p>
              <p>Please do not reply to this email.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
Welcome to IT Support System!

Hello ${emailData.firstName} ${emailData.lastName},

Your account has been successfully created in our IT Support System. You can now access the system to create and manage support tickets.

🔑 Your Login Credentials:
Email: ${emailData.email}
Temporary Password: ${emailData.tempPassword}

⚠️ Important Security Notice:
This is a temporary password. For security reasons, you will be required to change it on your first login.

Next Steps:
1. Go to ${emailData.loginUrl} to access the system
2. Use your email and the temporary password above
3. You will be prompted to create a new password
4. Start using the system to create and track support tickets

If you have any questions or need assistance, please contact your IT administrator.

This is an automated message from the IT Support System.
Please do not reply to this email.
    `;

    return { html, text };
  }

  private createPasswordResetEmailTemplate(emailData: PasswordResetEmail & { tempPassword: string }) {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset - IT Support System</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f8fafc; padding: 20px; border-radius: 0 0 8px 8px; }
          .credentials { background: #fef2f2; border: 1px solid #fecaca; padding: 15px; border-radius: 6px; margin: 20px 0; }
          .button { display: inline-block; background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .warning { background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Password Reset Request</h1>
          </div>
          
          <div class="content">
            <p>Hello ${emailData.firstName} ${emailData.lastName},</p>
            
            <p>Your password has been reset by an administrator. You can now access the IT Support System with your new temporary password.</p>
            
            <div class="credentials">
              <h3>🔑 Your New Login Credentials:</h3>
              <p><strong>Email:</strong> ${emailData.email}</p>
              <p><strong>New Temporary Password:</strong> <code style="background: #f1f5f9; padding: 4px 8px; border-radius: 4px; font-family: monospace;">${emailData.tempPassword}</code></p>
            </div>
            
            <div class="warning">
              <h4>⚠️ Important Security Notice:</h4>
              <p>This is a temporary password. For security reasons, you will be required to change it on your next login.</p>
            </div>
            
            <p><strong>Next Steps:</strong></p>
            <ol>
              <li>Click the login button below to access the system</li>
              <li>Use your email and the new temporary password above</li>
              <li>You will be prompted to create a new password</li>
              <li>Continue using the system as normal</li>
            </ol>
            
            <a href="${emailData.loginUrl}" class="button">🚀 Login to IT Support System</a>
            
            <p>If you did not request this password reset, please contact your IT administrator immediately.</p>
            
            <div class="footer">
              <p>This is an automated message from the IT Support System.</p>
              <p>Please do not reply to this email.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
Password Reset - IT Support System

Hello ${emailData.firstName} ${emailData.lastName},

Your password has been reset by an administrator. You can now access the IT Support System with your new temporary password.

🔑 Your New Login Credentials:
Email: ${emailData.email}
New Temporary Password: ${emailData.tempPassword}

⚠️ Important Security Notice:
This is a temporary password. For security reasons, you will be required to change it on your next login.

Next Steps:
1. Go to ${emailData.loginUrl} to access the system
2. Use your email and the new temporary password above
3. You will be prompted to create a new password
4. Continue using the system as normal

If you did not request this password reset, please contact your IT administrator immediately.

This is an automated message from the IT Support System.
Please do not reply to this email.
    `;

    return { html, text };
  }

  // Method to test email configuration
  async testConnection(): Promise<boolean> {
    if (!this.isConfigured) {
      return false;
    }

    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      console.error('Email connection test failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const emailService = new EmailService();
