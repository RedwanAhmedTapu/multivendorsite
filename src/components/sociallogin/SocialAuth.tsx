// components/sociallogin/SocialAuth.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { Facebook } from "lucide-react";
import { useSocialLoginMutation } from "@/features/authApi";
import { useDispatch } from "react-redux";
import { setCredentials as setReduxCredentials } from "@/features/authSlice";

declare global {
  interface Window {
    google: any;
    FB: any;
    googleAuthInitialized?: boolean;
    fbAuthInitialized?: boolean;
  }
}

interface SocialAuthProps {
  enableOneTap?: boolean; // Enable/disable One Tap
  onSuccess?: () => void; // Callback after successful login
}

const SocialAuth = ({ enableOneTap = true, onSuccess }: SocialAuthProps) => {
  const [isLoading, setIsLoading] = useState<"google" | "facebook" | null>(null);
  const [googleLoaded, setGoogleLoaded] = useState(false);
  const [facebookLoaded, setFacebookLoaded] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);
  const googleButtonRef = useRef<HTMLDivElement>(null);
  const isProcessingRef = useRef(false);
  const buttonRenderedRef = useRef(false);
  const oneTapPromptedRef = useRef(false);
  const [socialLogin] = useSocialLoginMutation();
  const dispatch = useDispatch();

  // Load Google SDK - with duplicate prevention
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Prevent duplicate loading
    const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
    
    // If SDK is already loaded, just initialize
    if (window.google?.accounts?.id) {
      console.log("Google SDK already available");
      if (!window.googleAuthInitialized) {
        initializeGoogleAuth();
      } else {
        setGoogleLoaded(true);
        // Re-render button if needed
        setTimeout(() => {
          renderGoogleButton();
          if (enableOneTap && !oneTapPromptedRef.current) {
            promptOneTap();
          }
        }, 100);
      }
      return;
    }

    // If script is loading, wait for it
    if (existingScript) {
      console.log("Google SDK script already loading");
      existingScript.addEventListener('load', () => {
        initializeGoogleAuth();
      });
      return;
    }

    // Load Google SDK for the first time
    console.log("Loading Google SDK...");
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      console.log("Google SDK loaded successfully");
      initializeGoogleAuth();
    };
    script.onerror = () => {
      console.error("Failed to load Google SDK");
      setGoogleError("Failed to load Google authentication");
    };
    document.head.appendChild(script);

    return () => {
      // Don't remove script on cleanup to prevent reload on remount
    };
  }, [enableOneTap]);

  // Load Facebook SDK - with duplicate prevention
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Prevent duplicate loading
    const existingScript = document.querySelector('script[src*="connect.facebook.net"]');
    
    // If SDK is already loaded, just initialize
    if (window.FB) {
      console.log("Facebook SDK already available");
      if (!window.fbAuthInitialized) {
        initializeFacebookAuth();
      } else {
        setFacebookLoaded(true);
      }
      return;
    }

    // If script is loading, wait for it
    if (existingScript) {
      console.log("Facebook SDK script already loading");
      return;
    }

    // Load Facebook SDK for the first time
    console.log("Loading Facebook SDK...");
    const script = document.createElement("script");
    script.src = "https://connect.facebook.net/en_US/sdk.js";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      console.log("Facebook SDK loaded successfully");
      initializeFacebookAuth();
    };
    script.onerror = () => {
      console.error("Failed to load Facebook SDK");
    };
    document.head.appendChild(script);

    return () => {
      // Don't remove script on cleanup to prevent reload on remount
    };
  }, []);

  // Re-render Google button when component mounts and SDK is ready
  useEffect(() => {
    if (googleLoaded && googleButtonRef.current && !buttonRenderedRef.current) {
      console.log("Rendering Google button on mount");
      renderGoogleButton();
      
      // Prompt One Tap after button is rendered
      if (enableOneTap && !oneTapPromptedRef.current) {
        setTimeout(() => promptOneTap(), 500);
      }
    }
  }, [googleLoaded, enableOneTap]);

  // Initialize Google Auth
  const initializeGoogleAuth = () => {
    if (typeof window === "undefined" || !window.google?.accounts?.id) {
      console.error("Google SDK not available for initialization");
      setGoogleError("Google authentication not available");
      return;
    }

    // Prevent duplicate initialization
    if (window.googleAuthInitialized) {
      console.log("Google Auth already initialized");
      setGoogleLoaded(true);
      return;
    }

    try {
      console.log("Initializing Google Auth...");
      window.google.accounts.id.initialize({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
        callback: handleGoogleResponse,
        auto_select: false, // Set to true to auto-select if user previously logged in
        cancel_on_tap_outside: true,
        context: "signin",
        ux_mode: "popup", // Use popup mode for One Tap
        itp_support: true, // Enable Intelligent Tracking Prevention support
        use_fedcm_for_prompt: false, // Disable FedCM to avoid network errors
      });
      
      window.googleAuthInitialized = true;
      setGoogleLoaded(true);
      console.log("Google Auth initialized successfully");
      
      // Render the button after a short delay to ensure DOM is ready
      setTimeout(() => {
        renderGoogleButton();
        if (enableOneTap && !oneTapPromptedRef.current) {
          promptOneTap();
        }
      }, 100);
    } catch (error) {
      console.error("Error initializing Google Auth:", error);
      setGoogleError("Failed to initialize Google authentication");
    }
  };

  // Prompt Google One Tap
 // Prompt Google One Tap
  const promptOneTap = () => {
    if (!window.google?.accounts?.id || oneTapPromptedRef.current) {
      return;
    }

    try {
      console.log("Prompting Google One Tap...");
      oneTapPromptedRef.current = true;
      
      // Suppress FedCM and origin errors
      const originalError = console.error;
      console.error = (...args: any[]) => {
        // Filter out expected Google SDK errors
        if (typeof args[0] === 'string') {
          const errorMsg = args[0];
          if (
            errorMsg.includes('FedCM') || 
            errorMsg.includes('NetworkError') ||
            errorMsg.includes('[GSI_LOGGER]') ||
            errorMsg.includes('origin is not allowed')
          ) {
            console.log('Google SDK info:', errorMsg);
            return;
          }
        }
        originalError.apply(console, args);
      };
      
      window.google.accounts.id.prompt((notification: any) => {
        // Restore original console.error
        console.error = originalError;
        
        console.log("One Tap notification:", notification);
        
        if (notification.isNotDisplayed()) {
          const reason = notification.getNotDisplayedReason();
          console.log("One Tap not displayed:", reason);
          
          // Handle specific reasons
          if (reason === 'opt_out_or_no_session') {
            console.log("User has no Google session or opted out");
          } else if (reason === 'suppressed_by_user') {
            console.log("User previously dismissed One Tap");
          } else if (reason === 'browser_not_supported') {
            console.log("Browser doesn't support One Tap");
          } else if (reason === 'invalid_client') {
            console.warn("Google Client ID configuration issue - check authorized origins");
            setGoogleError("Google sign-in configuration error. Please contact support.");
          }
          
          // Reset flag for retry
          oneTapPromptedRef.current = false;
        }
        
        if (notification.isSkippedMoment()) {
          const reason = notification.getSkippedReason();
          console.log("One Tap skipped:", reason);
          oneTapPromptedRef.current = false;
        }
        
        if (notification.isDismissedMoment()) {
          const reason = notification.getDismissedReason();
          console.log("One Tap dismissed:", reason);
          
          // Reset flag so One Tap can be shown again later if needed
          setTimeout(() => {
            oneTapPromptedRef.current = false;
          }, 60000); // Allow retry after 1 minute
        }
      });
      
      // Restore console.error after a delay in case prompt() doesn't call callback
      setTimeout(() => {
        console.error = originalError;
      }, 1000);
      
    } catch (error) {
      console.error("Error prompting One Tap:", error);
      oneTapPromptedRef.current = false;
    }
  };

  // Cancel One Tap prompt (useful if user clicks regular button)
  const cancelOneTap = () => {
    if (window.google?.accounts?.id) {
      try {
        window.google.accounts.id.cancel();
        console.log("One Tap cancelled");
      } catch (error) {
        console.error("Error cancelling One Tap:", error);
      }
    }
  };

  // Render Google Button
  const renderGoogleButton = () => {
    if (!googleButtonRef.current || !window.google?.accounts?.id) {
      console.log("Cannot render button - ref or SDK not available");
      return;
    }
    
    if (buttonRenderedRef.current) {
      console.log("Button already rendered, skipping");
      return;
    }

    try {
      console.log("Rendering Google button...");
      
      // Clear any existing content
      googleButtonRef.current.innerHTML = '';
      
      window.google.accounts.id.renderButton(
        googleButtonRef.current,
        {
          type: "standard",
          theme: "outline",
          size: "large",
          text: "signin_with",
          shape: "rectangular",
          logo_alignment: "left",
          width: googleButtonRef.current.offsetWidth || 320,
        }
      );

      buttonRenderedRef.current = true;
      console.log("Google button rendered successfully");

      // Add click listener to show loading state
      setTimeout(() => {
        const googleButton = googleButtonRef.current?.querySelector('div[role="button"]');
        if (googleButton) {
          googleButton.addEventListener('click', () => {
            console.log("Google button clicked");
            cancelOneTap(); // Cancel One Tap if user clicks regular button
            setIsLoading("google");
            setGoogleError(null);
            
            // Safety timeout
            setTimeout(() => {
              if (!isProcessingRef.current) {
                setIsLoading(null);
                setGoogleError("Authentication timed out. Please try again.");
              }
            }, 30000);
          }, { once: false }); // Allow multiple clicks
        }
      }, 100);
      
    } catch (error) {
      console.error("Error rendering Google button:", error);
      setGoogleError("Failed to render Google button");
      buttonRenderedRef.current = false;
    }
  };

  // Google Response Handler
  const handleGoogleResponse = async (response: any) => {
    console.log("handleGoogleResponse called");
    
    // Prevent duplicate processing
    if (isProcessingRef.current) {
      console.log("Already processing Google response, ignoring...");
      return;
    }

    isProcessingRef.current = true;
    setIsLoading("google");
    setGoogleError(null);

    try {
      console.log("Processing Google credential...");
      
      const { credential } = response;
      
      if (!credential) {
        throw new Error("No credential received from Google");
      }

      console.log("Calling social login API...");
      const result = await socialLogin({
        provider: "google",
        token: credential,
      }).unwrap();

      console.log("Social login API response:", result);

      dispatch(setReduxCredentials({ 
        user: result.user, 
        accessToken: result.accessToken || "" 
      }));
      
      console.log("Google login successful!");
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      }
      
    } catch (error: any) {
      console.error("Google login failed:", error);
      setGoogleError(
        error?.data?.message || 
        error?.message || 
        "Login failed. Please try again."
      );
    } finally {
      setIsLoading(null);
      isProcessingRef.current = false;
    }
  };

  // Initialize Facebook Auth
  const initializeFacebookAuth = () => {
    if (typeof window === "undefined" || !window.FB) {
      console.error("Facebook SDK not available");
      return;
    }

    // Prevent duplicate initialization
    if (window.fbAuthInitialized) {
      console.log("Facebook Auth already initialized");
      setFacebookLoaded(true);
      return;
    }

    try {
      console.log("Initializing Facebook Auth...");
      window.FB.init({
        appId: process.env.NEXT_PUBLIC_FACEBOOK_APP_ID,
        cookie: true,
        xfbml: false,
        version: "v18.0",
      });
      
      window.fbAuthInitialized = true;
      setFacebookLoaded(true);
      console.log("Facebook Auth initialized successfully");
    } catch (error) {
      console.error("Error initializing Facebook Auth:", error);
    }
  };

  // Facebook Login Handler
  const handleFacebookLogin = () => {
    if (!facebookLoaded || !window.FB) {
      console.error("Facebook SDK not loaded");
      setGoogleError("Facebook authentication not ready");
      return;
    }

    if (isProcessingRef.current) {
      console.log("Already processing, ignoring Facebook click");
      return;
    }

    console.log("Starting Facebook login...");
    setIsLoading("facebook");
    setGoogleError(null);
    
    try {
      window.FB.login(
        (response: any) => {
          console.log("Facebook login response:", response);
          
          if (response.authResponse) {
            handleFacebookResponse(response.authResponse.accessToken);
          } else {
            console.log("Facebook login cancelled by user");
            setIsLoading(null);
          }
        },
        { 
          scope: "email,public_profile",
          return_scopes: true 
        }
      );

      // Safety timeout
      setTimeout(() => {
        if (!isProcessingRef.current) {
          setIsLoading(null);
          setGoogleError("Facebook login timed out. Please try again.");
        }
      }, 30000);

    } catch (error) {
      console.error("Error with Facebook Login:", error);
      setIsLoading(null);
      setGoogleError("Facebook login failed");
    }
  };

  // Facebook Response Handler
  const handleFacebookResponse = async (accessToken: string) => {
    if (isProcessingRef.current) {
      console.log("Already processing Facebook response, ignoring...");
      return;
    }

    isProcessingRef.current = true;
    console.log("Processing Facebook access token...");
    
    try {
      console.log("Calling social login API...");
      const result = await socialLogin({
        provider: "facebook",
        token: accessToken,
      }).unwrap();

      console.log("Social login API response:", result);

      dispatch(setReduxCredentials({ 
        user: result.user, 
        accessToken: result.accessToken || "" 
      }));
      
      console.log("Facebook login successful!");
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      }
      
    } catch (error: any) {
      console.error("Facebook login failed:", error);
      setGoogleError(
        error?.data?.message || 
        error?.message || 
        "Login failed. Please try again."
      );
    } finally {
      setIsLoading(null);
      isProcessingRef.current = false;
    }
  };

  return (
    <div className="space-y-3 mt-3">
      {/* Error Message */}
      {googleError && (
        <div className="text-xs text-red-600 mb-2 p-2 bg-red-50 rounded border border-red-200">
          {googleError}
        </div>
      )}

      {/* Google Sign-In */}
      <div className="w-full">
        {googleLoaded ? (
          <div className="relative min-h-[40px]">
            {/* Google's rendered button */}
            <div ref={googleButtonRef} className="w-full"></div>
            
            {/* Loading overlay */}
            {isLoading === "google" && (
              <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm text-gray-700">Signing in...</span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <button
            type="button"
            disabled
            className="w-full inline-flex justify-center items-center py-2.5 px-4 border border-gray-300 rounded-lg text-sm font-medium text-gray-400 bg-gray-100 cursor-not-allowed"
          >
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-gray-300 rounded animate-pulse" />
              <span>Loading Google...</span>
            </div>
          </button>
        )}
      </div>

      {/* Facebook Sign-In */}
      <div className="w-full">
        {facebookLoaded ? (
          <button
            type="button"
            onClick={handleFacebookLogin}
            disabled={isLoading !== null}
            className="w-full inline-flex justify-center items-center py-2.5 px-4 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading === "facebook" ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <span>Signing in with Facebook...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Facebook size={20} className="text-blue-600" />
                <span>Continue with Facebook</span>
              </div>
            )}
          </button>
        ) : (
          <button
            type="button"
            disabled
            className="w-full inline-flex justify-center items-center py-2.5 px-4 border border-gray-300 rounded-lg text-sm font-medium text-gray-400 bg-gray-100 cursor-not-allowed"
          >
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-gray-300 rounded animate-pulse" />
              <span>Loading Facebook...</span>
            </div>
          </button>
        )}
      </div>
    </div>
  );
};

export default SocialAuth;