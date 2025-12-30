// API Route: Send Daily Digest Emails
import { NextRequest, NextResponse } from 'next/server';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/firebase';
import { sendDailyDigestEmail } from '@/lib/emailNotificationService';

export async function POST(request: NextRequest) {
  try {
    // Verify this is a cron job request (add your own authentication)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get all active users who have email notifications enabled
    const usersQuery = query(
      collection(db, 'users'),
      where('emailNotificationsEnabled', '!=', false),
      where('isVisible', '==', true)
    );
    
    const usersSnapshot = await getDocs(usersQuery);
    let successCount = 0;
    let failCount = 0;

    // Send digest to each user
    const promises = usersSnapshot.docs.map(async (userDoc) => {
      try {
        const success = await sendDailyDigestEmail(userDoc.id);
        if (success) {
          successCount++;
        } else {
          failCount++;
        }
      } catch (error) {
        console.error(`Failed to send digest to user ${userDoc.id}:`, error);
        failCount++;
      }
    });

    await Promise.all(promises);

    return NextResponse.json({
      success: true,
      message: `Daily digests sent`,
      successCount,
      failCount,
      totalUsers: usersSnapshot.size,
    });
  } catch (error) {
    console.error('Error in daily digest cron:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Allow GET for testing (remove in production)
export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get('userId');
  
  if (!userId) {
    return NextResponse.json(
      { error: 'userId is required' },
      { status: 400 }
    );
  }

  try {
    const success = await sendDailyDigestEmail(userId);
    
    return NextResponse.json({
      success,
      message: success ? 'Email sent' : 'No activity or email disabled',
    });
  } catch (error) {
    console.error('Error sending test digest:', error);
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
}
