// Test Match Email Script
// Run with: npx ts-node scripts/test-match-email.ts USER_ID_1 USER_ID_2

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

import { sendMatchNotificationEmail } from '../lib/emailNotificationService';

async function testMatchEmail() {
  const userId1 = process.argv[2];
  const userId2 = process.argv[3];

  if (!userId1 || !userId2) {
    console.error('❌ Usage: npx ts-node scripts/test-match-email.ts USER_ID_1 USER_ID_2');
    console.log('\nExample:');
    console.log('  npx ts-node scripts/test-match-email.ts abc123 xyz789');
    process.exit(1);
  }

  console.log('╔════════════════════════════════════════════╗');
  console.log('║  Test Match Notification Email            ║');
  console.log('╚════════════════════════════════════════════╝\n');

  console.log(`Testing match between:`);
  console.log(`  User 1: ${userId1}`);
  console.log(`  User 2: ${userId2}\n`);

  try {
    console.log('1. Sending match email to User 1...');
    const success1 = await sendMatchNotificationEmail(userId1, userId2);
    console.log(success1 ? '✅ Email sent to User 1' : '❌ Failed to send to User 1');

    console.log('\n2. Sending match email to User 2...');
    const success2 = await sendMatchNotificationEmail(userId2, userId1);
    console.log(success2 ? '✅ Email sent to User 2' : '❌ Failed to send to User 2');

    if (success1 && success2) {
      console.log('\n🎉 Both match notification emails sent successfully!');
      console.log('📧 Check both users\' email inboxes');
    } else {
      console.log('\n⚠️  Some emails failed to send. Check logs above.');
    }
  } catch (error) {
    console.error('\n❌ Error:', error);
  }

  console.log('\n╔════════════════════════════════════════════╗');
  console.log('║  Test Complete                            ║');
  console.log('╚════════════════════════════════════════════╝');
}

testMatchEmail().catch(console.error);
