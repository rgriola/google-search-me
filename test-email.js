const nodemailer = require('nodemailer');

console.log('Testing email configuration...');

const testTransporter = nodemailer.createTransporter({
    service: 'gmail',
    auth: {
        user: 'rodczaro@gmail.com',
        pass: 'Dakota1973$$'
    }
});

testTransporter.verify((error, success) => {
    if (error) {
        console.log('❌ Email configuration failed:');
        console.log('Error:', error.message);
        if (error.message.includes('Username and Password not accepted')) {
            console.log('\n🔧 Solutions:');
            console.log('1. Enable 2-factor authentication on your Gmail account');
            console.log('2. Generate an App Password instead of using your regular password');
            console.log('3. Go to: https://myaccount.google.com/apppasswords');
            console.log('4. Use the 16-character app password instead of your regular Gmail password');
        }
        if (error.message.includes('Invalid login')) {
            console.log('\n📧 Alternative email services:');
            console.log('- Use a different Gmail account');
            console.log('- Switch to SendGrid, Mailgun, or other email service');
            console.log('- Use development mode (console verification links)');
        }
    } else {
        console.log('✅ Email configuration is working!');
    }
    process.exit(0);
});
