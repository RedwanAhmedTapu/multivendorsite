// app/product/page.tsx
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { FilterSidebar } from "@/components/product/filter/FilterSidebar";
import { ProductHeader } from "@/components/product/header/ProductHeader";
import { ProductCard } from "@/components/product/productcard/ProductCard";
import ProductCategories from "@/components/product/productcategory/ProductCategories";
import CategoryBreadcrumb from "@/components/product/productcategory/CategoryBreadCumb";

// Types
interface Product {
  id: number;
  title: string;
  image: string;
  images: string[];
  colors: string;
  rating: number;
  reviews: number;
  price: number;
  oldPrice?: number;
  tags: string[];
}

interface Category {
  name: string;
  image?: string;
  highlight?: boolean;
  count?: number;
  children?: Category[];
}

// Available product images
const productImages = [
  "/products/1-9.webp",
  "/products/1-80.webp",
  "/products/1-103.webp",
  "/products/1-132.webp",
  "/products/1-143.webp",
  "/products/2-75.webp",
  "/products/3.webp",
];

const categories: Category[] = [
  {
    name: "Electronics",
    image: "/homesection/category/menu-cats-electronics.jpg",
    count: 28,
    children: [
      {
        name: "Audio",
        count: 8,
        children: [
          { name: "Headphones", count: 4 },
          { name: "Speakers", count: 4 },
        ],
      },
      {
        name: "Wearables",
        count: 6,
        children: [
          { name: "Smart Watches", count: 4 },
          { name: "Fitness Trackers", count: 2 },
        ],
      },
      {
        name: "Computers",
        count: 7,
        children: [
          { name: "Laptops", count: 3 },
          { name: "Desktops", count: 2 },
          { name: "Monitors", count: 2 },
        ],
      },
      {
        name: "Phones",
        count: 7,
        children: [
          { name: "Smartphones", count: 5 },
          { name: "Feature Phones", count: 2 },
        ],
      },
    ],
  },
  {
    name: "Home & Garden",
    image: "/homesection/category/menu-cats-home-garden.jpg",
    count: 20,
    children: [
      {
        name: "Living Room",
        count: 8,
        children: [
          { name: "Sofas", count: 3 },
          { name: "Coffee Tables", count: 2 },
          { name: "TV Stands", count: 3 },
        ],
      },
      {
        name: "Bedroom",
        count: 7,
        children: [
          { name: "Beds", count: 3 },
          { name: "Wardrobes", count: 2 },
          { name: "Nightstands", count: 2 },
        ],
      },
      {
        name: "Kitchen",
        count: 5,
        children: [
          { name: "Cookware", count: 2 },
          { name: "Dining Tables", count: 3 },
        ],
      },
    ],
  },
  {
    name: "Fashion",
    image: "/homesection/category/menu-cats-fashion.jpg",
    count: 45,
    children: [
      {
        name: "Men",
        count: 20,
        children: [
          { name: "Accessories", count: 5 },
          { name: "Coats", count: 2 },
          { name: "Jackets", count: 3 },
          { name: "Jeans", count: 4 },
          { name: "Pants", count: 3 },
          { name: "Shirts", count: 3 },
        ],
      },
      {
        name: "Women",
        count: 25,
        children: [
          { name: "Dresses", count: 6 },
          { name: "Tops", count: 5 },
          { name: "Skirts", count: 4 },
          { name: "Pants", count: 5 },
          { name: "Shoes", count: 5 },
        ],
      },
    ],
  },
  {
    name: "Jewelry",
    image: "/homesection/category/menu-cats-jewelry.jpg",
  },
  {
    name: "Beauty & Heathy",
    image: "/homesection/category/homev3-beauty.webp",
    count: 18,
    children: [
      {
        name: "Makeup",
        count: 8,
        children: [
          { name: "Lipsticks", count: 3 },
          { name: "Foundations", count: 3 },
          { name: "Mascaras", count: 2 },
        ],
      },
      {
        name: "Skincare",
        count: 6,
        children: [
          { name: "Moisturizers", count: 2 },
          { name: "Cleansers", count: 2 },
          { name: "Serums", count: 2 },
        ],
      },
      {
        name: "Haircare",
        count: 4,
        children: [
          { name: "Shampoos", count: 2 },
          { name: "Conditioners", count: 2 },
        ],
      },
    ],
  },
  {
    name: "Toys & Games",
    image: "/homesection/category/homev3-toys.webp",
  },
  {
    name: "Mother & Kids",
    image: "/homesection/category/homev3-motherkids.webp",
  },
  {
    name: "Sports",
    image: "/homesection/category/menu-cats-sports.jpg",
    count: 22,
    children: [
      {
        name: "Fitness",
        count: 10,
        children: [
          { name: "Treadmills", count: 2 },
          { name: "Dumbbells", count: 3 },
          { name: "Yoga Mats", count: 2 },
          { name: "Resistance Bands", count: 3 },
        ],
      },
      {
        name: "Outdoor",
        count: 12,
        children: [
          { name: "Camping Gear", count: 4 },
          { name: "Tents", count: 3 },
          { name: "Sleeping Bags", count: 2 },
          { name: "Backpacks", count: 3 },
        ],
      },
    ],
  },
  {
    name: "Books",
    count: 12,
    children: [
      {
        name: "Fiction",
        count: 6,
        children: [
          { name: "Novels", count: 3 },
          { name: "Short Stories", count: 3 },
        ],
      },
      {
        name: "Non-Fiction",
        count: 6,
        children: [
          { name: "Biographies", count: 2 },
          { name: "Self-Help", count: 2 },
          { name: "Science", count: 2 },
        ],
      },
    ],
  },

  // ⭐ Added 7 More Categories
  { name: "Automotive", image: "/homesection/category/menu-cats-automotive.jpg" },
  { name: "Health & Wellness", image: "/homesection/category/menu-cats-health.jpg" },
  { name: "Music & Instruments", image: "/homesection/category/menu-cats-music.jpg" },
  { name: "Office Supplies", image: "/homesection/category/menu-cats-office.jpg" },
  { name: "Pet Supplies", image: "/homesection/category/menu-cats-pets.jpg" },
  { name: "Food & Beverages", image: "/homesection/category/menu-cats-food.jpg" },
  { name: "Travel & Luggage", image: "/homesection/category/menu-cats-travel.jpg" },
];


// Dummy data generator
const createDummyProducts = (startId: number, count: number): Product[] => {
  const templates = [
    { title: "Classic Denim Jacket", colors: "Blue", price: 79.99, oldPrice: 99.99, tags: ["Sale"] },
    { title: "Running Sneakers", colors: "White / Red", price: 59.99, oldPrice: 79.99, tags: ["New"] },
    { title: "Smart Watch", colors: "Black", price: 129.99, oldPrice: 159.99, tags: ["Sale"] },
    { title: "Leather Handbag", colors: "Brown", price: 99.99, oldPrice: 139.99, tags: ["New"] },
    { title: "Wireless Headphones", colors: "Black", price: 89.99, oldPrice: 119.99, tags: ["Sale", "Popular"] },
    { title: "Cotton T-Shirt", colors: "White", price: 24.99, tags: ["Basic"] },
    { title: "Sports Shorts", colors: "Blue / Gray", price: 34.99, tags: ["New", "Sport"] },
    { title: "Winter Beanie", colors: "Gray", price: 19.99, oldPrice: 29.99, tags: ["Sale", "Winter"] },
  ];

  return Array.from({ length: count }, (_, i) => {
    const template = templates[i % templates.length];
    const id = startId + i;
    return {
      id,
      ...template,
      title: `${template.title} #${id}`,
      image: productImages[id % productImages.length],
      images: [productImages[id % productImages.length]],
      rating: Math.floor(Math.random() * 2) + 3.5,
      reviews: Math.floor(Math.random() * 200) + 20,
    };
  });
};

// Loader Component
const BoxLoader = () => (
  <div className="flex flex-col items-center justify-center py-10">
    <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" className="animate-bounce">
      <path
        d="M12 2L2 7l10 5 10-5-10-5zm0 7.2L4.24 7 12 3.8 19.76 7 12 9.2zM2 17l10 5 10-5v-6l-10 5-10-5v6z"
        fill="#4B5563"
      >
        <animateTransform attributeType="XML" attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="2s" repeatCount="indefinite" />
      </path>
    </svg>
    <p className="mt-2 text-gray-600">Loading products...</p>
  </div>
);

const ProductPage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  const PRODUCTS_PER_PAGE = 12;
  const observer = useRef<IntersectionObserver | null>(null);
  const lastProductRef = useRef<HTMLDivElement | null>(null);

  const loadMoreProducts = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1200));

    const startId = (page - 1) * PRODUCTS_PER_PAGE + 1;
    const newProducts = createDummyProducts(startId, PRODUCTS_PER_PAGE);

    setProducts((prev) => [...prev, ...newProducts]);
    setPage((prev) => prev + 1);

    if (products.length + newProducts.length >= 100) {
      setHasMore(false);
    }

    setLoading(false);
  }, [loading, hasMore, page, products.length]);

  useEffect(() => {
    loadMoreProducts();
  }, []);

  useEffect(() => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore) {
          loadMoreProducts();
        }
      },
      { threshold: 1.0 }
    );

    if (lastProductRef.current) {
      observer.current.observe(lastProductRef.current);
    }
  }, [loading, hasMore, loadMoreProducts]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <ProductCategories categories={categories} onSelectCategory={(cat) => console.log("Selected:", cat)} />

          <CategoryBreadcrumb category={categories[0]}/>
          <ProductHeader totalResults={products.length} viewMode={viewMode} setViewMode={setViewMode} onFilterClick={() => setIsMobileFilterOpen(true)} />
        </div>

        <div className="flex gap-6">
          {/* Sidebar */}
          <FilterSidebar isMobileOpen={isMobileFilterOpen} onMobileClose={() => setIsMobileFilterOpen(false)} />

          {/* Products */}
          <div className="flex-1">
            <div className={viewMode === "grid" ? "grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "space-y-6"}>
              {products.map((product, idx) => {
                const isLast = idx === products.length - 1;
                return (
                  <div key={product.id} ref={isLast ? lastProductRef : null}>
                    <ProductCard product={product} view={viewMode} />
                  </div>
                );
              })}
            </div>

            {loading && <BoxLoader />}
            {!hasMore && products.length > 0 && (
              <div className="text-center py-8 text-gray-600">
                <p>You've reached the end of our catalog!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductPage;
