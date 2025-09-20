import { createSlice, PayloadAction } from "@reduxjs/toolkit";

// -----------------
// Types
// -----------------
export interface User {
  id: number;
  name?: string;
  email?: string;
  phone?: string;
  vendorId?: string;
  role: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
}

// -----------------
// Initial state
// -----------------
const initialState: AuthState = {
  user: null,
  accessToken: null,
};

// -----------------
// Slice
// -----------------
const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    // Store both user & accessToken
    setCredentials: (
      state,
      action: PayloadAction<{ user: User; accessToken: string }>
    ) => {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
    },

    // Update only accessToken (used after refresh)
    setAccessToken: (state, action: PayloadAction<string>) => {
      state.accessToken = action.payload;
    },

    // Clear everything (logout)
    clearAuth: (state) => {
      state.user = null;
      state.accessToken = null;
    },
  },
});

// -----------------
// Exports
// -----------------
export const { setCredentials, setAccessToken, clearAuth } = authSlice.actions;
export default authSlice.reducer;
