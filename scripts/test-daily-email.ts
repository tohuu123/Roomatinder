// Test Daily Digest Email
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin
if (!getApps().length) {
  try {
    initializeApp({
      credential: cert({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
    console.log('✅ Firebase Admin initialized');
  } catch (error) {
    console.error('❌ Error initializing Firebase Admin:', error);
    process.exit(1);
  }
}

const db = getFirestore();

async function testDailyEmail(userId?: string) {
  console.log('🧪 Testing Daily Digest Email System\n');
  console.log('='.repeat(60));

  // Test 1: Check if we can query profiles
  console.log('\n📋 Test 1: Query Profiles Collection');
  console.log('-'.repeat(60));
  try {
    const profilesQuery = await db
      .collection('profiles')
      .where('emailNotificationsEnabled', '!=', false)
      .where('isVisible', '==', true)
      .limit(5)
      .get();
    
    console.log(`✅ Found ${profilesQuery.size} eligible profiles`);
    
    if (profilesQuery.size > 0) {
      console.log('\n📝 Sample profiles:');
      profilesQuery.docs.forEach((doc, index) => {
        const data = doc.data();
        console.log(`  ${index + 1}. ${doc.id}`);
        console.log(`     Email: ${data.email || '❌ NO EMAIL'}`);
        console.log(`     Display Name: ${data.displayName || 'N/A'}`);
        console.log(`     Email Notifications: ${data.emailNotificationsEnabled !== false ? '✅ Enabled' : '❌ Disabled'}`);
        console.log(`     Is Visible: ${data.isVisible ? '✅ Yes' : '❌ No'}`);
      });
    }
  } catch (error) {
    console.error('❌ Error querying profiles:', error);
  }

  // Test 2: Check specific user if provided
  if (userId) {
    console.log('\n📋 Test 2: Check Specific User Profile');
    console.log('-'.repeat(60));
    console.log(`User ID: ${userId}\n`);
    
    try {
      const profileDoc = await db.collection('profiles').doc(userId).get();
      
      if (!profileDoc.exists) {
        console.log('❌ Profile not found!');
      } else {
        const data = profileDoc.data()!;
        console.log('✅ Profile found:');
        console.log(`   Email: ${data.email || '❌ NO EMAIL'}`);
        console.log(`   Display Name: ${data.displayName || 'N/A'}`);
        console.log(`   Email Notifications: ${data.emailNotificationsEnabled !== false ? '✅ Enabled' : '❌ Disabled'}`);
        console.log(`   Is Visible: ${data.isVisible ? '✅ Yes' : '❌ No'}`);
        console.log(`   Last Email Sent: ${data.lastEmailSent ? new Date(data.lastEmailSent.toDate()).toLocaleString() : 'Never'}`);
      }
    } catch (error) {
      console.error('❌ Error fetching user profile:', error);
    }

    // Test 3: Check notifications for user
    console.log('\n📋 Test 3: Check Notifications for User');
    console.log('-'.repeat(60));
    
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Count likes today
      const likesQuery = await db
        .collection('notifications')
        .where('userId', '==', userId)
        .where('type', '==', 'like')
        .where('createdAt', '>=', today)
        .get();
      
      console.log(`💘 Likes today: ${likesQuery.size}`);
      
      // Count matches today
      const matchesQuery = await db
        .collection('notifications')
        .where('userId', '==', userId)
        .where('type', '==', 'match')
        .where('createdAt', '>=', today)
        .get();
      
      console.log(`🎯 Matches today: ${matchesQuery.size}`);
      
      // Count messages today
      const messagesQuery = await db
        .collection('notifications')
        .where('userId', '==', userId)
        .where('type', '==', 'message')
        .where('createdAt', '>=', today)
        .get();
      
      console.log(`💬 Messages today: ${messagesQuery.size}`);
      
      const totalActivity = likesQuery.size + matchesQuery.size + messagesQuery.size;
      
      if (totalActivity === 0) {
        console.log('\n⚠️ No activity today - Daily email will NOT be sent');
        console.log('💡 To test, create a notification record in Firebase:');
        console.log('   Collection: notifications');
        console.log('   Document: {');
        console.log(`     userId: "${userId}",`);
        console.log('     fromUserId: "some_user_id",');
        console.log('     fromUserName: "Test User",');
        console.log('     type: "like",');
        console.log('     message: "Test User liked you!",');
        console.log('     read: false,');
        console.log('     createdAt: <current timestamp>');
        console.log('   }');
      } else {
        console.log(`\n✅ Total activity: ${totalActivity} - Email will be sent!`);
        
        // Show recent notifications
        console.log('\n📝 Recent notifications:');
        const allNotifications = [
          ...likesQuery.docs,
          ...matchesQuery.docs,
          ...messagesQuery.docs
        ].slice(0, 5);
        
        allNotifications.forEach((doc, index) => {
          const data = doc.data();
          console.log(`  ${index + 1}. ${data.type} from ${data.fromUserName || 'Unknown'}`);
          console.log(`     Created: ${data.createdAt ? new Date(data.createdAt.toDate()).toLocaleString() : 'N/A'}`);
        });
      }
    } catch (error) {
      console.error('❌ Error checking notifications:', error);
    }

    // Test 4: Try to call the API
    console.log('\n📋 Test 4: Test API Endpoint');
    console.log('-'.repeat(60));
    console.log('You can test the API manually:');
    console.log(`GET http://localhost:3000/api/email/daily-digest?userId=${userId}`);
    console.log('\nOr using curl:');
    console.log(`curl "http://localhost:3000/api/email/daily-digest?userId=${userId}"`);
  }

  // Test 5: Check environment variables
  console.log('\n📋 Test 5: Check Environment Variables');
  console.log('-'.repeat(60));
  
  const envVars = [
    'EMAIL_SERVICE',
    'EMAIL_USER',
    'EMAIL_PASSWORD',
    'NEXT_PUBLIC_GEMINI_API_KEY',
    'CRON_SECRET',
    'NEXT_PUBLIC_APP_URL'
  ];
  
  envVars.forEach(varName => {
    const value = process.env[varName];
    if (value) {
      if (varName.includes('PASSWORD') || varName.includes('SECRET') || varName.includes('KEY')) {
        console.log(`✅ ${varName}: ${'*'.repeat(10)}`);
      } else {
        console.log(`✅ ${varName}: ${value}`);
      }
    } else {
      console.log(`❌ ${varName}: NOT SET`);
    }
  });

  console.log('\n' + '='.repeat(60));
  console.log('🎉 Test completed!\n');
}

// Get userId from command line argument
const userId = process.argv[2];

if (!userId) {
  console.log('⚠️ No userId provided. Will only check system status.\n');
  console.log('Usage: npx tsx scripts/test-daily-email.ts <userId>\n');
}

testDailyEmail(userId).catch(console.error);
