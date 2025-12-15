// Post Type Definitions for Roomatinder

export type PostSource = 'user' | 'internet';
export type PostCategory = 'accommodation' | 'roommate' | 'general' | 'news' | 'tips';

export interface Post {
  postId: string;
  source: PostSource;
  
  // Author information
  authorId?: string; // User ID if source is 'user'
  authorName: string;
  authorPhoto?: string;
  authorSlug?: string; // URL-friendly slug for profile link
  
  // Post content
  title?: string;
  content: string;
  images?: string[];
  category: PostCategory;
  tags?: string[];
  
  // Post metadata
  createdAt: Date;
  updatedAt?: Date;
  
  // Engagement
  likes: string[]; // Array of user IDs who liked
  comments: Comment[];
  views: number;
  
  // Internet post specific
  sourceUrl?: string; // If from internet
  sourceName?: string; // e.g., "Facebook", "Reddit", "News Site"
  
  // Accommodation specific fields
  districts?: string[];
  price?: number;
  contactInfo?: string;
}

export interface Comment {
  commentId: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorPhoto?: string;
  authorSlug?: string; // URL-friendly slug for profile link
  content: string;
  createdAt: Date;
  likes: string[]; // Array of user IDs who liked
}

export interface CreatePostData {
  title?: string;
  content: string;
  images?: string[];
  category: PostCategory;
  tags?: string[];
  districts?: string[];
  price?: number;
  contactInfo?: string;
}
