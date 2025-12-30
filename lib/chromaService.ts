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
 * Excludes profileCompletion field.
 */
function profileToMetadata(profile: UserProfile): Record<string, string | number | boolean> {
  const metadata: Record<string, string | number | boolean> = {};
  
  for (const [key, value] of Object.entries(profile)) {
    // Skip profileCompletion - not needed for matching
    if (key === 'profileCompletion') continue;
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
  if (profile.districts && profile.districts.length > 0) parts.push(`Districts: ${profile.districts.join(', ')}`);
  
  // Budget
  if (profile.budgetMin || profile.budgetMax) {
    parts.push(`Budget: ${profile.budgetMin || 0} - ${profile.budgetMax || 0} VND`);
  }
  
  // Living preferences
  if (profile.cleanlinessLevel) parts.push(`Cleanliness: ${profile.cleanlinessLevel}`);
  if (profile.smokingPolicy) parts.push(`Smoking: ${profile.smokingPolicy}`);
  if (profile.noiseLevel) parts.push(`Noise Level: ${profile.noiseLevel}`);
  if (profile.guestPolicy) parts.push(`Guest Policy: ${profile.guestPolicy}`);
  if (profile.cookingSkills) parts.push(`Cooking Skills: ${profile.cookingSkills}`);
  if (profile.sleepSchedule) parts.push(`Sleep Schedule: ${profile.sleepSchedule}`);
  
  // Accommodation details
  if (profile.accommodationStatus === 'have-room') {
    if (profile.districts && profile.districts.length > 0) {
      parts.push(`Accommodation Districts: ${profile.districts.join(', ')}`);
    }
    if (profile.accommodationType) {
      const typeStr = Array.isArray(profile.accommodationType) 
        ? profile.accommodationType.join(', ') 
        : profile.accommodationType;
      parts.push(`Accommodation Type: ${typeStr}`);
    }
    if (profile.accommodationSize) {
      const sizeStr = Array.isArray(profile.accommodationSize) 
        ? profile.accommodationSize.join(', ') 
        : profile.accommodationSize;
      parts.push(`Accommodation Size: ${sizeStr}`);
    }
    if (profile.liveWithLandlord !== undefined) {
      parts.push(`Live With Landlord: ${profile.liveWithLandlord}`);
    }
    if (profile.accommodationServices && profile.accommodationServices.length > 0) {
      parts.push(`Accommodation Services: ${profile.accommodationServices.join(', ')}`);
    }
    if (profile.accommodationFee) {
      parts.push(`Monthly Fee: ${profile.accommodationFee} Million VND`);
    }
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

/**
 * Convert cosine distance to similarity percentage.
 * ChromaDB returns cosine distance (0 = identical, 2 = opposite).
 * Similarity = (1 - distance/2) * 100
 */
function distanceToSimilarity(distance: number): number {
  // Cosine distance ranges from 0 (identical) to 2 (opposite)
  // Convert to percentage: 0 distance = 100%, 2 distance = 0%
  const similarity = (1 - distance / 2) * 100;
  return Math.round(similarity * 100) / 100; // Round to 2 decimal places
}

/**
 * Query ChromaDB for a matching profile.
 * Returns the userId and similarity percentage of the best matching profile.
 * 
 * @param currentUserId - The current user's ID (to exclude from results)
 * @param excludeUserIds - Array of user IDs to exclude (already seen profiles)
 * @param metadataFilter - ChromaDB where filter for metadata (optional)
 * @returns Object with userId and similarity percentage, or null if none found
 */
export async function queryMatchingProfile(
  currentUserId: string,
  excludeUserIds: string[] = [],
  metadataFilter?: Record<string, any>
): Promise<{ userId: string; similarity: number } | null> {
  try {
    const client = getChromaClient();
    
    // Get the collection
    const collection = await client.getOrCreateCollection({
      name: COLLECTION_NAME,
    });
    
    // Get count to check if collection has data
    const count = await collection.count();
    if (count === 0) {
      console.log('[ChromaDB] No profiles in collection');
      return null;
    }
    
    // All IDs to exclude - deduplicate to avoid duplicate entries in $nin filter
    const allExcluded = Array.from(new Set([currentUserId, ...excludeUserIds]));
    
    console.log(`[ChromaDB] Excluding ${allExcluded.length} user IDs (${excludeUserIds.length + 1} before dedup):`, allExcluded.slice(0, 5), '...');
    
    // First, get the current user's document to use as query
    const currentUserResult = await collection.get({
      ids: [currentUserId],
      include: ['documents'],
    });
    
    if (!currentUserResult.documents || !currentUserResult.documents[0]) {
      console.log('[ChromaDB] Current user profile not found in ChromaDB');
      return null;
    }
    
    const queryText = currentUserResult.documents[0];
    
    // Build where filter - combine user exclusion with metadata filters
    let whereFilter: Record<string, any> | undefined = undefined;
    
    // Start with user exclusion
    if (allExcluded.length > 0) {
      whereFilter = {
        userId: { "$nin": allExcluded }
      };
    }
    
    // Merge with metadata filters using $and
    if (metadataFilter && Object.keys(metadataFilter).length > 0) {
      if (whereFilter) {
        // Combine both filters using $and
        whereFilter = {
          "$and": [
            whereFilter,
            metadataFilter
          ]
        };
      } else {
        whereFilter = metadataFilter;
      }
    }
    
    console.log('[ChromaDB] Where filter:', JSON.stringify(whereFilter, null, 2));
    
    // Query with the current user's profile as the search text and where filter
    const results = await collection.query({
      queryTexts: [queryText],
      nResults: 1, // Only get the top match
      include: ['distances', 'metadatas'],
      where: whereFilter,
    });
    
    // Get first result
    if (results.ids && results.ids[0] && results.ids[0][0] && results.distances && results.distances[0] && results.distances[0][0] !== null) {
      const id = results.ids[0][0];
      const distance = results.distances[0][0];
      
      // Extra safety check: ensure the returned ID is not in the exclude list
      if (allExcluded.includes(id)) {
        console.error(`[ChromaDB] WARNING: Returned excluded ID ${id}! Filter not working properly.`);
        console.log('[ChromaDB] Metadata:', results.metadatas?.[0]?.[0]);
        return null;
      }
      
      const similarity = distanceToSimilarity(distance);
      console.log(`[ChromaDB] Match found: ${id} (similarity: ${similarity}%)`);
      return { userId: id, similarity };
    }
    
    console.log('[ChromaDB] No matching profiles found');
    return null;
  } catch (error) {
    console.error('[ChromaDB] Error querying profiles:', error);
    return null;
  }
}