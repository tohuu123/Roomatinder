import { NextRequest, NextResponse } from 'next/server';
import { updateBoardName } from '@/lib/sharedBoardService';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { name } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Board name is required' },
        { status: 400 }
      );
    }

    await updateBoardName(params.id, name);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating board name:', error);
    return NextResponse.json(
      { error: 'Failed to update board name' },
      { status: 500 }
    );
  }
}
