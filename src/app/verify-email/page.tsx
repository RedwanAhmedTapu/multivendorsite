"use client"

import React, { useState, useEffect } from 'react';
import { Mail, CheckCircle, AlertCircle, Loader, ArrowRight } from 'lucide-react';
import { useVerifyEmailMutation } from '@/features/authApi';

const VerifyEmailPage = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token') || '';
  
  const [status, setStatus] = useState('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const [tokenValid, setTokenValid] = useState(true);
  
  const [verifyEmail, { isLoading }] = useVerifyEmailMutation();
  
  useEffect(() => {
    if (!token || token.length < 32) {
      setTokenValid(false);
      setStatus('error');
      setErrorMessage('Invalid verification link.');
      return;
    }

    if (status === 'idle') {
      handleVerification();
    }
  }, [token, status]);

  const handleVerification = async () => {
    setStatus('loading');
    setErrorMessage('');
    
    try {
      const result = await verifyEmail({ token, password: "" }).unwrap();
      
      if (result) {
        setStatus('success');
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      }
    } catch (err: any) {
      console.log('Verification error:', err);
      
      // Handle "already in progress" error with retry logic
      if (err?.status === 429 || err?.data?.message?.includes('already in progress')) {
        if (retryCount < 3) {
          const delay = Math.min(1000 * Math.pow(2, retryCount), 10000); // Exponential backoff: 2s, 4s, 8s max 10s
          setRetryCount(prev => prev + 1);
          setErrorMessage(`Verification in progress... Retrying in ${delay/1000} seconds`);
          
          setTimeout(() => {
            handleVerification();
          }, delay);
          return;
        } else {
          setStatus('error');
          setErrorMessage('Verification is taking longer than expected. Please try again in a moment.');
          return;
        }
      }
      
      // Handle "user already exists" - treat as success
      if (err?.data?.message?.includes('User already exists')) {
        setStatus('success');
        setErrorMessage('Account already verified! Redirecting to login...');
        setTimeout(() => {
          window.location.href = '/login';
        }, 3000);
        return;
      }
      
      // Handle invalid or expired token
      if (err?.data?.message?.includes('Invalid or expired') || err?.data?.message?.includes('No verification data')) {
        setStatus('error');
        setErrorMessage('This verification link has expired or been used. Please request a new verification email.');
        return;
      }
      
      // Handle other errors
      setStatus('error');
      setErrorMessage(err?.data?.message || 'Verification failed. Please try again.');
    }
  };

  const handleRetry = () => {
    setRetryCount(0);
    handleVerification();
  };

  const handleBackToSignup = () => {
    window.location.href = '/register';
  };

  const handleGoToLogin = () => {
    window.location.href = '/login';
  };

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-cyan-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
            <CheckCircle className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            Email Verified! 🎉
          </h1>
          <p className="text-gray-600 mb-6">
            {errorMessage || 'Your account has been successfully created. Redirecting you to login...'}
          </p>
          <div className="flex justify-center items-center space-x-2">
            <Loader className="w-5 h-5 text-teal-500 animate-spin" />
            <span className="text-teal-600 text-sm">Redirecting...</span>
          </div>
          <button
            onClick={handleGoToLogin}
            className="w-full mt-4 bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-all duration-300"
          >
            Go to Login Now
          </button>
        </div>
      </div>
    );
  }
  
  if (!tokenValid && status === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-cyan-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-red-400 to-rose-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            Invalid Link
          </h1>
          <p className="text-gray-600 mb-6">
            {errorMessage}
          </p>
          <button
            onClick={handleBackToSignup}
            className="w-full bg-gradient-to-r from-teal-500 to-cyan-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-300"
          >
            Back to Signup
          </button>
        </div>
      </div>
    );
  }
  
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-cyan-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <Loader className="w-12 h-12 text-white animate-spin" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            {retryCount > 0 ? 'Retrying Verification...' : 'Verifying Email...'}
          </h1>
          <p className="text-gray-600 mb-4">
            {errorMessage || 'Please wait while we verify your email address.'}
          </p>
          {retryCount > 0 && (
            <div className="flex items-center justify-center space-x-2 text-sm text-teal-600">
              <Loader className="w-4 h-4 animate-spin" />
              <span>Attempt {retryCount + 1} of 3</span>
            </div>
          )}
        </div>
      </div>
    );
  }
  
  if (status === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-cyan-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-red-400 to-rose-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            Verification Failed
          </h1>
          <p className="text-gray-600 mb-6">
            {errorMessage}
          </p>
          <div className="space-y-3">
            {!errorMessage.includes('expired') && (
              <button
                onClick={handleRetry}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-teal-500 to-cyan-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-300 disabled:opacity-50 flex items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                    Retrying...
                  </>
                ) : (
                  'Try Again'
                )}
              </button>
            )}
            <button
              onClick={handleBackToSignup}
              className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-all duration-300"
            >
              Back to Signup
            </button>
            <button
              onClick={handleGoToLogin}
              className="w-full border border-teal-500 text-teal-600 py-3 rounded-lg font-semibold hover:bg-teal-50 transition-all duration-300"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-cyan-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="w-20 h-20 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <Loader className="w-12 h-12 text-white animate-spin" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          Initializing...
        </h1>
        <p className="text-gray-600">
          Preparing verification process...
        </p>
      </div>
    </div>
  );
};

export default VerifyEmailPage;