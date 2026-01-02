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
  Timestamp,
  writeBatch,
  increment,
} from 'firebase/firestore';
import { db } from '@/firebase';
import type {
  SharedBoard,
  BoardItem,
  CreateBoardItemInput,
  UpdateBoardItemInput,
  UpdateReactionInput,
  UserReaction,
  BoardItemStatus,
} from '@/types/sharedBoard';

const BOARDS_COLLECTION = 'sharedBoards';
const ITEMS_COLLECTION = 'boardItems';

// Helper function to convert Firestore timestamp to Date
const convertTimestamp = (timestamp: any): Date => {
  if (timestamp?.toDate) {
    return timestamp.toDate();
  }
  return timestamp;
};

/**
 * Get or create a shared board for a chat room
 */
export async function getOrCreateSharedBoard(
  chatRoomId: string,
  userIds: [string, string]
): Promise<SharedBoard> {
  try {
    // Try to find existing board for this chat
    const boardsRef = collection(db, BOARDS_COLLECTION);
    const q = query(boardsRef, where('chatRoomId', '==', chatRoomId));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const docSnap = querySnapshot.docs[0];
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        createdAt: convertTimestamp(data.createdAt),
        updatedAt: convertTimestamp(data.updatedAt),
      } as SharedBoard;
    }

    // Create new board if doesn't exist
    const newBoard = {
      name: 'Our Shared Board',
      userIds,
      chatRoomId,
      stats: {
        saved: 0,
        contacted: 0,
        finalized: 0,
      },
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    const docRef = await addDoc(boardsRef, newBoard);
    
    return {
      id: docRef.id,
      ...newBoard,
      createdAt: newBoard.createdAt.toDate(),
      updatedAt: newBoard.updatedAt.toDate(),
    } as SharedBoard;
  } catch (error) {
    console.error('Error getting/creating shared board:', error);
    throw error;
  }
}

/**
 * Get a shared board by ID
 */
export async function getSharedBoard(boardId: string): Promise<SharedBoard | null> {
  try {
    const boardRef = doc(db, BOARDS_COLLECTION, boardId);
    const docSnap = await getDoc(boardRef);

    if (!docSnap.exists()) {
      return null;
    }

    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
      createdAt: convertTimestamp(data.createdAt),
      updatedAt: convertTimestamp(data.updatedAt),
    } as SharedBoard;
  } catch (error) {
    console.error('Error getting shared board:', error);
    throw error;
  }
}

/**
 * Update board name
 */
export async function updateBoardName(boardId: string, name: string): Promise<void> {
  try {
    const boardRef = doc(db, BOARDS_COLLECTION, boardId);
    await updateDoc(boardRef, {
      name,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error updating board name:', error);
    throw error;
  }
}

/**
 * Get all items for a board
 */
export async function getBoardItems(boardId: string): Promise<BoardItem[]> {
  try {
    const itemsRef = collection(db, ITEMS_COLLECTION);
    const q = query(
      itemsRef,
      where('boardId', '==', boardId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: convertTimestamp(data.createdAt),
        updatedAt: convertTimestamp(data.updatedAt),
        reactions: Object.keys(data.reactions || {}).reduce((acc, userId) => {
          acc[userId] = {
            ...data.reactions[userId],
            timestamp: convertTimestamp(data.reactions[userId].timestamp),
          };
          return acc;
        }, {} as any),
      } as BoardItem;
    });
  } catch (error) {
    console.error('Error getting board items:', error);
    throw error;
  }
}

/**
 * Create a new board item
 */
export async function createBoardItem(
  boardId: string,
  userId: string,
  input: CreateBoardItemInput
): Promise<BoardItem> {
  try {
    const itemsRef = collection(db, ITEMS_COLLECTION);
    const newItem = {
      boardId,
      ...input,
      reactions: {
        [userId]: {
          userId,
          reaction: 'liked' as UserReaction,
          timestamp: Timestamp.now(),
        },
      },
      status: 'saved' as BoardItemStatus,
      createdBy: userId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    const docRef = await addDoc(itemsRef, newItem);

    // Update board stats
    const boardRef = doc(db, BOARDS_COLLECTION, boardId);
    await updateDoc(boardRef, {
      'stats.saved': increment(1),
      updatedAt: Timestamp.now(),
    });

    const itemDoc = await getDoc(docRef);
    const data = itemDoc.data()!;
    
    return {
      id: docRef.id,
      ...data,
      createdAt: convertTimestamp(data.createdAt),
      updatedAt: convertTimestamp(data.updatedAt),
      reactions: {
        [userId]: {
          userId,
          reaction: 'liked' as UserReaction,
          timestamp: data.reactions[userId].timestamp.toDate(),
        },
      },
    } as BoardItem;
  } catch (error) {
    console.error('Error creating board item:', error);
    throw error;
  }
}

/**
 * Update a board item
 */
export async function updateBoardItem(
  itemId: string,
  input: UpdateBoardItemInput
): Promise<void> {
  try {
    const itemRef = doc(db, ITEMS_COLLECTION, itemId);
    const itemDoc = await getDoc(itemRef);
    
    if (!itemDoc.exists()) {
      throw new Error('Item not found');
    }

    const currentData = itemDoc.data();
    const batch = writeBatch(db);

    // Update item
    batch.update(itemRef, {
      ...input,
      updatedAt: Timestamp.now(),
    });

    // If status changed, update board stats
    if (input.status && input.status !== currentData.status) {
      const boardRef = doc(db, BOARDS_COLLECTION, currentData.boardId);
      
      // Decrement old status
      batch.update(boardRef, {
        [`stats.${currentData.status}`]: increment(-1),
      });
      
      // Increment new status
      batch.update(boardRef, {
        [`stats.${input.status}`]: increment(1),
        updatedAt: Timestamp.now(),
      });
    }

    await batch.commit();
  } catch (error) {
    console.error('Error updating board item:', error);
    throw error;
  }
}

/**
 * Update user reaction to an item
 */
export async function updateReaction(
  itemId: string,
  userId: string,
  reaction: UserReaction
): Promise<void> {
  try {
    const itemRef = doc(db, ITEMS_COLLECTION, itemId);
    await updateDoc(itemRef, {
      [`reactions.${userId}`]: {
        userId,
        reaction,
        timestamp: Timestamp.now(),
      },
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error updating reaction:', error);
    throw error;
  }
}

/**
 * Delete a board item
 */
export async function deleteBoardItem(itemId: string): Promise<void> {
  try {
    const itemRef = doc(db, ITEMS_COLLECTION, itemId);
    const itemDoc = await getDoc(itemRef);
    
    if (!itemDoc.exists()) {
      throw new Error('Item not found');
    }

    const data = itemDoc.data();
    const batch = writeBatch(db);

    // Delete item
    batch.delete(itemRef);

    // Update board stats
    const boardRef = doc(db, BOARDS_COLLECTION, data.boardId);
    batch.update(boardRef, {
      [`stats.${data.status}`]: increment(-1),
      updatedAt: Timestamp.now(),
    });

    await batch.commit();
  } catch (error) {
    console.error('Error deleting board item:', error);
    throw error;
  }
}

/**
 * Get board by chat room ID
 */
export async function getBoardByChatRoomId(chatRoomId: string): Promise<SharedBoard | null> {
  try {
    const boardsRef = collection(db, BOARDS_COLLECTION);
    const q = query(boardsRef, where('chatRoomId', '==', chatRoomId));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return null;
    }

    const docSnap = querySnapshot.docs[0];
    const data = docSnap.data();
    
    return {
      id: docSnap.id,
      ...data,
      createdAt: convertTimestamp(data.createdAt),
      updatedAt: convertTimestamp(data.updatedAt),
    } as SharedBoard;
  } catch (error) {
    console.error('Error getting board by chat room ID:', error);
    throw error;
  }
}
