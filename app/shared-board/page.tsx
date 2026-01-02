'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { SharedBoard, BoardItem, CreateBoardItemInput, UserReaction, BoardItemStatus } from '@/types/sharedBoard';
import BoardItemCard from './components/BoardItemCard';
import AddItemModal from './components/AddItemModal';

function SharedBoardContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const auth = getAuth();
  
  const chatRoomId = searchParams.get('chatRoomId');
  const otherUserId = searchParams.get('otherUserId');

  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [board, setBoard] = useState<SharedBoard | null>(null);
  const [items, setItems] = useState<BoardItem[]>([]); 
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<BoardItem | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [boardName, setBoardName] = useState('');

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
      
      if (!currentUser) {
        router.push('/login');
      }
    });

    return () => unsubscribe();
  }, [auth, router]);

  // Load board when user is authenticated
  useEffect(() => {
    if (authLoading) return;
    
    if (user && chatRoomId && otherUserId) {
      loadBoard();
    }
  }, [user, authLoading, chatRoomId, otherUserId]);

  const loadBoard = async () => {
    if (!user) {
      console.log('Cannot load board: user is null');
      return;
    }

    try {
      setLoading(true);
      console.log('Loading board for chatRoomId:', chatRoomId, 'otherUserId:', otherUserId);

      // Get or create board
      const boardRes = await fetch('/api/shared-board', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatRoomId,
          userIds: [user.uid, otherUserId],
        }),
      });

      if (!boardRes.ok) {
        const errorText = await boardRes.text();
        console.error('Failed to load board:', errorText);
        throw new Error('Failed to load board');
      }

      const boardData: SharedBoard = await boardRes.json();
      console.log('Board loaded:', boardData);
      setBoard(boardData);
      setBoardName(boardData.name);

      // Load items
      const itemsRes = await fetch(`/api/shared-board/items?boardId=${boardData.id}`);
      
      if (!itemsRes.ok) {
        const errorText = await itemsRes.text();
        console.error('Failed to load items:', errorText);
        throw new Error('Failed to load items');
      }

      const itemsData: BoardItem[] = await itemsRes.json();
      console.log('Items loaded:', itemsData.length, 'items');
      setItems(itemsData);
    } catch (error) {
      console.error('Error loading board:', error);
      // Set loading to false and board to empty state so UI can show error
      setBoard(null);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async (data: CreateBoardItemInput) => {
    if (!board || !user) return;

    try {
      const res = await fetch('/api/shared-board/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          boardId: board.id,
          userId: user.uid,
          ...data,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to add item');
      }

      const newItem: BoardItem = await res.json();
      setItems([newItem, ...items]);
      
      // Update board stats
      setBoard({
        ...board,
        stats: {
          ...board.stats,
          saved: board.stats.saved + 1,
        },
      });
    } catch (error) {
      console.error('Error adding item:', error);
      throw error;
    }
  };

  const handleUpdateItem = async (data: CreateBoardItemInput) => {
    if (!editingItem) return;

    try {
      const res = await fetch('/api/shared-board/items', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: editingItem.id,
          ...data,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to update item');
      }

      setItems(items.map(item => 
        item.id === editingItem.id 
          ? { ...item, ...data, updatedAt: new Date() }
          : item
      ));
      setEditingItem(null);
    } catch (error) {
      console.error('Error updating item:', error);
      throw error;
    }
  };

  const handleReactionChange = async (itemId: string, reaction: UserReaction) => {
    if (!user) return;

    try {
      const res = await fetch('/api/shared-board/reaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId,
          userId: user.uid,
          reaction,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to update reaction');
      }

      setItems(items.map(item => 
        item.id === itemId
          ? {
              ...item,
              reactions: {
                ...item.reactions,
                [user.uid]: {
                  userId: user.uid,
                  reaction,
                  timestamp: new Date(),
                },
              },
            }
          : item
      ));
    } catch (error) {
      console.error('Error updating reaction:', error);
      alert('Failed to update reaction');
    }
  };

  const handleStatusChange = async (itemId: string, status: BoardItemStatus) => {
    if (!board) return;

    try {
      const item = items.find(i => i.id === itemId);
      if (!item) return;

      const res = await fetch('/api/shared-board/items', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId,
          status,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to update status');
      }

      setItems(items.map(i => 
        i.id === itemId ? { ...i, status } : i
      ));

      // Update board stats
      const newStats = { ...board.stats };
      newStats[item.status]--;
      newStats[status]++;
      setBoard({ ...board, stats: newStats });
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!board) return;

    try {
      const item = items.find(i => i.id === itemId);
      if (!item) return;

      const res = await fetch(`/api/shared-board/items?itemId=${itemId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('Failed to delete item');
      }

      setItems(items.filter(i => i.id !== itemId));

      // Update board stats
      setBoard({
        ...board,
        stats: {
          ...board.stats,
          [item.status]: board.stats[item.status] - 1,
        },
      });
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Failed to delete item');
    }
  };

  const handleSaveBoardName = async () => {
    if (!board || !boardName.trim()) return;

    try {
      const res = await fetch(`/api/shared-board/${board.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: boardName.trim() }),
      });

      if (!res.ok) {
        throw new Error('Failed to update board name');
      }

      setBoard({ ...board, name: boardName.trim() });
      setIsEditingName(false);
    } catch (error) {
      console.error('Error updating board name:', error);
      alert('Failed to update board name');
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <span className="loading loading-spinner loading-lg"></span>
          <p className="mt-4 text-sm text-base-content/60">
            {authLoading ? 'Authenticating...' : 'Loading board...'}
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    console.log('Rendering: No user');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg">Please log in</p>
          <button className="btn btn-primary mt-4" onClick={() => router.push('/login')}>
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (!board) {
    console.log('Rendering: No board');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg">Board not found</p>
          <p className="text-sm text-base-content/60 mt-2">
            chatRoomId: {chatRoomId || 'missing'}, otherUserId: {otherUserId || 'missing'}
          </p>
          <button className="btn btn-primary mt-4" onClick={() => router.back()}>
            Go Back
          </button>
        </div>
      </div>
    );
  }

  console.log('Rendering board with', items.length, 'items');

  return (
    <div className="min-h-screen bg-base-200">
      {/* Header */}
      <div className="bg-base-100 shadow-md sticky top-0 z-20">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => router.back()}
            >
              ← Back
            </button>
          </div>

          {/* Board title and avatars */}
          <div className="flex items-center gap-4">
            {/* Avatars */}
            <div className="avatar-group -space-x-4">
              <div className="avatar">
                <div className="w-12">
                  <div className="rounded-full bg-primary text-primary-content flex items-center justify-center">
                    👤
                  </div>
                </div>
              </div>
              <div className="avatar">
                <div className="w-12">
                  <div className="rounded-full bg-secondary text-secondary-content flex items-center justify-center">
                    👤
                  </div>
                </div>
              </div>
            </div>

            {/* Board name */}
            <div className="flex-1">
              {isEditingName ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    className="input input-bordered input-sm flex-1"
                    value={boardName}
                    onChange={(e) => setBoardName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveBoardName();
                      if (e.key === 'Escape') {
                        setBoardName(board.name);
                        setIsEditingName(false);
                      }
                    }}
                    autoFocus
                  />
                  <button className="btn btn-sm btn-primary" onClick={handleSaveBoardName}>
                    ✓
                  </button>
                  <button
                    className="btn btn-sm btn-ghost"
                    onClick={() => {
                      setBoardName(board.name);
                      setIsEditingName(false);
                    }}
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <h1
                  className="text-2xl font-bold cursor-pointer hover:text-primary"
                  onClick={() => setIsEditingName(true)}
                >   
                  {board.name} ✏️
                </h1>
              )}
            </div>
          </div>

          {/* Progress stats */}
          <div className="stats stats-horizontal shadow mt-4 w-full">
            <div className="stat">
              <div className="stat-title">Saved</div>
              <div className="stat-value text-primary">{board.stats.saved}</div>
            </div>
            <div className="stat">
              <div className="stat-title">Contacted</div>
              <div className="stat-value text-info">{board.stats.contacted}</div>
            </div>
            <div className="stat">
              <div className="stat-title">Finalized</div>
              <div className="stat-value text-success">{board.stats.finalized}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid of items */}
      <div className="container mx-auto px-4 py-8">
        {items.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-xl text-base-content/60 mb-4">
              No items added yet
            </p>
            <p className="text-base-content/40">
              Click the + button below to add rooms or decor items
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {items.map((item) => (
              <BoardItemCard
                key={item.id}
                item={item}
                currentUserId={user.uid}
                otherUserId={otherUserId!}
                onReactionChange={handleReactionChange}
                onStatusChange={handleStatusChange}
                onEdit={(item) => {
                  setEditingItem(item);
                  setIsModalOpen(true);
                }}
                onDelete={handleDeleteItem}
              />
            ))}
          </div>
        )}
      </div>

      {/* Floating add button */}
      <div className="fab">
        <button
          className="btn btn-lg btn-circle btn-primary"
          onClick={() => {
            setEditingItem(null);
            setIsModalOpen(true);
          }}
        >
          <span className="text-2xl">+</span>
        </button>
      </div>

      {/* Add/Edit item modal */}
      <AddItemModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingItem(null);
        }}
        onSubmit={editingItem ? handleUpdateItem : handleAddItem}
        editItem={editingItem}
      />
    </div>
  );
}

export default function SharedBoardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    }>
      <SharedBoardContent />
    </Suspense>
  );
}
