'use client';

import React from 'react';

interface LocationReviewProps {
  summary: string;
  vibe_score: number;
  details: {
    amenities: string;
    environment: string;
    traffic: string;
    security: string;
  };
  highlight_tag: string[];
  warning: string;
}

const LocationReviewModal: React.FC<{
  review: LocationReviewProps | null;
  isOpen: boolean;
  onClose: () => void;
}> = ({ review, isOpen, onClose }) => {
  if (!isOpen || !review) return null;

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-success';
    if (score >= 6) return 'text-warning';
    return 'text-error';
  };

  const getScoreBg = (score: number) => {
    if (score >= 8) return 'bg-success/10 border-success';
    if (score >= 6) return 'bg-warning/10 border-warning';
    return 'bg-error/10 border-error';
  };

  return (
    <dialog className="modal modal-open">
      <div className="modal-box max-w-4xl">
        {/* Header with close button */}
        <form method="dialog">
          <button
            onClick={onClose}
            className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
          >
            ✕
          </button>
        </form>

        {/* Summary and Score */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-2xl font-bold flex-1 pr-4">{review.summary}</h3>
            <div className={`badge badge-lg ${getScoreBg(review.vibe_score)} border-2 px-4 py-3`}>
              <span className={`text-2xl font-bold ${getScoreColor(review.vibe_score)}`}>
                {review.vibe_score}
              </span>
              <span className="text-sm ml-1">/10</span>
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            {review.highlight_tag.map((tag, index) => (
              <span key={index} className="badge badge-primary badge-lg">
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Details Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Amenities Card */}
          <div className="card bg-base-200">
            <div className="card-body p-4">
              <h4 className="card-title text-base flex items-center gap-2">
                <span className="text-2xl">🛒</span>
                Amenities
              </h4>
              <p className="text-sm">{review.details.amenities}</p>
            </div>
          </div>

          {/* Environment Card */}
          <div className="card bg-base-200">
            <div className="card-body p-4">
              <h4 className="card-title text-base flex items-center gap-2">
                <span className="text-2xl">🌳</span>
                Environment
              </h4>
              <p className="text-sm">{review.details.environment}</p>
            </div>
          </div>

          {/* Traffic Card */}
          <div className="card bg-base-200">
            <div className="card-body p-4">
              <h4 className="card-title text-base flex items-center gap-2">
                <span className="text-2xl">🚗</span>
                Traffic
              </h4>
              <p className="text-sm">{review.details.traffic}</p>
            </div>
          </div>

          {/* Security Card */}
          <div className="card bg-base-200">
            <div className="card-body p-4">
              <h4 className="card-title text-base flex items-center gap-2">
                <span className="text-2xl">🛡️</span>
                Security
              </h4>
              <p className="text-sm">{review.details.security}</p>
            </div>
          </div>
        </div>

        {/* Warning Alert */}
        {review.warning && (
          <div className="alert alert-warning shadow-lg">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="stroke-current shrink-0 h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <div>
              <h3 className="font-bold">Warning!</h3>
              <div className="text-sm">{review.warning}</div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="modal-action">
          <button onClick={onClose} className="btn btn-primary">
            Close
          </button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button onClick={onClose}>close</button>
      </form>
    </dialog>
  );
};

export default LocationReviewModal;
