#!/usr/bin/env npx ts-node
/**
 * Standalone script to manage ChromaDB user_profiles collection.
 * 
 * Usage:
 *   npx ts-node scripts/list-chroma-profiles.ts [command]
 * 
 * Commands:
 *   list     - List all documents in the collection (default)
 *   delete   - Delete all documents from the collection
 *   help     - Show this help message
 * 
 * Examples:
 *   npx ts-node scripts/list-chroma-profiles.ts
 *   npx ts-node scripts/list-chroma-profiles.ts list
 *   npx ts-node scripts/list-chroma-profiles.ts delete
 */

import { ChromaClient } from 'chromadb';
import * as readline from 'readline';

const CHROMA_HOST = process.env.CHROMA_HOST || 'http://localhost:8000';
const COLLECTION_NAME = 'user_profiles';

function getChromaClient(): ChromaClient {
  return new ChromaClient({ path: CHROMA_HOST });
}

function printHeader(): void {
  console.log('Connecting to ChromaDB at:', CHROMA_HOST);
  console.log('Collection:', COLLECTION_NAME);
  console.log('-------------------------------------------\n');
}

function printHelp(): void {
  console.log(`
ChromaDB Profile Manager

Usage:
  npx ts-node scripts/list-chroma-profiles.ts [command]

Commands:
  list     List all documents in the collection (default)
  delete   Delete all documents from the collection
  help     Show this help message

Environment Variables:
  CHROMA_HOST   ChromaDB server URL (default: http://localhost:8000)

Examples:
  npx ts-node scripts/list-chroma-profiles.ts
  npx ts-node scripts/list-chroma-profiles.ts list
  npx ts-node scripts/list-chroma-profiles.ts delete
  CHROMA_HOST=http://myserver:8000 npx ts-node scripts/list-chroma-profiles.ts list
`);
}

async function confirm(message: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(`${message} (y/N): `, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

async function listAllProfiles(): Promise<void> {
  printHeader();

  try {
    const client = getChromaClient();

    // Check if collection exists
    const collections = await client.listCollections();
    const collectionExists = collections.some((c: { name: string }) => c.name === COLLECTION_NAME);

    if (!collectionExists) {
      console.log('Collection does not exist yet. No profiles have been indexed.');
      console.log('\nAvailable collections:', collections.map((c: { name: string }) => c.name).join(', ') || 'None');
      return;
    }

    // Get the collection
    const collection = await client.getCollection({ name: COLLECTION_NAME });

    // Get collection count
    const count = await collection.count();
    console.log(`Total documents in collection: ${count}\n`);

    if (count === 0) {
      console.log('No profiles found in the collection.');
      return;
    }

    // Get all documents (with limit for safety)
    const limit = Math.min(count, 100);
    const results = await collection.get({
      limit: limit,
      include: ['documents', 'metadatas'],
    });

    console.log(`Showing ${results.ids.length} profiles:\n`);
    console.log('===========================================');

    for (let i = 0; i < results.ids.length; i++) {
      const id = results.ids[i];
      const document = results.documents?.[i] || 'No document';
      const metadata = results.metadatas?.[i] || {};

      console.log(`\n[Profile ${i + 1}]`);
      console.log('ID (userId):', id);
      console.log('Display Name:', metadata.displayName || 'N/A');
      console.log('Email:', metadata.email || 'N/A');
      console.log('Slug:', metadata.slug || 'N/A');
      console.log('Gender:', metadata.gender || 'N/A');
      console.log('University:', metadata.university || 'N/A');
      console.log('District:', metadata.district || 'N/A');
      console.log('Budget:', `${metadata.budgetMin || 0} - ${metadata.budgetMax || 0} VND`);
      console.log('Has Accommodation:', metadata.hasAccommodation || 'N/A');
      console.log('Sleep Schedule:', metadata.sleepSchedule || 'N/A');
      console.log('Cleanliness:', metadata.cleanlinessLevel || 'N/A');
      console.log('Profile Completion:', metadata.profileCompletion || 0, '%');
      console.log('\nDocument (searchable text):');
      console.log(document ? document.substring(0, 500) + (document.length > 500 ? '...' : '') : 'N/A');
      console.log('-------------------------------------------');
    }

    if (count > limit) {
      console.log(`\n... and ${count - limit} more profiles (showing first ${limit})`);
    }
  } catch (error) {
    handleError(error);
  }
}

async function deleteAllProfiles(): Promise<void> {
  printHeader();

  try {
    const client = getChromaClient();

    // Check if collection exists
    const collections = await client.listCollections();
    const collectionExists = collections.some((c: { name: string }) => c.name === COLLECTION_NAME);

    if (!collectionExists) {
      console.log('Collection does not exist. Nothing to delete.');
      return;
    }

    // Get the collection
    const collection = await client.getCollection({ name: COLLECTION_NAME });

    // Get collection count
    const count = await collection.count();

    if (count === 0) {
      console.log('No profiles found in the collection. Nothing to delete.');
      return;
    }

    console.log(`Found ${count} documents in the collection.`);
    
    // Confirm deletion
    const confirmed = await confirm(`Are you sure you want to delete ALL ${count} documents?`);
    
    if (!confirmed) {
      console.log('\nDeletion cancelled.');
      return;
    }

    console.log('\nDeleting all documents...');

    // Get all document IDs
    const results = await collection.get({ include: [] });
    const ids = results.ids;

    if (ids.length > 0) {
      await collection.delete({ ids: ids });
      console.log(`Successfully deleted ${ids.length} documents.`);
    }

    // Verify deletion
    const newCount = await collection.count();
    console.log(`Remaining documents in collection: ${newCount}`);
  } catch (error) {
    handleError(error);
  }
}

function handleError(error: unknown): void {
  if (error instanceof Error) {
    if (error.message.includes('ECONNREFUSED') || error.message.includes('fetch failed')) {
      console.error('ERROR: Cannot connect to ChromaDB server.');
      console.error('Make sure ChromaDB is running at:', CHROMA_HOST);
      console.error('\nTo start ChromaDB, run:');
      console.error('  docker run -p 8000:8000 chromadb/chroma');
      console.error('\nOr using docker-compose (see docs/CHROMADB_SETUP.md)');
    } else {
      console.error('Error:', error.message);
    }
  } else {
    console.error('Unknown error:', error);
  }
  process.exit(1);
}

// Main entry point
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const command = args[0]?.toLowerCase() || 'list';

  switch (command) {
    case 'list':
      await listAllProfiles();
      break;
    case 'delete':
      await deleteAllProfiles();
      break;
    case 'help':
    case '--help':
    case '-h':
      printHelp();
      break;
    default:
      console.error(`Unknown command: ${command}`);
      console.error('Use "help" to see available commands.');
      process.exit(1);
  }
}

main();
