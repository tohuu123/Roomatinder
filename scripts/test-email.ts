// Test Email Configuration
// Run with: npx ts-node scripts/test-email.ts

import nodemailer from 'nodemailer';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env' });

async function testEmailConfiguration() {
  console.log('🧪 Testing Email Configuration...\n');
  
  // Check environment variables
  console.log('1. Checking environment variables...');
  const required = ['EMAIL_SERVICE', 'EMAIL_USER', 'EMAIL_PASSWORD'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:', missing.join(', '));
    console.log('\nPlease add these to your .env file');
    return;
  }
  console.log('✅ All required environment variables are set');
  
  if (!process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
    console.log('⚠️  NEXT_PUBLIC_GEMINI_API_KEY not set (AI features will use fallback messages)');
  } else {
    console.log('✅ NEXT_PUBLIC_GEMINI_API_KEY is set (AI features enabled)');
  }
  console.log('');
  
  // Test email service connection
  console.log('2. Testing email service connection...');
  try {
    const transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
    
    // Verify connection
    await transporter.verify();
    console.log('✅ Email service connection successful\n');
    
    // Send test email
    console.log('3. Sending test email...');
    const info = await transporter.sendMail({
      from: `"Roomatinder Test" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER, // Send to self
      subject: 'Test Email - Roomatinder Notification System',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
            .container { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 12px; color: white; }
            .content { background: white; color: #333; padding: 20px; border-radius: 8px; margin-top: 20px; }
            h1 { margin: 0 0 10px 0; }
            .success { color: #10b981; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>🎉 Test Successful!</h1>
            <p>Your Roomatinder email notification system is working correctly.</p>
            <div class="content">
              <p class="success">✅ Email Configuration: Working</p>
              <p class="success">✅ Email Sending: Working</p>
              <p class="success">✅ HTML Templates: Working</p>
              <hr>
              <p><strong>Next Steps:</strong></p>
              <ul>
                <li>Test with actual user data</li>
                <li>Configure cron jobs</li>
                <li>Set up production email service</li>
              </ul>
            </div>
          </div>
        </body>
        </html>
      `,
    });
    
    console.log('✅ Test email sent successfully!');
    console.log('📧 Check your inbox:', process.env.EMAIL_USER);
    console.log('📨 Message ID:', info.messageId);
    console.log('\n🎉 All tests passed! Your email system is ready to use.\n');
    
  } catch (error: any) {
    console.error('❌ Email test failed:', error.message);
    console.log('\n🔍 Troubleshooting:');
    if (error.message.includes('Invalid login')) {
      console.log('  - Check your EMAIL_PASSWORD (use App Password, not regular password)');
      console.log('  - Generate App Password at: https://myaccount.google.com/apppasswords');
    } else if (error.message.includes('authentication')) {
      console.log('  - Enable 2-Factor Authentication on your Google account');
      console.log('  - Generate an App Password for Gmail');
    } else {
      console.log('  - Verify EMAIL_SERVICE is correct (gmail, outlook, etc.)');
      console.log('  - Check your internet connection');
      console.log('  - Try a different email service');
    }
    console.log('\nFull error:', error);
  }
}

// Test Gemini API
async function testGeminiAPI() {
  console.log('\n4. Testing Gemini AI integration...');
  
  if (!process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
    console.log('⚠️  NEXT_PUBLIC_GEMINI_API_KEY not set (AI features will use fallbacks)');
    return;
  }
  
  try {
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });
    
    const result = await model.generateContent('Say "AI is working!" in a creative way');
    const response = await result.response;
    const text = response.text();
    
    console.log('✅ Gemini AI is working!');
    console.log('🤖 AI Response:', text.substring(0, 100) + '...');
  } catch (error: any) {
    console.error('❌ Gemini AI test failed:', error.message);
    console.log('⚠️  Email notifications will use fallback messages');
  }
}

// Run all tests
async function runAllTests() {
  console.log('╔════════════════════════════════════════════╗');
  console.log('║  Roomatinder Email Notification Test      ║');
  console.log('╚════════════════════════════════════════════╝\n');
  
  await testEmailConfiguration();
  await testGeminiAPI();
  
  console.log('╔════════════════════════════════════════════╗');
  console.log('║  Test Complete                            ║');
  console.log('╚════════════════════════════════════════════╝');
}

// Execute
runAllTests().catch(console.error);
