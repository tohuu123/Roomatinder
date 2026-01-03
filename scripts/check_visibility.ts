import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

if (getApps().length === 0) {
  initializeApp(firebaseConfig);
}

const db = getFirestore();

async function checkVisibility() {
  console.log('Checking isVisible field for profiles...\n');
  
  const usersCollection = collection(db, 'users');
  const snapshot = await getDocs(usersCollection);
  
  let visibleCount = 0;
  let invisibleCount = 0;
  let undefinedCount = 0;
  
  snapshot.forEach(doc => {
    const data = doc.data();
    const isVisible = data.isVisible;
    
    if (isVisible === true) {
      visibleCount++;
    } else if (isVisible === false) {
      invisibleCount++;
      console.log(`❌ Invisible: ${doc.id} (${data.displayName || data.nickname})`);
    } else {
      undefinedCount++;
      console.log(`⚠️  Undefined: ${doc.id} (${data.displayName || data.nickname}) - isVisible: ${isVisible}`);
    }
  });
  
  console.log('\n=== Summary ===');
  console.log(`✅ Visible profiles: ${visibleCount}`);
  console.log(`❌ Invisible profiles: ${invisibleCount}`);
  console.log(`⚠️  Undefined isVisible: ${undefinedCount}`);
  console.log(`📊 Total profiles: ${snapshot.size}`);
}

checkVisibility().catch(console.error);
