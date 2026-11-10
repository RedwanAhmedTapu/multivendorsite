// lib/homepage-config/grid.ts
//
// Tiny, dependency-free helpers for client components (no zod here, so the
// schema never ends up in the customer-facing bundle).

/** Today's homepage grid: grid-cols-2 md:grid-cols-5 lg:grid-cols-6. */
export const CURRENT_GRID_COLUMNS = Object.freeze({ mobile: 2, tablet: 5, desktop: 6 });

export function isCurrentGridColumns(c: { mobile: number; tablet: number; desktop: number }): boolean {
  return (
    c.mobile === CURRENT_GRID_COLUMNS.mobile &&
    c.tablet === CURRENT_GRID_COLUMNS.tablet &&
    c.desktop === CURRENT_GRID_COLUMNS.desktop
  );
}
