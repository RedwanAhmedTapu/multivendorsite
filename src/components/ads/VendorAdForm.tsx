"use client";

// Create / edit an advertisement campaign (vendor). FRONTEND-ONLY:
//   - "Save draft" and "Submit for review" validate the form and then show a
//     dialog that says plainly that nothing was saved or submitted — there is
//     no advertisement API yet, and nothing is charged.
//   - Product choices come from the existing read-only product picker (your
//     own products); category names from the existing public category list.
//   - Logo and banner files are previewed locally (object URLs) and never
//     uploaded.

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarClock, Eye, ImageIcon, LayoutGrid, Megaphone, Package, Store, Type as TypeIcon, X } from "lucide-react";
import { SectionCard } from "@/components/ui/section-card";
import { GradientButton, OutlineButton } from "@/components/ui/section-buttons";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { StoreProductPicker, type PickedProduct } from "@/app/store-editor/Storeproductpicker";
import { useGetCategoriesQuery } from "@/features/apiSlice";
import type { Category } from "@/types/type";
import {
  AD_DURATIONS_DAYS,
  AD_TYPE_LABEL,
  MAX_AD_PRODUCTS,
  MAX_HEADLINE,
  MAX_TITLE,
  placementById,
  placementsFor,
  switchAdType,
  validateAdForm,
  type AdFormErrors,
  type AdFormState,
  type AdType,
} from "@/lib/ads/ads-demo";
import { AdCreativePreview, DemoNotice, ProductThumb } from "./AdsShared";

function flattenCategories(list: Category[] | undefined, out: { id: string; name: string }[] = []) {
  for (const c of list ?? []) {
    out.push({ id: c.id, name: c.name });
    flattenCategories(c.children, out);
  }
  return out;
}

function FieldError({ id, message }: { id: string; message?: string }) {
  return message ? (
    <p id={id} role="alert" className="mt-1 text-[12px] font-medium text-red-600">
      {message}
    </p>
  ) : null;
}

/** Local file preview — the file never leaves the browser. */
function useObjectUrl() {
  const [url, setUrl] = React.useState<string | undefined>();
  React.useEffect(() => () => {
    if (url?.startsWith("blob:")) URL.revokeObjectURL(url);
  }, [url]);
  return [url, (file?: File | null) => setUrl(file ? URL.createObjectURL(file) : undefined)] as const;
}

export function VendorAdForm({ mode, initial, storeName }: { mode: "create" | "edit"; initial: AdFormState; storeName: string }) {
  const router = useRouter();
  const [form, setForm] = React.useState<AdFormState>(initial);
  const [errors, setErrors] = React.useState<AdFormErrors>({});
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const [result, setResult] = React.useState<null | "draft" | "submit">(null);
  const [logoUrl, setLogoFile] = useObjectUrl();
  const [bannerUrl, setBannerFile] = useObjectUrl();
  const { data: categories, isLoading: categoriesLoading, isError: categoriesError } = useGetCategoriesQuery();
  const categoryOptions = React.useMemo(() => flattenCategories(categories), [categories]);

  const set = <K extends keyof AdFormState>(key: K, value: AdFormState[K]) => setForm((f) => ({ ...f, [key]: value }));
  const placement = form.placement ? placementById(form.placement) : undefined;

  const attempt = (kind: "draft" | "submit") => {
    const e = validateAdForm(form, kind);
    setErrors(e);
    if (Object.keys(e).length === 0) setResult(kind);
  };

  const typeOptions: { type: AdType; icon: React.ReactNode; text: string }[] = [
    { type: "STORE", icon: <Store className="h-5 w-5" aria-hidden />, text: "Promote your store with its logo and a headline" },
    { type: "PRODUCT", icon: <Package className="h-5 w-5" aria-hidden />, text: `Promote up to ${MAX_AD_PRODUCTS} of your products` },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-1">
        <Link href="/vendor-dashboard/advertisements" className="text-[12.5px] font-medium text-[#1e40af] hover:underline">
          ← My Advertisements
        </Link>
        <h1 className="text-xl font-bold text-[#0D1B2E]">{mode === "create" ? "Create Advertisement" : "Edit Advertisement"}</h1>
      </div>
      <DemoNotice>
        This form works, but it does not save anything yet: drafts and submissions are not stored, nothing is sent for review, and nothing is charged. Logo and banner files stay on your device.
      </DemoNotice>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(320px,420px)]">
        <div className="space-y-4">
          <SectionCard icon={<Megaphone className="h-4 w-4" />} title="Campaign type" subtitle="What do you want to promote?" badge="required">
            <div role="radiogroup" aria-label="Campaign type" className="grid gap-3 sm:grid-cols-2">
              {typeOptions.map((o) => {
                const active = form.type === o.type;
                return (
                  <button
                    key={o.type}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setForm((f) => switchAdType(f, o.type))}
                    className={`flex items-start gap-3 rounded-xl border-[1.5px] p-3 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1e40af] ${active ? "border-[#1e40af] bg-[#EEF3FB]" : "border-[#E5EAF2] bg-white hover:border-[#C7D2E3]"}`}
                  >
                    <span className={active ? "text-[#1e40af]" : "text-[#7A90AB]"}>{o.icon}</span>
                    <span>
                      <span className="block text-[13.5px] font-bold text-[#0D1B2E]">{AD_TYPE_LABEL[o.type]}</span>
                      <span className="block text-[12px] text-[#7A90AB]">{o.text}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </SectionCard>

          <SectionCard icon={<TypeIcon className="h-4 w-4" />} title="Campaign details" badge="required" error={!!errors.title}>
            <Label htmlFor="ad-title">Campaign title</Label>
            <Input
              id="ad-title"
              className="mt-1.5"
              value={form.title}
              maxLength={MAX_TITLE + 20}
              onChange={(e) => set("title", e.target.value)}
              aria-invalid={!!errors.title}
              aria-describedby={errors.title ? "ad-title-error" : undefined}
              placeholder="e.g. Spring store spotlight"
            />
            <FieldError id="ad-title-error" message={errors.title} />
            <p className="mt-1 text-[11px] text-[#7A90AB]">Only you and the review team see the title.</p>
          </SectionCard>

          {form.type === "STORE" ? (
            <SectionCard icon={<ImageIcon className="h-4 w-4" />} title="Store creative" subtitle="Logo, headline and an optional banner" badge="required" error={!!errors.headline}>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="ad-logo">Store logo</Label>
                  <Input id="ad-logo" type="file" accept="image/*" className="mt-1.5" onChange={(e) => setLogoFile(e.target.files?.[0])} />
                  <p className="mt-1 text-[11px] text-[#7A90AB]">Preview only — not uploaded.</p>
                </div>
                <div>
                  <Label htmlFor="ad-headline">Headline</Label>
                  <Input
                    id="ad-headline"
                    className="mt-1.5"
                    value={form.headline}
                    onChange={(e) => set("headline", e.target.value)}
                    aria-invalid={!!errors.headline}
                    aria-describedby={errors.headline ? "ad-headline-error" : "ad-headline-count"}
                    placeholder="e.g. New season, new arrivals"
                  />
                  <FieldError id="ad-headline-error" message={errors.headline} />
                  <p id="ad-headline-count" className="mt-1 text-[11px] text-[#7A90AB]">
                    {form.headline.trim().length}/{MAX_HEADLINE}
                  </p>
                </div>
                <div>
                  <Label htmlFor="ad-banner">Banner image (optional)</Label>
                  <Input id="ad-banner" type="file" accept="image/*" className="mt-1.5" onChange={(e) => setBannerFile(e.target.files?.[0])} />
                  <p className="mt-1 text-[11px] text-[#7A90AB]">Preview only — not uploaded.</p>
                </div>
              </div>
            </SectionCard>
          ) : (
            <SectionCard
              icon={<Package className="h-4 w-4" />}
              title="Products"
              subtitle={`${form.products.length} of ${MAX_AD_PRODUCTS} selected`}
              badge="required"
              error={!!errors.products}
              actions={
                <Button type="button" variant="outline" size="sm" onClick={() => setPickerOpen(true)}>
                  {form.products.length ? "Change products" : "Select products"}
                </Button>
              }
            >
              {form.products.length === 0 ? (
                <p className="text-[13px] text-[#7A90AB]">No products selected yet. You can choose up to {MAX_AD_PRODUCTS} of your own products.</p>
              ) : (
                <ul className="divide-y divide-[#F0F4FA]" aria-label="Selected products">
                  {form.products.map((p) => (
                    <li key={p.id} className="flex items-center gap-3 py-2">
                      <ProductThumb product={p} size={44} />
                      <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-[#0D1B2E]">{p.name}</span>
                      <Button type="button" variant="ghost" size="sm" aria-label={`Remove ${p.name}`} onClick={() => set("products", form.products.filter((x) => x.id !== p.id))}>
                        <X className="h-4 w-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
              <FieldError id="ad-products-error" message={errors.products} />
              <p className="mt-2 text-[11px] text-[#7A90AB]">The {MAX_AD_PRODUCTS}-product limit is applied by this form; the final rules will come from the advertising service.</p>
            </SectionCard>
          )}

          <SectionCard icon={<LayoutGrid className="h-4 w-4" />} title="Placement" subtitle="Where you would like the ad to appear" badge="required" error={!!errors.placement || !!errors.category}>
            <div role="radiogroup" aria-label="Placement" className="space-y-2">
              {placementsFor(form.type).map((p) => {
                const active = form.placement === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setForm((f) => ({ ...f, placement: p.id, ...(p.needsCategory ? {} : { categoryId: "", categoryName: "" }) }))}
                    className={`flex w-full items-start justify-between gap-3 rounded-xl border-[1.5px] px-3 py-2.5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1e40af] ${active ? "border-[#1e40af] bg-[#EEF3FB]" : "border-[#E5EAF2] hover:border-[#C7D2E3]"}`}
                  >
                    <span>
                      <span className="block text-[13px] font-semibold text-[#0D1B2E]">{p.label}</span>
                      <span className="block text-[12px] text-[#7A90AB]">{p.description}</span>
                    </span>
                  </button>
                );
              })}
            </div>
            <FieldError id="ad-placement-error" message={errors.placement} />
            {placement?.needsCategory && (
              <div className="mt-3">
                <Label htmlFor="ad-category">Category page</Label>
                <Select
                  value={form.categoryId || undefined}
                  onValueChange={(id) => setForm((f) => ({ ...f, categoryId: id, categoryName: categoryOptions.find((c) => c.id === id)?.name ?? "" }))}
                  disabled={categoriesLoading || categoriesError}
                >
                  <SelectTrigger id="ad-category" className="mt-1.5 w-full" aria-invalid={!!errors.category}>
                    <SelectValue placeholder={categoriesLoading ? "Loading categories…" : categoriesError ? "Categories unavailable" : form.categoryName || "Choose a category"} />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryOptions.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError id="ad-category-error" message={errors.category} />
                <p className="mt-1 text-[11px] text-[#7A90AB]">Each category page has its own limited number of ad slots.</p>
              </div>
            )}
          </SectionCard>

          <SectionCard icon={<CalendarClock className="h-4 w-4" />} title="Duration" badge="required" error={!!errors.durationDays}>
            <Label htmlFor="ad-duration">Campaign length</Label>
            <Select value={form.durationDays ? String(form.durationDays) : undefined} onValueChange={(v) => set("durationDays", Number(v))}>
              <SelectTrigger id="ad-duration" className="mt-1.5 w-full sm:w-[220px]" aria-invalid={!!errors.durationDays}>
                <SelectValue placeholder="Choose a duration" />
              </SelectTrigger>
              <SelectContent>
                {AD_DURATIONS_DAYS.map((d) => (
                  <SelectItem key={d} value={String(d)}>
                    {d} days
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError id="ad-duration-error" message={errors.durationDays} />
            <p className="mt-1 text-[11px] text-[#7A90AB]">The campaign starts once it has been approved and paid for. Pricing is not available yet.</p>
          </SectionCard>
        </div>

        <div className="space-y-4 lg:sticky lg:top-4 lg:self-start">
          <SectionCard icon={<Eye className="h-4 w-4" />} title="Preview">
            <AdCreativePreview type={form.type} storeName={storeName} logoUrl={logoUrl ?? form.logoPreviewUrl} headline={form.headline} bannerUrl={bannerUrl ?? form.bannerPreviewUrl} products={form.products} />
          </SectionCard>
          <div className="flex flex-col gap-2 sm:flex-row">
            <OutlineButton onClick={() => attempt("draft")} style={{ flex: 1 }}>
              Save draft
            </OutlineButton>
            <GradientButton onClick={() => attempt("submit")} style={{ flex: 1 }}>
              Submit for review
            </GradientButton>
          </div>
          {Object.keys(errors).length > 0 && (
            <p role="alert" className="text-[12px] font-medium text-red-600">
              Please fix the highlighted fields.
            </p>
          )}
        </div>
      </div>

      <StoreProductPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        selectedProductIds={form.products.map((p) => p.id)}
        maxSelect={MAX_AD_PRODUCTS}
        onConfirm={(picked: PickedProduct[]) => {
          set("products", picked.slice(0, MAX_AD_PRODUCTS).map((p) => ({ id: p.id, name: p.name, image: p.image, price: p.price })));
          setPickerOpen(false);
        }}
      />

      <Dialog open={result !== null} onOpenChange={(open) => !open && setResult(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{result === "submit" ? "Ready to submit — demo only" : "Draft is valid — demo only"}</DialogTitle>
            <DialogDescription>
              {result === "submit"
                ? "The campaign passed every check, but it was not submitted: advertising is not live yet, so nothing was sent for review and nothing was charged."
                : "The draft passed its checks, but it was not saved: advertising is not live yet. Leaving this page discards your changes."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setResult(null)}>
              Keep editing
            </Button>
            <Button onClick={() => router.push("/vendor-dashboard/advertisements")}>Back to My Advertisements</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
