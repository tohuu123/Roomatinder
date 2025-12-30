// API Route: Check Inactive Users and Send Reminders
import { NextRequest, NextResponse } from 'next/server';
import { checkInactiveUsers } from '@/lib/emailNotificationService';

export async function POST(request: NextRequest) {
  try {
    // Verify this is a cron job request
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const emailsSent = await checkInactiveUsers();

    return NextResponse.json({
      success: true,
      message: `Inactivity check completed`,
      emailsSent,
    });
  } catch (error) {
    console.error('Error in inactivity check cron:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
