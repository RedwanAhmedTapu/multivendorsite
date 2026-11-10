// app/robots.ts
import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://finixmart.com';
  
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/admin-dashboard/', '/vendor-dashboard/', '/user-dashboard/', '/cart/', '/checkout/'],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: ['/api/', '/admin-dashboard/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}