#!/usr/bin/env node

/**
 * Mailtrap.io Email Test Script
 * Run this after setting up your Mailtrap credentials in .env
 */

import 'dotenv/config';
import nodemailer from 'nodemailer';

console.log('📧 Testing Mailtrap.io Email Configuration\n');

// Load environment variables
const emailUser = process.env.EMAIL_USER;
const emailPass = process.env.EMAIL_PASS;
const emailHost = process.env.EMAIL_HOST || 'sandbox.smtp.mailtrap.io';
const emailPort = process.env.EMAIL_PORT || '2525';

console.log('🔧 Mailtrap Configuration:');
console.log('   Host:', emailHost);
console.log('   Port:', emailPort);
console.log('   Username:', emailUser);
console.log('   Password:', emailPass ? '✅ Set' : '❌ Missing');

if (!emailUser || !emailPass) {
    console.log('\n❌ Missing Mailtrap credentials in .env file');
    console.log('📝 Please update .env with your Mailtrap credentials:');
    console.log('   EMAIL_SERVICE=mailtrap');
    console.log('   EMAIL_HOST=sandbox.smtp.mailtrap.io');
    console.log('   EMAIL_PORT=2525');
    console.log('   EMAIL_USER=your-mailtrap-username');
    console.log('   EMAIL_PASS=your-mailtrap-password');
    console.log('\n💡 Get credentials from: https://mailtrap.io/inboxes');
    process.exit(1);
}

// Create Mailtrap transporter
const transporter = nodemailer.createTransport({
    host: emailHost,
    port: parseInt(emailPort),
    secure: false, // Use TLS
    auth: {
        user: emailUser,
        pass: emailPass
    }
});

console.log('\n🔍 Testing Mailtrap connection...');

// Test connection
transporter.verify((error, success) => {
    if (error) {
        console.log('❌ Mailtrap connection failed:', error.message);
        console.log('\n💡 Common issues:');
        console.log('   - Check username/password are correct');
        console.log('   - Verify host is sandbox.smtp.mailtrap.io');
        console.log('   - Ensure port is 2525');
        process.exit(1);
    } else {
        console.log('✅ Mailtrap connection successful!');
        
        // Send test verification email
        const testEmail = {
            from: '"Map Search App" <noreply@mapsearch.app>',
            to: 'test-user@example.com',
            subject: '🧪 Email Verification Test - Map Search App',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #1a73e8;">✅ Mailtrap Email Test</h2>
                    <p>Hello Test User,</p>
                    <p>This is a test email verification from your Map Search App. If you're seeing this in Mailtrap, your email configuration is working perfectly!</p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="http://localhost:3000/verify-email.html?token=test-token-123" 
                           style="background-color: #1a73e8; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                            Verify Email Address
                        </a>
                    </div>
                    
                    <div style="background: #f0f8ff; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <h3>Test Details:</h3>
                        <ul>
                            <li><strong>Service:</strong> Mailtrap.io</li>
                            <li><strong>Host:</strong> ${emailHost}</li>
                            <li><strong>Port:</strong> ${emailPort}</li>
                            <li><strong>Time:</strong> ${new Date().toLocaleString()}</li>
                        </ul>
                    </div>
                    
                    <p>🎉 Your email verification system is ready!</p>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                    <p style="font-size: 12px; color: #666;">This is a test email from Map Search App via Mailtrap.io</p>
                </div>
            `
        };
        
        console.log('\n📤 Sending test verification email...');
        
        transporter.sendMail(testEmail, (error, info) => {
            if (error) {
                console.log('❌ Test email failed:', error.message);
            } else {
                console.log('✅ Test email sent successfully!');
                console.log('📩 Message ID:', info.messageId);
                console.log('\n🎉 Mailtrap Configuration Complete!');
                console.log('📧 Check your Mailtrap inbox to see the email');
                console.log('🔗 Login to: https://mailtrap.io/inboxes');
            }
            process.exit(0);
        });
    }
});
