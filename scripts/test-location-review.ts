/**
 * Test script for Location Review API
 * Run with: npx tsx scripts/test-location-review.ts
 */

import { GeminiLocationReviewService } from '../lib/geminiLocationReviewService';

async function testLocationReview() {
  console.log('🧪 Testing Location Review Service...\n');

  try {
    // Test with a known location in HCMC
    const locationName = 'Aeon Mall Tan Phu';
    const address = 'Bờ Bao Tân Thắng, Tân Phú, TP.HCM';
    const longitude = 106.6285;
    const latitude = 10.7819;
    const radius = 1; // 1km

    console.log('📍 Testing location:', locationName);
    console.log('📍 Address:', address);
    console.log('📍 Coordinates:', longitude, latitude);
    console.log('📍 Radius:', radius, 'km\n');

    console.log('⏳ Generating review...\n');

    const review = await GeminiLocationReviewService.generateLocationReview(
      locationName,
      address,
      longitude,
      latitude,
      radius
    );

    console.log('\n✅ Review generated successfully!\n');
    console.log('📊 Results:');
    console.log('─────────────────────────────────────');
    console.log('Summary:', review.summary);
    console.log('Vibe Score:', review.vibe_score, '/ 10');
    console.log('\nDetails:');
    console.log('  🛒 Amenities:', review.details.amenities);
    console.log('  🌳 Environment:', review.details.environment);
    console.log('  🚗 Traffic:', review.details.traffic);
    console.log('  🛡️  Security:', review.details.security);
    console.log('\nTags:', review.highlight_tag.join(', '));
    if (review.warning) {
      console.log('\n⚠️  Warning:', review.warning);
    }
    console.log('─────────────────────────────────────\n');

  } catch (error) {
    console.error('\n❌ Test failed!');
    console.error('Error:', error);
    if (error instanceof Error) {
      console.error('Message:', error.message);
      console.error('Stack:', error.stack);
    }
    process.exit(1);
  }
}

// Run the test
testLocationReview();
