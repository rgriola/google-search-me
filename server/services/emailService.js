/**
 * Email Service Module
 * Handles email sending functionality for authentication and notifications
 * 
 * RESPONSIBILITIES:
 * - Email configuration management
 * - SMTP transporter initialization
 * - Email template generation
 * - Email sending with error handling
 * - Development mode support
 */

import * as nodemailer from 'nodemailer';
import crypto from 'crypto';
import { config } from '../config/environment.js';

// Import Mailtrap transport
let MailtrapTransport = null;
try {
    // Dynamic import for Mailtrap (will be available after npm install)
    MailtrapTransport = (await import('mailtrap')).MailtrapTransport;
    console.log('📧 Mailtrap transport loaded successfully');
} catch (error) {
    console.log('📧 Mailtrap package not installed, using SMTP fallback');
}

// =============================================================================
// CONSTANTS & CONFIGURATION
// =============================================================================

const EMAIL_TEMPLATES = {
    VERIFICATION: 'verification',
    PASSWORD_RESET: 'password_reset',
    WELCOME: 'welcome',
    SECURITY_NOTIFICATION: 'security_notification'
};

const SECURITY_EVENTS = {
    PASSWORD_CHANGE: 'password_change',
    PASSWORD_RESET: 'password_reset',
    LOGIN_NEW_DEVICE: 'login_new_device'
};

// =============================================================================
// EMAIL CONFIGURATION CLASS
// =============================================================================

class EmailConfiguration {
    constructor() {
        this.service = process.env.EMAIL_SERVICE || 'gmail';
        this.mode = process.env.EMAIL_MODE || 'production';
        this.host = process.env.EMAIL_HOST;
        this.port = process.env.EMAIL_PORT;
        this.user = process.env.EMAIL_USER;
        this.pass = process.env.EMAIL_PASS;
        this.fromName = process.env.EMAIL_FROM_NAME || 'Merkel Vision';
        this.fromAddress = process.env.EMAIL_FROM_ADDRESS; // New: separate sender email
        this.frontendUrl = process.env.FRONTEND_URL || config.FRONTEND_URL || 'http://localhost:3000';
    }

    /**
     * Get nodemailer configuration object
     */
    getTransporterConfig() {
        // Special configuration for Mailtrap
        if (this.service === 'mailtrap') {
            const isLive = this.host && this.host.includes('live');
            
            // Use MailtrapTransport for live emails (recommended approach)
            if (isLive && MailtrapTransport) {
                return {
                    useMailtrapTransport: true,
                    token: this.pass // API token
                };
            }
            
            // Fallback to SMTP for sandbox or if MailtrapTransport unavailable
            return {
                host: this.host || 'sandbox.smtp.mailtrap.io',
                port: parseInt(this.port) || (isLive ? 587 : 2525),
                secure: false, // Use STARTTLS
                auth: {
                    user: this.user,
                    pass: this.pass
                }
            };
        }

        // Standard service configuration
        return {
            service: this.service,
            auth: {
                user: this.user || config.EMAIL_USER || 'your-email@gmail.com',
                pass: this.pass || config.EMAIL_PASS || 'your-app-password'
            }
        };
    }

    /**
     * Get formatted "from" email address with display name
     */
    getFromAddress() {
        // For Mailtrap live, always use verified domain email
        if (this.service === 'mailtrap' && this.host && this.host.includes('live')) {
            const verifiedEmail = this.fromAddress || 'hello@merkelvision.com';
            return `${this.fromName} <${verifiedEmail}>`;
        }
        
        // For other services, use EMAIL_FROM_ADDRESS if set, otherwise fall back to user
        const senderEmail = this.fromAddress || this.user;
        return `${this.fromName} <${senderEmail}>`;
    }
    
    /**
     * Get sender object for Mailtrap Transport
     */
    getMailtrapSender() {
        const verifiedEmail = this.fromAddress || 'hello@merkelvision.com';
        return {
            address: verifiedEmail,
            name: this.fromName
        };
    }

    /**
     * Check if email service is properly configured
     */
    isConfigured() {
        return !!(this.user && this.pass);
    }

    /**
     * Check if running in development mode
     */
    isDevelopmentMode() {
        return this.mode === 'development';
    }

    /**
     * Log configuration status for debugging
     */
    logStatus() {
        console.log('📧 EMAIL CONFIGURATION STATUS:');
        console.log('📧 Mode:', this.mode);
        console.log('📧 Service:', this.service);
        console.log('📧 Host:', this.host || 'default');
        console.log('📧 Port:', this.port || 'default');
        console.log('📧 SMTP User:', this.user ? 'SET' : 'NOT SET');
        console.log('📧 SMTP Pass:', this.pass ? 'SET' : 'NOT SET');
        console.log('📧 From Name:', this.fromName);
        console.log('📧 From Address:', this.fromAddress || 'using SMTP user');
        console.log('📧 Computed From:', this.getFromAddress());
        console.log('📧 Frontend URL:', this.frontendUrl);
        console.log('📧 NODE_ENV:', process.env.NODE_ENV);
        
        if (this.service === 'mailtrap') {
            const isLive = this.host && this.host.includes('live');
            console.log('📧 Mailtrap Mode:', isLive ? 'LIVE (Production)' : 'SANDBOX (Testing)');
            if (isLive && this.user === 'api') {
                console.log('📧 ✅ Using correct Mailtrap live SMTP auth (user: api)');
                console.log('📧 ✅ API Token configured as password');
            }
        }
    }
}

// =============================================================================
// EMAIL TEMPLATE GENERATOR
// =============================================================================

class EmailTemplateGenerator {
    /**
     * Generate email verification template
     */
    static generateVerificationEmail(username, verificationUrl) {
        return {
            subject: 'Verify Your Email - Merkel Vision',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #1a73e8;">Welcome to Merkel Vision!</h2>
                    <p>Hello ${username},</p>
                    <p>Thank you for registering with Merkel Vision. To complete your registration, please verify your email address by clicking the button below:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${verificationUrl}" style="background-color: #1a73e8; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                            Verify Email Address
                        </a>
                    </div>
                    <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
                    <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
                    <p>This verification link will expire in 24 hours.</p>
                    <p>If you didn't create an account with us, please ignore this email.</p>
                    ${this._getEmailFooter()}
                </div>
            `
        };
    }

    /**
     * Generate password reset email template
     */
    static generatePasswordResetEmail(username, resetUrl) {
        return {
            subject: 'Reset Your Password - Merkel Vision',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #1a73e8;">Password Reset Request</h2>
                    <p>Hello ${username},</p>
                    <p>We received a request to reset your password for your Merkel Vision account. If you made this request, click the button below to reset your password:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${resetUrl}" style="background-color: #1a73e8; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                            Reset Password
                        </a>
                    </div>
                    <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
                    <p style="word-break: break-all; color: #666;">${resetUrl}</p>
                    <p>This password reset link will expire in 1 hour.</p>
                    <p><strong>If you didn't request a password reset, please ignore this email and your password will remain unchanged.</strong></p>
                    ${this._getEmailFooter()}
                </div>
            `
        };
    }

    /**
     * Generate welcome email template
     */
    static generateWelcomeEmail(username, appUrl) {
        return {
            subject: 'Welcome to Merkel Vision!',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #1a73e8;">Welcome to Merkel Vision!</h2>
                    <p>Hello ${username},</p>
                    <p>Your email has been successfully verified and your account is now active!</p>
                    <p>You can now:</p>
                    <ul>
                        <li>Search for locations using Google Maps</li>
                        <li>Save your favorite places</li>
                        <li>Manage your saved locations</li>
                        <li>Access popular locations</li>
                    </ul>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${appUrl}" style="background-color: #1a73e8; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                            Start Exploring
                        </a>
                    </div>
                    <p>If you have any questions or need help, please don't hesitate to contact us.</p>
                    ${this._getEmailFooter()}
                </div>
            `
        };
    }

    /**
     * Generate security notification email template
     */
    static generateSecurityNotificationEmail(username, event, details = {}) {
        const templates = {
            [SECURITY_EVENTS.PASSWORD_CHANGE]: {
                subject: 'Password Changed - Merkel Vision',
                content: `
                    <p>Your password has been successfully changed.</p>
                    <p>If you didn't make this change, please contact us immediately.</p>
                `
            },
            [SECURITY_EVENTS.PASSWORD_RESET]: {
                subject: 'Password Reset Completed - Merkel Vision',
                content: `
                    <p>Your password has been successfully reset using the secure reset link.</p>
                    <p>You can now log in with your new password.</p>
                    <p>If you didn't request this reset, please contact us immediately.</p>
                `
            },
            [SECURITY_EVENTS.LOGIN_NEW_DEVICE]: {
                subject: 'New Device Login - Merkel Vision',
                content: `
                    <p>We detected a login from a new device or location.</p>
                    <p>Time: ${details.time || new Date().toLocaleString()}</p>
                    <p>IP Address: ${details.ip || 'Unknown'}</p>
                    <p>If this wasn't you, please secure your account immediately.</p>
                `
            }
        };

        const template = templates[event] || {
            subject: 'Security Notification - Merkel Vision',
            content: `<p>A security event occurred on your account: ${event}</p>`
        };

        return {
            subject: template.subject,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #d73502;">Security Notification</h2>
                    <p>Hello ${username},</p>
                    ${template.content}
                    <div style="background-color: #f8f9fa; padding: 15px; border-radius: 6px; margin: 20px 0;">
                        <p style="margin: 0;"><strong>What should you do?</strong></p>
                        <ul style="margin: 10px 0;">
                            <li>Review your recent account activity</li>
                            <li>Change your password if you suspect unauthorized access</li>
                            <li>Contact us if you notice any suspicious activity</li>
                        </ul>
                    </div>
                    ${this._getEmailFooter()}
                </div>
            `
        };
    }

    /**
     * Common email footer
     */
    static _getEmailFooter() {
        return `
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="font-size: 12px; color: #666;">This is an automated message, please do not reply to this email.</p>
        `;
    }
}

// =============================================================================
// MAIN EMAIL SERVICE CLASS
// =============================================================================

class EmailService {
    constructor() {
        this.config = new EmailConfiguration();
        this.transporter = null;
        this.isInitialized = false;
    }

    /**
     * Initialize email service
     */
    async initialize() {
        if (this.isInitialized) {
            console.log('📧 Email service already initialized');
            return;
        }

        this.config.logStatus();

        try {
            // Check if in development mode
            if (this.config.isDevelopmentMode()) {
                console.log('🔧 EMAIL DEVELOPMENT MODE: Email verification links will be shown in console');
                this.transporter = null;
                this.isInitialized = true;
                return;
            }

            // Check if properly configured
            if (!this.config.isConfigured()) {
                console.log('❌ Email credentials missing. Using development mode.');
                console.log('📧 Missing credentials:', {
                    EMAIL_USER: !this.config.user ? 'REQUIRED' : 'SET',
                    EMAIL_PASS: !this.config.pass ? 'REQUIRED' : 'SET'
                });
                this.transporter = null;
                this.isInitialized = true;
                return;
            }

            // Create and verify transporter
            await this._createAndVerifyTransporter();
            this.isInitialized = true;

        } catch (error) {
            console.error('❌ Error initializing email service:', error.message);
            console.log('🔧 Falling back to development mode (console verification links)');
            this.transporter = null;
            this.isInitialized = true;
        }
    }

    /**
     * Create and verify email transporter
     */
    async _createAndVerifyTransporter() {
        const transporterConfig = this.config.getTransporterConfig();
        
        // Use Mailtrap Transport for live emails
        if (transporterConfig.useMailtrapTransport && MailtrapTransport) {
            console.log('📧 Creating Mailtrap Transport with token:', {
                method: 'MailtrapTransport',
                tokenSet: !!transporterConfig.token
            });
            
            this.transporter = nodemailer.default ? 
                nodemailer.default.createTransport(MailtrapTransport({
                    token: transporterConfig.token
                })) :
                nodemailer.createTransport(MailtrapTransport({
                    token: transporterConfig.token
                }));
        } else {
            // Use standard SMTP
            console.log('📧 Creating SMTP transporter with config:', {
                service: transporterConfig.service || 'Custom SMTP',
                host: transporterConfig.host,
                port: transporterConfig.port,
                secure: transporterConfig.secure,
                user: transporterConfig.auth?.user
            });

            this.transporter = nodemailer.default ? 
                nodemailer.default.createTransport(transporterConfig) : 
                nodemailer.createTransport(transporterConfig);
        }

        // Verify connection (skip for MailtrapTransport as it doesn't support verify)
        if (!transporterConfig.useMailtrapTransport) {
            return new Promise((resolve, reject) => {
                this.transporter.verify((error, success) => {
                    if (error) {
                        console.error('❌ Email transporter verification failed:', error);
                        this.transporter = null;
                        reject(error);
                    } else {
                        console.log('✅ Email service initialized and verified successfully');
                        resolve(success);
                    }
                });
            });
        } else {
            console.log('✅ Mailtrap Transport initialized (verification skipped)');
            return Promise.resolve(true);
        }
    }

    /**
     * Send email with error handling and logging
     */
    async _sendEmail(to, template, debugContext = '') {
        const logPrefix = debugContext ? `📧 ${debugContext}:` : '📧';
        
        console.log(`${logPrefix} Starting email send`);
        console.log(`${logPrefix} Email Service Status:`, {
            transporterExists: !!this.transporter,
            isInitialized: this.isInitialized,
            mode: this.config.mode
        });

        // Development mode - log to console
        if (!this.transporter) {
            console.log(`\n🔗 DEVELOPMENT MODE - ${template.subject}`);
            console.log('========================================');
            console.log(`📧 To: ${to}`);
            console.log(`📧 Subject: ${template.subject}`);
            if (debugContext.toLowerCase().includes('verification') || debugContext.toLowerCase().includes('reset')) {
                // Extract URL from HTML for development logging
                const urlMatch = template.html.match(/href="([^"]*)/);
                if (urlMatch) {
                    console.log(`🔗 URL: ${urlMatch[1]}`);
                }
            }
            console.log('========================================\n');
            return { success: true, mode: 'development' };
        }

        // Production mode - send actual email
        const transporterConfig = this.config.getTransporterConfig();
        
        let mailOptions;
        if (transporterConfig.useMailtrapTransport) {
            // Use Mailtrap Transport format
            mailOptions = {
                from: this.config.getMailtrapSender(),
                to: [to], // Mailtrap expects array
                subject: template.subject,
                html: template.html,
                category: 'Authentication' // Optional: helps with Mailtrap analytics
            };
        } else {
            // Use standard email format
            mailOptions = {
                from: this.config.getFromAddress(),
                to: to,
                subject: template.subject,
                html: template.html
            };
        }

        try {
            console.log(`${logPrefix} Attempting to send email...`);
            console.log(`${logPrefix} Mail options:`, {
                from: mailOptions.from,
                to: mailOptions.to,
                subject: mailOptions.subject
            });

            const info = await this.transporter.sendMail(mailOptions);
            
            console.log(`${logPrefix} Email sent successfully!`);
            console.log(`${logPrefix} Send result:`, {
                messageId: info.messageId,
                accepted: info.accepted,
                rejected: info.rejected
            });

            return { success: true, info, mode: 'production' };

        } catch (error) {
            console.error(`${logPrefix} Error sending email:`, error);
            console.error(`${logPrefix} Error details:`, {
                code: error.code,
                message: error.message,
                stack: error.stack?.split('\n').slice(0, 3).join('\n')
            });

            return { success: false, error, mode: 'production' };
        }
    }

    /**
     * Send verification email
     */
    async sendVerificationEmail(email, username, token) {
        const verificationUrl = `${this.config.frontendUrl}/verify-email.html?token=${token}`;
        const template = EmailTemplateGenerator.generateVerificationEmail(username, verificationUrl);
        return await this._sendEmail(email, template, 'VERIFICATION EMAIL');
    }

    /**
     * Send password reset email
     */
    async sendPasswordResetEmail(email, username, token) {
        const resetUrl = `${this.config.frontendUrl}/reset-password.html?token=${token}`;
        const template = EmailTemplateGenerator.generatePasswordResetEmail(username, resetUrl);
        return await this._sendEmail(email, template, 'PASSWORD RESET EMAIL');
    }

    /**
     * Send welcome email
     */
    async sendWelcomeEmail(email, username) {
        const template = EmailTemplateGenerator.generateWelcomeEmail(username, this.config.frontendUrl);
        return await this._sendEmail(email, template, 'WELCOME EMAIL');
    }

    /**
     * Send security notification email
     */
    async sendSecurityNotificationEmail(email, username, event, details) {
        const template = EmailTemplateGenerator.generateSecurityNotificationEmail(username, event, details);
        return await this._sendEmail(email, template, 'SECURITY NOTIFICATION EMAIL');
    }

    /**
     * Test email configuration
     */
    async testEmailConfiguration() {
        if (!this.transporter) {
            return false;
        }
        
        try {
            await this.transporter.verify();
            return true;
        } catch (error) {
            console.error('Email configuration test failed:', error);
            return false;
        }
    }
}

// =============================================================================
// SINGLETON INSTANCE AND EXPORTS
// =============================================================================

// Create singleton instance
const emailServiceInstance = new EmailService();

// Initialize the service
let initializationPromise = null;
const initializeEmailService = async () => {
    if (!initializationPromise) {
        initializationPromise = emailServiceInstance.initialize();
    }
    return initializationPromise;
};

// Export both the class and convenience methods
export { EmailService };

// Export convenience methods that use the singleton
export const sendVerificationEmail = (email, username, token) => {
    return emailServiceInstance.sendVerificationEmail(email, username, token);
};

export const sendPasswordResetEmail = (email, username, token) => {
    return emailServiceInstance.sendPasswordResetEmail(email, username, token);
};

export const sendWelcomeEmail = (email, username) => {
    return emailServiceInstance.sendWelcomeEmail(email, username);
};

export const sendSecurityNotificationEmail = (email, username, event, details) => {
    return emailServiceInstance.sendSecurityNotificationEmail(email, username, event, details);
};

export const testEmailConfiguration = () => {
    return emailServiceInstance.testEmailConfiguration();
};

// Export the initialization function
export { initializeEmailService };
