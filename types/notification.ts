export interface Notification {
  id: string;
  userId: string; // User who receives the notification
  fromUserId: string; // User who triggered the notification
  fromUserName: string;
  fromUserPhoto?: string;
  fromUserSlug?: string;
  type: 'match' | 'message' | 'like';
  message: string;
  read: boolean;
  createdAt: Date;
}
