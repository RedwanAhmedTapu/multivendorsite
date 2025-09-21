import { fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { setAccessToken, clearAuth } from "./authSlice";
import type { RootState } from "@/store/store";

// Core fetchBaseQuery with credentials + headers
const rawBaseQuery = fetchBaseQuery({
  baseUrl: "https://api.finixmart.com.bd/api",
  credentials: "include", // allows cookies
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
  let result = await rawBaseQuery(args, api, extraOptions);

  // Handle expired/invalid token (401 or 403)
  if (result.error && (result.error.status === 401 || result.error.status === 403)) {
    // Try refresh
    const refreshResult = await rawBaseQuery("https://api.finixmart.com.bd/auth/refresh", api, extraOptions);

    if (refreshResult.data && (refreshResult.data as any).accessToken) {
      // Save new access token
      api.dispatch(setAccessToken((refreshResult.data as any).accessToken));

      // Retry original request with new token
      result = await rawBaseQuery(args, api, extraOptions);
    } else {
      // Refresh failed → clear auth
      api.dispatch(clearAuth());
    }
  }

  return result;
};

export default baseQueryWithReauth;
