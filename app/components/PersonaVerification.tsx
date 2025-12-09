'use client';

import { useEffect, useState } from 'react';

interface PersonaVerificationProps {
  userId: string;
  onComplete?: (inquiryId: string, status: string) => void;
  onCancel?: () => void;
  onError?: (error: any) => void;
}

export default function PersonaVerification({
  userId,
  onComplete,
  onCancel,
  onError
}: PersonaVerificationProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load Persona script
    const script = document.createElement('script');
    script.src = 'https://cdn.withpersona.com/dist/persona-v4.8.0.js';
    script.async = true;
    script.onload = () => {
      console.log('Persona SDK loaded successfully');
      setIsLoading(false);
    };
    script.onerror = () => {
      console.error('Failed to load Persona SDK');
      setError('Failed to load Persona SDK');
      setIsLoading(false);
    };
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  const initializePersona = async () => {
    console.log('Starting Persona verification for user:', userId);
    setError(null);
    
    try {
      // Create inquiry session from backend
      console.log('Calling create-inquiry API...');
      const response = await fetch('/api/persona/create-inquiry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });
      
      console.log('API response status:', response.status);

      if (!response.ok) {
        throw new Error('Failed to create inquiry');
      }

      const { inquiryId } = await response.json();
      console.log('Received inquiryId:', inquiryId);

      // Check if Persona SDK is loaded
      if (!(window as any).Persona) {
        throw new Error('Persona SDK not loaded. Please refresh the page.');
      }

      // Get environment and template ID
      const templateId = process.env.NEXT_PUBLIC_PERSONA_TEMPLATE_ID;
      const environment = process.env.NEXT_PUBLIC_PERSONA_ENVIRONMENT;

      console.log('Using templateId:', templateId);
      console.log('Using environment:', environment);

      if (!templateId) {
        throw new Error('Persona template ID not configured');
      }

      // Initialize Persona client using template-based flow
      console.log('Initializing Persona client...');
      const client = new (window as any).Persona.Client({
        templateId: templateId,
        environment: environment,
        referenceId: userId,
        onReady: () => console.log('Persona ready'),
        onComplete: ({ inquiryId, status }: any) => {
          console.log('Verification complete:', inquiryId, status);
          if (onComplete) {
            onComplete(inquiryId, status);
          }
        },
        onCancel: ({ inquiryId }: any) => {
          console.log('Verification cancelled:', inquiryId);
          if (onCancel) {
            onCancel();
          }
        },
        onError: (error: any) => {
          console.error('Verification error:', error);
          setError('Verification failed. Please try again.');
          if (onError) {
            onError(error);
          }
        },
      });

      console.log('Opening Persona verification...');
      client.open();
    } catch (err: any) {
      console.error('Error initializing Persona:', err);
      setError(err.message || 'Failed to start verification');
      if (onError) {
        onError(err);
      }
    }
  };

  const handleStartVerification = () => {
    initializePersona();
  };

  if (error) {
    return (
      <div className="alert alert-error">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
        <span>{error}</span>
        <button className="btn btn-sm" onClick={handleStartVerification}>
          Retry
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <span className="loading loading-spinner loading-lg"></span>
        <span className="ml-4">Loading verification...</span>
      </div>
    );
  }

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title">Identity Verification</h2>
        <p>To ensure the safety of our community, we need to verify your identity.</p>
        <div className="card-actions justify-end">
          <button className="btn btn-primary" onClick={handleStartVerification}>
            Start Verification
          </button>
        </div>
      </div>
    </div>
  );
}
