// components/seo/SeoPagination.tsx
"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

interface SeoPaginationProps {
  currentPage: number;
  totalPages: number;
  baseUrl: string;
}

export const SeoPagination: React.FC<SeoPaginationProps> = ({
  currentPage,
  totalPages,
  baseUrl,
}) => {
  const searchParams = useSearchParams();
  
  if (totalPages <= 1) return null;

  const buildUrl = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (page > 1) {
      params.set("page", page.toString());
    } else {
      params.delete("page");
    }
    const queryString = params.toString();
    return queryString ? `${baseUrl}?${queryString}` : baseUrl;
  };

  // Generate page numbers to show
  const getPageNumbers = () => {
    const pages: (number | '...')[] = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      
      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);
      
      if (currentPage <= 3) {
        end = 4;
      } else if (currentPage >= totalPages - 2) {
        start = totalPages - 3;
      }
      
      if (start > 2) pages.push('...');
      for (let i = start; i <= end; i++) pages.push(i);
      if (end < totalPages - 1) pages.push('...');
      
      pages.push(totalPages);
    }
    
    return pages;
  };

  return (
    <>
      {/* SEO-friendly link elements for crawlers */}
      <nav aria-label="Product pagination" className="mt-8">
        <ul className="flex items-center justify-center gap-2">
          {currentPage > 1 && (
            <li>
              <Link
                href={buildUrl(currentPage - 1)}
                className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
                aria-label="Previous page"
              >
                ← Previous
              </Link>
            </li>
          )}

          {getPageNumbers().map((page, index) => (
            <li key={index}>
              {page === '...' ? (
                <span className="px-3 py-2 text-gray-400">...</span>
              ) : (
                <Link
                  href={buildUrl(page)}
                  className={`px-4 py-2 rounded-lg border transition-colors ${
                    page === currentPage
                      ? "bg-teal-600 text-white border-teal-600"
                      : "border-gray-300 hover:bg-gray-50"
                  }`}
                  aria-current={page === currentPage ? "page" : undefined}
                >
                  {page}
                </Link>
              )}
            </li>
          ))}

          {currentPage < totalPages && (
            <li>
              <Link
                href={buildUrl(currentPage + 1)}
                className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
                aria-label="Next page"
              >
                Next →
              </Link>
            </li>
          )}
        </ul>
      </nav>

      {/* Hidden links for search engine discovery of all pages */}
      <div className="sr-only" aria-hidden="true">
        {currentPage > 1 && (
          <Link href={buildUrl(1)}>First page</Link>
        )}
        {currentPage < totalPages && (
          <Link href={buildUrl(totalPages)}>Last page</Link>
        )}
      </div>
    </>
  );
};