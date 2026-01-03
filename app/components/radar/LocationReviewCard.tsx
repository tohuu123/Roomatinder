'use client';

import React from 'react';

export interface LocationReviewData {
  summary: string;
  score: number;
  pros: string[];
  cons: string[];
  tags: string[];
  recommendation: string;
}

interface LocationReviewCardProps {
  locationName: string;
  address?: string;
  review: LocationReviewData;
  onClose?: () => void;
  loading?: boolean;
}

export default function LocationReviewCard({ 
  locationName, 
  address, 
  review, 
  onClose,
  loading = false
}: LocationReviewCardProps) {
  // Score color based on rating
  const getScoreColor = (score: number) => {
    if (score >= 8) return 'badge-success';
    if (score >= 6) return 'badge-warning';
    return 'badge-error';
  };

  if (loading) {
    return (
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body items-center justify-center py-12">
          <span className="loading loading-spinner loading-lg text-primary"></span>
          <p className="mt-4 font-semibold">AI đang phân tích địa điểm...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card bg-base-100 shadow-xl max-w-xl">
      <div className="card-body p-4">
        {/* Header */}
        <div className="flex justify-between items-start gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="card-title text-lg mb-1 break-words">
              📍 {locationName}
            </h3>
            {address && (
              <p className="text-xs text-base-content/60 mb-2 break-words">{address}</p>
            )}
          </div>
          {onClose && (
            <button 
              onClick={onClose}
              className="btn btn-ghost btn-sm btn-circle flex-shrink-0"
              aria-label="Close"
            >
              ✕
            </button>
          )}
        </div>

        {/* Score Badge */}
        <div className="flex items-center gap-2 mb-3">
          <div className={`badge badge-lg ${getScoreColor(review.score)} gap-2`}>
            <span className="font-bold text-lg">{review.score.toFixed(1)}</span>
            <span>/10</span>
          </div>
        </div>

        {/* Summary */}
        <div className="alert alert-info py-2 px-3 mb-3">
          <div>
            <span className="text-sm font-semibold">💡 {review.summary}</span>
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1 mb-3">
          {review.tags.map((tag, index) => (
            <span key={index} className="badge badge-outline badge-sm">
              {tag}
            </span>
          ))}
        </div>

        {/* Pros and Cons */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          {/* Pros */}
          <div className="card bg-success/10">
            <div className="card-body p-2">
              <h4 className="font-semibold text-success text-xs mb-1 flex items-center gap-1">
                <span>✅</span> Ưu điểm
              </h4>
              <ul className="space-y-1">
                {review.pros.map((pro, index) => (
                  <li key={index} className="flex items-start gap-1 text-xs">
                    <span className="text-success mt-0.5 flex-shrink-0">•</span>
                    <span className="break-words">{pro}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Cons */}
          <div className="card bg-error/10">
            <div className="card-body p-2">
              <h4 className="font-semibold text-error text-xs mb-1 flex items-center gap-1">
                <span>⚠️</span> Nhược điểm
              </h4>
              <ul className="space-y-1">
                {review.cons.map((con, index) => (
                  <li key={index} className="flex items-start gap-1 text-xs">
                    <span className="text-error mt-0.5 flex-shrink-0">•</span>
                    <span className="break-words">{con}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Recommendation */}
        <div className="alert alert-warning py-2 px-3">
          <div className="w-full">
            <div className="font-bold text-xs mb-1">🎯 Đánh giá:</div>
            <p className="text-xs break-words">{review.recommendation}</p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-2">
          <p className="text-xs text-base-content/50">
            💡 Powered by Gemini AI
          </p>
        </div>
      </div>
    </div>
  );
}
