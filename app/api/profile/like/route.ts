import { NextRequest, NextResponse } from 'next/server';
import { likeUser } from '@/lib/profileService';

export async function POST(request: NextRequest) {
  try {
    const { currentUserId, likedUserId } = await request.json();

    if (!currentUserId || !likedUserId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    console.log('[API /profile/like] Processing like:', {
      currentUserId,
      likedUserId
    });

    const result = await likeUser(currentUserId, likedUserId);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Failed to like user' },
        { status: 500 }
      );
    }

    console.log('[API /profile/like] ✅ Like successful, isMatch:', result.isMatch);

    return NextResponse.json({
      success: true,
      isMatch: result.isMatch
    });

  } catch (error) {
    console.error('[API /profile/like] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
