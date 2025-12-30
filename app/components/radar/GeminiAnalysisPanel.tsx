'use client';

import React from 'react';
import { GeminiAreaAnalysis } from '@/types/radar';

interface GeminiAnalysisPanelProps {
  analysis: GeminiAreaAnalysis | null;
  loading: boolean;
  onAnalyze: () => void;
}

export default function GeminiAnalysisPanel({
  analysis,
  loading,
  onAnalyze
}: GeminiAnalysisPanelProps) {
  return (
    <div className="absolute top-20 right-4 z-10 w-80 max-h-[70vh] overflow-y-auto">
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title text-lg">
            <span className="mr-2">🤖</span>
            AI Area Analysis
          </h2>

          {!analysis && !loading && (
            <div className="text-center py-4">
              <p className="text-sm text-base-content/70 mb-4">
                Select filters to discover nearby amenities, then get AI insights about living in this area
              </p>
              <button
                onClick={onAnalyze}
                className="btn btn-primary btn-sm"
              >
                Analyze Area
              </button>
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
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <span>🏪</span>
                  Living Convenience
                </h3>
                <p className="text-sm text-base-content/80 mt-1">
                  {analysis.convenience}
                </p>
              </div>

              <div className="divider my-2"></div>

              <div>
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <span>🔊</span>
                  Noise Level
                </h3>
                <p className="text-sm text-base-content/80 mt-1">
                  {analysis.noiseLevel}
                </p>
              </div>

              <div className="divider my-2"></div>

              <div>
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <span>👥</span>
                  Suitable For
                </h3>
                <p className="text-sm text-base-content/80 mt-1">
                  {analysis.suitableFor}
                </p>
              </div>

              <div className="divider my-2"></div>

              <div>
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <span>📝</span>
                  Summary
                </h3>
                <p className="text-sm text-base-content/80 mt-1">
                  {analysis.summary}
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
