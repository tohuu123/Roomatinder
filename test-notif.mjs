import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, Timestamp } from 'firebase/firestore';

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

const userId = 'EcY9gBUgV2eZgyEOuZ82R7WA6HE2';
const notificationData = {
  userId,
  fromUserId: 'test-user-123',
  fromUserName: 'Test User',
  type: 'like',
  message: 'Test User liked you!',
  read: false,
  createdAt: Timestamp.now()
};

addDoc(collection(db, 'notifications'), notificationData).then(() => {
  console.log(' Test notification created!');
  process.exit(0);
});
