// lib/theme-utils.ts
import { resolveHomepageConfig, selectPublishedConfig, type HomepageConfig } from './homepage-config/core';
import { HOMEPAGE_CACHE_TAGS } from './homepage-config/revalidate';
import { selectPublishedProductCardConfig, type ProductCardConfig } from './product-card/config';
import { getDefaultProductCardConfig } from './product-card/defaults';

export type LayoutType = 'layout_1' | 'layout_2' | 'layout_3';

export interface ActiveThemeResponse {
  success: boolean;
  data: {
    id: string;
    name: string;
    layoutType: LayoutType;
    status: 'active' | 'inactive';
    description: string | null;
    createdAt: string;
    updatedAt: string;
  } | null;
  message?: string;
}

// Fetch only layout type with revalidation
export async function getActiveLayoutType(): Promise<LayoutType> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    const response = await fetch(`${apiUrl}/themes/active`, {
      cache: 'force-cache', // SSG caching
      // revalidate every hour; layout switches expire the tag immediately
      // via /api/revalidate-homepage
      next: { revalidate: 3600, tags: [HOMEPAGE_CACHE_TAGS.layout] },
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.warn('Failed to fetch active theme, using default layout_1');
      return 'layout_1';
    }

    const result: ActiveThemeResponse = await response.json();

    if (result.success && result.data && result.data.status === 'active') {
      return result.data.layoutType;
    }

    console.warn('No active theme found, using default layout_1');
    return 'layout_1';
  } catch (error) {
    console.error('Error fetching active theme:', error);
    return 'layout_1';
  }
}

// Fetch full theme data with revalidation
export async function getActiveTheme(): Promise<ActiveThemeResponse['data'] | null> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    const response = await fetch(`${apiUrl}/themes/active`, {
      cache: 'force-cache',
      next: { revalidate: 3600, tags: [HOMEPAGE_CACHE_TAGS.layout] },
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return null;
    }

    const result: ActiveThemeResponse = await response.json();

    if (result.success && result.data) {
      return result.data;
    }

    return null;
  } catch (error) {
    console.error('Error fetching active theme:', error);
    return null;
  }
}

/**
 * Published homepage configuration (GET /themes/homepage-config). Never throws:
 * any network/HTTP/shape problem returns the built-in defaults, which render
 * today's homepage. Publishing expires the tag immediately via
 * /api/revalidate-homepage; the 5-minute revalidate is only a safety net
 * (it also limits how long a backend 'fallback' answer can stay cached).
 */
export async function getPublishedHomepageConfig(): Promise<HomepageConfig> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    const response = await fetch(`${apiUrl}/themes/homepage-config`, {
      cache: 'force-cache',
      next: { revalidate: 300, tags: [HOMEPAGE_CACHE_TAGS.config] },
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) {
      console.warn(`Failed to fetch homepage config (${response.status}), using defaults`);
      return resolveHomepageConfig(null).config;
    }
    const result: unknown = await response.json();
    const data = result && typeof result === 'object' ? (result as { data?: unknown }).data : undefined;
    // Only a published config is used; otherwise our own defaults render.
    const { config, fallbackParts } = selectPublishedConfig(data);
    if (fallbackParts.length) {
      console.warn(`Homepage config: invalid parts replaced by defaults: ${fallbackParts.join(', ')}`);
    }
    return config;
  } catch (error) {
    console.error('Error fetching homepage config, using defaults:', error);
    return resolveHomepageConfig(null).config;
  }
}

/**
 * Published GLOBAL product card design (GET /themes/product-card). Never
 * throws: anything but a valid 'published' answer yields the built-in default
 * card (today's design). Publishing expires the tag via
 * /api/revalidate-homepage (scope "card"); 5 minutes is the safety net.
 */
export async function getPublishedProductCardConfig(): Promise<ProductCardConfig> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    const response = await fetch(`${apiUrl}/themes/product-card`, {
      cache: 'force-cache',
      next: { revalidate: 300, tags: [HOMEPAGE_CACHE_TAGS.card] },
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) {
      console.warn(`Failed to fetch product card config (${response.status}), using defaults`);
      return getDefaultProductCardConfig();
    }
    const result: unknown = await response.json();
    const data = result && typeof result === 'object' ? (result as { data?: unknown }).data : undefined;
    const { config, usedFallback } = selectPublishedProductCardConfig(data, getDefaultProductCardConfig());
    if (usedFallback) console.warn('Published product card config is invalid, using defaults');
    return config;
  } catch (error) {
    console.error('Error fetching product card config, using defaults:', error);
    return getDefaultProductCardConfig();
  }
}
