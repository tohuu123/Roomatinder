// Simple Test - Daily Email Configuration Check
import * as fs from 'fs';
import * as path from 'path';

console.log('🔍 Daily Email System - Configuration Check\n');
console.log('='.repeat(60));

// Check .env file exists
console.log('\n📋 Test 1: Environment File');
console.log('-'.repeat(60));
const envPath = path.join(process.cwd(), '.env.local');
const envExists = fs.existsSync(envPath);
console.log(`.env.local exists: ${envExists ? '✅ Yes' : '❌ No'}`);

// Check environment variables
console.log('\n📋 Test 2: Required Environment Variables');
console.log('-'.repeat(60));

const requiredVars = {
  'EMAIL_SERVICE': process.env.EMAIL_SERVICE,
  'EMAIL_USER': process.env.EMAIL_USER,
  'EMAIL_PASSWORD': process.env.EMAIL_PASSWORD ? '***' : undefined,
  'NEXT_PUBLIC_APP_URL': process.env.NEXT_PUBLIC_APP_URL,
  'NEXT_PUBLIC_GEMINI_API_KEY': process.env.NEXT_PUBLIC_GEMINI_API_KEY ? '***' : undefined,
  'CRON_SECRET': process.env.CRON_SECRET ? '***' : undefined,
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID': process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
};

let missingVars = 0;
Object.entries(requiredVars).forEach(([key, value]) => {
  if (value) {
    console.log(`✅ ${key}: ${value}`);
  } else {
    console.log(`❌ ${key}: NOT SET`);
    missingVars++;
  }
});

// Check important files exist
console.log('\n📋 Test 3: Required Files');
console.log('-'.repeat(60));

const requiredFiles = [
  'lib/emailNotificationService.ts',
  'lib/emailService.ts',
  'lib/emailTemplates.ts',
  'lib/cronScheduler.ts',
  'app/api/email/daily-digest/route.ts',
  'app/api/email/weekly-report/route.ts',
  'types/profile.ts',
];

requiredFiles.forEach(filePath => {
  const fullPath = path.join(process.cwd(), filePath);
  const exists = fs.existsSync(fullPath);
  console.log(`${exists ? '✅' : '❌'} ${filePath}`);
});

// Check Firebase collections structure
console.log('\n📋 Test 4: Firebase Collections (Documentation)');
console.log('-'.repeat(60));
console.log('Required collections:');
console.log('  1. ✅ profiles - Main user profiles');
console.log('     Fields needed:');
console.log('       - userId: string');
console.log('       - email: string (required)');
console.log('       - displayName: string');
console.log('       - emailNotificationsEnabled: boolean (default: true)');
console.log('       - isVisible: boolean (default: true)');
console.log('       - lastEmailSent: timestamp');
console.log('');
console.log('  2. ✅ notifications - Activity notifications');
console.log('     Fields needed:');
console.log('       - userId: string (receiver)');
console.log('       - fromUserId: string');
console.log('       - fromUserName: string');
console.log('       - type: "like" | "match" | "message"');
console.log('       - message: string');
console.log('       - read: boolean');
console.log('       - createdAt: timestamp (required for filtering)');

// Check cron schedule
console.log('\n📋 Test 5: Cron Schedule Configuration');
console.log('-'.repeat(60));
console.log('Scheduled jobs:');
console.log('  1. Daily Digest    - Every day at 6 PM UTC (1 AM Vietnam)');
console.log('  2. Weekly Report   - Every Monday at 9 AM UTC');
console.log('  3. Inactivity Check - Every day at 10 AM UTC');
console.log('');
console.log('Cron jobs enabled: ' + (process.env.NODE_ENV === 'production' || process.env.ENABLE_CRON === 'true' ? '✅ Yes' : '❌ No (dev mode)'));

// API endpoints
console.log('\n📋 Test 6: API Endpoints');
console.log('-'.repeat(60));
console.log('Available endpoints:');
console.log('  POST /api/email/daily-digest');
console.log('    - Requires: Authorization header with CRON_SECRET');
console.log('    - Sends daily digest to all eligible users');
console.log('');
console.log('  GET /api/email/daily-digest?userId=USER_ID');
console.log('    - Test endpoint for single user');
console.log('    - No auth required (should be disabled in production)');
console.log('');
console.log('  POST /api/email/weekly-report');
console.log('  GET /api/email/weekly-report?userId=USER_ID');
console.log('');
console.log('  POST /api/email/check-inactive');

// Testing instructions
console.log('\n📋 Test 7: How to Test');
console.log('-'.repeat(60));
console.log('\n🧪 Method 1: Test with real user ID');
console.log('1. Get a user ID from Firebase Console (profiles collection)');
console.log('2. Make sure the user has:');
console.log('   - email field set');
console.log('   - emailNotificationsEnabled = true (or undefined)');
console.log('   - isVisible = true (or undefined)');
console.log('3. Create test notification in Firebase:');
console.log('   Collection: notifications');
console.log('   {');
console.log('     userId: "YOUR_USER_ID",');
console.log('     fromUserId: "test_123",');
console.log('     fromUserName: "Test User",');
console.log('     type: "like",');
console.log('     message: "Test User liked you!",');
console.log('     read: false,');
console.log('     createdAt: <current timestamp>');
console.log('   }');
console.log('4. Test API:');
console.log('   curl "http://localhost:3000/api/email/daily-digest?userId=YOUR_USER_ID"');
console.log('');
console.log('🧪 Method 2: Test with real match');
console.log('1. Use 2 accounts');
console.log('2. Account A likes Account B');
console.log('3. Account B likes Account A back');
console.log('4. Match occurs → notifications created automatically');
console.log('5. Wait or trigger daily digest');
console.log('');
console.log('🧪 Method 3: Manual API test');
console.log('1. Start dev server: npm run dev');
console.log('2. Call API endpoint:');
console.log('   curl "http://localhost:3000/api/email/daily-digest?userId=YOUR_USER_ID"');
console.log('3. Check response and email inbox');

// Summary
console.log('\n' + '='.repeat(60));
console.log('📊 Summary');
console.log('='.repeat(60));

if (missingVars > 0) {
  console.log(`⚠️  ${missingVars} environment variable(s) missing`);
  console.log('Please add them to .env.local file');
} else {
  console.log('✅ All required environment variables are set');
}

console.log('\n📚 Documentation Files:');
console.log('  - docs/EMAIL_SYSTEM_OVERVIEW.md     - Complete system overview');
console.log('  - docs/DAILY_EMAIL_CHECKLIST.md     - Detailed checklist');
console.log('  - docs/DAILY_WEEKLY_EMAIL_DEBUG.md  - Debug guide');
console.log('');

console.log('🔗 Next Steps:');
if (missingVars > 0) {
  console.log('  1. ❌ Setup missing environment variables');
} else {
  console.log('  1. ✅ Environment variables configured');
}
console.log('  2. Verify Firebase collections structure');
console.log('  3. Create test notification in Firebase');
console.log('  4. Test API endpoint with real user ID');
console.log('  5. Check email inbox');
console.log('  6. Deploy to production with cron job setup');
console.log('');
console.log('🎉 Configuration check completed!\n');
