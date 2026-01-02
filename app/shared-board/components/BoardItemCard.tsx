'use client';

import { useState } from 'react';
import { BoardItem, UserReaction } from '@/types/sharedBoard';
import Image from 'next/image';

interface BoardItemCardProps {
  item: BoardItem;
  currentUserId: string;
  otherUserId: string;
  onReactionChange: (itemId: string, reaction: UserReaction) => void;
  onStatusChange: (itemId: string, status: 'saved' | 'contacted' | 'finalized') => void;
  onEdit: (item: BoardItem) => void;
  onDelete: (itemId: string) => void;
}

const getReactionColor = (reaction: UserReaction) => {
  switch (reaction) {
    case 'liked':
      return 'bg-success';
    case 'disliked':
      return 'bg-error';
    case 'unseen':
    default:
      return 'bg-base-300';
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'saved':
      return 'badge-neutral';
    case 'contacted':
      return 'badge-info';
    case 'finalized':
      return 'badge-success';
    default:
      return 'badge-ghost';
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'saved':
      return 'Saved';
    case 'contacted':
      return 'Contacted';
    case 'finalized':
      return 'Finalized';
    default:
      return status;
  }
};

export default function BoardItemCard({
  item,
  currentUserId,
  otherUserId,
  onReactionChange,
  onStatusChange,
  onEdit,
  onDelete,
}: BoardItemCardProps) {
  const [showMenu, setShowMenu] = useState(false);

  const currentUserReaction = item.reactions[currentUserId]?.reaction || 'unseen';
  const otherUserReaction = item.reactions[otherUserId]?.reaction || 'unseen';

  const handleReactionClick = (reaction: UserReaction) => {
    onReactionChange(item.id, reaction);
  };

  return (
    <div className="card card-border bg-base-100 shadow-lg hover:shadow-xl transition-shadow">
      {/* Reaction indicators at top-left corner */}
      <div className="absolute top-2 left-2 flex gap-1 z-10">
        <div
          className={`w-6 h-6 rounded-full ${getReactionColor(currentUserReaction)} border-2 border-base-100 shadow-md`}
          title="Your reaction"
        />
        <div
          className={`w-6 h-6 rounded-full ${getReactionColor(otherUserReaction)} border-2 border-base-100 shadow-md`}
          title="Their reaction"
        />
      </div>

      {/* Status badge */}
      <div className="absolute top-2 right-2 z-10">
        <div className={`badge ${getStatusColor(item.status)}`}>
          {getStatusLabel(item.status)}
        </div>
      </div>

      {/* Image or placeholder */}
      {item.imageUrl ? (
        <figure className="relative h-48">
          <Image
            src={item.imageUrl}
            alt={item.title}
            fill
            className="object-cover"
          />
        </figure>
      ) : (
        <div className="bg-base-200 h-48 flex items-center justify-center">
          <span className="text-6xl">
            {item.type === 'room' ? '🏠' : '🪑'}
          </span>
        </div>
      )}

      <div className="card-body p-4">
        {/* Title and type */}
        <h3 className="card-title text-base">
          {item.title}
          <div className={`badge badge-sm ${item.type === 'room' ? 'badge-primary' : 'badge-accent'}`}>
            {item.type === 'room' ? 'Room' : 'Decor'}
          </div>
        </h3>

        {/* Description */}
        {item.description && (
          <p className="text-sm text-base-content/70 line-clamp-2">
            {item.description}
          </p>
        )}

        {/* Price and Location */}
        <div className="flex flex-wrap gap-2 text-sm">
          {item.price && (
            <span className="badge badge-outline">
              {item.price.toLocaleString('vi-VN')} đ
            </span>
          )}
          {item.location && (
            <span className="badge badge-outline">
              📍 {item.location}
            </span>
          )}
        </div>

        {/* URL Link */}
        {item.url && (
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="link link-primary text-sm truncate"
          >
            🔗 View Details
          </a>
        )}

        {/* Notes */}
        {item.notes && (
          <p className="text-xs text-base-content/60 italic line-clamp-2">
            💬 {item.notes}
          </p>
        )}

        {/* Action buttons */}
        <div className="card-actions justify-between items-center mt-2">
          {/* Reaction buttons */}
          <div className="flex gap-1">
            <button
              className={`btn btn-xs ${currentUserReaction === 'liked' ? 'btn-success' : 'btn-ghost'}`}
              onClick={() => handleReactionClick('liked')}
              title="Like"
            >
              ❤️
            </button>
            <button
              className={`btn btn-xs ${currentUserReaction === 'disliked' ? 'btn-error' : 'btn-ghost'}`}
              onClick={() => handleReactionClick('disliked')}
              title="Dislike"
            >
              ❌
            </button>
          </div>

          {/* More actions */}
          <div className="dropdown dropdown-end">
            <button
              tabIndex={0}
              className="btn btn-xs btn-ghost"
              onClick={() => setShowMenu(!showMenu)}
            >
              ⋮
            </button>
            {showMenu && (
              <ul tabIndex={0} className="dropdown-content menu bg-base-100 rounded-box z-10 w-52 p-2 shadow-lg border border-base-300">
                <li className="menu-title">
                  <span>Update Status</span>
                </li>
                <li>
                  <button onClick={() => {
                    onStatusChange(item.id, 'saved');
                    setShowMenu(false);
                  }}>
                    📌 Saved
                  </button>
                </li>
                <li>
                  <button onClick={() => {
                    onStatusChange(item.id, 'contacted');
                    setShowMenu(false);
                  }}>
                    📞 Contacted
                  </button>
                </li>
                <li>
                  <button onClick={() => {
                    onStatusChange(item.id, 'finalized');
                    setShowMenu(false);
                  }}>
                    ✅ Finalized
                  </button>
                </li>
                <div className="divider my-0"></div>
                <li>
                  <button onClick={() => {
                    onEdit(item);
                    setShowMenu(false);
                  }}>
                    ✏️ Edit
                  </button>
                </li>
                <li>
                  <button
                    className="text-error"
                    onClick={() => {
                      if (confirm('Are you sure you want to delete this item?')) {
                        onDelete(item.id);
                      }
                      setShowMenu(false);
                    }}
                  >
                    🗑️ Delete
                  </button>
                </li>
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
