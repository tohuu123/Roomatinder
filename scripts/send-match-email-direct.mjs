// Direct Match Email Test - ESM Module
import 'dotenv/config';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import nodemailer from 'nodemailer';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Firebase config
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '');

// Email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

async function generateIceBreaker(userProfile, matchProfile) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    
    const prompt = `Generate a short, friendly ice breaker message (max 20 words) for:

User: ${userProfile.name}${userProfile.bio ? ` - ${userProfile.bio}` : ''}
Match: ${matchProfile.name}${matchProfile.bio ? ` - ${matchProfile.bio}` : ''}

Make it personalized and fun!`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.error('Error generating ice breaker:', error);
    return `Hey! You both matched! Start chatting to learn more about each other!`;
  }
}

function getEmailTemplate(userName, matchName, matchBio, iceBreaker) {
  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; background: #fff; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white; }
    .content { padding: 40px 30px; }
    .match-banner { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; border-radius: 12px; margin: 20px 0; }
    .match-banner h1 { margin: 0 0 10px 0; font-size: 36px; }
    .highlight { background: #fff3cd; padding: 15px; border-radius: 8px; border-left: 4px solid #ffc107; margin: 20px 0; }
    .button { display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0; font-size: 32px;">🏠 Roomatinder</h1>
    </div>
    <div class="content">
      <div class="match-banner">
        <h1>🎉 It's a Match!</h1>
        <p style="font-size: 18px; margin: 0;">You and ${matchName} liked each other!</p>
      </div>
      <h2 style="text-align: center; color: #333;">Congratulations, ${userName}!</h2>
      <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <h3 style="color: #667eea; margin-top: 0;">${matchName}</h3>
        ${matchBio ? `<p style="color: #6c757d; font-style: italic;">"${matchBio}"</p>` : ''}
      </div>
      <div class="highlight">
        <p style="margin: 0 0 10px 0; font-weight: 600; color: #333;">💡 Ice Breaker Suggestion:</p>
        <p style="margin: 0; font-size: 16px; color: #495057;">"${iceBreaker}"</p>
      </div>
      <p style="font-size: 16px; line-height: 1.6; color: #333; text-align: center;">
        Don't be shy! Start the conversation and see where it goes. 😊
      </p>
      <div style="text-align: center;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/chatroom" class="button">
          Start Chatting Now
        </a>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

async function sendMatchEmail(userId, matchUserId) {
  try {
    console.log(`\n📧 Sending match email to user: ${userId}`);
    
    // Try users collection first, then profiles
    let userDoc = await getDoc(doc(db, 'users', userId));
    let matchDoc = await getDoc(doc(db, 'users', matchUserId));
    
    if (!userDoc.exists()) {
      console.log('   User not in users collection, trying profiles...');
      userDoc = await getDoc(doc(db, 'profiles', userId));
    }
    
    if (!matchDoc.exists()) {
      console.log('   Match not in users collection, trying profiles...');
      matchDoc = await getDoc(doc(db, 'profiles', matchUserId));
    }

    if (!userDoc.exists() || !matchDoc.exists()) {
      console.error('❌ User(s) not found in Firestore (checked users and profiles)');
      return false;
    }

    const userData = userDoc.data();
    const matchData = matchDoc.data();

    console.log(`   User: ${userData.displayName || userData.email}`);
    console.log(`   Match: ${matchData.displayName || matchData.email}`);
    console.log(`   Recipient email: ${userData.email}`);

    if (!userData.email) {
      console.error('❌ User has no email address');
      return false;
    }

    // Generate ice breaker
    console.log('   Generating ice breaker...');
    const iceBreaker = await generateIceBreaker(
      {
        name: userData.displayName || 'You',
        bio: userData.bio,
      },
      {
        name: matchData.displayName || 'Your match',
        bio: matchData.bio,
      }
    );
    console.log(`   ✅ Ice breaker: "${iceBreaker}"`);

    // Send email
    const emailHtml = getEmailTemplate(
      userData.displayName || 'there',
      matchData.displayName || 'Someone special',
      matchData.bio,
      iceBreaker
    );

    console.log('   Sending email...');
    await transporter.sendMail({
      from: `"Roomatinder" <${process.env.EMAIL_USER}>`,
      to: userData.email,
      subject: "🎉 It's a Match! Start chatting now!",
      html: emailHtml,
    });

    console.log('   ✅ Email sent successfully!');
    return true;
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

async function main() {
  const userId1 = process.argv[2];
  const userId2 = process.argv[3];

  if (!userId1 || !userId2) {
    console.error('❌ Usage: node scripts/send-match-email-direct.mjs USER_ID_1 USER_ID_2');
    process.exit(1);
  }

  console.log('╔════════════════════════════════════════════╗');
  console.log('║  Test Match Notification Email            ║');
  console.log('╚════════════════════════════════════════════╝');
  console.log(`\nUser 1: ${userId1}`);
  console.log(`User 2: ${userId2}\n`);

  // Send to both users
  const [success1, success2] = await Promise.all([
    sendMatchEmail(userId1, userId2),
    sendMatchEmail(userId2, userId1),
  ]);

  console.log('\n╔════════════════════════════════════════════╗');
  if (success1 && success2) {
    console.log('║  ✅ Both emails sent successfully!         ║');
  } else if (success1 || success2) {
    console.log('║  ⚠️  One email sent, one failed            ║');
  } else {
    console.log('║  ❌ Both emails failed                     ║');
  }
  console.log('╚════════════════════════════════════════════╝\n');

  process.exit(success1 && success2 ? 0 : 1);
}

main();
