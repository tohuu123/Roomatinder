#!/usr/bin/env npx ts-node
import { ChromaClient } from 'chromadb';

async function main() {
  const client = new ChromaClient({ path: 'http://localhost:8000' });
  const collection = await client.getCollection({ name: 'user_profiles' });
  
  // Get first profile
  const result = await collection.get({
    ids: ['0GkPfk0FiGcCTUkgHauBB4OlulL2'],
    include: ['metadatas'],
  });
  
  console.log('Profile metadata:');
  console.log(JSON.stringify(result.metadatas?.[0], null, 2));
}

main().catch(console.error);
