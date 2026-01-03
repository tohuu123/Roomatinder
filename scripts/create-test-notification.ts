// Quick test to create notification for testing daily email
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, Timestamp, getDoc, doc } from 'firebase/firestore';

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

async function testUser(userId: string) {
  console.log('🔍 Testing Daily Email for User\n');
  console.log('='.repeat(60));
  console.log(`User ID: ${userId}\n`);

  // Check profile
  console.log('📋 Step 1: Checking User Profile');
  console.log('-'.repeat(60));
  
  try {
    const profileDoc = await getDoc(doc(db, 'profiles', userId));
    
    if (!profileDoc.exists()) {
      console.log('❌ Profile not found!');
      console.log('This user ID does not exist in profiles collection.');
      return;
    }
    
    const profileData = profileDoc.data();
    console.log('✅ Profile found:');
    console.log(`   Email: ${profileData.email || '❌ NO EMAIL'}`);
    console.log(`   Display Name: ${profileData.displayName || 'N/A'}`);
    console.log(`   Email Notifications: ${profileData.emailNotificationsEnabled !== false ? '✅ Enabled' : '❌ Disabled'}`);
    console.log(`   Is Visible: ${profileData.isVisible !== false ? '✅ Yes' : '❌ No'}`);
    
    if (!profileData.email) {
      console.log('\n❌ ERROR: User has no email address!');
      console.log('Daily email cannot be sent without an email address.');
      return;
    }
    
    if (profileData.emailNotificationsEnabled === false) {
      console.log('\n⚠️ WARNING: Email notifications are disabled for this user.');
      console.log('Daily email will not be sent.');
      return;
    }
    
  } catch (error) {
    console.error('❌ Error fetching profile:', error);
    return;
  }

  // Check notifications
  console.log('\n📋 Step 2: Checking Notifications Today');
  console.log('-'.repeat(60));
  
  try {
    // For simplicity, we'll create a test notification instead of querying
    console.log('Creating test notification...');
    
    const notificationData = {
      userId: userId,
      fromUserId: 'test_user_123',
      fromUserName: 'Test User',
      fromUserPhoto: null,
      fromUserSlug: 'test-user',
      type: 'like',
      message: 'Test User liked your profile!',
      read: false,
      createdAt: Timestamp.now(),
    };
    
    const docRef = await addDoc(collection(db, 'notifications'), notificationData);
    console.log(`✅ Test notification created: ${docRef.id}`);
    console.log('   Type: like');
    console.log('   From: Test User');
    console.log('   Message: Test User liked your profile!');
    
  } catch (error) {
    console.error('❌ Error creating notification:', error);
    return;
  }

  // Test API
  console.log('\n📋 Step 3: Testing Daily Email API');
  console.log('-'.repeat(60));
  console.log('Now you can test the API:');
  console.log(`\ncurl "http://localhost:3000/api/email/daily-digest?userId=${userId}"`);
  console.log('\nOr open in browser:');
  console.log(`http://localhost:3000/api/email/daily-digest?userId=${userId}`);
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ Test notification created successfully!');
  console.log('Now call the API endpoint to send the email.');
  console.log('='.repeat(60));
}

const userId = process.argv[2];

if (!userId) {
  console.log('❌ Error: User ID required');
  console.log('Usage: npx tsx scripts/create-test-notification.ts <userId>');
  process.exit(1);
}

testUser(userId).catch(console.error);
