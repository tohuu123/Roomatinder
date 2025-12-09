'use client';

import { useState } from 'react';
import PersonaVerification from '@/app/components/PersonaVerification';

interface VerificationSectionProps {
  userId: string;
  verificationStatus?: {
    inquiryId?: string;
    status?: 'pending' | 'completed' | 'approved' | 'declined' | 'failed';
    isVerified?: boolean;
    completedAt?: string;
    approvedAt?: string;
    declinedAt?: string;
    failedAt?: string;
  };
  onVerificationComplete?: () => void;
}

export default function VerificationSection({
  userId,
  verificationStatus,
  onVerificationComplete
}: VerificationSectionProps) {
  const [showVerification, setShowVerification] = useState(false);
  const [localStatus, setLocalStatus] = useState(verificationStatus);

  const handleComplete = async (inquiryId: string, status: string) => {
    console.log('Verification completed:', inquiryId, status);
    setShowVerification(false);
    
    // Update local status
    setLocalStatus({
      inquiryId,
      status: 'completed',
      completedAt: new Date().toISOString()
    });

    // Call parent callback
    if (onVerificationComplete) {
      onVerificationComplete();
    }
  };

  const handleCancel = () => {
    setShowVerification(false);
  };

  const handleError = (error: any) => {
    console.error('Verification error:', error);
    setShowVerification(false);
  };

  const getStatusBadge = () => {
    if (!localStatus?.status) {
      return (
        <span className="badge badge-ghost">Not Verified</span>
      );
    }

    switch (localStatus.status) {
      case 'approved':
        return (
          <span className="badge badge-success">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Verified
          </span>
        );
      case 'completed':
        return (
          <span className="badge badge-info">Under Review</span>
        );
      case 'pending':
        return (
          <span className="badge badge-warning">Pending</span>
        );
      case 'declined':
        return (
          <span className="badge badge-error">Declined</span>
        );
      case 'failed':
        return (
          <span className="badge badge-error">Failed</span>
        );
      default:
        return (
          <span className="badge badge-ghost">Unknown</span>
        );
    }
  };

  const getStatusMessage = () => {
    if (!localStatus?.status) {
      return 'Verify your identity to increase trust and match with more people.';
    }

    switch (localStatus.status) {
      case 'approved':
        return 'Your identity has been verified! ✅';
      case 'completed':
        return 'Your verification is under review. We\'ll notify you once it\'s approved.';
      case 'pending':
        return 'Please complete the verification process.';
      case 'declined':
        return 'Your verification was declined. You can try again.';
      case 'failed':
        return 'Verification failed. Please try again.';
      default:
        return '';
    }
  };

  const canStartVerification = () => {
    return !localStatus?.status || 
           localStatus.status === 'declined' || 
           localStatus.status === 'failed';
  };

  if (showVerification) {
    return (
      <PersonaVerification
        userId={userId}
        onComplete={handleComplete}
        onCancel={handleCancel}
        onError={handleError}
      />
    );
  }

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title">
          Identity Verification
          {getStatusBadge()}
        </h2>
        
        <p className="text-base-content/70">
          {getStatusMessage()}
        </p>

        {localStatus?.isVerified && (
          <div className="alert alert-success">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="font-bold">Verified Account</h3>
              <div className="text-xs">
                Verified on {localStatus.approvedAt ? new Date(localStatus.approvedAt).toLocaleDateString() : 'N/A'}
              </div>
            </div>
          </div>
        )}

        {canStartVerification() && (
          <div className="card-actions justify-end">
            <button 
              className="btn btn-primary"
              onClick={() => setShowVerification(true)}
            >
              {localStatus?.status === 'declined' || localStatus?.status === 'failed' 
                ? 'Retry Verification' 
                : 'Start Verification'}
            </button>
          </div>
        )}

        {localStatus?.status === 'completed' && (
          <div className="alert alert-info">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>We&apos;re reviewing your verification. This usually takes 1-2 business days.</span>
          </div>
        )}
      </div>
    </div>
  );
}
