// lib/theme-utils.ts
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
      next: { revalidate: 3600 }, // revalidate every hour
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
      next: { revalidate: 3600 },
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
