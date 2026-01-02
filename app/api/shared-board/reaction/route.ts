import { NextRequest, NextResponse } from 'next/server';
import { updateReaction } from '@/lib/sharedBoardService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { itemId, userId, reaction } = body;

    if (!itemId || !userId || !reaction) {
      return NextResponse.json(
        { error: 'Item ID, user ID, and reaction are required' },
        { status: 400 }
      );
    }

    if (!['liked', 'disliked', 'unseen'].includes(reaction)) {
      return NextResponse.json(
        { error: 'Invalid reaction type' },
        { status: 400 }
      );
    }

    await updateReaction(itemId, userId, reaction);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating reaction:', error);
    return NextResponse.json(
      { error: 'Failed to update reaction' },
      { status: 500 }
    );
  }
}
