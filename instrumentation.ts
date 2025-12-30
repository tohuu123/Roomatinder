// Instrumentation file - Runs on server startup
// This file is automatically loaded by Next.js

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Only run in Node.js runtime (server-side)
    const { initializeCronJobs } = await import('./lib/cronScheduler');
    
    console.log('🚀 [Instrumentation] Server starting...');
    initializeCronJobs();
    console.log('✅ [Instrumentation] Email notification system initialized');
  }
}

export async function onRequestError(
  error: Error,
  request: {
    path: string;
    method: string;
  }
) {
  // Optional: Log request errors
  console.error('Request error:', {
    error: error.message,
    path: request.path,
    method: request.method,
  });
}
