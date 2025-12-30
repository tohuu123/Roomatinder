#!/usr/bin/env npx ts-node
/**
 * Script to reset isVisible to true for all profiles
 * This is needed because the auto-hide logic was marking all inactive profiles as invisible
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore';

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

async function resetVisibility() {
  console.log('Resetting isVisible to true for all profiles...\n');
  
  const usersCollection = collection(db, 'profiles');
  const snapshot = await getDocs(usersCollection);
  
  console.log(`Found ${snapshot.size} profiles to update\n`);
  
  let successCount = 0;
  let failCount = 0;
  
  for (const docSnapshot of snapshot.docs) {
    try {
      const docRef = doc(db, 'profiles', docSnapshot.id);
      await updateDoc(docRef, {
        isVisible: true
      });
      console.log(`✅ Updated: ${docSnapshot.id}`);
      successCount++;
    } catch (error) {
      console.error(`❌ Failed to update ${docSnapshot.id}:`, error);
      failCount++;
    }
  }
  
  console.log('\n=== Summary ===');
  console.log(`✅ Successfully updated: ${successCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log(`📊 Total: ${snapshot.size}`);
}

resetVisibility()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });
