import { db } from '@/firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
} from 'firebase/firestore';
import { Post, Comment, CreatePostData, PostCategory } from '@/types/post';

const POSTS_COLLECTION = 'posts';
const COMMENTS_COLLECTION = 'comments';

// Convert Firestore timestamp to Date
const convertTimestamp = (timestamp: any): Date => {
  if (timestamp?.toDate) {
    return timestamp.toDate();
  }
  return new Date(timestamp);
};

// Get all posts (user + internet) with pagination
export const getPosts = async (
  limitCount: number = 20,
  categoryFilter?: PostCategory
): Promise<Post[]> => {
  try {
    console.log('[getPosts] Fetching posts with category:', categoryFilter);
    const postsRef = collection(db, POSTS_COLLECTION);
    let q;

    if (categoryFilter) {
      q = query(
        postsRef,
        where('category', '==', categoryFilter),
        limit(limitCount)
      );
      console.log('[getPosts] Using WHERE query for category:', categoryFilter);
    } else {
      q = query(postsRef, orderBy('createdAt', 'desc'), limit(limitCount));
      console.log('[getPosts] Using orderBy query (no filter)');
    }

    const snapshot = await getDocs(q);
    console.log('[getPosts] Snapshot size:', snapshot.size);
    const posts: Post[] = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      console.log('[getPosts] Post:', doc.id, 'Category:', data.category);
      posts.push({
        postId: doc.id,
        ...data,
        createdAt: convertTimestamp(data.createdAt),
        updatedAt: data.updatedAt ? convertTimestamp(data.updatedAt) : undefined,
      } as Post);
    });

    // Sort by createdAt in memory when filtering by category
    if (categoryFilter) {
      posts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }

    console.log(`[getPosts] Found ${posts.length} posts`);
    return posts;
  } catch (error) {
    console.error('Error getting posts:', error);
    return [];
  }
};

// Get posts by user
export const getUserPosts = async (userId: string): Promise<Post[]> => {
  try {
    const postsRef = collection(db, POSTS_COLLECTION);
    const q = query(
      postsRef,
      where('authorId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    const posts: Post[] = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      posts.push({
        postId: doc.id,
        ...data,
        createdAt: convertTimestamp(data.createdAt),
        updatedAt: data.updatedAt ? convertTimestamp(data.updatedAt) : undefined,
      } as Post);
    });

    return posts;
  } catch (error) {
    console.error('Error getting user posts:', error);
    return [];
  }
};

// Get single post
export const getPost = async (postId: string): Promise<Post | null> => {
  try {
    const postRef = doc(db, POSTS_COLLECTION, postId);
    const snapshot = await getDoc(postRef);

    if (!snapshot.exists()) {
      return null;
    }

    const data = snapshot.data();
    return {
      postId: snapshot.id,
      ...data,
      createdAt: convertTimestamp(data.createdAt),
      updatedAt: data.updatedAt ? convertTimestamp(data.updatedAt) : undefined,
    } as Post;
  } catch (error) {
    console.error('Error getting post:', error);
    return null;
  }
};

// Create a new user post
export const createPost = async (
  userId: string,
  userName: string,
  userPhoto: string | undefined,
  userSlug: string | undefined,
  postData: CreatePostData
): Promise<string | null> => {
  try {
    const postsRef = collection(db, POSTS_COLLECTION);
    const newPost = {
      source: 'user',
      authorId: userId,
      authorName: userName,
      authorPhoto: userPhoto,
      authorSlug: userSlug,
      ...postData,
      likes: [],
      comments: [],
      views: 0,
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(postsRef, newPost);
    console.log('Post created with ID:', docRef.id);
    
    // Update user's last_action
    const userRef = doc(db, 'profiles', userId);
    await updateDoc(userRef, {
      last_action: serverTimestamp(),
    });
    
    return docRef.id;
  } catch (error) {
    console.error('Error creating post:', error);
    return null;
  }
};

// Update post
export const updatePost = async (
  postId: string,
  updateData: Partial<CreatePostData>
): Promise<boolean> => {
  try {
    const postRef = doc(db, POSTS_COLLECTION, postId);
    await updateDoc(postRef, {
      ...updateData,
      updatedAt: serverTimestamp(),
    });
    return true;
  } catch (error) {
    console.error('Error updating post:', error);
    return false;
  }
};

// Delete post
export const deletePost = async (postId: string): Promise<boolean> => {
  try {
    const postRef = doc(db, POSTS_COLLECTION, postId);
    await deleteDoc(postRef);
    
    // Also delete all comments for this post
    const commentsRef = collection(db, COMMENTS_COLLECTION);
    const q = query(commentsRef, where('postId', '==', postId));
    const snapshot = await getDocs(q);
    
    const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
    
    return true;
  } catch (error) {
    console.error('Error deleting post:', error);
    return false;
  }
};

// Like/Unlike post
export const toggleLikePost = async (
  postId: string,
  userId: string
): Promise<boolean> => {
  try {
    const postRef = doc(db, POSTS_COLLECTION, postId);
    const postSnap = await getDoc(postRef);

    if (!postSnap.exists()) {
      return false;
    }

    const post = postSnap.data();
    const likes = post.likes || [];

    if (likes.includes(userId)) {
      // Unlike
      await updateDoc(postRef, {
        likes: arrayRemove(userId),
      });
    } else {
      // Like
      await updateDoc(postRef, {
        likes: arrayUnion(userId),
      });
    }

    return true;
  } catch (error) {
    console.error('Error toggling like:', error);
    return false;
  }
};

// Add comment to post
export const addComment = async (
  postId: string,
  userId: string,
  userName: string,
  userPhoto: string | undefined,
  userSlug: string | undefined,
  content: string
): Promise<string | null> => {
  try {
    const commentsRef = collection(db, COMMENTS_COLLECTION);
    const newComment = {
      postId,
      authorId: userId,
      authorName: userName,
      authorPhoto: userPhoto,
      authorSlug: userSlug,
      content,
      likes: [],
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(commentsRef, newComment);
    
    // Update post's comment count
    const postRef = doc(db, POSTS_COLLECTION, postId);
    const postSnap = await getDoc(postRef);
    if (postSnap.exists()) {
      const currentComments = postSnap.data().comments || [];
      await updateDoc(postRef, {
        comments: [...currentComments, {
          commentId: docRef.id,
          ...newComment,
          createdAt: new Date(),
        }]
      });
    }
    
    return docRef.id;
  } catch (error) {
    console.error('Error adding comment:', error);
    return null;
  }
};

// Get comments for a post
export const getPostComments = async (postId: string): Promise<Comment[]> => {
  try {
    const commentsRef = collection(db, COMMENTS_COLLECTION);
    const q = query(
      commentsRef,
      where('postId', '==', postId),
      orderBy('createdAt', 'asc')
    );

    const snapshot = await getDocs(q);
    const comments: Comment[] = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      comments.push({
        commentId: doc.id,
        ...data,
        createdAt: convertTimestamp(data.createdAt),
      } as Comment);
    });

    return comments;
  } catch (error) {
    console.error('Error getting comments:', error);
    return [];
  }
};

// Increment view count
export const incrementPostViews = async (postId: string): Promise<boolean> => {
  try {
    const postRef = doc(db, POSTS_COLLECTION, postId);
    const postSnap = await getDoc(postRef);
    
    if (!postSnap.exists()) {
      return false;
    }
    
    const currentViews = postSnap.data().views || 0;
    await updateDoc(postRef, {
      views: currentViews + 1,
    });
    
    return true;
  } catch (error) {
    console.error('Error incrementing views:', error);
    return false;
  }
};
