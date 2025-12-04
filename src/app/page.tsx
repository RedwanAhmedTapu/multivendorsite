// app/page.tsx
import { Suspense } from 'react';
import LayoutProvider from "@/components/layout/LayoutProvider";
import { getCategoriesServer } from "@/lib/api-utils";
import { getActiveLayoutType, getActiveTheme } from "@/lib/theme-utils";



export default async function Home() {
  // Fetch data in parallel
  const [layoutType, categoriesData] = await Promise.all([
    getActiveLayoutType(),
    getCategoriesServer()
  ]);
  
  const categories = categoriesData || [];
  
  return (
    <Suspense >
      <main className="min-h-screen">
        <LayoutProvider layoutType={layoutType} categories={categories} />
      </main>
    </Suspense>
  );
}

// Generate metadata dynamically
export async function generateMetadata() {
  const activeTheme = await getActiveTheme();
  
  return {
    title: activeTheme?.name 
      ? `${activeTheme.name} | Your Store` 
      : 'FinixMart - Multi-Vendor Marketplace',
    description: activeTheme?.description || 'Discover amazing products from multiple vendors',
  };
}