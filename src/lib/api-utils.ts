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

export async function getProductsServer() {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products`, {
      cache: "no-store",
    });
    return await response.json();
  } catch (error) {
    console.error("Failed to fetch products:", error);
    return { data: [] };
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