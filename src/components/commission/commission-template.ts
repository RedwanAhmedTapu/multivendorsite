// Styled Excel template for category commission rates.
// xlsx-js-style is loaded on demand so the admin bundle only pays when a
// template is actually downloaded.
type TemplateRow = { path: string; currentRate: number; inherited?: boolean };

const SEP = " > ";

const rgb = (hex: string) => ({ rgb: hex });
const solid = (hex: string) => ({ patternType: "solid", fgColor: rgb(hex) });
const edge = (hex: string) => ({ style: "thin", color: rgb(hex) });

const H = {
  ink: "0F172A",
  body: "1E293B",
  slate100: "F1F5F9",
  slate200: "E2E8F0",
  slate500: "64748B",
  slate600: "475569",
  indigo600: "4F46E5",
  indigo900: "312E81",
  amber50: "FFFBEB",
  amber100: "FEF3C7",
  amber500: "F59E0B",
  amber700: "B45309",
  amber800: "92400E",
  emerald50: "ECFDF5",
  emerald700: "047857",
  rose50: "FFF1F2",
  rose700: "BE123C",
  sky50: "F0F9FF",
  sky700: "0369A1",
  white: "FFFFFF",
};

const LEVEL_TINT = ["E0E7FF", "E7ECFF", "EEF1FF", "F4F6FF", "F9FAFF", "FCFDFF"];

const STATUS_TONE: Record<string, { bg: string; fg: string }> = {
  OK: { bg: H.emerald50, fg: H.emerald700 },
  UNCHANGED: { bg: H.slate100, fg: H.slate600 },
  SKIPPED: { bg: H.sky50, fg: H.sky700 },
  NOT_FOUND: { bg: H.rose50, fg: H.rose700 },
  AMBIGUOUS: { bg: H.amber50, fg: H.amber700 },
  NOT_LEAF: { bg: H.amber50, fg: H.amber700 },
  INVALID: { bg: H.rose50, fg: H.rose700 },
  DUPLICATE: { bg: H.amber50, fg: H.amber700 },
};

const columnGuides: [string, string, string][] = [
  ["Category Level 1 … N", "Read-only", "Tree view of the category path. Parent groups are merged vertically; the deepest (bold) segment is the sellable leaf."],
  ["Category Path", "Read-only", "Exact “Root > Child > Leaf” text used to match the category when the file is uploaded. Never retype or edit it."],
  ["Current %", "Read-only", "Rate currently in effect. Italic grey means it is inherited from a parent category or the global default."],
  ["Commission %", "Yes", "Enter a percent between 0 and 100 with up to 2 decimals (e.g. 12.5). Leave it blank to skip the row."],
];

const statusGuides: [string, string][] = [
  ["OK", "Valid row — this rate will be applied."],
  ["UNCHANGED", "Same as the stored rate — nothing is written."],
  ["SKIPPED", "Commission % is blank — the row is ignored."],
  ["NOT_FOUND", "Path matches no category. Check spelling and the “ > ” separator."],
  ["AMBIGUOUS", "Two sibling categories share this name. Edit one of them in the category tree instead."],
  ["NOT_LEAF", "Path is a parent category. Use a leaf path, or enable “apply to all leaf descendants” on the preview."],
  ["INVALID", "Not a number, or outside 0–100."],
  ["DUPLICATE", "The same path appears more than once; only the first occurrence is considered."],
];

const rules: string[] = [
  "Do not add, delete or reorder rows, and do not rename the sheets or columns — uploads are matched by header text.",
  "Only the amber “Commission %” column is input. Everything else is reference data.",
  "Maximum 2,000 rows per file. Files are matched against every sellable (leaf) category.",
  "Re-uploading is safe: rows marked UNCHANGED are skipped and every applied change is appended to rate history.",
  "Applying a parent path with “apply to all leaf descendants” writes the same rate to every leaf below it.",
  "Save as .xlsx (or .csv) with the header row intact, then upload from Global → Excel rates → Upload.",
];

export async function downloadCommissionTemplate(rows: TemplateRow[], filename = "commission-template.xlsx") {
  const mod: any = await import("xlsx-js-style");
  const XLSX: any = mod.default ?? mod;

  const parsed = rows.map((row) => ({
    ...row,
    segs: row.path.split(SEP).map((s) => s.trim()).filter(Boolean),
  }));
  const depth = Math.max(1, ...parsed.map((row) => row.segs.length));
  const pathCol = depth;
  const currentCol = depth + 1;
  const rateCol = depth + 2;
  const lastCol = rateCol;
  const headerRow = 3;
  const firstDataRow = headerRow + 1;
  const lastRow = firstDataRow + Math.max(parsed.length, 1) - 1;

  const ws: any = {};
  const at = (r: number, c: number) => XLSX.utils.encode_cell({ r, c });
  const put = (r: number, c: number, v: unknown, s: any, t = "s") => {
    ws[at(r, c)] = { t, v, s };
  };
  const comment = (r: number, c: number, text: string) => {
    if (ws[at(r, c)]) ws[at(r, c)].c = [{ a: "Commission admin", t: text }];
  };

  ws["!ref"] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: lastRow, c: lastCol } });

  /* header block */
  put(0, 0, "Category Commission Template", {
    font: { name: "Calibri", sz: 16, bold: true, color: rgb(H.white) },
    fill: solid(H.ink),
    alignment: { horizontal: "left", vertical: "center", indent: 1 },
  });
  put(
    1,
    0,
    `${parsed.length} leaf categories · Fill the amber “Commission %” column only · Values are percent (0–100, 2 decimals)`,
    {
      font: { name: "Calibri", sz: 10, color: rgb(H.slate600) },
      fill: solid(H.slate100),
      alignment: { vertical: "center", indent: 1 },
    },
  );
  put(2, 0, "Blank cells are skipped — you can fill only the rows you want to change. Preview before applying; only rows marked OK are written.", {
    font: { name: "Calibri", sz: 10, bold: true, color: rgb(H.amber700) },
    fill: solid(H.amber50),
    alignment: { vertical: "center", indent: 1 },
  });

  /* column headers */
  for (let level = 0; level < depth; level++) {
    put(headerRow, level, `Level ${level + 1}`, {
      font: { name: "Calibri", sz: 11, bold: true, color: rgb(H.white) },
      fill: solid(H.indigo600),
      alignment: { horizontal: "center", vertical: "center" },
      border: { bottom: { style: "medium", color: rgb(H.ink) } },
    });
    comment(
      headerRow,
      level,
      "Read-only. Ancestor category at this level. Cells are merged for every parent group so the nesting stays easy to read.",
    );
  }
  put(headerRow, pathCol, "Category Path", {
    font: { name: "Calibri", sz: 11, bold: true, color: rgb(H.white) },
    fill: solid(H.slate600),
    alignment: { horizontal: "center", vertical: "center", wrapText: true },
    border: { bottom: { style: "medium", color: rgb(H.ink) } },
  });
  comment(headerRow, pathCol, "Read-only. Full “Root > Child > Leaf” path used to match the category on upload. Copy it exactly — do not retype.");
  put(headerRow, currentCol, "Current %", {
    font: { name: "Calibri", sz: 11, bold: true, color: rgb(H.white) },
    fill: solid(H.slate500),
    alignment: { horizontal: "center", vertical: "center", wrapText: true },
    border: { bottom: { style: "medium", color: rgb(H.ink) } },
  });
  comment(headerRow, currentCol, "Reference only. The rate in effect today (own or inherited). Editing this column has no effect.");
  put(headerRow, rateCol, "Commission %", {
    font: { name: "Calibri", sz: 12, bold: true, color: rgb(H.white) },
    fill: solid(H.amber700),
    alignment: { horizontal: "center", vertical: "center", wrapText: true },
    border: { bottom: { style: "medium", color: rgb(H.ink) } },
  });
  comment(
    headerRow,
    rateCol,
    "Input column. Type a percent from 0 to 100 (up to 2 decimals). Leave blank to skip the row — blanks never overwrite a stored rate.",
  );

  /* data */
  parsed.forEach((row, i) => {
    const r = firstDataRow + i;
    for (let level = 0; level < depth; level++) {
      const segment = row.segs[level] ?? "";
      const deepest = level === row.segs.length - 1;
      const borderTop = level === 0 ? edge(H.slate200) : undefined;
      put(r, level, segment, {
        font: { name: "Calibri", sz: 11, bold: deepest, color: rgb(deepest ? H.indigo900 : H.slate600) },
        fill: solid(segment ? LEVEL_TINT[level % LEVEL_TINT.length] : H.white),
        alignment: { vertical: "center", indent: 1, shrinkToFit: true },
        border: {
          bottom: edge(H.slate200),
          ...(borderTop ? { left: borderTop } : {}),
        },
      });
    }
    put(r, pathCol, row.path, {
      font: { name: "Consolas", sz: 9, color: rgb(H.slate600) },
      fill: solid("F8FAFC"),
      alignment: { vertical: "center", indent: 1 },
      border: { bottom: edge(H.slate200) },
    });
    put(
      r,
      currentCol,
      row.currentRate,
      {
        font: { name: "Calibri", sz: 11, italic: Boolean(row.inherited), color: rgb(row.inherited ? H.slate500 : H.body) },
        fill: solid(H.slate100),
        alignment: { horizontal: "center", vertical: "center" },
        numFmt: '0.00"%"',
        border: { bottom: edge(H.slate200) },
      },
      "n",
    );
    put(r, rateCol, "", {
      font: { name: "Calibri", sz: 11, bold: true, color: rgb(H.amber800) },
      fill: solid(H.amber50),
      alignment: { horizontal: "center", vertical: "center" },
      numFmt: "0.00",
      border: { top: edge(H.amber500), bottom: edge(H.amber500), left: edge(H.amber500), right: edge(H.amber500) },
    });
  });

  /* merged header rows + merged parent groups */
  const merges: any[] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: lastCol } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: lastCol } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: lastCol } },
  ];
  const NONE = "\u0000";
  for (let level = 0; level < depth; level++) {
    let start = -1;
    let key = "";
    for (let i = 0; i <= parsed.length; i++) {
      const segs = i < parsed.length ? parsed[i].segs : null;
      const prefix = segs && segs.length > level ? segs.slice(0, level + 1).join(SEP) : NONE;
      if (prefix !== key) {
        if (start >= 0 && i - start > 1) {
          merges.push({ s: { r: firstDataRow + start, c: level }, e: { r: firstDataRow + i - 1, c: level } });
        }
        start = prefix === NONE ? -1 : i;
        key = prefix;
      }
    }
  }
  ws["!merges"] = merges;
  ws["!cols"] = [
    ...Array.from({ length: depth }, () => ({ wch: 22 })),
    { wch: Math.min(72, Math.max(42, ...parsed.map((row) => row.path.length + 4))) },
    { wch: 12 },
    { wch: 15 },
  ];
  ws["!rows"] = [
    { hpt: 34 },
    { hpt: 20 },
    { hpt: 22 },
    { hpt: 28 },
    ...parsed.map(() => ({ hpt: 19 })),
  ];
  ws["!sheetViews"] = [{ showGridLines: false }];

  const guide = buildGuideSheet(XLSX);
  const book = XLSX.utils.book_new();
  book.Props = { Title: "Category Commission Template", Author: "FinixMart admin" };
  XLSX.utils.book_append_sheet(book, ws, "Commission Template");
  XLSX.utils.book_append_sheet(book, guide, "Filling Guide");
  XLSX.writeFile(book, filename);
}

function buildGuideSheet(XLSX: any) {
  const ws: any = {};
  const at = (r: number, c: number) => XLSX.utils.encode_cell({ r, c });
  const put = (r: number, c: number, v: string, s: any) => {
    ws[at(r, c)] = { t: "s", v, s };
  };
  const merges: any[] = [];
  const wide = (r: number, c: number, v: string, s: any) => {
    put(r, c, v, s);
    merges.push({ s: { r, c }, e: { r, c: 2 } });
  };

  const title = {
    font: { name: "Calibri", sz: 16, bold: true, color: rgb(H.white) },
    fill: solid(H.ink),
    alignment: { horizontal: "left", vertical: "center", indent: 1 },
  };
  const intro = {
    font: { name: "Calibri", sz: 10, color: rgb(H.slate600) },
    fill: solid(H.slate100),
    alignment: { vertical: "center", wrapText: true, indent: 1 },
  };
  const section = {
    font: { name: "Calibri", sz: 11, bold: true, color: rgb(H.white) },
    fill: solid(H.indigo600),
    alignment: { vertical: "center", indent: 1 },
  };
  const tableHead = {
    font: { name: "Calibri", sz: 10, bold: true, color: rgb(H.white) },
    fill: solid(H.body),
    alignment: { vertical: "center", indent: 1 },
    border: { bottom: edge(H.ink) },
  };
  const body = {
    font: { name: "Calibri", sz: 10, color: rgb(H.body) },
    alignment: { vertical: "center", wrapText: true, indent: 1 },
    border: { bottom: edge(H.slate200) },
  };
  const bullet = { ...body, fill: solid(H.white) };

  let r = 0;
  wide(r++, 0, "Commission Template — Filling Guide", title);
  wide(
    r++,
    0,
    "This file controls the category commission rate used by delivery, return and agent vouchers. Every applied change is appended to rate history and cannot be erased — preview before you apply.",
    intro,
  );
  r++;

  wide(r++, 0, "1 · How to fill", section);
  const steps = [
    "1. Only edit the amber “Commission %” column — every other column is reference data.",
    "2. Type a percent between 0 and 100, up to 2 decimals (12.5 is valid; 12.556 is rounded to 12.56).",
    "3. Leave a cell blank to skip that row. Blank cells never overwrite a stored rate.",
    "4. Do not insert, delete or reorder rows; do not edit Level / Category Path / Current %.",
    "5. Save as .xlsx (or .csv) and upload from Global → Excel rates → Upload.",
    "6. Check the dry-run preview — only rows marked OK are applied, nothing is written before you confirm.",
  ];
  for (const step of steps) wide(r++, 0, step, bullet);
  r++;

  wide(r++, 0, "2 · Column reference", section);
  put(r, 0, "Column", tableHead);
  put(r, 1, "Editable", tableHead);
  put(r, 2, "What it is / what to enter", tableHead);
  r++;
  for (const [name, editable, text] of columnGuides) {
    put(r, 0, name, { ...body, font: { ...body.font, bold: true } });
    put(r, 1, editable, {
      ...body,
      alignment: { horizontal: "center", vertical: "center" },
      font: { ...body.font, bold: editable === "Yes", color: rgb(editable === "Yes" ? H.amber700 : H.slate600) },
      fill: solid(editable === "Yes" ? H.amber50 : H.white),
    });
    put(r, 2, text, body);
    r++;
  }
  r++;

  wide(r++, 0, "3 · What each preview status means", section);
  put(r, 0, "Status", tableHead);
  put(r, 1, "Meaning", tableHead);
  merges.push({ s: { r, c: 1 }, e: { r, c: 2 } });
  r++;
  for (const [status, text] of statusGuides) {
    const tone = STATUS_TONE[status];
    put(r, 0, status, {
      font: { name: "Calibri", sz: 10, bold: true, color: rgb(tone.fg) },
      fill: solid(tone.bg),
      alignment: { horizontal: "center", vertical: "center" },
      border: { bottom: edge(H.slate200) },
    });
    put(r, 1, text, body);
    merges.push({ s: { r, c: 1 }, e: { r, c: 2 } });
    r++;
  }
  r++;

  wide(r++, 0, "4 · Rules and limits", section);
  for (const rule of rules) wide(r++, 0, `•  ${rule}`, bullet);
  r++;

  wide(
    r++,
    0,
    "Colour legend — indigo: category hierarchy · grey: read-only reference · italic grey value: rate inherited from a parent or global default · amber: your input",
    intro,
  );

  ws["!ref"] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: r - 1, c: 2 } });
  ws["!merges"] = merges;
  ws["!cols"] = [{ wch: 30 }, { wch: 14 }, { wch: 88 }];
  ws["!sheetViews"] = [{ showGridLines: false }];
  return ws;
}
