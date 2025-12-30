// API Route: Test Match Notification Email
import { NextRequest, NextResponse } from 'next/server';
import { sendMatchNotificationEmail } from '@/lib/emailNotificationService';

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get('userId');
  const matchUserId = request.nextUrl.searchParams.get('matchUserId');
  
  if (!userId || !matchUserId) {
    return NextResponse.json(
      { 
        error: 'Missing required parameters',
        usage: 'GET /api/email/test-match?userId=USER_ID&matchUserId=MATCH_USER_ID'
      },
      { status: 400 }
    );
  }

  try {
    console.log(`Testing match notification email for ${userId} with ${matchUserId}`);
    
    // Send match notification to both users
    const [success1, success2] = await Promise.all([
      sendMatchNotificationEmail(userId, matchUserId),
      sendMatchNotificationEmail(matchUserId, userId),
    ]);

    return NextResponse.json({
      success: success1 && success2,
      message: 'Match notification emails sent',
      details: {
        user1Email: success1 ? 'Sent' : 'Failed',
        user2Email: success2 ? 'Sent' : 'Failed',
      },
    });
  } catch (error) {
    console.error('Error sending test match emails:', error);
    return NextResponse.json(
      { error: 'Failed to send match emails', details: error },
      { status: 500 }
    );
  }
}
