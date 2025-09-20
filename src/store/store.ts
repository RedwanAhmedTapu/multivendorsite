// src/app/store.ts
import { configureStore, combineReducers } from "@reduxjs/toolkit";
import { persistReducer, persistStore } from "redux-persist";
import storage from "redux-persist/lib/storage";

// APIs & slices
import { apiSlice } from "../features/apiSlice";
import { authApi } from "../features/authApi";
import authReducer from "../features/authSlice";
import { sliderApi } from "../features/sliderApi";
import { productApi } from "../features/productApi";
import { attrSpecSlice } from "@/features/attrSpecSlice";
import { vendorManageApi } from "../features/vendorManageApi"; 
import { customerManageApi } from "../features/customerManageApi";
import { chatApi } from "../features/chatApi"; // ⬅️ NEW: Chat API
import chatReducer from "../features/chatSlice"; // ⬅️ NEW: Chat slice

// --------------------
// Persist configuration
// --------------------
const persistConfig = {
  key: "root",
  storage,
  whitelist: ["auth"], // persist only the auth slice
};

// --------------------
// Combine reducers
// --------------------
const rootReducer = combineReducers({
  auth: authReducer,
  chat: chatReducer, // ⬅️ NEW: Chat reducer
  [apiSlice.reducerPath]: apiSlice.reducer,
  [authApi.reducerPath]: authApi.reducer,
  [sliderApi.reducerPath]: sliderApi.reducer,
  [productApi.reducerPath]: productApi.reducer,
  [attrSpecSlice.reducerPath]: attrSpecSlice.reducer,
  [vendorManageApi.reducerPath]: vendorManageApi.reducer,
  [customerManageApi.reducerPath]: customerManageApi.reducer,
  [chatApi.reducerPath]: chatApi.reducer, // ⬅️ NEW: Chat API reducer
});

// --------------------
// Persisted reducer
// --------------------
const persistedReducer = persistReducer(persistConfig, rootReducer);

// --------------------
// Store configuration
// --------------------
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ["persist/PERSIST", "persist/REHYDRATE"],
      },
    }).concat(
      apiSlice.middleware,
      authApi.middleware,
      sliderApi.middleware,
      productApi.middleware,
      attrSpecSlice.middleware,
      vendorManageApi.middleware,
      customerManageApi.middleware,
      chatApi.middleware // ⬅️ NEW: Chat API middleware
    ),
  devTools: process.env.NODE_ENV !== "production",
});

// --------------------
// Persistor
// --------------------
export const persistor = persistStore(store);

// --------------------
// Types
// --------------------
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;