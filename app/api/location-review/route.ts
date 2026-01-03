import { NextRequest, NextResponse } from 'next/server';
import { GeminiLocationReviewService, LocationReviewOutput } from '@/lib/geminiLocationReviewService';

export interface LocationReviewResponse {
  summary: string;
  vibe_score: number;
  details: {
    amenities: string;
    environment: string;
    traffic: string;
    security: string;
  };
  highlight_tag: string[];
  warning: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { locationName, address, longitude, latitude, radius } = body;

    console.log('[LocationReview API] Received request:', { locationName, address, longitude, latitude, radius });

    if (!locationName) {
      return NextResponse.json(
        { error: 'Location name is required' },
        { status: 400 }
      );
    }

    if (longitude === undefined || latitude === undefined) {
      return NextResponse.json(
        { error: 'Coordinates (longitude, latitude) are required' },
        { status: 400 }
      );
    }

    console.log('[LocationReview API] Analyzing area:', locationName, 'Radius:', radius || 1, 'km');

    const radiusKm = radius || 1;

    // Use the service to generate the review
    const reviewData: LocationReviewOutput = await GeminiLocationReviewService.generateLocationReview(
      locationName,
      address || '',
      longitude,
      latitude,
      radiusKm
    );

    console.log('[LocationReview API] Analysis completed successfully');

    return NextResponse.json(reviewData);

  } catch (error) {
    console.error('[LocationReview API] Error:', error);
    
    // More detailed error logging
    if (error instanceof Error) {
      console.error('[LocationReview API] Error name:', error.name);
      console.error('[LocationReview API] Error message:', error.message);
      console.error('[LocationReview API] Error stack:', error.stack);
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to analyze location',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
