'use client';

import { useState, useEffect } from 'react';
import { BoardItemType, CreateBoardItemInput, BoardItem } from '@/types/sharedBoard';

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateBoardItemInput) => Promise<void>;
  editItem?: BoardItem | null;
}

export default function AddItemModal({ isOpen, onClose, onSubmit, editItem }: AddItemModalProps) {
  const [type, setType] = useState<BoardItemType>('room');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [url, setUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [price, setPrice] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editItem) {
      setType(editItem.type);
      setTitle(editItem.title);
      setDescription(editItem.description || '');
      setUrl(editItem.url || '');
      setImageUrl(editItem.imageUrl || '');
      setPrice(editItem.price?.toString() || '');
      setLocation(editItem.location || '');
      setNotes(editItem.notes || '');
    } else {
      resetForm();
    }
  }, [editItem, isOpen]);

  const resetForm = () => {
    setType('room');
    setTitle('');
    setDescription('');
    setUrl('');
    setImageUrl('');
    setPrice('');
    setLocation('');
    setNotes('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      alert('Please enter a title');
      return;
    }

    setIsSubmitting(true);

    try {
      const data: CreateBoardItemInput = {
        type,
        title: title.trim(),
        description: description.trim() || undefined,
        url: url.trim() || undefined,
        imageUrl: imageUrl.trim() || undefined,
        price: price ? parseFloat(price) : undefined,
        location: location.trim() || undefined,
        notes: notes.trim() || undefined,
      };

      await onSubmit(data);
      resetForm();
      onClose();
    } catch (error) {
      console.error('Error submitting item:', error);
      alert('An error occurred, please try again');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      resetForm();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <dialog className="modal modal-open">
      <div className="modal-box max-w-2xl">
        <button
          className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
          onClick={handleClose}
          disabled={isSubmitting}
        >
          ✕
        </button>

        <h3 className="font-bold text-lg mb-4">
          {editItem ? 'Edit Item' : 'Add New Item'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type selection */}
          <div className="form-control">
            <label className="label">
              <span className="label-text">Type</span>
            </label>
            <div className="flex gap-4">
              <label className="label cursor-pointer gap-2">
                <input
                  type="radio"
                  name="type"
                  className="radio radio-primary"
                  value="room"
                  checked={type === 'room'}
                  onChange={(e) => setType(e.target.value as BoardItemType)}
                />
                <span>🏠 Room</span>
              </label>
              <label className="label cursor-pointer gap-2">
                <input
                  type="radio"
                  name="type"
                  className="radio radio-accent"
                  value="decor"
                  checked={type === 'decor'}
                  onChange={(e) => setType(e.target.value as BoardItemType)}
                />
                <span>🪑 Decor</span>
              </label>
            </div>
          </div>

          {/* Title */}
          <label className="input input-bordered flex items-center gap-2">
            <span className="label-text">Title*</span>
            <input
              type="text"
              className="grow"
              placeholder="e.g. Room near campus..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </label>

          {/* Description */}
          <div className="form-control">
            <label className="label">
              <span className="label-text">Description</span>
            </label>
            <textarea
              className="textarea textarea-bordered h-20"
              placeholder="Detailed description..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* URL */}
          <label className="input input-bordered flex items-center gap-2">
            <span className="label-text">Link</span>
            <input
              type="url"
              className="grow"
              placeholder="https://..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </label>

          {/* Image URL */}
          <label className="input input-bordered flex items-center gap-2">
            <span className="label-text">Image URL</span>
            <input
              type="url"
              className="grow"
              placeholder="https://..."
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
            />
          </label>

          {/* Price */}
          <label className="input input-bordered flex items-center gap-2">
            <span className="label-text">Price</span>
            <input
              type="number"
              className="grow"
              placeholder="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
            <span className="label-text">$</span>
          </label>

          {/* Location (for rooms) */}
          {type === 'room' && (
            <label className="input input-bordered flex items-center gap-2">
              <span className="label-text">Location</span>
              <input
                type="text"
                className="grow"
                placeholder="e.g. District 1, HCMC"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </label>
          )}

          {/* Notes */}
          <div className="form-control">
            <label className="label">
              <span className="label-text">Notes</span>
            </label>
            <textarea
              className="textarea textarea-bordered h-16"
              placeholder="Additional notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* Actions */}
          <div className="modal-action">
            <button
              type="button"
              className="btn"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  Saving...
                </>
              ) : editItem ? (
                'Update'
              ) : (
                'Add'
              )}
            </button>
          </div>
        </form>
      </div>
      <div className="modal-backdrop" onClick={handleClose}></div>
    </dialog>
  );
}
