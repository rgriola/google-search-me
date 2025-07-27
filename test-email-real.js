import nodemailer from 'nodemailer';

// Test email configuration
async function testEmailConfig() {
    console.log('🧪 Testing email configuration...\n');
    
    // Create test SMTP credentials using Ethereal
    let testAccount;
    try {
        testAccount = await nodemailer.createTestAccount();
        console.log('📧 Created test account:', testAccount.user);
    } catch (error) {
        console.log('❌ Failed to create test account:', error.message);
        return { success: false, error: error.message };
    }
    
    // Create transporter with test credentials
    let transporter;
    try {
        transporter = nodemailer.createTransporter({
            host: 'smtp.ethereal.email',
            port: 587,
            secure: false,
            auth: {
                user: testAccount.user,
                pass: testAccount.pass,
            },
        });
        console.log('✅ Created email transporter');
    } catch (error) {
        console.log('❌ Failed to create transporter:', error.message);
        return { success: false, error: error.message };
    }

    // Test email content
    const testEmail = {
        from: testAccount.user,
        to: 'tester@example.com',
        subject: 'Test Email Verification',
        html: `
            <h2>Email Verification Test</h2>
            <p>This is a test email to verify email sending is working.</p>
            <a href="http://localhost:3000/verify-email.html?token=test123" 
               style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                Verify Email
            </a>
            <p>Test URL: http://localhost:3000/verify-email.html?token=test123</p>
        `
    };

    try {
        const info = await transporter.sendMail(testEmail);
        console.log('✅ Email sent successfully!');
        console.log('📩 Message ID:', info.messageId);
        console.log('🔗 Preview URL:', nodemailer.getTestMessageUrl(info));
        console.log('\n✨ You can view the email at the preview URL above!');
        
        return {
            success: true,
            credentials: testAccount,
            previewUrl: nodemailer.getTestMessageUrl(info)
        };
    } catch (error) {
        console.log('❌ Email sending failed:', error.message);
        return { success: false, error: error.message };
    }
}

// Run the test
testEmailConfig().catch(console.error);
