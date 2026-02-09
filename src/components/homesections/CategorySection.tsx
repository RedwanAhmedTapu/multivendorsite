"use client";
import { useGetCategoriesQuery } from "@/features/apiSlice";
import Image from "next/image";
import Link from "next/link";
import { Container } from "../Container";

export default function CategorySection() {
  const { data, isLoading, isError } = useGetCategoriesQuery(undefined);
  const categories = data || [];

  // Skeleton Loading Component
  const CategorySkeleton = () => (
    <div className="flex flex-col items-center text-center min-w-max">
      <div className="w-20 h-20 rounded-full bg-gray-200 animate-pulse" />
      <div className="mt-2 w-16 h-4 bg-gray-200 rounded animate-pulse" />
    </div>
  );

  // Skeleton Grid Component
  const SkeletonGrid = () => (
    <div className="flex space-x-6 pb-4 justify-between items-center">
      {[...Array(8)].map((_, index) => (
        <CategorySkeleton key={index} />
      ))}
    </div>
  );

  if (isLoading) {
    return (
      <Container className="flex flex-col px-1 md:px-0 gap-y-2">
        <div className="flex items-center justify-between">
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
          <div className="h-6 w-16 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="relative">
          <div
            className="overflow-x-auto overflow-y-hidden scrollbar-hide"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            <style jsx>{`
              div::-webkit-scrollbar {
                display: none;
              }
            `}</style>
            <SkeletonGrid />
          </div>
        </div>
      </Container>
    );
  }

  if (isError) {
    return (
      <Container className="flex flex-col px-1 md:px-0 gap-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xl md:text-2xl font-bold">Shop by Category</h2>
        </div>
        <p className="text-red-500">Failed to load categories.</p>
      </Container>
    );
  }

  if (categories.length === 0) {
    return (
      <Container className="flex flex-col px-1 md:px-0 gap-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xl md:text-2xl font-bold">Shop by Category</h2>
        </div>
        <p className="text-gray-500">No categories available.</p>
      </Container>
    );
  }

  return (
    <>
      <Container className=" md:bg-teal-50 rounded-sm px-3 py-1 my-0">
        <div className="flex items-center justify-between px-2 py-1.5">
          <h2 className="text-lg md:text-xl font-bold">Categories</h2>
          <Link
            href="/products"
            className="text-sm font-medium text-gray-700 hover:underline"
          >
            See All
          </Link>
        </div>
      </Container>

      <Container className="   md:bg-teal-50 rounded-sm px-3 py-1 my-0">
        <div className="relative">
          <div
            className="overflow-x-auto overflow-y-hidden scrollbar-hide"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            <style jsx>{`
              div::-webkit-scrollbar {
                display: none;
              }
            `}</style>
            <div className="flex space-x-6 py-2 px-1.5 justify-between items-center">
              {categories.map((cat: any) => (
                <Link
                  key={cat.id}
                  href={`/products?category=${cat.slug || cat.id}`}
                  className="flex flex-col items-center text-center group cursor-pointer min-w-max"
                >
                  <div
                    className={`flex items-center justify-center w-20 h-20 rounded-full 
                    ${
                      cat.highlight
                        ? "bg-red-50 border-2 border-red-500"
                        : "bg-gray-100"
                    } 
                    transition-colors group-hover:bg-gray-200`}
                  >
                    <Image
                      src={cat.image || "/placeholder.png"}
                      alt={cat.name}
                      width={50}
                      height={50}
                      className="w-full h-full rounded-full object-cover"
                    />
                  </div>
                  <p className="mt-2 text-sm line-clamp-2 min-h-[2.5rem] text-gray-700">{cat.name}</p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </>
  );
}
