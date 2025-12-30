import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  updateDoc,
  doc,
  getDocs,
  Timestamp,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/firebase";
import { Notification } from "@/types/notification";
import { sendMatchNotificationEmail } from "./emailNotificationService";

const NOTIFICATIONS_COLLECTION = "notifications";

/**
 * Create a new notification
 */
export async function createNotification(
  userId: string,
  fromUserId: string,
  fromUserName: string,
  type: 'match' | 'message' | 'like',
  message: string,
  fromUserPhoto?: string,
  fromUserSlug?: string
): Promise<string | null> {
  try {
    console.log('[NotificationService] Creating notification:', {
      userId,
      fromUserId,
      fromUserName,
      type,
      message,
    });
    
    const notificationRef = await addDoc(collection(db, NOTIFICATIONS_COLLECTION), {
      userId,
      fromUserId,
      fromUserName,
      fromUserPhoto: fromUserPhoto || null,
      fromUserSlug: fromUserSlug || null,
      type,
      message,
      read: false,
      createdAt: Timestamp.now(),
    });
    console.log("[NotificationService] ✅ Notification created with ID:", notificationRef.id);
    
    // Send email notification for matches
    if (type === 'match') {
      console.log('[NotificationService] 📧 Triggering match email notification...');
      // Send email asynchronously (don't wait for it)
      sendMatchNotificationEmail(userId, fromUserId).catch(error => {
        console.error('[NotificationService] Failed to send match email:', error);
      });
    }
    
    return notificationRef.id;
  } catch (error) {
    console.error("[NotificationService] ❌ Error creating notification:", error);
    return null;
  }
}

/**
 * Subscribe to user's notifications
 */
export function subscribeToNotifications(
  userId: string,
  callback: (notifications: Notification[]) => void
): () => void {
  console.log('[NotificationService] 🔔 Subscribing to notifications for user:', userId);
  
  const q = query(
    collection(db, NOTIFICATIONS_COLLECTION),
    where("userId", "==", userId),
    orderBy("createdAt", "desc")
  );

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      console.log('[NotificationService] 📨 Received', snapshot.docs.length, 'notifications');
      const notifications: Notification[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          userId: data.userId,
          fromUserId: data.fromUserId,
          fromUserName: data.fromUserName,
          fromUserPhoto: data.fromUserPhoto,
          fromUserSlug: data.fromUserSlug,
          type: data.type,
          message: data.message,
          read: data.read,
          createdAt: data.createdAt?.toDate() || new Date(),
        };
      });
      console.log('[NotificationService] Parsed notifications:', notifications);
      callback(notifications);
    },
    (error) => {
      console.error("[NotificationService] ❌ Error subscribing to notifications:", error);
      callback([]);
    }
  );

  return unsubscribe;
}

/**
 * Mark a notification as read
 */
export async function markNotificationAsRead(notificationId: string): Promise<boolean> {
  try {
    const notificationRef = doc(db, NOTIFICATIONS_COLLECTION, notificationId);
    await updateDoc(notificationRef, {
      read: true,
    });
    return true;
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return false;
  }
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsAsRead(userId: string): Promise<boolean> {
  try {
    const q = query(
      collection(db, NOTIFICATIONS_COLLECTION),
      where("userId", "==", userId),
      where("read", "==", false)
    );

    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return true;
    }

    const batch = writeBatch(db);
    snapshot.docs.forEach((document) => {
      batch.update(document.ref, { read: true });
    });

    await batch.commit();
    return true;
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    return false;
  }
}

/**
 * Get unread notification count
 */
export async function getUnreadNotificationCount(userId: string): Promise<number> {
  try {
    const q = query(
      collection(db, NOTIFICATIONS_COLLECTION),
      where("userId", "==", userId),
      where("read", "==", false)
    );

    const snapshot = await getDocs(q);
    return snapshot.size;
  } catch (error) {
    console.error("Error getting unread notification count:", error);
    return 0;
  }
}
