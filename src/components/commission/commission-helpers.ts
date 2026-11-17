import * as XLSX from "xlsx";

export function fmtPercent(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === "") return "—";
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  return `${Number(n.toFixed(2))}%`;
}

export function fmtDelta(value: number | string | null | undefined): { text: string; tone: string } {
  if (value === null || value === undefined) return { text: "—", tone: "text-slate-400" };
  const n = Number(value);
  if (!Number.isFinite(n) || n === 0) return { text: "0", tone: "text-slate-400" };
  return n > 0
    ? { text: `↑ ${Math.abs(n).toFixed(2)}`, tone: "text-emerald-600" }
    : { text: `↓ ${Math.abs(n).toFixed(2)}`, tone: "text-rose-600" };
}

export function fmtDate(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export function fmtDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

export function scopeLabel(scope: string): string {
  return (
    {
      GLOBAL_DEFAULT: "Global default",
      CATEGORY: "Category",
      VENDOR: "Vendor",
      VENDOR_CATEGORY: "Vendor × category",
      BADGE: "Badge",
      BADGE_CATEGORY: "Badge × category",
    } as Record<string, string>
  )[scope] ?? scope;
}

export type ExcelUploadRow = { path: string; rate: unknown };

/**
 * Parses "Category Path" + "Commission %" from the first sheet (xlsx/csv).
 * The column header row is located by name, so a styled template with title
 * and guidance rows above the table still parses correctly.
 */
export async function parseCommissionExcel(file: File): Promise<ExcelUploadRow[]> {
  const buffer = await file.arrayBuffer();
  const book = XLSX.read(buffer, { type: "array" });
  const sheet = book.Sheets[book.SheetNames[0]];
  if (!sheet) return [];

  const norm = (value: unknown) => String(value ?? "").trim().toLowerCase();
  const grid = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: "", blankrows: false });
  const headerIndex = grid.findIndex((row) => row.some((cell) => norm(cell) === "category path" || norm(cell) === "category"));
  if (headerIndex < 0) return [];

  const header = grid[headerIndex].map(norm);
  const pathCol = header.findIndex((cell) => cell === "category path" || cell === "category");
  const rateCol = header.findIndex((cell) => cell === "commission %" || cell === "commission" || cell === "rate");
  if (pathCol < 0) return [];

  return grid
    .slice(headerIndex + 1)
    .map((row) => ({
      path: String(row[pathCol] ?? "").trim(),
      rate: rateCol >= 0 ? (row[rateCol] ?? "") : "",
    }))
    .filter((row) => row.path !== "" || String(row.rate ?? "").trim() !== "");
}

export function isExcelFile(file: File): boolean {
  return /\.(xlsx|xls|csv)$/i.test(file.name);
}

export function flattenTree<T extends { children: T[] }>(nodes: T[]): T[] {
  const out: T[] = [];
  const walk = (list: T[]) => {
    for (const node of list) {
      out.push(node);
      walk(node.children);
    }
  };
  walk(nodes);
  return out;
}
