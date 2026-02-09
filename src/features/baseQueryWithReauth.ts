import { fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { setAccessToken, setCredentials, clearAuth } from "./authSlice";
import type { RootState } from "@/store/store";

// Track refresh state to prevent multiple calls
let refreshPromise: Promise<any> | null = null;
let isRefreshing = false;

// Create base query with credentials
const baseQuery = fetchBaseQuery({
  baseUrl: "https://api.finixmart.com.bd/api",
  credentials: "include",
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.accessToken;
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    return headers;
  },
});

const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions
) => {
  // First, check if we have a token at all
  const state = api.getState() as RootState;
  if (!state.auth.accessToken) {
    // No token means user is not logged in
    return await baseQuery(args, api, extraOptions);
  }

  let result = await baseQuery(args, api, extraOptions);

  // Check if error is due to expired/unauthorized token
  // ONLY refresh if we get a 401 AND we have a token
  if ((result.error?.status === 401 || result.error?.status === 403) && state.auth.accessToken) {
    console.log('Token might be expired, attempting refresh...');
    
    // Prevent multiple refresh calls
    if (!isRefreshing) {
      isRefreshing = true;
      
      refreshPromise = baseQuery(
        {
          url: "/auth/refresh",
          method: "POST",
        },
        api,
        extraOptions
      )
        .then(refreshResult => {
          if (refreshResult.data) {
            const { accessToken, user } = refreshResult.data as any;
            
            if (accessToken) {
              // Update Redux state with new token
              api.dispatch(setAccessToken(accessToken));
              
              // If user data is returned, update it
              if (user) {
                const currentUser = state.auth.user;
                api.dispatch(setCredentials({ 
                  user: { ...currentUser, ...user }, 
                  accessToken 
                }));
              }
              console.log('Token refreshed successfully');
              return { success: true, accessToken };
            } else {
              throw new Error('No access token in refresh response');
            }
          } else {
            throw new Error('Refresh failed with no data');
          }
        })
        .catch(error => {
          console.error('Token refresh failed:', error);
          
          // Only clear auth if refresh endpoint itself failed with 401/403
          if (error?.status === 401 || error?.status === 403) {
            api.dispatch(clearAuth());
            
            // Optional: Redirect to login
            if (typeof window !== 'undefined') {
              // Use setTimeout to avoid React dispatch in the middle of another dispatch
              setTimeout(() => {
                window.location.href = '/login?session=expired';
              }, 100);
            }
          }
          return { success: false, error };
        })
        .finally(() => {
          isRefreshing = false;
          refreshPromise = null;
        });
    }

    // Wait for the refresh to complete
    const refreshResult = await refreshPromise;

    // If refresh was successful, retry the original request
    if (refreshResult?.success) {
      result = await baseQuery(args, api, extraOptions);
    } else {
      // If refresh failed, we might want to handle specific endpoints differently
      const url = typeof args === 'string' ? args : args.url;
      
      // For cart/wishlist endpoints, return a specific error
      if (url.includes('cart-wish')) {
        return {
          error: {
            status: 401,
            data: { message: 'Please login to access cart/wishlist' }
          }
        };
      }
    }
  }
  // Don't clear auth for 403 errors (might be permission issues, not token issues)
  else if (result.error?.status === 403) {
    console.log('Access forbidden - might be permission issue, not refreshing token');
  }

  return result;
};

export default baseQueryWithReauth;