import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateSharedBoard, getBoardByChatRoomId } from '@/lib/sharedBoardService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const chatRoomId = searchParams.get('chatRoomId');

    if (!chatRoomId) {
      return NextResponse.json(
        { error: 'Chat room ID is required' },
        { status: 400 }
      );
    }

    const board = await getBoardByChatRoomId(chatRoomId);

    if (!board) {
      return NextResponse.json(
        { error: 'Board not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(board);
  } catch (error) {
    console.error('Error getting board:', error);
    return NextResponse.json(
      { error: 'Failed to get board' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { chatRoomId, userIds } = body;

    if (!chatRoomId || !userIds || userIds.length !== 2) {
      return NextResponse.json(
        { error: 'Chat room ID and two user IDs are required' },
        { status: 400 }
      );
    }

    const board = await getOrCreateSharedBoard(chatRoomId, userIds);

    return NextResponse.json(board);
  } catch (error) {
    console.error('Error creating board:', error);
    return NextResponse.json(
      { error: 'Failed to create board' },
      { status: 500 }
    );
  }
}
