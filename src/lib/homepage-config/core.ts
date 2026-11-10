// lib/homepage-config/core.ts
//
// Frontend copy of the homepage configuration contract owned by the backend
// (multivendorbackend/src/validators/homepage-config.validator.ts and
// src/constants/homepage-config.defaults.ts). tests/homepage-config.test.mjs
// checks that both sides accept each other's defaults and that the defaults
// are identical, so drift is caught.
//
// Kept dependency-light and free of relative imports so it runs unchanged
// under Next.js and under `node --test` (native type stripping).
//
// Nothing in a config is ever executed or turned into class names: section
// types map to a fixed component registry (LayoutProvider), visibility maps to
// a fixed set of class strings below, and sizes are applied via CSS variables.
import { z } from "zod";

export const HOMEPAGE_CONFIG_SCHEMA_VERSION = 1 as const;

export const LAYOUT_IDS = ["layout_1", "layout_2", "layout_3"] as const;
export type LayoutId = (typeof LAYOUT_IDS)[number];

export const SECTION_TYPES = [
  "hero",
  "horizontalCategoryNav",
  "categoryGrid",
  "benefits",
  "categoryCircles",
  "productCollection",
  "footer",
] as const;

export const PRODUCT_SOURCES = ["flashSale", "featured", "newArrivals", "trending", "bestSelling", "discounted"] as const;
export type ProductSource = (typeof PRODUCT_SOURCES)[number];

const SECTION_TYPE_LIMITS: Record<(typeof SECTION_TYPES)[number], number> = {
  hero: 1,
  horizontalCategoryNav: 1,
  categoryGrid: 1,
  benefits: 1,
  categoryCircles: 1,
  productCollection: 10,
  footer: 1,
};

// ── schema (mirrors the backend validator) ──────────────────────────────────

const hexColor = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/)
  .transform((v) => v.toLowerCase());
const optColor = hexColor.nullable().optional();
const plainText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .regex(/^[^<>{}\u0000-\u001F\u007F]*$/);
const int = (min: number, max: number) => z.number().int().min(min).max(max);
const responsive = (min: number, max: number) =>
  z.strictObject({ mobile: int(min, max), tablet: int(min, max), desktop: int(min, max) });
const visibility = z.strictObject({ mobile: z.boolean(), tablet: z.boolean(), desktop: z.boolean() });
const sectionId = z.string().regex(/^[a-z0-9][a-z0-9_-]{0,39}$/);
const spacingStep = z.enum(["none", "sm", "md", "lg"]).nullable().optional();

const sectionAppearance = z
  .strictObject({
    background: optColor,
    textColor: optColor,
    align: z.enum(["left", "center"]).nullable().optional(),
    containerWidth: z.enum(["contained", "full"]).nullable().optional(),
    spacing: z
      .strictObject({ mobile: spacingStep, tablet: spacingStep, desktop: spacingStep })
      .nullable()
      .optional(),
  })
  .optional();

const sectionBase = { id: sectionId, enabled: z.boolean(), visibility, appearance: sectionAppearance };
const emptySettings = z.strictObject({}).optional();

const productCollectionSettings = z.strictObject({
  source: z.enum(PRODUCT_SOURCES),
  title: plainText(80).min(1),
  subtitle: plainText(160).nullable().optional(),
  limit: int(1, 24),
  columns: responsive(1, 8),
  showSeeAll: z.boolean(),
});

export const sectionSchema = z.discriminatedUnion("type", [
  z.strictObject({ ...sectionBase, type: z.literal("hero"), settings: emptySettings }),
  z.strictObject({ ...sectionBase, type: z.literal("horizontalCategoryNav"), settings: emptySettings }),
  z.strictObject({ ...sectionBase, type: z.literal("categoryGrid"), settings: emptySettings }),
  z.strictObject({ ...sectionBase, type: z.literal("benefits"), settings: emptySettings }),
  z.strictObject({
    ...sectionBase,
    type: z.literal("categoryCircles"),
    settings: z
      .strictObject({
        title: plainText(80).nullable().optional(),
        subtitle: plainText(160).nullable().optional(),
        maxItems: int(4, 48).nullable().optional(),
      })
      .optional(),
  }),
  z.strictObject({ ...sectionBase, type: z.literal("productCollection"), settings: productCollectionSettings }),
  z.strictObject({ ...sectionBase, type: z.literal("footer"), settings: emptySettings }),
]);

export const layoutSchema = z
  .strictObject({ sections: z.array(sectionSchema).max(20) })
  .superRefine((layout, ctx) => {
    const seen = new Set<string>();
    const counts: Record<string, number> = {};
    layout.sections.forEach((s, i) => {
      if (seen.has(s.id)) ctx.addIssue({ code: "custom", message: `Duplicate section id "${s.id}"`, path: ["sections", i, "id"] });
      seen.add(s.id);
      counts[s.type] = (counts[s.type] ?? 0) + 1;
      if (counts[s.type] > SECTION_TYPE_LIMITS[s.type]) {
        ctx.addIssue({ code: "custom", message: `Too many "${s.type}" sections`, path: ["sections", i, "type"] });
      }
    });
  });

const themeSchema = z.strictObject({
  preset: z.enum(["finixmartDefault"]),
  colors: z
    .strictObject({
      primary: optColor,
      secondary: optColor,
      accent: optColor,
      pageBackground: optColor,
      surface: optColor,
      heading: optColor,
      body: optColor,
      muted: optColor,
      border: optColor,
      buttonBackground: optColor,
      buttonText: optColor,
      badgeBackground: optColor,
      badgeText: optColor,
    })
    .optional(),
});

export const homepageConfigSchema = z.strictObject({
  schemaVersion: z.literal(HOMEPAGE_CONFIG_SCHEMA_VERSION),
  layouts: z.strictObject({ layout_1: layoutSchema, layout_2: layoutSchema, layout_3: layoutSchema }),
  theme: themeSchema,
});

export type HomepageConfig = z.infer<typeof homepageConfigSchema>;
export type HomepageSection = z.infer<typeof sectionSchema>;
export type HomepageLayoutConfig = z.infer<typeof layoutSchema>;
export type ProductCollectionSettings = z.infer<typeof productCollectionSettings>;

// ── defaults (identical to the backend defaults; checked by tests) ─────────

const ALL = { mobile: true, tablet: true, desktop: true };
const CURRENT_COLUMNS = { mobile: 2, tablet: 5, desktop: 6 };

function productSections(): HomepageSection[] {
  const collection = (id: string, source: ProductSource, title: string, enabled: boolean): HomepageSection => ({
    id,
    type: "productCollection",
    enabled,
    visibility: { ...ALL },
    settings: { source, title, limit: 12, columns: { ...CURRENT_COLUMNS }, showSeeAll: true },
  });
  return [
    collection("products-flash-sale", "flashSale", "Flash Sale", true),
    collection("products-featured", "featured", "Featured Products", true),
    collection("products-new-arrivals", "newArrivals", "New Arrivals", true),
    collection("products-trending", "trending", "Trending Now", false),
    collection("products-best-selling", "bestSelling", "Best Selling", false),
    collection("products-discounted", "discounted", "Discounted Products", false),
  ];
}

const hero = (): HomepageSection => ({ id: "hero", type: "hero", enabled: true, visibility: { ...ALL } });
const benefits = (): HomepageSection => ({ id: "benefits", type: "benefits", enabled: true, visibility: { ...ALL } });
const footer = (): HomepageSection => ({ id: "footer", type: "footer", enabled: true, visibility: { ...ALL } });
const categoryCircles = (): HomepageSection => ({
  id: "category-circles",
  type: "categoryCircles",
  enabled: true,
  visibility: { ...ALL },
});

/** Today's homepage, as configuration. Fresh copy on every call. */
export function getDefaultHomepageConfig(): HomepageConfig {
  return {
    schemaVersion: HOMEPAGE_CONFIG_SCHEMA_VERSION,
    layouts: {
      layout_1: { sections: [hero(), benefits(), categoryCircles(), ...productSections(), footer()] },
      layout_2: {
        sections: [
          { id: "horizontal-category-nav", type: "horizontalCategoryNav", enabled: true, visibility: { ...ALL } },
          hero(),
          benefits(),
          categoryCircles(),
          ...productSections(),
          footer(),
        ],
      },
      layout_3: {
        sections: [
          // CategoryLayout_3 hides itself below md (`hidden md:flex`).
          { id: "category-grid", type: "categoryGrid", enabled: true, visibility: { mobile: false, tablet: true, desktop: true } },
          benefits(),
          categoryCircles(),
          ...productSections(),
          footer(),
        ],
      },
    },
    theme: { preset: "finixmartDefault" },
  };
}

// ── safe resolution ─────────────────────────────────────────────────────────

export interface ResolvedHomepageConfig {
  config: HomepageConfig;
  /** Parts that were invalid and replaced by defaults (empty when all valid). */
  fallbackParts: string[];
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/**
 * Turns any value (API response, preview message, garbage) into a renderable
 * config. Never throws. Valid parts are kept; each invalid layout / theme
 * block falls back to its default on its own, so one bad layout can't break
 * the others. Unknown schema versions fall back entirely. (Product card design
 * is a separate global setting, not part of this config.)
 */
export function resolveHomepageConfig(raw: unknown): ResolvedHomepageConfig {
  const defaults = getDefaultHomepageConfig();
  if (raw === undefined || raw === null) return { config: defaults, fallbackParts: [] };
  if (!isPlainObject(raw) || raw.schemaVersion !== HOMEPAGE_CONFIG_SCHEMA_VERSION) {
    return { config: defaults, fallbackParts: ["all"] };
  }

  const full = homepageConfigSchema.safeParse(raw);
  if (full.success) return { config: full.data, fallbackParts: [] };

  const fallbackParts: string[] = [];
  const layouts = isPlainObject(raw.layouts) ? raw.layouts : {};
  const config: HomepageConfig = { ...defaults, layouts: { ...defaults.layouts } };
  for (const id of LAYOUT_IDS) {
    const parsed = layoutSchema.safeParse(layouts[id]);
    if (parsed.success) config.layouts[id] = parsed.data;
    else fallbackParts.push(id);
  }
  const theme = themeSchema.safeParse(raw.theme);
  if (theme.success) config.theme = theme.data;
  else fallbackParts.push("theme");
  return { config, fallbackParts };
}

/**
 * Picks the config to render from a GET /themes/homepage-config `data` body.
 * Only an actually published config ('published') is used; for 'default'
 * (nothing published) or 'fallback' (backend couldn't use its stored value)
 * the frontend's own defaults render, so a frontend/backend version skew can
 * never change today's homepage.
 */
export function selectPublishedConfig(apiData: unknown): ResolvedHomepageConfig {
  const data = isPlainObject(apiData) ? apiData : {};
  if (data.source !== "published") return { config: getDefaultHomepageConfig(), fallbackParts: [] };
  return resolveHomepageConfig(data.config);
}

export function normalizeLayoutId(value: unknown): LayoutId {
  return (LAYOUT_IDS as readonly unknown[]).includes(value) ? (value as LayoutId) : "layout_1";
}

// ── rendering helpers ───────────────────────────────────────────────────────

/**
 * Fixed visibility classes (mobile <768px, tablet 768–1023px = md, desktop
 * ≥1024px = lg). `contents` keeps the wrapper out of layout, so a section
 * renders exactly as it would unwrapped. Keys are "mobile tablet desktop" bits.
 * null = render without a wrapper; "never" = don't render at all.
 */
const VISIBILITY_CLASSES: Record<string, string | null | "never"> = {
  "111": null,
  "000": "never",
  "100": "contents md:hidden",
  "010": "hidden md:contents lg:hidden",
  "001": "hidden lg:contents",
  "110": "contents lg:hidden",
  "101": "contents md:hidden lg:contents",
  "011": "hidden md:contents",
};

export function visibilityClass(v: { mobile: boolean; tablet: boolean; desktop: boolean }): string | null | "never" {
  return VISIBILITY_CLASSES[`${+v.mobile}${+v.tablet}${+v.desktop}`];
}

export interface RenderableSection {
  section: HomepageSection;
  /** Wrapper class, or null to render the section unwrapped. */
  wrapperClass: string | null;
}

/** Enabled sections of one layout, in order, with their visibility wrapper. */
export function getRenderableSections(config: HomepageConfig, layoutId: LayoutId): RenderableSection[] {
  const out: RenderableSection[] = [];
  for (const section of config.layouts[layoutId].sections) {
    if (!section.enabled) continue;
    const cls = visibilityClass(section.visibility);
    if (cls === "never") continue;
    out.push({ section, wrapperClass: cls });
  }
  return out;
}
