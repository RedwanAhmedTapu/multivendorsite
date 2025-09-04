// src/app/store.ts
import { configureStore, combineReducers } from "@reduxjs/toolkit";
import { persistReducer, persistStore } from "redux-persist";
import storage from "redux-persist/lib/storage";
import { apiSlice } from "../features/apiSlice";
import { authApi } from "../features/authApi";
import { sliderApi } from "../features/sliderApi"; // ⬅️ add this

// Persist configuration
const persistConfig = {
  key: "root",
  storage,
  whitelist: [authApi.reducerPath], // persist authApi slice
};

// Combine reducers
const rootReducer = combineReducers({
  [apiSlice.reducerPath]: apiSlice.reducer,
  [authApi.reducerPath]: authApi.reducer,
  [sliderApi.reducerPath]: sliderApi.reducer, 
});

// Persisted reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// Store configuration
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
      sliderApi.middleware 
    ),
  devTools: process.env.NODE_ENV !== "production",
});

export const persistor = persistStore(store);

// Types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
