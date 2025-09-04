// features/authApi.ts
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

// Types
export interface LoginRequest {
  email: string;
  phone?: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  phone: string;
  password: string;
  role?: "CUSTOMER" | "VENDOR" | "EMPLOYEE" | "ADMIN";
}

export interface AuthResponse {
  token: string;
  user: {
    id: number;
    name: string;
    email: string;
    role: string;
  };
}

// Create Auth API
export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "http://localhost:5000/api",
    // Uncomment if you want cookies sent automatically:
    // credentials: "include",
  }),
  tagTypes: ["Auth"],
  endpoints: (builder) => ({
    login: builder.mutation<AuthResponse, LoginRequest>({
      query: (credentials) => ({
        url: "/auth/login",
        method: "POST",
        body: credentials,
      }),
      invalidatesTags: ["Auth"],
    }),
    register: builder.mutation<AuthResponse, RegisterRequest>({
      query: (body) => ({
        url: "/auth/register",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Auth"],
    }),
  }),
});

// Export hooks
export const { useLoginMutation, useRegisterMutation } = authApi;
