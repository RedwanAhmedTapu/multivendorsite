// app/sitemap.ts
import { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://finixmart.com';
  
  // Fetch categories for sitemap
  let categories: any[] = [];
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/categories`, {
      next: { revalidate: 86400 }, // Daily
    });
    const data = await response.json();
    categories = data.data || [];
  } catch {
    // Fallback to empty
  }

  // Flatten categories
  const flattenCategories = (cats: any[]): any[] => {
    const result: any[] = [];
    cats.forEach((cat) => {
      result.push(cat);
      if (cat.children?.length) {
        result.push(...flattenCategories(cat.children));
      }
    });
    return result;
  };

  const flatCategories = flattenCategories(categories);

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/products`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
  ];

  // Category pages
  const categoryPages: MetadataRoute.Sitemap = flatCategories.map((category) => ({
    url: `${baseUrl}/products?category=${category.slug}`,
    lastModified: new Date(category.updatedAt || Date.now()),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  // Note: Product pages should be generated dynamically or via a separate sitemap
  // for large catalogs, consider using sitemap index files

  return [...staticPages, ...categoryPages];
}