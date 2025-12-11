"use client";

import React from "react";
import { useGetActiveTermsQuery } from "../../features/termsApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Hash, FileText, Loader2, Calendar } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Container } from "../Container";

interface TermsShowProps {
  type?: "GENERAL" | "PRIVACY_POLICY" | "VENDOR_AGREEMENT" | "CUSTOMER_TERMS" | "DELIVERY_TERMS" | "RETURN_POLICY";
  title?: string;
  className?: string;
}

// Helper function to validate type
const isValidType = (type: string | undefined): type is TermsShowProps['type'] => {
  const validTypes = [
    "GENERAL",
    "PRIVACY_POLICY", 
    "VENDOR_AGREEMENT",
    "CUSTOMER_TERMS",
    "DELIVERY_TERMS",
    "RETURN_POLICY"
  ];
  return validTypes.includes(type as any);
};

// Format date as "9 Sep, 2025"
const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return "Invalid date";
    }
    const day = date.getDate();
    const month = date.toLocaleString('default', { month: 'short' });
    const year = date.getFullYear();
    return `${day} ${month}, ${year}`;
  } catch (error) {
    console.error("Error formatting date:", error);
    return "Date unavailable";
  }
};

// Get default title based on type
const getDefaultTitle = (type: TermsShowProps['type']): string => {
  switch (type) {
    case "PRIVACY_POLICY":
      return "Privacy Policy";
    case "VENDOR_AGREEMENT":
      return "Vendor Agreement";
    case "CUSTOMER_TERMS":
      return "Customer Terms & Conditions";
    case "DELIVERY_TERMS":
      return "Delivery Terms";
    case "RETURN_POLICY":
      return "Return & Refund Policy";
    case "GENERAL":
    default:
      return "Terms & Conditions";
  }
};

export default function TermsShow({ 
  type: propType = "GENERAL", 
  title: propTitle, 
  className = "" 
}: TermsShowProps) {
  const searchParams = useSearchParams();
  const queryType = searchParams.get('type');
  
  // Determine which type to use: query param > prop > default
  let finalType: TermsShowProps['type'] = propType;
  if (queryType && isValidType(queryType)) {
    finalType = queryType;
  }
  
  const { data: terms, isLoading, error } = useGetActiveTermsQuery({ type: finalType });

  // Use provided title, terms title, or default based on type
  const displayTitle = propTitle || terms?.title || getDefaultTitle(finalType);

  if (isLoading) {
  return (
    <Container className={` ${className}`}>
      <div className="animate-pulse">
        {/* Header skeleton */}
        <div className="p-6 rounded-t-lg bg-gradient-to-r from-gray-50 to-gray-100">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
            <div className="flex-1">
              {/* Title skeleton */}
              <div className="h-10 bg-gray-300 rounded-lg w-3/4 mb-4 animate-pulse"></div>
              
              {/* Badges skeleton */}
              <div className="flex flex-wrap gap-2 items-center">
                <div className="h-6 bg-gray-300 rounded-full w-20 animate-pulse"></div>
                <div className="h-6 bg-gray-300 rounded-full w-32 animate-pulse"></div>
              </div>
            </div>
            
            {/* Date skeleton */}
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 bg-gray-300 rounded-full animate-pulse"></div>
              <div className="h-4 bg-gray-300 rounded w-40 animate-pulse"></div>
            </div>
          </div>
        </div>
        
        {/* Content skeleton */}
        <div className="pt-2 pb-10 px-4 md:px-6 space-y-6">
          {/* Paragraph skeletons */}
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <div className="h-4 bg-gray-200 rounded animate-pulse" style={{ 
                width: i % 4 === 0 ? '90%' : i % 4 === 1 ? '85%' : i % 4 === 2 ? '95%' : '80%' 
              }}></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse" style={{ 
                width: i % 4 === 0 ? '70%' : i % 4 === 1 ? '65%' : i % 4 === 2 ? '75%' : '60%' 
              }}></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse" style={{ 
                width: i % 4 === 0 ? '80%' : i % 4 === 1 ? '75%' : i % 4 === 2 ? '85%' : '70%' 
              }}></div>
            </div>
          ))}
          
          {/* List skeleton */}
          <div className="space-y-2">
            <div className="h-6 bg-gray-300 rounded w-32 animate-pulse mb-4"></div>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2 ml-4">
                <div className="h-2 w-2 bg-gray-300 rounded-full animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-64 animate-pulse"></div>
              </div>
            ))}
          </div>
          
          {/* Document info skeleton */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <div className="h-6 bg-gray-300 rounded w-48 animate-pulse mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="h-4 bg-gray-300 rounded w-32 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-300 rounded w-40 animate-pulse"></div>
                <div className="h-8 bg-gray-200 rounded w-full animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Container>
  );
}

  if (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return (
      <div className={`flex justify-center items-center min-h-[400px] ${className}`}>
        <Card className="w-full max-w-2xl mx-4">
          <CardContent className="pt-8 pb-6 text-center">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Unable to Load Content</h3>
            <p className="text-gray-600 mb-4">
              {errorMessage.includes("Network") 
                ? "Network error. Please check your connection." 
                : "We're having trouble loading the terms and conditions at this time."}
            </p>
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              Try Again
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!terms) {
    return (
      <div className={`flex justify-center items-center min-h-[400px] ${className}`}>
        <Card className="w-full max-w-2xl mx-4">
          <CardContent className="pt-8 pb-6 text-center">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              {getDefaultTitle(finalType)} Not Available
            </h3>
            <p className="text-gray-600">
              There are no {getDefaultTitle(finalType).toLowerCase()} available at this time.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <Container className={` ${className}`}>
      <Card className="shadow-none overflow-hidden  bg-transparent border-none  ots-font">
        <CardHeader className="p-6 rounded-t-lg bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
            <div className="flex-1">
              <CardTitle className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
                {displayTitle}
              </CardTitle>
              <div className="flex flex-wrap gap-2 items-center">
                <Badge variant="secondary" className="px-3 py-1 flex items-center gap-1 bg-blue-100 text-blue-800 border border-blue-200">
                  <Hash className="w-3.5 h-3.5" /> v{terms.version}
                </Badge>
                <Badge variant="outline" className="px-3 py-1 text-gray-600">
                  {finalType.replace(/_/g, ' ').toLowerCase()}
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600 bg-white px-3 py-2 rounded-lg shadow-sm border border-gray-200">
              <Calendar className="w-4 h-4" />
              <span>Last updated: {formatDate(terms.updatedAt)}</span>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-2 pb-10 px-4 md:px-6">
          <div 
            className="prose prose-lg md:prose-xl max-w-none terms-content"
            dangerouslySetInnerHTML={{ __html: terms.content }}
          />
          
          {(terms.metaTitle || terms.metaDesc) && (
            <div className="mt-12 pt-8 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Document Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700 bg-gray-50 p-4 rounded-lg border border-gray-200">
                {terms.metaTitle && (
                  <div>
                    <span className="font-medium text-gray-900 block mb-1">Meta Title:</span>
                    <p className="text-gray-700">{terms.metaTitle}</p>
                  </div>
                )}
                {terms.metaDesc && (
                  <div>
                    <span className="font-medium text-gray-900 block mb-1">Meta Description:</span>
                    <p className="text-gray-700">{terms.metaDesc}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <style jsx global>{`
        .terms-content {
          line-height: 1.8;
          color: #374151;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        }
        
        .terms-content h1 {
          font-size: 2.25em;
          color: #1f2937;
          margin-top: 1.5em;
          margin-bottom: 0.8em;
          font-weight: 700;
          border-bottom: 3px solid #e5e7eb;
          padding-bottom: 0.5em;
        }
        
        .terms-content h2 {
          font-size: 1.875em;
          color: #1f2937;
          margin-top: 1.8em;
          margin-bottom: 0.6em;
          font-weight: 600;
          border-bottom: 2px solid #f3f4f6;
          padding-bottom: 0.4em;
        }
        
        .terms-content h3 {
          font-size: 1.5em;
          color: #374151;
          margin-top: 1.5em;
          margin-bottom: 0.5em;
          font-weight: 600;
        }
        
        .terms-content h4 {
          font-size: 1.25em;
          color: #4b5563;
          margin-top: 1.2em;
          margin-bottom: 0.4em;
          font-weight: 600;
        }
        
        .terms-content p {
          margin-bottom: 1.2em;
          font-size: 1.1em;
          line-height: 1.8;
        }
        
        .terms-content ul,
        .terms-content ol {
          margin-bottom: 1.5em;
          padding-left: 1.8em;
        }
        
        .terms-content li {
          margin-bottom: 0.6em;
          line-height: 1.7;
        }
        
        .terms-content ul li {
          list-style-type: disc;
        }
        
        .terms-content ol li {
          list-style-type: decimal;
        }
        
        .terms-content strong {
          font-weight: 600;
          color: #1f2937;
        }
        
        .terms-content a {
          color: #2563eb;
          text-decoration: underline;
          transition: color 0.2s ease;
        }
        
        .terms-content a:hover {
          color: #1d4ed8;
        }
        
        .terms-content blockquote {
          border-left: 4px solid #3b82f6;
          padding: 1.5em 2em;
          margin: 2em 0;
          background-color: #f8fafc;
          border-radius: 0 8px 8px 0;
          font-style: italic;
          color: #475569;
        }
        
        .terms-content table {
          width: 100%;
          border-collapse: collapse;
          margin: 2em 0;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          border-radius: 8px;
          overflow: hidden;
        }
        
        .terms-content th,
        .terms-content td {
          border: 1px solid #e5e7eb;
          padding: 1em;
          text-align: left;
        }
        
        .terms-content th {
          background-color: #f9fafb;
          font-weight: 600;
          color: #374151;
        }
        
        .terms-content tr:nth-child(even) {
          background-color: #fafafa;
        }
        
        .terms-content tr:hover {
          background-color: #f3f4f6;
        }
        
        .terms-content code {
          background-color: #f3f4f6;
          padding: 0.2em 0.4em;
          border-radius: 4px;
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
          font-size: 0.9em;
        }
        
        .terms-content pre {
          background-color: #1f2937;
          color: #f9fafb;
          padding: 1.5em;
          border-radius: 8px;
          overflow-x: auto;
          margin: 1.5em 0;
        }
        
        .terms-content pre code {
          background-color: transparent;
          padding: 0;
          color: inherit;
        }
        
        /* Responsive adjustments */
        @media (max-width: 768px) {
          .terms-content {
            font-size: 16px;
            line-height: 1.7;
          }
          
          .terms-content h1 {
            font-size: 1.8em;
          }
          
          .terms-content h2 {
            font-size: 1.5em;
          }
          
          .terms-content h3 {
            font-size: 1.3em;
          }
          
          .terms-content table {
            font-size: 14px;
          }
          
          .terms-content th,
          .terms-content td {
            padding: 0.75em;
          }
        }
        
        @media (max-width: 640px) {
          .terms-content table {
            display: block;
            overflow-x: auto;
          }
        }
      `}</style>
    </Container>
  );
}