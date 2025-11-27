"use server";

/**
 * ChromaDB Service - Simple profile indexing
 * 
 * This service adds profile data to ChromaDB for vector-based retrieval.
 * Each profile is stored as a single JSON document with the user's UUID as the ID.
 */

import { ChromaClient } from 'chromadb';
import { UserProfile } from '@/types/profile';

// ChromaDB configuration
const CHROMA_HOST = process.env.CHROMA_HOST || 'http://localhost:8000';
const COLLECTION_NAME = 'user_profiles';

// Initialize ChromaDB client
let chromaClient: ChromaClient | null = null;

function getChromaClient(): ChromaClient {
  if (!chromaClient) {
    chromaClient = new ChromaClient({ path: CHROMA_HOST });
  }
  return chromaClient;
}

/**
 * Safely encode a value for ChromaDB metadata.
 * ChromaDB metadata only supports: string, number, boolean.
 * Arrays are converted to JSON strings, null/undefined become empty strings.
 */
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
  if (Array.isArray(value)) {
    return JSON.stringify(value);
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return String(value);
}

/**
 * Convert a UserProfile to a flat metadata object for ChromaDB.
 * All values are safely encoded to supported types.
 */
function profileToMetadata(profile: UserProfile): Record<string, string | number | boolean> {
  const metadata: Record<string, string | number | boolean> = {};
  
  for (const [key, value] of Object.entries(profile)) {
    metadata[key] = encodeValue(value);
  }
  
  return metadata;
}

/**
 * Convert a UserProfile to a text document for embedding.
 * This creates a searchable text representation of the profile.
 */
function profileToDocument(profile: UserProfile): string {
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

/**
 * Add a profile to ChromaDB.
 * The profile is stored as a single document with the userId as the ID.
 * 
 * @param profile - The UserProfile to add
 */
export async function addProfileToChroma(profile: UserProfile): Promise<void> {
  try {
    const client = getChromaClient();
    
    // Get or create the collection
    const collection = await client.getOrCreateCollection({
      name: COLLECTION_NAME,
      metadata: { description: 'User profiles for roommate matching' },
    });
    
    // Convert profile to document and metadata
    const document = profileToDocument(profile);
    const metadata = profileToMetadata(profile);
    
    // Upsert the profile (add or update)
    await collection.upsert({
      ids: [profile.userId],
      documents: [document],
      metadatas: [metadata],
    });
    
    console.log(`[ChromaDB] Profile ${profile.userId} added/updated successfully`);
  } catch (error) {
    // Log error but don't throw - ChromaDB indexing should not block profile creation
    console.error('[ChromaDB] Error adding profile:', error);
  }
}
