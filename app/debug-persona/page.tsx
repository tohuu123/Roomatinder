'use client';

import { useState } from 'react';

export default function DebugPersonaPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const testCreateInquiry = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      console.log('Testing create-inquiry API...');
      
      const response = await fetch('/api/persona/create-inquiry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: 'test-user-123' }),
      });

      console.log('Response status:', response.status);

      const data = await response.json();
      console.log('Response data:', data);

      if (!response.ok) {
        setError(data.error || 'API request failed');
      } else {
        setResult(data);
      }
    } catch (err: any) {
      console.error('Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const testPersonaSDK = () => {
    console.log('Testing Persona SDK...');
    if ((window as any).Persona) {
      console.log('✅ Persona SDK is loaded!');
      alert('✅ Persona SDK is loaded!');
    } else {
      console.error('❌ Persona SDK is NOT loaded!');
      alert('❌ Persona SDK is NOT loaded!');
    }
  };

  const checkEnvVars = () => {
    console.log('Environment Variables:');
    console.log('NEXT_PUBLIC_PERSONA_TEMPLATE_ID:', process.env.NEXT_PUBLIC_PERSONA_TEMPLATE_ID);
    console.log('NEXT_PUBLIC_PERSONA_ENVIRONMENT:', process.env.NEXT_PUBLIC_PERSONA_ENVIRONMENT);
  };

  return (
    <div className="min-h-screen bg-base-200 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Debug Persona Integration</h1>

        {/* Check Environment Variables */}
        <div className="card bg-base-100 shadow-xl mb-4">
          <div className="card-body">
            <h2 className="card-title">1. Check Environment Variables</h2>
            <button className="btn btn-primary" onClick={checkEnvVars}>
              Check Env Vars (See Console)
            </button>
            <div className="mockup-code mt-4">
              <pre data-prefix="$">
                <code>NEXT_PUBLIC_PERSONA_TEMPLATE_ID: {process.env.NEXT_PUBLIC_PERSONA_TEMPLATE_ID || '❌ NOT SET'}</code>
              </pre>
              <pre data-prefix="$">
                <code>NEXT_PUBLIC_PERSONA_ENVIRONMENT: {process.env.NEXT_PUBLIC_PERSONA_ENVIRONMENT || '❌ NOT SET'}</code>
              </pre>
            </div>
          </div>
        </div>

        {/* Test Persona SDK */}
        <div className="card bg-base-100 shadow-xl mb-4">
          <div className="card-body">
            <h2 className="card-title">2. Test Persona SDK Load</h2>
            <p>Check if Persona SDK is loaded in browser</p>
            <button className="btn btn-secondary" onClick={testPersonaSDK}>
              Test Persona SDK
            </button>
            <div className="alert alert-info mt-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Open browser console (F12) to see results</span>
            </div>
          </div>
        </div>

        {/* Test API */}
        <div className="card bg-base-100 shadow-xl mb-4">
          <div className="card-body">
            <h2 className="card-title">3. Test Create Inquiry API</h2>
            <p>Test if API can create an inquiry with Persona</p>
            <button 
              className="btn btn-accent" 
              onClick={testCreateInquiry}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="loading loading-spinner"></span>
                  Testing...
                </>
              ) : (
                'Test API'
              )}
            </button>

            {error && (
              <div className="alert alert-error mt-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {result && (
              <div className="alert alert-success mt-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <div>
                  <h3 className="font-bold">API Success!</h3>
                  <div className="mockup-code mt-2">
                    <pre>
                      <code>{JSON.stringify(result, null, 2)}</code>
                    </pre>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="alert alert-warning">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <h3 className="font-bold">Debug Steps:</h3>
            <ol className="list-decimal list-inside text-sm">
              <li>Check if environment variables are set</li>
              <li>Check if Persona SDK loads successfully</li>
              <li>Test if API can create inquiry</li>
              <li>Open browser console (F12) to see detailed logs</li>
            </ol>
          </div>
        </div>
      </div>

      {/* Load Persona SDK for testing */}
      <script src="https://cdn.withpersona.com/dist/persona-v4.8.0.js" async></script>
    </div>
  );
}
