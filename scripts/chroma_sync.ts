#!/usr/bin/env npx ts-node
/**
 * Standalone script to sync all Firebase profiles to ChromaDB.
 * 
 * This script fetches all profiles from Firebase and upserts them into ChromaDB.
 * If a profile already exists in ChromaDB, it will be updated.
 * 
 * Usage:
 *   npx ts-node scripts/chroma_sync.ts
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { ChromaClient } from 'chromadb';
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

// Validate Firebase config
if (!firebaseConfig.projectId) {
  console.error('ERROR: Firebase configuration is missing.');
  console.error('Make sure .env.local exists with NEXT_PUBLIC_FIREBASE_* variables.');
  process.exit(1);
}

console.log('Firebase Project:', firebaseConfig.projectId);

// Initialize Firebase
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const db = getFirestore(app);

// Configuration
const CHROMA_HOST = process.env.CHROMA_HOST || 'http://localhost:8000';
const COLLECTION_NAME = 'user_profiles';
const FIREBASE_COLLECTION = 'profiles';

// Encode value for ChromaDB metadata
function encodeValue(value: unknown): string | number | boolean {
  if (value === null || value === undefined) {
    return '';
  }
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number') {
    return value;
  }
  if (typeof value === 'boolean') {
    return value;
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (value && typeof value === 'object' && 'toDate' in value) {
    // Firebase Timestamp
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  if (Array.isArray(value)) {
    return JSON.stringify(value);
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return String(value);
}

// Convert profile to metadata (same as chromaService.ts)
// Excludes profileCompletion field
function profileToMetadata(profile: Record<string, unknown>): Record<string, string | number | boolean> {
  const metadata: Record<string, string | number | boolean> = {};
  
  for (const [key, value] of Object.entries(profile)) {
    // Skip profileCompletion - not needed for matching
    if (key === 'profileCompletion') continue;
    metadata[key] = encodeValue(value);
  }
  
  return metadata;
}

// Convert profile to document text (same as chromaService.ts)
function profileToDocument(profile: Record<string, unknown>): string {
  const parts: string[] = [];
  
  // Basic info
  if (profile.gender) parts.push(`Gender: ${profile.gender}`);
  if (profile.university) parts.push(`University: ${profile.university}`);
  if (profile.district) parts.push(`District: ${profile.district}`);
  
  // Budget
  if (profile.budgetMin || profile.budgetMax) {
    parts.push(`Budget: ${profile.budgetMin || 0} - ${profile.budgetMax || 0} VND`);
  }
  
  // Living preferences
  if (profile.cleanlinessLevel) parts.push(`Cleanliness: ${profile.cleanlinessLevel}`);
  if (profile.smokingPolicy) parts.push(`Smoking: ${profile.smokingPolicy}`);
  
  // Optional preferences
  if (profile.noiseLevelPreference) parts.push(`Noise Level: ${profile.noiseLevelPreference}`);
  if (profile.cookingSkills) parts.push(`Cooking: ${profile.cookingSkills}`);
  if (profile.guestPolicy) parts.push(`Guest Policy: ${profile.guestPolicy}`);
  if (profile.sharedSpaceCleaning) parts.push(`Cleaning: ${profile.sharedSpaceCleaning}`);
  
  // Accommodation details
  if (profile.hasAccommodation === 'have-room') {
    if (profile.accommodationLocation) parts.push(`Accommodation Location: ${profile.accommodationLocation}`);
  } else {
    if (profile.location) parts.push(`Desired Location: ${profile.location}`);
  }
  
  return parts.join('. ');
}

async function syncProfilesToChroma(): Promise<void> {
  console.log('===========================================');
  console.log('Firebase to ChromaDB Sync');
  console.log('===========================================\n');
  console.log('ChromaDB Host:', CHROMA_HOST);
  console.log('Collection:', COLLECTION_NAME);
  console.log('-------------------------------------------\n');

  try {
    // Initialize ChromaDB
    const chromaClient = new ChromaClient({ path: CHROMA_HOST });
    
    // Get or create ChromaDB collection
    const chromaCollection = await chromaClient.getOrCreateCollection({
      name: COLLECTION_NAME,
      metadata: { description: 'User profiles for roommate matching' },
    });
    
    console.log('Fetching profiles from Firebase...\n');
    
    // Fetch all profiles from Firebase
    const profilesRef = collection(db, FIREBASE_COLLECTION);
    const snapshot = await getDocs(profilesRef);
    
    if (snapshot.empty) {
      console.log('No profiles found in Firebase.');
      return;
    }
    
    console.log(`Found ${snapshot.size} profiles in Firebase.\n`);
    
    // Process each profile
    let successCount = 0;
    let errorCount = 0;
    
    for (const doc of snapshot.docs) {
      const userId = doc.id;
      const profileData = doc.data();
      
      // Add userId to profile data
      const profile: Record<string, unknown> = { ...profileData, userId };
      
      try {
        const document = profileToDocument(profile);
        const metadata = profileToMetadata(profile);
        
        // Upsert to ChromaDB
        await chromaCollection.upsert({
          ids: [userId],
          documents: [document],
          metadatas: [metadata],
        });
        
        console.log(`✓ Synced: ${profile.displayName || profile.email || userId}`);
        successCount++;
      } catch (error) {
        console.error(`✗ Error syncing ${userId}:`, error);
        errorCount++;
      }
    }
    
    console.log('\n-------------------------------------------');
    console.log('Sync Complete!');
    console.log(`  Successful: ${successCount}`);
    console.log(`  Failed: ${errorCount}`);
    console.log(`  Total in ChromaDB: ${await chromaCollection.count()}`);
    console.log('-------------------------------------------\n');
    
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('ECONNREFUSED') || error.message.includes('fetch failed')) {
        console.error('ERROR: Cannot connect to ChromaDB server.');
        console.error('Make sure ChromaDB is running at:', CHROMA_HOST);
        console.error('\nTo start ChromaDB, run:');
        console.error('  docker run -p 8000:8000 chromadb/chroma');
      } else {
        console.error('Error:', error.message);
      }
    } else {
      console.error('Unknown error:', error);
    }
    process.exit(1);
  }
}

// Run the script
syncProfilesToChroma();
