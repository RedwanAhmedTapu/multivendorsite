// lib/api-utils.ts

// Server-side versions of your RTK queries
export async function getCategoriesServer() {
  try {
    // This would be your actual server-side API call
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/categories`, {
      cache: 'force-cache', // SSG behavior
      next: { revalidate: 3600 } // Revalidate every hour
    });
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch categories:', error);
    return { data: [] };
  }
}

export async function getCategoryBySlugServer(slug: string) {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
  
  try {
    const response = await fetch(`${baseUrl}/categories/slug/${slug}`, {
      next: { revalidate: 3600 }, // Cache for 1 hour
    });
    
    if (!response.ok) {
      return null;
    }
    
    return response.json();
  } catch (error) {
    console.error('Error fetching category by slug:', error);
    return null;
  }
}
export async function getProductsServer(params?: {
  categorySlug?: string;
  search?: string;
  minPrice?: string;
  maxPrice?: string;
  ratings?: string;
  availability?: string;
  brands?: string;
  attrs?: string;
}) {
  try {
    const query = new URLSearchParams();
    if (params?.categorySlug) query.set('categorySlug', params.categorySlug);
    if (params?.search) query.set('search', params.search);
    if (params?.minPrice) query.set('minPrice', params.minPrice);
    if (params?.maxPrice) query.set('maxPrice', params.maxPrice);
    if (params?.ratings) query.set('ratings', params.ratings);
    if (params?.availability) query.set('availability', params.availability);
    if (params?.brands) query.set('brands', params.brands);
    if (params?.attrs) query.set('attributes', params.attrs);

    const queryString = query.toString();
    const url = `${process.env.NEXT_PUBLIC_API_URL}/products${queryString ? `?${queryString}` : ''}`;
    console.log('Fetching products from URL:', url);

    const response = await fetch(url, { cache: "no-store" });

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    const json = await response.json();      // ✅ একবারই পড়া হচ্ছে
    console.log('Response:', json);          // ✅ পড়া ভ্যারিয়েবল থেকে log
    return json;                              // ✅ একই ভ্যারিয়েবল রিটার্ন
  } catch (error) {
    console.error('Failed to fetch products:', error);
    return { data: [], pagination: {} };
  }
}



export async function getCategoryFiltersServer(categoryId?: string) {
  if (!categoryId) return { data: null };
  
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/categories/${categoryId}/filters`,
      {
        cache: 'force-cache',
        next: { revalidate: 3600 }
      }
    );
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch category filters:', error);
    return { data: null };
  }

  
}
export async function searchProductsServer(query: string, limit: number = 20) {
  try {
    const url = `${process.env.NEXT_PUBLIC_API_URL}/products/search?q=${encodeURIComponent(query)}&mode=full&limit=${limit}`;
    
    const response = await fetch(url, {
      cache: "no-store",
    });
    
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    return await response.json();
  } catch (error) {
    console.error('Failed to search products:', error);
    return { data: [] };
  }
}
// Generic helper for the simple (non-paginated) public product lists
async function getProductListServer(endpoint: string, limit: number = 12) {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  try {
    const response = await fetch(`${baseUrl}/products/${endpoint}?limit=${limit}`, {
      cache: "no-store", // homepage-এ সবসময় fresh data চাইলে; চাইলে revalidate দিয়ে ISR-ও করতে পারেন
    });

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    return await response.json();
  } catch (error) {
    console.error(`Failed to fetch products/${endpoint}:`, error);
    return { data: [] };
  }
}

export function getFlashSaleProductsServer(limit?: number) {
  return getProductListServer("flash-sale", limit);
}

export function getFeaturedProductsServer(limit?: number) {
  return getProductListServer("featured", limit);
}

export function getNewArrivalsServer(limit?: number) {
  return getProductListServer("new-arrivals", limit);
}

export function getTrendingProductsServer(limit?: number) {
  return getProductListServer("trending", limit);
}

// GET /products/best-selling (ordered by salesCount)
export function getBestSellingProductsServer(limit?: number) {
  return getProductListServer("best-selling", limit);
}

export function getDiscountedProductsServer(limit?: number) {
  return getProductListServer("discounted", limit);
}