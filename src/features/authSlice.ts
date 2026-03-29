// features/authSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface User {
  // ✅ FIX: id must be string — your DB uses cuid/uuid (e.g. "cmj72c9po0000o0ucd3proe4e")
  // Declaring it as number causes silent === failures when comparing with
  // message.senderId, participant.userId, etc. which are all strings from Prisma.
  id: string;
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
      state.user = {
        ...action.payload.user,
        // Coerce id to string at write time — guards against APIs that
        // return id as a number despite the schema using string PKs
        id: String(action.payload.user.id),
      };
      state.accessToken = action.payload.accessToken;
    },

    setAccessToken: (state, action: PayloadAction<string>) => {
      state.accessToken = action.payload;
    },

    setUser: (state, action: PayloadAction<User>) => {
      state.user = {
        ...action.payload,
        id: String(action.payload.id),
      };
    },

    clearAuth: (state) => {
      state.user        = null;
      state.accessToken = null;
      if (typeof window !== "undefined") {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");
      }
    },
  },
});

export const { setCredentials, setAccessToken, setUser, clearAuth } =
  authSlice.actions;
export default authSlice.reducer;