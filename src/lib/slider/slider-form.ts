// lib/slider/slider-form.ts
//
// Pure helpers for the admin banner (homepage slider) form — shared by
// SliderAdmin.tsx and features/sliderApi.ts, unit tested in
// tests/banner-editor.test.mjs.
//
// Backend contract (multivendorbackend slider.controller/slider.service):
//   POST /api/sliders      multipart, `image` required.
//   PUT  /api/sliders/:id  multipart, `image` optional — without a new file the
//                          stored imageUrl is kept. A text field that is sent
//                          (even "") is saved; a field that is omitted is kept.
//                          `vendorId` can be changed but not removed, and an
//                          empty buttonLink keeps the stored link.

export type SliderType = "HOMEPAGE" | "VENDORPAGE";

export interface SliderFormState {
  title: string;
  subtitle: string;
  description: string;
  buttonText: string;
  /** "" = use the automatic link of the tagged vendor / campaign. */
  buttonLink: string;
  type: SliderType;
  vendorId: string;
  campaignId: string;
}

export interface SliderLike {
  id: string;
  title?: string | null;
  subtitle?: string | null;
  description?: string | null;
  buttonText?: string | null;
  buttonLink?: string | null;
  imageUrl: string;
  type: SliderType;
  vendorId?: string | null;
}

export interface CampaignRef {
  id: string;
  slug: string;
}

export function emptySliderForm(): SliderFormState {
  return { title: "", subtitle: "", description: "", buttonText: "", buttonLink: "", type: "HOMEPAGE", vendorId: "", campaignId: "" };
}

/** The link a slide gets automatically from its tagged vendor or campaign. */
export function sliderAutoLink(vendorId: string, campaignSlug: string | undefined): string {
  if (vendorId) return `/store/${vendorId}`;
  if (campaignSlug) return `/campaign/${campaignSlug}`;
  return "";
}

/**
 * Prefills the form from a saved slide. A campaign is recognised from a stored
 * `/campaign/<slug>` link (sliders keep no campaign id). A stored link that is
 * exactly the automatic one is shown as "" so it keeps following the tag.
 */
export function sliderToForm(slider: SliderLike, campaigns: CampaignRef[] = []): SliderFormState {
  const vendorId = slider.vendorId ?? "";
  const link = slider.buttonLink ?? "";
  const campaign = vendorId ? undefined : campaigns.find((c) => link === `/campaign/${c.slug}`);
  const auto = sliderAutoLink(vendorId, campaign?.slug);
  return {
    title: slider.title ?? "",
    subtitle: slider.subtitle ?? "",
    description: slider.description ?? "",
    buttonText: slider.buttonText ?? "",
    buttonLink: auto && link === auto ? "" : link,
    type: slider.type,
    vendorId,
    campaignId: campaign?.id ?? "",
  };
}

export interface SliderPayload {
  title?: string;
  subtitle?: string;
  description?: string;
  buttonText?: string;
  buttonLink?: string;
  type?: SliderType;
  vendorId?: string;
  image?: File;
}

/** Request body for create and update — the same fields both ways. */
export function sliderPayloadFromForm(form: SliderFormState, campaignSlug: string | undefined, image?: File | null): SliderPayload {
  return {
    title: form.title,
    subtitle: form.subtitle,
    description: form.description,
    buttonText: form.buttonText,
    // Left empty → the slide follows its tagged vendor / campaign.
    buttonLink: form.buttonLink || sliderAutoLink(form.vendorId, campaignSlug),
    type: form.type,
    vendorId: form.vendorId || undefined,
    ...(image ? { image } : {}),
  };
}

const TEXT_FIELDS = ["title", "subtitle", "description", "buttonText", "buttonLink"] as const;

/**
 * Multipart body for POST (create) and PUT (update).
 *   create — empty text fields are left out (unchanged behaviour).
 *   update — every text field the form holds is sent, including "", so a
 *            cleared title/subtitle/description/button text is saved; the
 *            image is sent only when a new file was chosen (the current
 *            image is kept otherwise).
 */
export function buildSliderFormData(body: SliderPayload, mode: "create" | "update"): FormData {
  const fd = new FormData();
  if (body.image) fd.append("image", body.image);
  for (const key of TEXT_FIELDS) {
    const v = body[key];
    if (mode === "update" ? v !== undefined : !!v) fd.append(key, v as string);
  }
  if (body.type) fd.append("type", body.type);
  if (body.vendorId) fd.append("vendorId", String(body.vendorId));
  return fd;
}
