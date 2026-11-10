"use client";

// components/product/card/ProductCardConfigProvider.tsx
//
// Carries the published GLOBAL product card configuration to every shared
// card below it. Without a provider, cards use the built-in defaults (today's
// design), so a page that hasn't been wired yet still renders correctly.
import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { ProductCardConfig } from "@/lib/product-card/config";
import { getDefaultProductCardConfig } from "@/lib/product-card/defaults";
import { cardColorOverrides, cardStyleVars } from "@/lib/product-card/style";

export interface ProductCardDesign {
  config: ProductCardConfig;
  vars: Record<string, string>;
  colors: ReturnType<typeof cardColorOverrides>;
}

function buildDesign(config: ProductCardConfig): ProductCardDesign {
  return { config, vars: cardStyleVars(config), colors: cardColorOverrides(config) };
}

const DEFAULT_DESIGN = buildDesign(getDefaultProductCardConfig());
const ProductCardDesignContext = createContext<ProductCardDesign>(DEFAULT_DESIGN);

export function ProductCardConfigProvider({ config, children }: { config: ProductCardConfig; children: ReactNode }) {
  const design = useMemo(() => buildDesign(config), [config]);
  return <ProductCardDesignContext.Provider value={design}>{children}</ProductCardDesignContext.Provider>;
}

export function useProductCardDesign(): ProductCardDesign {
  return useContext(ProductCardDesignContext);
}
