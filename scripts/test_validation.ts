#!/usr/bin/env npx ts-node
/**
 * Test script to check which profiles pass the new validation
 */

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

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const db = getFirestore(app);

// Same validation logic as in profileService.ts
function hasCompletedRequiredFields(profile: any): boolean {
  // Check essential fields
  if (!profile.displayName || profile.displayName.trim() === '') return false;
  if (!profile.gender) return false;
  if (!profile.accommodationStatus) return false;
  
  // Must have at least one lifestyle preference for matching
  if (!profile.cleanlinessLevel && !profile.sleepSchedule && !profile.noiseLevel) return false;
  
  // Must have districts for location-based matching
  if (!profile.districts || profile.districts.length === 0) return false;
  
  // If have-room, must have accommodation fee
  if (profile.accommodationStatus === 'have-room') {
    if (profile.accommodationFee === undefined || profile.accommodationFee === null) return false;
  }
  
  return true;
}

async function testValidation() {
  console.log('===========================================');
  console.log('Profile Validation Test');
  console.log('===========================================\n');

  try {
    const profilesRef = collection(db, 'profiles');
    const snapshot = await getDocs(profilesRef);
    
    if (snapshot.empty) {
      console.log('No profiles found in Firebase.');
      return;
    }
    
    console.log(`Total profiles in Firebase: ${snapshot.size}\n`);
    
    let validCount = 0;
    let invalidCount = 0;
    
    const validProfiles: any[] = [];
    const invalidProfiles: any[] = [];
    
    snapshot.forEach((doc) => {
      const profile = { ...doc.data(), userId: doc.id };
      const isValid = hasCompletedRequiredFields(profile);
      
      if (isValid) {
        validCount++;
        validProfiles.push(profile);
      } else {
        invalidCount++;
        invalidProfiles.push(profile);
      }
    });
    
    console.log('-------------------------------------------');
    console.log(`✅ Valid Profiles: ${validCount}`);
    console.log(`❌ Invalid Profiles: ${invalidCount}`);
    console.log('-------------------------------------------\n');
    
    if (validProfiles.length > 0) {
      console.log('Valid Profiles (showing first 10):');
      validProfiles.slice(0, 10).forEach((p, i) => {
        console.log(`${i + 1}. ${p.displayName} (${p.gender}) - ${p.accommodationStatus}`);
      });
      console.log('');
    }
    
    if (invalidProfiles.length > 0) {
      console.log('Invalid Profiles (showing first 5 with reasons):');
      invalidProfiles.slice(0, 5).forEach((p, i) => {
        const reasons: string[] = [];
        if (!p.displayName || p.displayName.trim() === '') reasons.push('No displayName');
        if (!p.gender) reasons.push('No gender');
        if (!p.accommodationStatus) reasons.push('No accommodationStatus');
        if (!p.cleanlinessLevel && !p.sleepSchedule && !p.noiseLevel) reasons.push('No lifestyle preferences');
        if (!p.districts || p.districts.length === 0) reasons.push('No districts');
        if (p.accommodationStatus === 'have-room' && (p.accommodationFee === undefined || p.accommodationFee === null)) {
          reasons.push('No accommodationFee (have-room)');
        }
        
        console.log(`${i + 1}. ${p.displayName || 'N/A'} - Missing: ${reasons.join(', ')}`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testValidation();
