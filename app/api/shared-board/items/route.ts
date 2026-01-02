import { NextRequest, NextResponse } from 'next/server';
import {
  getBoardItems,
  createBoardItem,
  updateBoardItem,
  deleteBoardItem,
} from '@/lib/sharedBoardService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const boardId = searchParams.get('boardId');

    if (!boardId) {
      return NextResponse.json(
        { error: 'Board ID is required' },
        { status: 400 }
      );
    }

    const items = await getBoardItems(boardId);

    return NextResponse.json(items);
  } catch (error) {
    console.error('Error getting board items:', error);
    return NextResponse.json(
      { error: 'Failed to get board items' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { boardId, userId, ...itemData } = body;

    if (!boardId || !userId) {
      return NextResponse.json(
        { error: 'Board ID and user ID are required' },
        { status: 400 }
      );
    }

    const item = await createBoardItem(boardId, userId, itemData);

    return NextResponse.json(item);
  } catch (error) {
    console.error('Error creating board item:', error);
    return NextResponse.json(
      { error: 'Failed to create board item' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { itemId, ...updateData } = body;

    if (!itemId) {
      return NextResponse.json(
        { error: 'Item ID is required' },
        { status: 400 }
      );
    }

    await updateBoardItem(itemId, updateData);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating board item:', error);
    return NextResponse.json(
      { error: 'Failed to update board item' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('itemId');

    if (!itemId) {
      return NextResponse.json(
        { error: 'Item ID is required' },
        { status: 400 }
      );
    }

    await deleteBoardItem(itemId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting board item:', error);
    return NextResponse.json(
      { error: 'Failed to delete board item' },
      { status: 500 }
    );
  }
}
