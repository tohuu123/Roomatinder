export type BoardItemType = 'room' | 'decor';

export type UserReaction = 'liked' | 'disliked' | 'unseen';

export type BoardItemStatus = 'saved' | 'contacted' | 'finalized';

export interface UserReactionData {
  userId: string;
  reaction: UserReaction;
  timestamp: Date;
}

export interface BoardItem {
  id: string;
  boardId: string;
  type: BoardItemType;
  title: string;
  description?: string;
  url?: string; // For room listings or external links
  imageUrl?: string; // For decor items or room photos
  price?: number;
  location?: string; // For room listings
  
  // Reactions from both users
  reactions: {
    [userId: string]: UserReactionData;
  };
  
  // Status tracking
  status: BoardItemStatus;
  
  // Metadata
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Additional notes
  notes?: string;
}

export interface SharedBoard {
  id: string;
  name: string;
  
  // Two users who share this board
  userIds: [string, string];
  
  // Associated chat room ID
  chatRoomId: string;
  
  // Statistics
  stats: {
    saved: number;
    contacted: number;
    finalized: number;
  };
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateBoardItemInput {
  type: BoardItemType;
  title: string;
  description?: string;
  url?: string;
  imageUrl?: string;
  price?: number;
  location?: string;
  notes?: string;
}

export interface UpdateBoardItemInput {
  title?: string;
  description?: string;
  url?: string;
  imageUrl?: string;
  price?: number;
  location?: string;
  status?: BoardItemStatus;
  notes?: string;
}

export interface UpdateReactionInput {
  itemId: string;
  reaction: UserReaction;
}
