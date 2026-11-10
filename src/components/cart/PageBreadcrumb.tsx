// components/cart/PageBreadcrumb.tsx
//
// Compact page header for /cart and /checkout: "🏠 › Cart" with an optional
// note (e.g. item count) and an action on the right. The current page name is
// the page's <h1>, so the heading structure stays intact.
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

export function PageBreadcrumb({ current, note, action }: { current: string; note?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-stone-200 pb-4">
      <nav aria-label="Breadcrumb" className="min-w-0">
        <ol className="flex min-w-0 items-center gap-1.5">
          <li className="shrink-0">
            <Link
              href="/"
              aria-label="Home"
              title="Home"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-stone-200 bg-white text-teal-700 transition-colors hover:border-teal-700 hover:bg-teal-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
            >
              <Home className="h-4 w-4" aria-hidden="true" />
            </Link>
          </li>
          <li className="shrink-0 text-stone-400" aria-hidden="true">
            <ChevronRight className="h-4 w-4" />
          </li>
          <li aria-current="page" className="flex min-w-0 items-baseline gap-2">
            <h1 className="text-[15px] font-semibold leading-none text-stone-900">{current}</h1>
            {note && <span className="truncate text-sm text-stone-400">{note}</span>}
          </li>
        </ol>
      </nav>
      {action}
    </header>
  );
}
