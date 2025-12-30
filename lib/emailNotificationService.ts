// Notification Service - Enhanced with Email Support

import { 
  collection, 
  addDoc, 
  serverTimestamp, 
  query, 
  where, 
  getDocs,
  updateDoc,
  doc,
  getDoc,
  Timestamp,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from '@/firebase';
import {
  sendEmail,
  generateIntriguingContent,
  generateIceBreakerSuggestion,
  generateWeeklySummary
} from './emailService';
import {
  getDailyDigestTemplate,
  getMatchNotificationTemplate,
  getInactivityCheckTemplate,
  getWeeklyReportTemplate,
  getAccountDeactivatedTemplate
} from './emailTemplates';

export interface NotificationData {
  userId: string;
  type: 'like' | 'match' | 'message' | 'ice_breaker';
  title: string;
  message: string;
  fromUserId?: string;
  fromUserName?: string;
  fromUserAvatar?: string;
  link?: string;
  read?: boolean;
  emailSent?: boolean;
}

/**
 * Create a notification
 */
export async function createNotification(data: NotificationData) {
  try {
    const notificationData = {
      ...data,
      read: false,
      emailSent: false,
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, 'notifications'), notificationData);
    console.log('Notification created:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
}

/**
 * Get user email and preferences
 */
async function getUserEmailSettings(userId: string): Promise<{
  email: string | null;
  emailNotificationsEnabled: boolean;
  lastEmailSent?: Date;
}> {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) {
      return { email: null, emailNotificationsEnabled: false };
    }

    const userData = userDoc.data();
    return {
      email: userData.email || null,
      emailNotificationsEnabled: userData.emailNotificationsEnabled !== false, // Default true
      lastEmailSent: userData.lastEmailSent?.toDate(),
    };
  } catch (error) {
    console.error('Error getting user email settings:', error);
    return { email: null, emailNotificationsEnabled: false };
  }
}

/**
 * Update user's last email sent timestamp
 */
async function updateLastEmailSent(userId: string) {
  try {
    await updateDoc(doc(db, 'users', userId), {
      lastEmailSent: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating last email sent:', error);
  }
}

/**
 * Send Daily Digest Email
 */
export async function sendDailyDigestEmail(userId: string): Promise<boolean> {
  try {
    const userSettings = await getUserEmailSettings(userId);
    if (!userSettings.email || !userSettings.emailNotificationsEnabled) {
      console.log(`User ${userId} has email notifications disabled or no email`);
      return false;
    }

    // Get user info
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) return false;
    const userData = userDoc.data();

    // Get today's stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Count likes
    const likesQuery = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      where('type', '==', 'like'),
      where('createdAt', '>=', Timestamp.fromDate(today))
    );
    const likesSnapshot = await getDocs(likesQuery);
    const likesCount = likesSnapshot.size;

    // Count messages
    const messagesQuery = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      where('type', '==', 'message'),
      where('createdAt', '>=', Timestamp.fromDate(today))
    );
    const messagesSnapshot = await getDocs(messagesQuery);
    const messagesCount = messagesSnapshot.size;

    // Skip if no activity
    if (likesCount === 0 && messagesCount === 0) {
      console.log(`No activity for user ${userId} today`);
      return false;
    }

    // Get profiles for intriguing content
    const profiles: Array<{ name: string; bio?: string; interests?: string[] }> = [];
    
    if (likesCount > 0) {
      const likeNotifications = likesSnapshot.docs.slice(0, 3);
      for (const notif of likeNotifications) {
        const notifData = notif.data();
        if (notifData.fromUserId) {
          const fromUserDoc = await getDoc(doc(db, 'users', notifData.fromUserId));
          if (fromUserDoc.exists()) {
            const fromUserData = fromUserDoc.data();
            profiles.push({
              name: fromUserData.displayName || 'Someone',
              bio: fromUserData.bio,
              interests: fromUserData.interests,
            });
          }
        }
      }
    }

    // Generate intriguing line using Gemini
    const intriguingLine = await generateIntriguingContent(
      profiles,
      likesCount > 0 ? 'like' : 'message'
    );

    // Send email
    const emailHtml = getDailyDigestTemplate({
      userName: userData.displayName || 'there',
      likesCount,
      messagesCount,
      intriguingLine,
    });

    const success = await sendEmail({
      to: userSettings.email,
      subject: `Your Daily Update: ${likesCount + messagesCount} new ${likesCount + messagesCount === 1 ? 'notification' : 'notifications'}! 💖`,
      html: emailHtml,
    });

    if (success) {
      await updateLastEmailSent(userId);
    }

    return success;
  } catch (error) {
    console.error('Error sending daily digest email:', error);
    return false;
  }
}

/**
 * Send Match Notification Email
 */
export async function sendMatchNotificationEmail(
  userId: string,
  matchUserId: string
): Promise<boolean> {
  try {
    const userSettings = await getUserEmailSettings(userId);
    if (!userSettings.email || !userSettings.emailNotificationsEnabled) {
      console.log(`User ${userId} has email notifications disabled or no email`);
      return false;
    }

    // Get both user profiles
    const [userDoc, matchDoc] = await Promise.all([
      getDoc(doc(db, 'users', userId)),
      getDoc(doc(db, 'users', matchUserId)),
    ]);

    if (!userDoc.exists() || !matchDoc.exists()) return false;

    const userData = userDoc.data();
    const matchData = matchDoc.data();

    // Generate ice breaker using Gemini
    const iceBreaker = await generateIceBreakerSuggestion(
      {
        name: userData.displayName || 'You',
        bio: userData.bio,
        interests: userData.interests,
      },
      {
        name: matchData.displayName || 'Your match',
        bio: matchData.bio,
        interests: matchData.interests,
      }
    );

    // Send email
    const emailHtml = getMatchNotificationTemplate({
      userName: userData.displayName || 'there',
      matchName: matchData.displayName || 'Someone special',
      matchBio: matchData.bio,
      iceBreaker,
    });

    const success = await sendEmail({
      to: userSettings.email,
      subject: "🎉 It's a Match! Start chatting now!",
      html: emailHtml,
    });

    if (success) {
      await updateLastEmailSent(userId);
    }

    return success;
  } catch (error) {
    console.error('Error sending match notification email:', error);
    return false;
  }
}

/**
 * Send Inactivity Check Email
 */
export async function sendInactivityCheckEmail(userId: string): Promise<boolean> {
  try {
    const userSettings = await getUserEmailSettings(userId);
    if (!userSettings.email) {
      console.log(`User ${userId} has no email`);
      return false;
    }

    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) return false;
    const userData = userDoc.data();

    const lastActiveDate = userData.lastActive?.toDate() 
      ? new Date(userData.lastActive.toDate()).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      : 'a while ago';

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    
    const emailHtml = getInactivityCheckTemplate({
      userName: userData.displayName || 'there',
      lastActiveDate,
      confirmUrl: `${appUrl}/api/user/confirm-active?userId=${userId}`,
      deactivateUrl: `${appUrl}/api/user/deactivate?userId=${userId}`,
    });

    const success = await sendEmail({
      to: userSettings.email,
      subject: "We miss you! Are you still there? 💙",
      html: emailHtml,
    });

    if (success) {
      await updateLastEmailSent(userId);
      // Mark that inactivity email was sent
      await updateDoc(doc(db, 'users', userId), {
        inactivityEmailSent: serverTimestamp(),
      });
    }

    return success;
  } catch (error) {
    console.error('Error sending inactivity check email:', error);
    return false;
  }
}

/**
 * Send Weekly Report Email
 */
export async function sendWeeklyReportEmail(userId: string): Promise<boolean> {
  try {
    const userSettings = await getUserEmailSettings(userId);
    if (!userSettings.email || !userSettings.emailNotificationsEnabled) {
      console.log(`User ${userId} has email notifications disabled or no email`);
      return false;
    }

    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) return false;
    const userData = userDoc.data();

    // Get week date range
    const weekEnd = new Date();
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);

    // Get week's stats
    const [likesSnapshot, messagesSnapshot, matchesSnapshot] = await Promise.all([
      getDocs(query(
        collection(db, 'notifications'),
        where('userId', '==', userId),
        where('type', '==', 'like'),
        where('createdAt', '>=', Timestamp.fromDate(weekStart))
      )),
      getDocs(query(
        collection(db, 'notifications'),
        where('userId', '==', userId),
        where('type', '==', 'message'),
        where('createdAt', '>=', Timestamp.fromDate(weekStart))
      )),
      getDocs(query(
        collection(db, 'notifications'),
        where('userId', '==', userId),
        where('type', '==', 'match'),
        where('createdAt', '>=', Timestamp.fromDate(weekStart))
      )),
    ]);

    const stats = {
      totalLikes: likesSnapshot.size,
      totalMessages: messagesSnapshot.size,
      totalMatches: matchesSnapshot.size,
      profileViews: userData.weeklyProfileViews || 0,
    };

    // Get top interactions
    const topInteractions: Array<{ name: string; count: number }> = [];
    const messagesByUser = new Map<string, number>();
    
    messagesSnapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.fromUserId) {
        messagesByUser.set(
          data.fromUserId,
          (messagesByUser.get(data.fromUserId) || 0) + 1
        );
      }
    });

    // Get top 3 users
    const sortedUsers = Array.from(messagesByUser.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    for (const [fromUserId, count] of sortedUsers) {
      const fromUserDoc = await getDoc(doc(db, 'users', fromUserId));
      if (fromUserDoc.exists()) {
        topInteractions.push({
          name: fromUserDoc.data().displayName || 'Someone',
          count,
        });
      }
    }

    // Generate AI summary
    const aiSummary = await generateWeeklySummary({
      totalLikes: stats.totalLikes,
      totalMessages: stats.totalMessages,
      totalMatches: stats.totalMatches,
      topInteractions,
    });

    // Send email
    const emailHtml = getWeeklyReportTemplate({
      userName: userData.displayName || 'there',
      weekStart: weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      weekEnd: weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      stats,
      aiSummary,
      topMatches: topInteractions.map(t => ({ name: t.name, messageCount: t.count })),
    });

    const success = await sendEmail({
      to: userSettings.email,
      subject: `Your Week in Review: ${stats.totalMatches} new matches! 📊`,
      html: emailHtml,
    });

    if (success) {
      await updateLastEmailSent(userId);
      // Reset weekly profile views
      await updateDoc(doc(db, 'users', userId), {
        weeklyProfileViews: 0,
        lastWeeklyReportSent: serverTimestamp(),
      });
    }

    return success;
  } catch (error) {
    console.error('Error sending weekly report email:', error);
    return false;
  }
}

/**
 * Deactivate user profile (hide from search)
 */
export async function deactivateUserProfile(userId: string): Promise<boolean> {
  try {
    await updateDoc(doc(db, 'users', userId), {
      isVisible: false,
      deactivatedAt: serverTimestamp(),
      deactivationReason: 'inactivity',
    });

    const userSettings = await getUserEmailSettings(userId);
    if (userSettings.email) {
      const userDoc = await getDoc(doc(db, 'users', userId));
      const userData = userDoc.data();

      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      
      const emailHtml = getAccountDeactivatedTemplate({
        userName: userData?.displayName || 'there',
        reactivateUrl: `${appUrl}/login`,
      });

      await sendEmail({
        to: userSettings.email,
        subject: "Your Roomatinder profile has been hidden",
        html: emailHtml,
      });
    }

    return true;
  } catch (error) {
    console.error('Error deactivating user profile:', error);
    return false;
  }
}

/**
 * Check for inactive users and send reminder emails
 */
export async function checkInactiveUsers(): Promise<number> {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const usersQuery = query(
      collection(db, 'users'),
      where('lastActive', '<', Timestamp.fromDate(sevenDaysAgo)),
      where('isVisible', '==', true),
      where('inactivityEmailSent', '==', null)
    );

    const usersSnapshot = await getDocs(usersQuery);
    let emailsSent = 0;

    for (const userDoc of usersSnapshot.docs) {
      const success = await sendInactivityCheckEmail(userDoc.id);
      if (success) emailsSent++;
    }

    console.log(`Sent ${emailsSent} inactivity check emails`);
    return emailsSent;
  } catch (error) {
    console.error('Error checking inactive users:', error);
    return 0;
  }
}
