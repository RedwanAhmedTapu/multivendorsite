// productapi/index.ts
// Single import point for the whole product API. Register `productApiBase`
// (not the individual slices) in your store — injectEndpoints() mutates
// the same base instance, so importing any of the three files below is
// enough to make its endpoints available on productApiBase too.

export { productApiBase } from "./productApiBase";

export * from "./commonProductApi"; // public / logged-in-user (storefront)
export * from "./vendorProductApi"; // vendor dashboard
export * from "./adminProductApi"; // admin dashboard

export * from "./types";

// ---------------------------------------------------------------------
// store.ts wiring example:
//
//   import { configureStore } from "@reduxjs/toolkit";
//   import { productApiBase } from "./productapi";
//   // side-effect imports so injectEndpoints() runs before first use:
//   import "./productapi/commonProductApi";
//   import "./productapi/vendorProductApi";
//   import "./productapi/adminProductApi";
//
//   export const store = configureStore({
//     reducer: { [productApiBase.reducerPath]: productApiBase.reducer, ... },
//     middleware: (gDM) => gDM().concat(productApiBase.middleware),
//   });
//
// In practice, importing from "./productapi" (this file) already pulls in
// all three, so a single `import { useGetProductsQuery } from "./productapi"`
// anywhere in the app is sufficient — no separate side-effect imports needed.
// ---------------------------------------------------------------------
