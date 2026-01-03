// Simple Email Test
import 'dotenv/config';
import nodemailer from 'nodemailer';

console.log('╔════════════════════════════════════════════╗');
console.log('║  Simple Email Test                        ║');
console.log('╚════════════════════════════════════════════╝\n');

console.log('Email Configuration:');
console.log(`  Service: ${process.env.EMAIL_SERVICE}`);
console.log(`  User: ${process.env.EMAIL_USER}`);
console.log(`  Password: ${process.env.EMAIL_PASSWORD ? '***' + process.env.EMAIL_PASSWORD.slice(-4) : 'NOT SET'}\n`);

const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
  debug: true, // Enable debug
  logger: true, // Log to console
});

async function sendTestEmail() {
  try {
    console.log('Verifying SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection verified!\n');

    const testEmail = process.argv[2] || 'vonguyenkhoa838@gmail.com';
    
    console.log(`Sending test email to: ${testEmail}`);
    
    const info = await transporter.sendMail({
      from: `"Roomatinder Test" <${process.env.EMAIL_USER}>`,
      to: testEmail,
      subject: '🧪 Test Email from Roomatinder - ' + new Date().toLocaleString(),
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px;">
            <h1 style="margin: 0;">🧪 Test Email</h1>
          </div>
          <div style="padding: 30px; background: #f9f9f9; margin-top: 20px; border-radius: 10px;">
            <h2 style="color: #333;">This is a test email!</h2>
            <p style="color: #666; line-height: 1.6;">
              If you're seeing this, it means email sending is working correctly. ✅
            </p>
            <p style="color: #666; line-height: 1.6;">
              <strong>Time sent:</strong> ${new Date().toLocaleString()}<br>
              <strong>From:</strong> ${process.env.EMAIL_USER}<br>
              <strong>To:</strong> ${testEmail}
            </p>
          </div>
        </div>
      `,
      text: `This is a test email from Roomatinder. Time: ${new Date().toLocaleString()}`,
    });

    console.log('\n✅ Email sent successfully!');
    console.log('Message ID:', info.messageId);
    console.log('Response:', info.response);
    
    if (info.accepted && info.accepted.length > 0) {
      console.log('✅ Accepted:', info.accepted);
    }
    if (info.rejected && info.rejected.length > 0) {
      console.log('❌ Rejected:', info.rejected);
    }
    
    console.log('\n💡 Tips:');
    console.log('  - Check your inbox for: ' + testEmail);
    console.log('  - Check spam/junk folder');
    console.log('  - Wait a few minutes for email to arrive');
    console.log('  - Gmail may take 1-5 minutes to deliver\n');
    
  } catch (error) {
    console.error('\n❌ Error sending email:');
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    if (error.response) {
      console.error('Server response:', error.response);
    }
    process.exit(1);
  }
}

sendTestEmail();
