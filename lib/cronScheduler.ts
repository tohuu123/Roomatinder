// Cron Job Scheduler for Email Notifications
import cron from 'node-cron';

const CRON_SECRET = process.env.CRON_SECRET;
const API_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

/**
 * Start all scheduled email cron jobs
 */
export function startEmailCronJobs() {
  console.log('Starting email notification cron jobs...');

  // Daily Digest - Every day at 6 PM
  cron.schedule('0 18 * * *', async () => {
    console.log('Running daily digest cron job...');
    try {
      const response = await fetch(`${API_URL}/api/email/daily-digest`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${CRON_SECRET}`,
          'Content-Type': 'application/json',
        },
      });
      const result = await response.json();
      console.log('Daily digest result:', result);
    } catch (error) {
      console.error('Error running daily digest cron:', error);
    }
  }, {
    timezone: 'UTC'
  });

  // Weekly Report - Every Monday at 9 AM
  cron.schedule('0 9 * * 1', async () => {
    console.log('Running weekly report cron job...');
    try {
      const response = await fetch(`${API_URL}/api/email/weekly-report`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${CRON_SECRET}`,
          'Content-Type': 'application/json',
        },
      });
      const result = await response.json();
      console.log('Weekly report result:', result);
    } catch (error) {
      console.error('Error running weekly report cron:', error);
    }
  }, {
    timezone: 'UTC'
  });

  // Inactivity Check - Every day at 10 AM
  cron.schedule('0 10 * * *', async () => {
    console.log('Running inactivity check cron job...');
    try {
      const response = await fetch(`${API_URL}/api/email/check-inactive`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${CRON_SECRET}`,
          'Content-Type': 'application/json',
        },
      });
      const result = await response.json();
      console.log('Inactivity check result:', result);
    } catch (error) {
      console.error('Error running inactivity check cron:', error);
    }
  }, {
    timezone: 'UTC'
  });

  console.log('Email notification cron jobs started successfully');
  console.log('- Daily digest: Every day at 6 PM UTC');
  console.log('- Weekly report: Every Monday at 9 AM UTC');
  console.log('- Inactivity check: Every day at 10 AM UTC');
}

/**
 * Initialize cron jobs (call this in your server startup)
 */
export function initializeCronJobs() {
  if (!CRON_SECRET) {
    console.warn('CRON_SECRET not set - email cron jobs will not be secured');
    return;
  }

  // Only run cron jobs in production or if explicitly enabled
  if (process.env.NODE_ENV === 'production' || process.env.ENABLE_CRON === 'true') {
    startEmailCronJobs();
  } else {
    console.log('Cron jobs disabled (not in production). Set ENABLE_CRON=true to enable.');
  }
}
