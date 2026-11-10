"use client";

import type { CSSProperties } from "react";
import Link from "next/link";
import { Container } from "../Container";
import { SharedProductCard } from "../product/card/SharedProductCard";
import { isCurrentGridColumns } from "@/lib/homepage-config/grid";
import gridStyles from "./homepage-grid.module.css";

import type { Product as ProductType } from "@/types/product";

interface SectionProps {
  title: string;
  products: ProductType[];
  /** Optional line under the title (configurable; none by default). */
  subtitle?: string | null;
  /** "See All" link (shown by default). */
  showSeeAll?: boolean;
  /** Columns per breakpoint; default = today's 2 / 5 / 6. */
  columns?: { mobile: number; tablet: number; desktop: number };
}

export default function ProductSection({ title, products, subtitle, showSeeAll = true, columns }: SectionProps) {
  // data না থাকলে পুরো section (title সহ) render হবে না
  if (!products || products.length === 0) return null;

  // Default columns keep the original Tailwind classes, so the default homepage
  // renders exactly as before. Custom columns go through CSS variables (never
  // through generated class names).
  const customColumns = columns && !isCurrentGridColumns(columns) ? columns : null;
  const gridClassName = customColumns ? gridStyles.grid : "grid grid-cols-2 md:grid-cols-5 lg:grid-cols-6 gap-1";
  const gridStyle = customColumns
    ? ({
        "--fm-cols-m": customColumns.mobile,
        "--fm-cols-t": customColumns.tablet,
        "--fm-cols-d": customColumns.desktop,
      } as CSSProperties)
    : undefined;

  return (
    <Container className="py-4">
      <div className="flex justify-between items-center mb-6">
        {subtitle ? (
          <div>
            <h2 className="text-xs sm:text-sm md:text-lg lg:text-xl font-bold text-foreground">{title}</h2>
            <p className="text-xs md:text-sm text-muted-foreground mt-0.5">{subtitle}</p>
          </div>
        ) : (
          <h2 className="text-xs sm:text-sm md:text-lg lg:text-xl font-bold text-foreground">
            {title}
          </h2>
        )}
        {showSeeAll && (
          <Link
            href="/products"
            className="text-primary hover:text-primary-dark text-sm font-medium transition-colors"
          >
            See All
          </Link>
        )}
      </div>
      <div className={gridClassName} style={gridStyle}>
        {products.map((product) => (
          <SharedProductCard key={product.id} product={product} />
        ))}
      </div>
    </Container>
  );
}
