// Chat Service - Firebase Realtime Chat Operations

import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  Timestamp,
  writeBatch,
  increment,
  arrayUnion,
  arrayRemove,
  DocumentSnapshot,
} from 'firebase/firestore';
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  UploadTask,
} from 'firebase/storage';
import { db, storage } from '@/firebase';
import {
  Chat,
  Message,
  CreateChatData,
  CreateMessageData,
  ChatType,
  MessageStatus,
  UserStatus,
  TypingIndicator,
  ChatNotification,
} from '@/types/chat';

// ============= CHAT OPERATIONS =============

/**
 * Create a new chat (individual or group)
 */
export async function createChat(
  currentUserId: string,
  data: CreateChatData
): Promise<string> {
  try {
    // For individual chats, check if chat already exists
    if (data.type === 'individual' && data.participants.length === 2) {
      const existingChat = await findExistingChat(data.participants);
      if (existingChat) {
        return existingChat.id;
      }
    }

    const chatRef = doc(collection(db, 'chats'));
    const chatData: any = {
      type: data.type,
      participants: data.participants,
      createdAt: serverTimestamp(),
      createdBy: currentUserId,
      updatedAt: serverTimestamp(),
      unreadCount: {},
    };

    // Only add optional fields if they exist
    if (data.type === 'group') {
      if (data.name) chatData.name = data.name;
      if (data.avatar) chatData.avatar = data.avatar;
      chatData.admins = [currentUserId];
    }

    await setDoc(chatRef, chatData);
    return chatRef.id;
  } catch (error) {
    console.error('Error creating chat:', error);
    throw new Error('Failed to create chat');
  }
}

/**
 * Find existing chat between users
 */
async function findExistingChat(participants: string[]): Promise<Chat | null> {
  try {
    const chatsRef = collection(db, 'chats');
    const q = query(
      chatsRef,
      where('type', '==', 'individual'),
      where('participants', 'array-contains', participants[0])
    );

    const snapshot = await getDocs(q);
    
    // Find chat where all participants match
    for (const docSnapshot of snapshot.docs) {
      const data = docSnapshot.data() as Chat;
      if (
        data.participants.length === participants.length &&
        participants.every((p) => data.participants.includes(p))
      ) {
        return { id: docSnapshot.id, ...data } as Chat;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error finding existing chat:', error);
    // Return null instead of throwing to allow chat creation
    return null;
  }
}

/**
 * Get chat by ID
 */
export async function getChat(chatId: string): Promise<Chat | null> {
  try {
    const chatRef = doc(db, 'chats', chatId);
    const chatDoc = await getDoc(chatRef);

    if (chatDoc.exists()) {
      return { id: chatDoc.id, ...chatDoc.data() } as Chat;
    }
    return null;
  } catch (error) {
    console.error('Error getting chat:', error);
    return null;
  }
}

/**
 * Get user's chats
 */
export async function getUserChats(userId: string): Promise<Chat[]> {
  try {
    const chatsRef = collection(db, 'chats');
    const q = query(
      chatsRef,
      where('participants', 'array-contains', userId),
      orderBy('updatedAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() } as Chat)
    );
  } catch (error) {
    console.error('Error getting user chats:', error);
    return [];
  }
}

/**
 * Subscribe to user's chats (real-time)
 */
export function subscribeToUserChats(
  userId: string,
  callback: (chats: Chat[]) => void
): () => void {
  const chatsRef = collection(db, 'chats');
  const q = query(
    chatsRef,
    where('participants', 'array-contains', userId),
    orderBy('updatedAt', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const chats = snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() } as Chat)
    );
    callback(chats);
  });
}

/**
 * Update chat details (name, avatar for groups)
 */
export async function updateChat(
  chatId: string,
  updates: Partial<Chat>
): Promise<void> {
  try {
    const chatRef = doc(db, 'chats', chatId);
    await updateDoc(chatRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating chat:', error);
    throw new Error('Failed to update chat');
  }
}

/**
 * Delete chat
 */
export async function deleteChat(chatId: string): Promise<void> {
  try {
    const batch = writeBatch(db);

    // Delete chat document
    const chatRef = doc(db, 'chats', chatId);
    batch.delete(chatRef);

    // Delete all messages in chat
    const messagesRef = collection(db, 'chats', chatId, 'messages');
    const messagesSnapshot = await getDocs(messagesRef);
    messagesSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();
  } catch (error) {
    console.error('Error deleting chat:', error);
    throw new Error('Failed to delete chat');
  }
}

// ============= MESSAGE OPERATIONS =============

/**
 * Send a message
 */
export async function sendMessage(
  currentUserId: string,
  currentUserName: string,
  data: CreateMessageData,
  currentUserAvatar?: string
): Promise<string> {
  try {
    let mediaUrl: string | undefined;
    let mediaThumbnail: string | undefined;
    let mediaSize: number | undefined;
    let mediaName: string | undefined;

    // Upload media if present
    if (data.mediaFile) {
      const uploadResult = await uploadMediaFile(
        data.chatId,
        data.mediaFile,
        () => {} // Progress callback handled separately
      );
      mediaUrl = uploadResult.url;
      mediaThumbnail = uploadResult.thumbnail;
      mediaSize = data.mediaFile.size;
      mediaName = data.mediaFile.name;
    }

    // Create message
    const messagesRef = collection(db, 'chats', data.chatId, 'messages');
    const messageData: any = {
      chatId: data.chatId,
      senderId: currentUserId,
      senderName: currentUserName,
      content: data.content,
      type: data.type,
      status: 'sent',
      timestamp: serverTimestamp(),
      readBy: [currentUserId],
      deliveredTo: [],
    };

    // Only add optional fields if they exist
    if (currentUserAvatar) messageData.senderAvatar = currentUserAvatar;
    if (data.replyTo) messageData.replyTo = data.replyTo;
    if (mediaUrl) messageData.mediaUrl = mediaUrl;
    if (mediaName) messageData.mediaName = mediaName;
    if (mediaSize) messageData.mediaSize = mediaSize;
    if (mediaThumbnail) messageData.mediaThumbnail = mediaThumbnail;

    const messageDoc = await addDoc(messagesRef, messageData);

    // Update chat's last message
    const chatRef = doc(db, 'chats', data.chatId);
    const chatDoc = await getDoc(chatRef);
    
    if (chatDoc.exists()) {
      const chatData = chatDoc.data() as Chat;
      const unreadCount: { [key: string]: number } = chatData.unreadCount || {};
      
      // Increment unread count for all participants except sender
      chatData.participants.forEach((participantId) => {
        if (participantId !== currentUserId) {
          unreadCount[participantId] = (unreadCount[participantId] || 0) + 1;
        }
      });

      await updateDoc(chatRef, {
        lastMessage: data.content,
        lastMessageType: data.type,
        lastMessageTime: serverTimestamp(),
        lastMessageSenderId: currentUserId,
        unreadCount,
        updatedAt: serverTimestamp(),
      });

      // Create notifications for other participants
      await createMessageNotifications(
        data.chatId,
        messageDoc.id,
        currentUserId,
        currentUserName,
        currentUserAvatar,
        data.content,
        data.type,
        chatData.participants.filter((id) => id !== currentUserId)
      );
    }

    return messageDoc.id;
  } catch (error) {
    console.error('Error sending message:', error);
    throw new Error('Failed to send message');
  }
}

/**
 * Upload media file to Firebase Storage
 */
async function uploadMediaFile(
  chatId: string,
  file: File,
  onProgress: (progress: number) => void
): Promise<{ url: string; thumbnail?: string }> {
  try {
    const timestamp = Date.now();
    const fileName = `${timestamp}_${file.name}`;
    const storageRef = ref(storage, `chats/${chatId}/${fileName}`);

    const uploadTask = uploadBytesResumable(storageRef, file);

    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress =
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          onProgress(progress);
        },
        (error) => {
          console.error('Upload error:', error);
          reject(error);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve({ url: downloadURL });
        }
      );
    });
  } catch (error) {
    console.error('Error uploading media:', error);
    throw new Error('Failed to upload media');
  }
}

/**
 * Get messages for a chat
 */
export async function getChatMessages(
  chatId: string,
  limitCount: number = 50,
  lastDoc?: DocumentSnapshot
): Promise<{ messages: Message[]; lastDoc: DocumentSnapshot | null }> {
  try {
    const messagesRef = collection(db, 'chats', chatId, 'messages');
    let q = query(messagesRef, orderBy('timestamp', 'desc'), limit(limitCount));

    if (lastDoc) {
      q = query(q, startAfter(lastDoc));
    }

    const snapshot = await getDocs(q);
    const messages = snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() } as Message)
    );

    return {
      messages: messages.reverse(),
      lastDoc: snapshot.docs[snapshot.docs.length - 1] || null,
    };
  } catch (error) {
    console.error('Error getting messages:', error);
    return { messages: [], lastDoc: null };
  }
}

/**
 * Subscribe to chat messages (real-time)
 */
export function subscribeToChatMessages(
  chatId: string,
  callback: (messages: Message[]) => void,
  limitCount: number = 50
): () => void {
  const messagesRef = collection(db, 'chats', chatId, 'messages');
  const q = query(messagesRef, orderBy('timestamp', 'asc'), limit(limitCount));

  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() } as Message)
    );
    callback(messages);
  });
}

/**
 * Update message status
 */
export async function updateMessageStatus(
  chatId: string,
  messageId: string,
  status: MessageStatus
): Promise<void> {
  try {
    const messageRef = doc(db, 'chats', chatId, 'messages', messageId);
    await updateDoc(messageRef, { status });
  } catch (error) {
    console.error('Error updating message status:', error);
  }
}

/**
 * Mark message as read
 */
export async function markMessageAsRead(
  chatId: string,
  messageId: string,
  userId: string
): Promise<void> {
  try {
    const messageRef = doc(db, 'chats', chatId, 'messages', messageId);
    await updateDoc(messageRef, {
      readBy: arrayUnion(userId),
      status: 'read',
    });
  } catch (error) {
    console.error('Error marking message as read:', error);
  }
}

/**
 * Mark all messages in chat as read
 */
export async function markChatAsRead(
  chatId: string,
  userId: string
): Promise<void> {
  try {
    const batch = writeBatch(db);

    // Get unread messages
    const messagesRef = collection(db, 'chats', chatId, 'messages');
    const q = query(messagesRef, where('readBy', 'not-in', [[userId]]));
    const snapshot = await getDocs(q);

    // Update each message
    snapshot.docs.forEach((doc) => {
      batch.update(doc.ref, {
        readBy: arrayUnion(userId),
      });
    });

    // Reset unread count for user
    const chatRef = doc(db, 'chats', chatId);
    batch.update(chatRef, {
      [`unreadCount.${userId}`]: 0,
    });

    await batch.commit();
  } catch (error) {
    console.error('Error marking chat as read:', error);
  }
}

/**
 * Delete message
 */
export async function deleteMessage(
  chatId: string,
  messageId: string
): Promise<void> {
  try {
    const messageRef = doc(db, 'chats', chatId, 'messages', messageId);
    await updateDoc(messageRef, {
      deletedAt: serverTimestamp(),
      content: 'Tin nhắn đã bị xóa',
    });
  } catch (error) {
    console.error('Error deleting message:', error);
    throw new Error('Failed to delete message');
  }
}

// ============= TYPING INDICATOR =============

/**
 * Set typing indicator
 */
export async function setTypingIndicator(
  chatId: string,
  userId: string,
  isTyping: boolean
): Promise<void> {
  try {
    const chatRef = doc(db, 'chats', chatId);
    
    if (isTyping) {
      await updateDoc(chatRef, {
        typingUsers: arrayUnion(userId),
      });
    } else {
      await updateDoc(chatRef, {
        typingUsers: arrayRemove(userId),
      });
    }
  } catch (error) {
    console.error('Error setting typing indicator:', error);
  }
}

// ============= ONLINE STATUS =============

/**
 * Update user online status
 */
export async function updateUserOnlineStatus(
  userId: string,
  online: boolean
): Promise<void> {
  try {
    const statusRef = doc(db, 'userStatus', userId);
    const statusData: UserStatus = {
      userId,
      online,
      lastSeen: serverTimestamp() as Timestamp,
    };
    await setDoc(statusRef, statusData, { merge: true });
  } catch (error) {
    console.error('Error updating online status:', error);
  }
}

/**
 * Subscribe to user online status
 */
export function subscribeToUserStatus(
  userId: string,
  callback: (status: UserStatus | null) => void
): () => void {
  const statusRef = doc(db, 'userStatus', userId);
  
  return onSnapshot(statusRef, (doc) => {
    if (doc.exists()) {
      callback({ id: doc.id, ...doc.data() } as UserStatus);
    } else {
      callback(null);
    }
  });
}

/**
 * Subscribe to multiple users' online status
 */
export function subscribeToUsersStatus(
  userIds: string[],
  callback: (statuses: { [userId: string]: UserStatus }) => void
): () => void {
  const unsubscribes: (() => void)[] = [];
  const statuses: { [userId: string]: UserStatus } = {};

  userIds.forEach((userId) => {
    const unsubscribe = subscribeToUserStatus(userId, (status) => {
      if (status) {
        statuses[userId] = status;
      } else {
        delete statuses[userId];
      }
      callback({ ...statuses });
    });
    unsubscribes.push(unsubscribe);
  });

  return () => {
    unsubscribes.forEach((unsubscribe) => unsubscribe());
  };
}

// ============= NOTIFICATIONS =============

/**
 * Create message notifications
 */
async function createMessageNotifications(
  chatId: string,
  messageId: string,
  senderId: string,
  senderName: string,
  senderAvatar: string | undefined,
  content: string,
  type: string,
  recipientIds: string[]
): Promise<void> {
  try {
    const batch = writeBatch(db);

    recipientIds.forEach((recipientId) => {
      const notificationRef = doc(collection(db, 'notifications'));
      const notificationData: Omit<ChatNotification, 'id'> = {
        userId: recipientId,
        chatId,
        messageId,
        senderId,
        senderName,
        senderAvatar,
        content,
        type: type as any,
        timestamp: serverTimestamp() as Timestamp,
        read: false,
        clicked: false,
      };
      batch.set(notificationRef, notificationData);
    });

    await batch.commit();
  } catch (error) {
    console.error('Error creating notifications:', error);
  }
}

/**
 * Get user notifications
 */
export async function getUserNotifications(
  userId: string
): Promise<ChatNotification[]> {
  try {
    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('userId', '==', userId),
      where('read', '==', false),
      orderBy('timestamp', 'desc'),
      limit(50)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() } as ChatNotification)
    );
  } catch (error) {
    console.error('Error getting notifications:', error);
    return [];
  }
}

/**
 * Subscribe to user notifications (real-time)
 */
export function subscribeToUserNotifications(
  userId: string,
  callback: (notifications: ChatNotification[]) => void
): () => void {
  const notificationsRef = collection(db, 'notifications');
  const q = query(
    notificationsRef,
    where('userId', '==', userId),
    where('read', '==', false),
    orderBy('timestamp', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const notifications = snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() } as ChatNotification)
    );
    callback(notifications);
  });
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(
  notificationId: string
): Promise<void> {
  try {
    const notificationRef = doc(db, 'notifications', notificationId);
    await updateDoc(notificationRef, { read: true });
  } catch (error) {
    console.error('Error marking notification as read:', error);
  }
}

// ============= GROUP CHAT OPERATIONS =============

/**
 * Add participants to group chat
 */
export async function addParticipantsToGroup(
  chatId: string,
  userIds: string[]
): Promise<void> {
  try {
    const chatRef = doc(db, 'chats', chatId);
    await updateDoc(chatRef, {
      participants: arrayUnion(...userIds),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error adding participants:', error);
    throw new Error('Failed to add participants');
  }
}

/**
 * Remove participant from group chat
 */
export async function removeParticipantFromGroup(
  chatId: string,
  userId: string
): Promise<void> {
  try {
    const chatRef = doc(db, 'chats', chatId);
    await updateDoc(chatRef, {
      participants: arrayRemove(userId),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error removing participant:', error);
    throw new Error('Failed to remove participant');
  }
}

/**
 * Leave group chat
 */
export async function leaveGroupChat(
  chatId: string,
  userId: string
): Promise<void> {
  try {
    await removeParticipantFromGroup(chatId, userId);
  } catch (error) {
    console.error('Error leaving group:', error);
    throw new Error('Failed to leave group');
  }
}
