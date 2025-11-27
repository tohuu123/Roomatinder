"use server";

/**
 * Server Actions for ChromaDB operations
 * 
 * These actions run on the server only, avoiding client-side bundling issues
 * with the chromadb package which uses Node.js-specific APIs.
 */

import { addProfileToChroma as addProfileToChromaService } from '../chromaService';
import { UserProfile } from '@/types/profile';

/**
 * Server action to add/update a profile in ChromaDB
 */
export async function addProfileToChroma(profile: UserProfile): Promise<void> {
  await addProfileToChromaService(profile);
}
