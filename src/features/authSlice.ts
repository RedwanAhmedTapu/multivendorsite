import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface User {
  id: number;
  avatar?: string;
  name?: string;
  email?: string;
  phone?: string;
  vendorId?: string;
  vendor?: { storeName: string; vendorType: string };
  role: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ user: User; accessToken: string }>
    ) => {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
    },

    setAccessToken: (state, action: PayloadAction<string>) => {
      state.accessToken = action.payload;
    },

    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
    },

    clearAuth: (state) => {
      state.user = null;
      state.accessToken = null;
      
      // Clear localStorage if needed
      if (typeof window !== 'undefined') {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
      }
    },
  },
});

export const { setCredentials, setAccessToken, setUser, clearAuth } = authSlice.actions;
export default authSlice.reducer;