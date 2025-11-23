// app/vendor/onboarding/page.tsx
'use client';
import { RootState } from '@/store/store';
import React from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import OnboardingWizard from '@/components/vendorinfo/OnboardingWizard';

const OnboardingPage = () => {
  const router = useRouter();
  const { user } = useSelector((state: RootState) => state.auth);

  const handleOnboardingComplete = () => {
    // Navigate to vendor dashboard or appropriate page after completion
    router.push('/vendor-dashboard');
  };

  

  // Show error if no user is found
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="bg-red-50 rounded-lg p-8 max-w-md">
            <svg className="w-12 h-12 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-xl font-semibold text-red-800 mb-2">Authentication Required</h2>
            <p className="text-red-600 mb-4">You need to be logged in to access this page.</p>
            <div className="space-x-4">
              <button 
                onClick={() => router.push('/login')}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Go to Login
              </button>
              <button 
                onClick={() => window.location.reload()}
                className="px-4 py-2 border border-red-600 text-red-600 rounded-md hover:bg-red-50 transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error if vendor ID is missing
  if (!user.vendorId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="bg-amber-50 rounded-lg p-8 max-w-md">
            <svg className="w-12 h-12 text-amber-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <h2 className="text-xl font-semibold text-amber-800 mb-2">Vendor Account Not Found</h2>
            <p className="text-amber-700 mb-4">
              Your account doesn't appear to be set up as a vendor account. Please contact support to get started.
            </p>
            <div className="space-x-4">
              <button 
                onClick={() => router.push('/support')}
                className="px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 transition-colors"
              >
                Contact Support
              </button>
              <button 
                onClick={() => router.push('/')}
                className="px-4 py-2 border border-amber-600 text-amber-600 rounded-md hover:bg-amber-50 transition-colors"
              >
                Go to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <OnboardingWizard 
          vendorId={user.vendorId} 
          onComplete={handleOnboardingComplete}
        />
      </div>
    </div>
  );
};

export default OnboardingPage;