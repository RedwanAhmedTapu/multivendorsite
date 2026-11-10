// src/app/store.ts
import { configureStore, combineReducers } from "@reduxjs/toolkit";
import { persistReducer, persistStore } from "redux-persist";
import storage from "redux-persist/lib/storage";
import { useDispatch, useSelector } from "react-redux";

// Import all your APIs
import { apiSlice } from "../features/apiSlice";
import { authApi } from "../features/authApi";
import customerProfileApi from "@/features/customerProfileApi";
import authReducer from "../features/authSlice";
import { sliderApi } from "../features/sliderApi";
import { productApiBase } from "@/features/productapi/productApiBase";
import { attributeSlice } from "@/features/attrSpecSlice";
import { vendorManageApi } from "../features/vendorManageApi";
import { customerManageApi } from "../features/customerManageApi";
import { chatApi } from "../features/chatApi";
import chatReducer from "../features/chatSlice";
import { termsApi } from "../features/termsApi";
import { shippingProviderApi } from "../features/shippingProviderApi";
import { offerApi } from "../features/offerApi";
import { userOrderApi } from "@/features/userorderApi";
import { adminOrderApi } from "@/features/adminOrderApi";
import { adminFraudProviderApi } from "@/features/adminFraudProviderApi";

import { vendorOrderApi } from "@/features/vendorOrderApi";
import { employeeApi } from "@/features/employeeApi";
import { storeDecorationApi } from "@/features/storeEditorApi";
import { faqApi } from "@/features/faqApi";
import { themeApi } from "@/features/themeApi";
import { themePaletteApi } from "@/features/themePaletteApi";
import { productCardConfigApi } from "@/features/productCardConfigApi";
import { locationApi } from "@/features/locationApi";
import { courierApi } from "@/features/courierApi";
import { cartWishApi } from "@/features/cartWishApi";
import { warehouseApi } from "@/features/warehouseApi";
import { accountingApi } from "@/features/accountingApi";
import userAddressApi from "@/features/userAddressApi";
import { footerSettingsApi } from "@/features/footerSettingsApi";
import { supplierApi } from "@/features/supplierApi";
import { purchaseOrderApi } from "@/features/purchaseOrderApi";
import { stockApi } from "@/features/stockApi";
import { orderChargeApi } from "@/features/orderChargeapi";
import { brandApi } from "@/features/brandApi";
import {paymentApi} from "@/features/paymentApi";
import { adminPaymentProviderApi } from "@/features/adminPaymentProviderApi";
import{blogApi} from "@/features/blogApi";
import {bankApi} from "@/features/bankApi";
import {hrmApi} from "@/features/hrmApi";
import {campaignPageApi } from "@/features/campaignPageApi";
import { marketingAdminApi } from "@/features/marketingAdminApi";
import { posApi } from "../features/posApi";
import { productrequiredfieldsettingsAdminApi } from "@/features/productrequiredfieldsettingsAdmin";

// --------------------
// All API imports in one array for easier management
// --------------------
const apiMiddlewares = [
  apiSlice.middleware,
  authApi.middleware,
  customerProfileApi.middleware,
  sliderApi.middleware,
  productApiBase.middleware,
  attributeSlice.middleware,
  vendorManageApi.middleware,
  customerManageApi.middleware,
  chatApi.middleware,
  termsApi.middleware,
  shippingProviderApi.middleware,
  offerApi.middleware,
  userOrderApi.middleware,
  adminOrderApi.middleware,
  adminFraudProviderApi.middleware,
  vendorOrderApi.middleware,
  employeeApi.middleware,
  locationApi.middleware,
  storeDecorationApi.middleware,
  faqApi.middleware,
  themeApi.middleware,
  themePaletteApi.middleware,
  productCardConfigApi.middleware,
  courierApi.middleware,
  cartWishApi.middleware,
  warehouseApi.middleware,
  accountingApi.middleware,
  userAddressApi.middleware,
  footerSettingsApi.middleware,
  supplierApi.middleware,
  purchaseOrderApi.middleware,
  stockApi.middleware,
  orderChargeApi.middleware,
  brandApi.middleware,
  paymentApi.middleware,
  adminPaymentProviderApi.middleware,
  blogApi.middleware,
  bankApi.middleware,
  hrmApi.middleware,
  campaignPageApi .middleware,
  marketingAdminApi.middleware,
  posApi.middleware,
  productrequiredfieldsettingsAdminApi.middleware,
];

const apiReducers = {
  auth: authReducer,
  chat: chatReducer,
  [apiSlice.reducerPath]: apiSlice.reducer,
  [authApi.reducerPath]: authApi.reducer,
  [customerProfileApi.reducerPath]: customerProfileApi.reducer,
  [sliderApi.reducerPath]: sliderApi.reducer,
  [productApiBase.reducerPath]: productApiBase.reducer,
  [attributeSlice.reducerPath]: attributeSlice.reducer,
  [vendorManageApi.reducerPath]: vendorManageApi.reducer,
  [customerManageApi.reducerPath]: customerManageApi.reducer,
  [chatApi.reducerPath]: chatApi.reducer,
  [termsApi.reducerPath]: termsApi.reducer,
  [shippingProviderApi.reducerPath]: shippingProviderApi.reducer,
  [offerApi.reducerPath]: offerApi.reducer,
  [userOrderApi.reducerPath]: userOrderApi.reducer,
  [adminOrderApi.reducerPath]: adminOrderApi.reducer,
  [adminFraudProviderApi.reducerPath]:adminFraudProviderApi.reducer,
  [vendorOrderApi.reducerPath]: vendorOrderApi.reducer,
  [employeeApi.reducerPath]: employeeApi.reducer,
  [storeDecorationApi.reducerPath]: storeDecorationApi.reducer,
  [locationApi.reducerPath]: locationApi.reducer,
  [faqApi.reducerPath]: faqApi.reducer,
  [themeApi.reducerPath]: themeApi.reducer,
  [themePaletteApi.reducerPath]: themePaletteApi.reducer,
  [productCardConfigApi.reducerPath]: productCardConfigApi.reducer,
  [courierApi.reducerPath]: courierApi.reducer,
  [cartWishApi.reducerPath]: cartWishApi.reducer,
  [warehouseApi.reducerPath]: warehouseApi.reducer,
  [accountingApi.reducerPath]: accountingApi.reducer,
  [userAddressApi.reducerPath]: userAddressApi.reducer,
  [footerSettingsApi.reducerPath]: footerSettingsApi.reducer,
  [supplierApi.reducerPath]: supplierApi.reducer,
  [purchaseOrderApi.reducerPath]: purchaseOrderApi.reducer,
  [stockApi.reducerPath]: stockApi.reducer,
  [orderChargeApi.reducerPath]: orderChargeApi.reducer,
  [brandApi.reducerPath]: brandApi.reducer,
  [paymentApi.reducerPath]: paymentApi.reducer,
  [adminPaymentProviderApi.reducerPath]:adminPaymentProviderApi.reducer,
  [productrequiredfieldsettingsAdminApi.reducerPath]:
    productrequiredfieldsettingsAdminApi.reducer,
  [blogApi.reducerPath]: blogApi.reducer,
  [bankApi.reducerPath]: bankApi.reducer,
  [hrmApi.reducerPath]:hrmApi.reducer,
  [campaignPageApi .reducerPath]:campaignPageApi .reducer,
  [marketingAdminApi.reducerPath]: marketingAdminApi.reducer,
  // POS terminal API. posSubscriptionAdminApi = posApi.injectEndpoints(...), so
  // this single registration covers both; without it the store throws
  // "Middleware for RTK-Query API at reducerPath posApi has not been added".
  [posApi.reducerPath]: posApi.reducer,
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

// src/app/store.ts

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          "persist/PERSIST",
          "persist/REHYDRATE",
          // productApiBase
          `${productApiBase.reducerPath}/executeQuery/fulfilled`,
          `${productApiBase.reducerPath}/executeQuery/pending`,
          `${productApiBase.reducerPath}/executeMutation/pending`,
          `${productApiBase.reducerPath}/executeMutation/fulfilled`,
          `${productApiBase.reducerPath}/executeMutation/rejected`,
          // apiSlice
          `${apiSlice.reducerPath}/executeQuery/fulfilled`,
          `${apiSlice.reducerPath}/executeQuery/pending`,
          `${apiSlice.reducerPath}/executeMutation/pending`,
          `${apiSlice.reducerPath}/executeMutation/fulfilled`,
          `${apiSlice.reducerPath}/executeMutation/rejected`,
          // bankApi — downloadBankTemplate stores a Blob, bulkImportBanks sends FormData
          `${bankApi.reducerPath}/executeQuery/fulfilled`,
          `${bankApi.reducerPath}/executeQuery/pending`,
          `${bankApi.reducerPath}/executeMutation/pending`,
          `${bankApi.reducerPath}/executeMutation/fulfilled`,
          `${bankApi.reducerPath}/executeMutation/rejected`,
        ],
        ignoredActionPaths: [
          "meta.baseQueryMeta",
          "payload",
          "meta.arg.originalArgs",
        ],
        ignoredPaths: [
          // productApiBase
          `${productApiBase.reducerPath}.queries`,
          `${productApiBase.reducerPath}.mutations`,
          // apiSlice
          `${apiSlice.reducerPath}.queries`,
          `${apiSlice.reducerPath}.mutations`,
          // bankApi — catches the Blob from downloadBankTemplate and
          // FormData from bulkImportBanks
          `${bankApi.reducerPath}.queries`,
          `${bankApi.reducerPath}.mutations`,
        ],
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
// --------------------
// Typed Hooks
// --------------------

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: <T>(selector: (state: RootState) => T) => T =
  useSelector;
