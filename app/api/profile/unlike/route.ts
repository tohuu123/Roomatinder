import { NextRequest, NextResponse } from 'next/server';
import { unlikeUser } from '@/lib/profileService';

export async function POST(request: NextRequest) {
  try {
    const { currentUserId, unlikedUserId } = await request.json();

    if (!currentUserId || !unlikedUserId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    console.log('[API /profile/unlike] Processing unlike:', {
      currentUserId,
      unlikedUserId
    });

    const success = await unlikeUser(currentUserId, unlikedUserId);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to unlike user' },
        { status: 500 }
      );
    }

    console.log('[API /profile/unlike] ✅ Unlike successful');

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('[API /profile/unlike] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
