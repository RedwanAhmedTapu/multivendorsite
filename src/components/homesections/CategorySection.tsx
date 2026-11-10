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
      <div className="w-20 h-20 rounded-full bg-muted animate-pulse" />
      <div className="mt-2 w-16 h-4 bg-muted rounded animate-pulse" />
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
          <div className="h-8 w-48 bg-muted rounded animate-pulse" />
          <div className="h-6 w-16 bg-muted rounded animate-pulse" />
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
        <p className="text-destructive">Failed to load categories.</p>
      </Container>
    );
  }

  if (categories.length === 0) {
    return (
      <Container className="flex flex-col px-1 md:px-0 gap-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xl md:text-2xl font-bold">Shop by Category</h2>
        </div>
        <p className="text-muted-foreground">No categories available.</p>
      </Container>
    );
  }

  return (
    <>
      <Container className="md:bg-primary-tint rounded-sm px-3 py-1 my-0">
        <div className="flex items-center justify-between px-2 py-1.5">
          <h2 className="text-lg md:text-xl font-bold">Categories</h2>
          <Link
            href="/products"
            className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors duration-200 hover:underline underline-offset-4"
          >
            See All
          </Link>
        </div>
      </Container>

      <Container className="md:bg-primary-tint rounded-sm px-3 py-1 my-0">
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
                  href={`/category/${cat.slug || cat.id}`}
                  className="flex flex-col items-center text-center group cursor-pointer min-w-max"
                >
                  <div
                    className={`relative flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-full border-2 ${
                      cat.highlight
                        ? "bg-destructive/10 border-destructive"
                        : "bg-muted border-transparent"
                    } transition-all duration-300 ease-out group-hover:border-primary group-hover:shadow-lg group-hover:shadow-primary/20 group-hover:-translate-y-1 group-hover:bg-card`}
                  >
                    <Image
                      src={cat.image || "/placeholder.png"}
                      alt={cat.name}
                      width={50}
                      height={50}
                      className="w-full h-full rounded-full object-cover transition-transform duration-300 ease-out group-hover:scale-110"
                    />
                    {/* animated ring pulse on hover */}
                    <span
                      className="pointer-events-none absolute inset-0 rounded-full border-2 border-primary opacity-0 scale-100 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300 ease-out"
                    />
                  </div>
                  <p className="mt-2 text-xs md:text-sm line-clamp-2 min-h-[2.5rem] text-foreground transition-colors duration-200 group-hover:text-primary group-hover:font-medium">
                    {cat.name}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </>
  );
}
