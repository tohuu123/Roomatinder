'use client';

import React from 'react';
import { GeminiAreaAnalysis } from '@/types/radar';

interface GeminiAnalysisPanelProps {
  analysis: GeminiAreaAnalysis | null;
  loading: boolean;
  onAnalyze: () => void;
  onAnalyzeLocation?: () => void;
  hasLocationData?: boolean;
}

export default function GeminiAnalysisPanel({
  analysis,
  loading,
  onAnalyze,
  onAnalyzeLocation,
  hasLocationData = false
}: GeminiAnalysisPanelProps) {
  return (
    <div className="absolute top-20 right-4 z-10 w-80 max-h-[70vh] overflow-y-auto">
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title text-lg">
            AI Area Analysis
          </h2>

          {!analysis && !loading && (
            <div className="text-center py-4">
              <p className="text-sm text-base-content/70 mb-4">
                Select filters to discover nearby amenities, then get AI insights about living in this area
              </p>
              <div className="flex flex-col gap-2">
                <button
                  onClick={onAnalyze}
                  className="btn btn-primary btn-sm"
                >
                  Analyze Area
                </button>
                {hasLocationData && onAnalyzeLocation && (
                  <button
                    onClick={onAnalyzeLocation}
                    className="btn btn-outline btn-sm"
                  >
                    Analyze This Location
                  </button>
                )}
              </div>
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center py-6">
              <span className="loading loading-spinner loading-lg text-primary"></span>
              <p className="text-sm text-base-content/70 mt-3">
                Analyzing area with Gemini AI...
              </p>
            </div>
          )}

          {analysis && !loading && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-sm">Summary</h3>
                <p className="text-sm text-base-content/80 mt-1 italic">
                  {analysis.summary}
                </p>
              </div>

              <div className="divider my-2"></div>

              <div>
                <h3 className="font-semibold text-sm">Score</h3>
                <div className="flex items-center gap-2 mt-1">
                  <div className="badge badge-primary badge-lg">{analysis.score}/10</div>
                </div>
              </div>

              <div className="divider my-2"></div>

              <div>
                <h3 className="font-semibold text-sm text-success">Pros</h3>
                <ul className="text-sm text-base-content/80 mt-1 list-disc list-inside space-y-1">
                  {analysis.pros?.map((pro: string, idx: number) => (
                    <li key={idx}>{pro}</li>
                  ))}
                </ul>
              </div>

              <div className="divider my-2"></div>

              <div>
                <h3 className="font-semibold text-sm text-error">Cons</h3>
                <ul className="text-sm text-base-content/80 mt-1 list-disc list-inside space-y-1">
                  {analysis.cons?.map((con: string, idx: number) => (
                    <li key={idx}>{con}</li>
                  ))}
                </ul>
              </div>

              <div className="divider my-2"></div>

              <div>
                <h3 className="font-semibold text-sm">Tags</h3>
                <div className="flex flex-wrap gap-2 mt-1">
                  {analysis.tags?.map((tag: string, idx: number) => (
                    <span key={idx} className="badge badge-outline badge-sm">{tag}</span>
                  ))}
                </div>
              </div>

              <div className="divider my-2"></div>

              <div>
                <h3 className="font-semibold text-sm">Recommendation</h3>
                <p className="text-sm text-base-content/80 mt-1">
                  {analysis.recommendation}
                </p>
              </div>

              <button
                onClick={onAnalyze}
                className="btn btn-outline btn-sm w-full mt-2"
              >
                Refresh Analysis
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
