/**
 * Builds a compact page-number window for the pagination bar, e.g.
 * [1, "…", 4, 5, 6, "…", 12] for current=5, total=12.
 */
export function buildPageWindow(current: number, total: number): (number | "…")[] {
  const window = 1; // pages shown on each side of current
  const pages: (number | "…")[] = [];
  const add = (p: number) => pages.push(p);

  add(1);
  if (current - window > 2) pages.push("…");
  for (let p = Math.max(2, current - window); p <= Math.min(total - 1, current + window); p++) {
    add(p);
  }
  if (current + window < total - 1) pages.push("…");
  if (total > 1) add(total);

  return pages;
}
