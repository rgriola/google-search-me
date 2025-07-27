#!/usr/bin/env node

/**
 * Simple email test script
 * Run this after setting up your email credentials in .env
 */

import { config } from './server/config/environment.js';
import nodemailer from 'nodemailer';

console.log('🧪 Testing Email Configuration\n');

// Load environment variables
const emailUser = process.env.EMAIL_USER;
const emailPass = process.env.EMAIL_PASS;
const emailService = process.env.EMAIL_SERVICE || 'gmail';

console.log('📧 Email Service:', emailService);
console.log('👤 Email User:', emailUser);
console.log('🔑 Password Set:', emailPass ? 'Yes' : 'No');

if (!emailUser || !emailPass) {
    console.log('❌ Missing email credentials in .env file');
    console.log('📝 Please update .env with:');
    console.log('   EMAIL_USER=your-email@gmail.com');
    console.log('   EMAIL_PASS=your-app-password');
    process.exit(1);
}

// Create transporter
const transporter = nodemailer.createTransporter({
    service: emailService,
    auth: {
        user: emailUser,
        pass: emailPass
    }
});

console.log('\n🔍 Testing SMTP connection...');

// Test connection
transporter.verify((error, success) => {
    if (error) {
        console.log('❌ Connection failed:', error.message);
        
        if (error.message.includes('Username and Password not accepted')) {
            console.log('\n💡 Suggestions:');
            console.log('   1. Use App Password instead of regular password');
            console.log('   2. Enable 2-factor authentication');
            console.log('   3. Check if "Less secure app access" is enabled (if available)');
        }
    } else {
        console.log('✅ SMTP connection successful!');
        
        // Send test email
        const testEmail = {
            from: emailUser,
            to: emailUser, // Send to yourself for testing
            subject: '🧪 Map Search App - Email Test',
            html: `
                <h2>✅ Email Configuration Working!</h2>
                <p>This test email confirms that your Map Search App can send emails successfully.</p>
                <div style="background: #f0f8ff; padding: 15px; border-radius: 5px; margin: 15px 0;">
                    <p><strong>Test Details:</strong></p>
                    <ul>
                        <li>Service: ${emailService}</li>
                        <li>From: ${emailUser}</li>
                        <li>Time: ${new Date().toLocaleString()}</li>
                    </ul>
                </div>
                <p>🎉 Your email verification system is ready for testing!</p>
                <hr>
                <p><small>This is an automated test from Map Search App</small></p>
            `
        };
        
        console.log('\n📤 Sending test email...');
        
        transporter.sendMail(testEmail, (error, info) => {
            if (error) {
                console.log('❌ Test email failed:', error.message);
            } else {
                console.log('✅ Test email sent successfully!');
                console.log('📩 Message ID:', info.messageId);
                console.log('📧 Check your inbox at:', emailUser);
                console.log('\n🎉 Email configuration is working perfectly!');
            }
            process.exit(0);
        });
    }
});
