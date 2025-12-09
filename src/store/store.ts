// src/app/store.ts
import { configureStore, combineReducers } from "@reduxjs/toolkit";
import { persistReducer, persistStore } from "redux-persist";
import storage from "redux-persist/lib/storage";

// Import all your APIs
import { apiSlice } from "../features/apiSlice";
import { authApi } from "../features/authApi";
import authReducer from "../features/authSlice";
import { sliderApi } from "../features/sliderApi";
import { productApi } from "../features/productApi";
import { attributeSlice } from "@/features/attrSpecSlice";
import { vendorManageApi } from "../features/vendorManageApi";
import { customerManageApi } from "../features/customerManageApi";
import { chatApi } from "../features/chatApi";
import chatReducer from "../features/chatSlice";
import { termsApi } from "../features/termsApi"; 
import { shippingProviderApi } from "../features/shippingProviderApi";
import { offerApi } from "../features/offerApi"; 
import { employeeApi } from "@/features/employeeApi";
import { storeEditorApi } from "@/features/storeEditorApi";
import { faqApi } from "@/features/faqApi";
import { themeApi } from "@/features/themeApi";

// --------------------
// All API imports in one array for easier management
// --------------------
const apiMiddlewares = [
  apiSlice.middleware,
  authApi.middleware,
  sliderApi.middleware,
  productApi.middleware,
  attributeSlice.middleware,
  vendorManageApi.middleware,
  customerManageApi.middleware,
  chatApi.middleware,
  termsApi.middleware,
  shippingProviderApi.middleware,
  offerApi.middleware, 
  employeeApi.middleware,
  storeEditorApi.middleware,
  faqApi.middleware,
  themeApi.middleware,
];

const apiReducers = {
  auth: authReducer,
  chat: chatReducer,
  [apiSlice.reducerPath]: apiSlice.reducer,
  [authApi.reducerPath]: authApi.reducer,
  [sliderApi.reducerPath]: sliderApi.reducer,
  [productApi.reducerPath]: productApi.reducer,
  [attributeSlice.reducerPath]: attributeSlice.reducer,
  [vendorManageApi.reducerPath]: vendorManageApi.reducer,
  [customerManageApi.reducerPath]: customerManageApi.reducer,
  [chatApi.reducerPath]: chatApi.reducer,
  [termsApi.reducerPath]: termsApi.reducer,
  [shippingProviderApi.reducerPath]: shippingProviderApi.reducer,
  [offerApi.reducerPath]: offerApi.reducer, 
  [employeeApi.reducerPath]: employeeApi.reducer,
  [storeEditorApi.reducerPath]: storeEditorApi.reducer,
  [faqApi.reducerPath]: faqApi.reducer,
  [themeApi.reducerPath]: themeApi.reducer,
};

// --------------------
// Persist configuration
// --------------------
const persistConfig = {
  key: "root",
  storage,
  whitelist: ["auth"],
};

// --------------------
// Combine reducers
// --------------------
const rootReducer = combineReducers(apiReducers);
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
    }).concat(...apiMiddlewares),
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