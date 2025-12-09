'use client';

import { useState } from 'react';
import VerificationSection from './components/VerificationSection';

export default function VerificationTestPage() {
  const [userId] = useState('test-user-123'); // Replace with actual user ID
  const [verificationStatus, setVerificationStatus] = useState<any>(null);

  const handleVerificationComplete = () => {
    console.log('Verification completed! Reloading...');
    // In real app, reload user profile from Firestore
    alert('Verification completed! Check your profile.');
  };

  // Test different verification states
  const testStates = {
    notVerified: null,
    pending: {
      inquiryId: 'inq_test',
      status: 'pending' as const,
    },
    completed: {
      inquiryId: 'inq_test',
      status: 'completed' as const,
      completedAt: new Date().toISOString(),
    },
    approved: {
      inquiryId: 'inq_test',
      status: 'approved' as const,
      isVerified: true,
      approvedAt: new Date().toISOString(),
    },
    declined: {
      inquiryId: 'inq_test',
      status: 'declined' as const,
      declinedAt: new Date().toISOString(),
    },
    failed: {
      inquiryId: 'inq_test',
      status: 'failed' as const,
      failedAt: new Date().toISOString(),
    },
  };

  return (
    <div className="min-h-screen bg-base-200 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Persona Verification Test</h1>

        {/* Test controls */}
        <div className="card bg-base-100 shadow-xl mb-8">
          <div className="card-body">
            <h2 className="card-title">Test Different States</h2>
            <div className="flex flex-wrap gap-2">
              <button
                className="btn btn-sm"
                onClick={() => setVerificationStatus(null)}
              >
                Not Verified
              </button>
              <button
                className="btn btn-sm btn-warning"
                onClick={() => setVerificationStatus(testStates.pending)}
              >
                Pending
              </button>
              <button
                className="btn btn-sm btn-info"
                onClick={() => setVerificationStatus(testStates.completed)}
              >
                Completed
              </button>
              <button
                className="btn btn-sm btn-success"
                onClick={() => setVerificationStatus(testStates.approved)}
              >
                Approved
              </button>
              <button
                className="btn btn-sm btn-error"
                onClick={() => setVerificationStatus(testStates.declined)}
              >
                Declined
              </button>
              <button
                className="btn btn-sm btn-error"
                onClick={() => setVerificationStatus(testStates.failed)}
              >
                Failed
              </button>
            </div>

            <div className="divider"></div>

            <div className="mockup-code">
              <pre data-prefix="$">
                <code>Current State: {JSON.stringify(verificationStatus, null, 2)}</code>
              </pre>
            </div>
          </div>
        </div>

        {/* Verification component */}
        <VerificationSection
          userId={userId}
          verificationStatus={verificationStatus}
          onVerificationComplete={handleVerificationComplete}
        />

        {/* Instructions */}
        <div className="alert alert-info mt-8">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            className="h-6 w-6 shrink-0 stroke-current"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
            <h3 className="font-bold">Testing Instructions</h3>
            <ul className="list-disc list-inside text-sm">
              <li>Make sure you have configured .env.local with Persona credentials</li>
              <li>Use the buttons above to test different verification states</li>
              <li>Click "Start Verification" to test the actual Persona flow</li>
              <li>Check browser console for debugging information</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
