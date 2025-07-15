/**
 * Email Service Module
 * Handles email sending functionality for authentication and notifications
 */

import nodemailer from 'nodemailer';
import crypto from 'crypto';
import { config } from '../config/environment.js';

/**
 * Email service configuration
 */
const emailConfig = {
    service: 'gmail', // You can change this to your email service
    auth: {
        user: process.env.EMAIL_USER || config.EMAIL_USER || 'your-email@gmail.com',
        pass: process.env.EMAIL_PASS || config.EMAIL_PASS || 'your-app-password'
    }
};

/**
 * Nodemailer transporter instance
 */
let emailTransporter = null;

/**
 * Initialize email transporter
 * Will be disabled if no email configuration is provided
 */
function initializeEmailService() {
    try {
        if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
            emailTransporter = nodemailer.createTransporter(emailConfig);
            console.log('Email service initialized successfully');
        } else {
            console.log('Email service not configured. Email verification will be disabled.');
        }
    } catch (error) {
        console.error('Error initializing email service:', error.message);
        emailTransporter = null;
    }
}

/**
 * Generate a secure verification token
 * @returns {string} Hex-encoded random token
 */
function generateVerificationToken() {
    return crypto.randomBytes(32).toString('hex');
}

/**
 * Generate a secure password reset token
 * @returns {string} Hex-encoded random token
 */
function generatePasswordResetToken() {
    return crypto.randomBytes(32).toString('hex');
}

/**
 * Send email verification email
 * @param {string} email - Recipient email address
 * @param {string} username - Username for personalization
 * @param {string} token - Verification token
 * @returns {Promise<boolean>} Success status
 */
async function sendVerificationEmail(email, username, token) {
    if (!emailTransporter) {
        console.log(`Email verification disabled. Verification token for ${email}: ${token}`);
        console.log(`Verification URL: http://localhost:3000/verify-email.html?token=${token}`);
        return true;
    }
    
    const verificationUrl = `${config.FRONTEND_URL || 'http://localhost:3000'}/verify-email.html?token=${token}`;
    
    const mailOptions = {
        from: emailConfig.auth.user,
        to: email,
        subject: 'Verify Your Email - Map Search App',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #1a73e8;">Welcome to Map Search App!</h2>
                <p>Hello ${username},</p>
                <p>Thank you for registering with Map Search App. To complete your registration, please verify your email address by clicking the button below:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${verificationUrl}" style="background-color: #1a73e8; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                        Verify Email Address
                    </a>
                </div>
                <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
                <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
                <p>This verification link will expire in 24 hours.</p>
                <p>If you didn't create an account with us, please ignore this email.</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                <p style="font-size: 12px; color: #666;">This is an automated message, please do not reply to this email.</p>
            </div>
        `
    };
    
    try {
        await emailTransporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error('Error sending verification email:', error);
        return false;
    }
}

/**
 * Send password reset email
 * @param {string} email - Recipient email address
 * @param {string} username - Username for personalization
 * @param {string} token - Password reset token
 * @returns {Promise<boolean>} Success status
 */
async function sendPasswordResetEmail(email, username, token) {
    if (!emailTransporter) {
        console.log(`Email service disabled. Password reset token for ${email}: ${token}`);
        console.log(`Reset URL: http://localhost:3000/reset-password.html?token=${token}`);
        return true;
    }
    
    const resetUrl = `${config.FRONTEND_URL || 'http://localhost:3000'}/reset-password.html?token=${token}`;
    
    const mailOptions = {
        from: emailConfig.auth.user,
        to: email,
        subject: 'Password Reset - Map Search App',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #1a73e8;">Password Reset Request</h2>
                <p>Hello ${username},</p>
                <p>We received a request to reset your password for your Map Search App account. If you made this request, click the button below to reset your password:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${resetUrl}" style="background-color: #1a73e8; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                        Reset Password
                    </a>
                </div>
                <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
                <p style="word-break: break-all; color: #666;">${resetUrl}</p>
                <p>This password reset link will expire in 1 hour.</p>
                <p><strong>If you didn't request a password reset, please ignore this email and your password will remain unchanged.</strong></p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                <p style="font-size: 12px; color: #666;">This is an automated message, please do not reply to this email.</p>
            </div>
        `
    };
    
    try {
        await emailTransporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error('Error sending password reset email:', error);
        return false;
    }
}

/**
 * Send welcome email after successful registration
 * @param {string} email - Recipient email address
 * @param {string} username - Username for personalization
 * @returns {Promise<boolean>} Success status
 */
async function sendWelcomeEmail(email, username) {
    if (!emailTransporter) {
        console.log(`Welcome email would be sent to ${email} for user ${username}`);
        return true;
    }
    
    const mailOptions = {
        from: emailConfig.auth.user,
        to: email,
        subject: 'Welcome to Map Search App!',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #1a73e8;">Welcome to Map Search App!</h2>
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
                    <a href="${config.FRONTEND_URL || 'http://localhost:3000'}" style="background-color: #1a73e8; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                        Start Exploring
                    </a>
                </div>
                <p>If you have any questions or need help, please don't hesitate to contact us.</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                <p style="font-size: 12px; color: #666;">This is an automated message, please do not reply to this email.</p>
            </div>
        `
    };
    
    try {
        await emailTransporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error('Error sending welcome email:', error);
        return false;
    }
}

/**
 * Send notification email for security events
 * @param {string} email - Recipient email address
 * @param {string} username - Username for personalization
 * @param {string} event - Type of security event
 * @param {Object} details - Additional event details
 * @returns {Promise<boolean>} Success status
 */
async function sendSecurityNotificationEmail(email, username, event, details = {}) {
    if (!emailTransporter) {
        console.log(`Security notification would be sent to ${email} for event: ${event}`);
        return true;
    }
    
    let subject = 'Security Notification - Map Search App';
    let content = '';
    
    switch (event) {
        case 'password_change':
            subject = 'Password Changed - Map Search App';
            content = `
                <p>Your password has been successfully changed.</p>
                <p>If you didn't make this change, please contact us immediately.</p>
            `;
            break;
        case 'login_new_device':
            subject = 'New Device Login - Map Search App';
            content = `
                <p>We detected a login from a new device or location.</p>
                <p>Time: ${details.time || new Date().toLocaleString()}</p>
                <p>IP Address: ${details.ip || 'Unknown'}</p>
                <p>If this wasn't you, please secure your account immediately.</p>
            `;
            break;
        default:
            content = `<p>A security event occurred on your account: ${event}</p>`;
    }
    
    const mailOptions = {
        from: emailConfig.auth.user,
        to: email,
        subject: subject,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #d73502;">Security Notification</h2>
                <p>Hello ${username},</p>
                ${content}
                <div style="background-color: #f8f9fa; padding: 15px; border-radius: 6px; margin: 20px 0;">
                    <p style="margin: 0;"><strong>What should you do?</strong></p>
                    <ul style="margin: 10px 0;">
                        <li>Review your recent account activity</li>
                        <li>Change your password if you suspect unauthorized access</li>
                        <li>Contact us if you notice any suspicious activity</li>
                    </ul>
                </div>
                <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                <p style="font-size: 12px; color: #666;">This is an automated security notification. Please do not reply to this email.</p>
            </div>
        `
    };
    
    try {
        await emailTransporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error('Error sending security notification email:', error);
        return false;
    }
}

/**
 * Test email configuration
 * @returns {Promise<boolean>} Success status
 */
async function testEmailConfiguration() {
    if (!emailTransporter) {
        return false;
    }
    
    try {
        await emailTransporter.verify();
        return true;
    } catch (error) {
        console.error('Email configuration test failed:', error);
        return false;
    }
}

// Initialize email service when module is loaded
initializeEmailService();

export {
    initializeEmailService,
    generateVerificationToken,
    generatePasswordResetToken,
    sendVerificationEmail,
    sendPasswordResetEmail,
    sendWelcomeEmail,
    sendSecurityNotificationEmail,
    testEmailConfiguration
};
