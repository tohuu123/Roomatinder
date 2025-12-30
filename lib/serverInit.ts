// Server initialization script - Start cron jobs
// Import this in your main server file or API route

import { initializeCronJobs } from './cronScheduler';

// Call this when your server starts
export function initializeServer() {
  console.log('🚀 Initializing Roomatinder server...');
  
  // Start email notification cron jobs
  initializeCronJobs();
  
  console.log('✅ Server initialization complete');
}

// For Next.js, you can create an API route that runs on server start
// Or call this in your middleware.ts or instrumentation.ts
