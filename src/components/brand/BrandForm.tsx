"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Building2,
  ShieldCheck,
  CalendarDays,
  Loader2,
  Globe,
  Facebook,
  Instagram,
  Youtube,
  Link2,
  Search,
  Check,
  X,
  Sparkles,
} from "lucide-react";
import {
  useCreateBrandMutation,
  useUpdateBrandMutation,
  useGetBrandCatalogQuery,
} from "@/features/brandApi";
import type { Brand, BrandRelationship, BrandLinkInput } from "@/types/brand";
import {
  SectionCard,
  FieldLabel,
  FieldError,
  Toggle,
  RadioOption,
} from "./BrandformShared";
import BrandDocumentUploader from "./BranddocumentUploader";
import { toast } from "sonner";

const RELATIONSHIP_OPTIONS: { value: BrandRelationship; label: string }[] = [
  { value: "BRAND_OWNER", label: "Brand Owner" },
  { value: "EXCLUSIVE_DISTRIBUTOR", label: "Exclusive Distributor" },
  { value: "NON_EXCLUSIVE_DISTRIBUTOR", label: "Non-Exclusive Distributor" },
  { value: "RESELLER", label: "Reseller" },
];

// ─── Link platforms ─────────────────────────────────────────────────────
// Each platform maps to a LinkType value on the backend. "type" here must
// match whatever your Prisma LinkType enum + types/brand.ts LinkType union
// declare — update both together if you rename/add a platform.
type LinkPlatformKey = "website" | "facebook" | "x" | "instagram" | "youtube";

const XIcon = ({ size = 15 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M4 4L20 20M20 4L4 20"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
    />
  </svg>
);

const LINK_PLATFORMS: {
  key: LinkPlatformKey;
  type: BrandLinkInput["type"];
  label: string;
  placeholder: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
}[] = [
  {
    key: "website",
    type: "OFFICIAL_WEBSITE",
    label: "Website",
    placeholder: "https://yourbrand.com",
    icon: <Globe size={15} />,
    iconBg: "#EFF6FF",
    iconColor: "#1D4ED8",
  },
  {
    key: "facebook",
    type: "FACEBOOK",
    label: "Facebook",
    placeholder: "https://facebook.com/yourbrand",
    icon: <Facebook size={15} />,
    iconBg: "#E7F0FE",
    iconColor: "#1877F2",
  },
  {
    key: "x",
    type: "X",
    label: "X (Twitter)",
    placeholder: "https://x.com/yourbrand",
    icon: <XIcon size={14} />,
    iconBg: "#F1F1F1",
    iconColor: "#0F172A",
  },
  {
    key: "instagram",
    type: "INSTAGRAM",
    label: "Instagram",
    placeholder: "https://instagram.com/yourbrand",
    icon: <Instagram size={15} />,
    iconBg: "#FDECF3",
    iconColor: "#E1306C",
  },
  {
    key: "youtube",
    type: "YOUTUBE",
    label: "YouTube",
    placeholder: "https://youtube.com/@yourbrand",
    icon: <Youtube size={15} />,
    iconBg: "#FDEAEA",
    iconColor: "#FF0000",
  },
];

type LinkValues = Record<LinkPlatformKey, string>;

const EMPTY_LINKS: LinkValues = {
  website: "",
  facebook: "",
  x: "",
  instagram: "",
  youtube: "",
};

// Build the {website, facebook, x, instagram, youtube} form state from
// whatever BrandLink[] came back from the API (edit mode).
const linksToFormValues = (links?: Brand["links"]): LinkValues => {
  if (!links || links.length === 0) return { ...EMPTY_LINKS };
  const values = { ...EMPTY_LINKS };
  for (const platform of LINK_PLATFORMS) {
    const match = links.find((l) => l.type === platform.type);
    if (match) values[platform.key] = match.url;
  }
  return values;
};

// Build the BrandLinkInput[] payload from form state — empty fields are
// dropped so we don't submit blank links.
const formValuesToLinks = (values: LinkValues): BrandLinkInput[] => {
  return LINK_PLATFORMS.filter((platform) =>
    values[platform.key].trim()
  ).map((platform) => ({
    type: platform.type,
    title: platform.label,
    url: values[platform.key].trim(),
  }));
};

const isValidUrl = (value: string) => {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

// ─── Brand name selector ────────────────────────────────────────────────
// Searchable dropdown backed by the brand-catalog list (useGetBrandCatalogQuery).
// Vendors can pick an existing catalog name, or — if nothing matches — keep
// typing and submit a brand-new name (which becomes the value we send with
// createBrand/updateBrand, exactly like the plain text input used to).
function BrandNameSelector({
  value,
  onChange,
  hasError,
}: {
  value: string;
  onChange: (value: string) => void;
  hasError?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [debouncedSearch, setDebouncedSearch] = useState(value);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Debounce so we don't fire a catalog request on every keystroke.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(value.trim()), 250);
    return () => clearTimeout(t);
  }, [value]);

  const { data: catalog, isFetching } = useGetBrandCatalogQuery(
    { search: debouncedSearch || undefined, limit: 20 },
    { skip: !isOpen }
  );

  const entries = useMemo(() => catalog ?? [], [catalog]);

  // Is there an exact (case-insensitive) match already in the catalog?
  const exactMatch = useMemo(
    () =>
      entries.some(
        (entry) => entry.name.toLowerCase() === value.trim().toLowerCase()
      ),
    [entries, value]
  );

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handlePick = (name: string) => {
    onChange(name);
    setIsOpen(false);
  };

  return (
    <div style={{ position: "relative" }} ref={wrapperRef}>
      <div style={{ position: "relative" }}>
        <Search
          size={14}
          color="#94A3B8"
          style={{
            position: "absolute",
            left: 10,
            top: "50%",
            transform: "translateY(-50%)",
            pointerEvents: "none",
          }}
        />
        <Input
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="e.g. Samsung"
          style={{
            fontSize: 13,
            paddingLeft: 30,
            paddingRight: value ? 30 : 12,
            borderColor: hasError ? "#FCA5A5" : undefined,
          }}
        />
        {value && (
          <button
            type="button"
            onClick={() => {
              onChange("");
              setIsOpen(true);
            }}
            style={{
              position: "absolute",
              right: 8,
              top: "50%",
              transform: "translateY(-50%)",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 2,
              color: "#94A3B8",
              display: "flex",
              alignItems: "center",
            }}
            aria-label="Clear brand name"
          >
            <X size={13} />
          </button>
        )}
      </div>

      {isOpen && (
        <div
          style={{
            position: "absolute",
            zIndex: 40,
            top: "calc(100% + 4px)",
            left: 0,
            right: 0,
            background: "#fff",
            border: "1px solid #E5EAF2",
            borderRadius: 10,
            boxShadow: "0 8px 30px rgba(37,99,235,0.12), 0 2px 8px rgba(0,0,0,0.08)",
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "8px 12px",
              background: "#F8FAFC",
              borderBottom: "1px solid #E5EAF2",
              fontSize: 10.5,
              fontWeight: 700,
              color: "#7A90AB",
              textTransform: "uppercase",
              letterSpacing: 0.3,
            }}
          >
            {isFetching
              ? "Searching…"
              : value.trim()
              ? `Matches for "${value.trim()}"`
              : "Existing brand names"}
          </div>

          <div style={{ maxHeight: 220, overflowY: "auto" }}>
            {isFetching && (
              <div
                style={{
                  padding: "16px 12px",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 12,
                  color: "#64748B",
                }}
              >
                <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} />
                Loading brand names…
              </div>
            )}

            {!isFetching && entries.length === 0 && (
              <div style={{ padding: "14px 12px", fontSize: 12, color: "#94A3B8" }}>
                No matching brand names found.
              </div>
            )}

            {!isFetching &&
              entries.map((entry, i) => {
                const active = entry.name.toLowerCase() === value.trim().toLowerCase();
                return (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={() => handlePick(entry.name)}
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      textAlign: "left",
                      background: active ? "#EFF6FF" : "none",
                      border: "none",
                      borderBottom: i < entries.length - 1 ? "1px solid #F0F4FA" : "none",
                      cursor: "pointer",
                      fontFamily: "inherit",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 8,
                    }}
                    onMouseEnter={(e) => {
                      if (!active) e.currentTarget.style.background = "#F8FAFC";
                    }}
                    onMouseLeave={(e) => {
                      if (!active) e.currentTarget.style.background = "none";
                    }}
                  >
                    <span style={{ fontSize: 12.5, fontWeight: 600, color: "#0D1B2E" }}>
                      {entry.name}
                    </span>
                    {active && <Check size={13} color="#1D4ED8" />}
                  </button>
                );
              })}
          </div>

          {/* Offer to use the typed name as a brand-new one if it isn't in the catalog yet */}
          {!isFetching && value.trim() && !exactMatch && (
            <button
              type="button"
              onClick={() => handlePick(value.trim())}
              style={{
                width: "100%",
                padding: "10px 12px",
                textAlign: "left",
                background: "#FFFBEB",
                border: "none",
                borderTop: "1px solid #E5EAF2",
                cursor: "pointer",
                fontFamily: "inherit",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <Sparkles size={13} color="#D97706" />
              <span style={{ fontSize: 12, color: "#92400E" }}>
                Use "<strong>{value.trim()}</strong>" as a new brand name
              </span>
            </button>
          )}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function BrandForm({
  brand,
  onSuccess,
  onCancel,
}: {
  brand?: Brand | null;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const isEditMode = !!brand;

  const [name, setName] = useState(brand?.name ?? "");
  const [relationship, setRelationship] = useState<BrandRelationship | "">(
    brand?.relationship ?? ""
  );
  const [authorizationStart, setAuthorizationStart] = useState(
    brand?.authorizationStart ? brand.authorizationStart.slice(0, 10) : ""
  );
  const [hasEndDate, setHasEndDate] = useState(brand?.hasEndDate ?? false);
  const [authorizationEnd, setAuthorizationEnd] = useState(
    brand?.authorizationEnd ? brand.authorizationEnd.slice(0, 10) : ""
  );
  const [authenticationDoc, setAuthenticationDoc] = useState<string | null>(
    brand?.authenticationDoc ?? null
  );
  const [links, setLinks] = useState<LinkValues>(() =>
    linksToFormValues(brand?.links)
  );
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  const [createBrand, { isLoading: isCreating }] = useCreateBrandMutation();
  const [updateBrand, { isLoading: isUpdating }] = useUpdateBrandMutation();
  const isSubmitting = isCreating || isUpdating;

  useEffect(() => {
    if (!hasEndDate) setAuthorizationEnd("");
  }, [hasEndDate]);

  const validate = () => {
    const next: Record<string, boolean> = {};
    if (!name.trim() || name.trim().length < 2) next.name = true;
    if (!relationship) next.relationship = true;
    if (!authorizationStart) next.startDate = true;
    if (hasEndDate && !authorizationEnd) next.endDate = true;
    if (
      hasEndDate &&
      authorizationEnd &&
      authorizationStart &&
      new Date(authorizationEnd) <= new Date(authorizationStart)
    ) {
      next.endDate = true;
    }
    if (!authenticationDoc) next.document = true;

    // Any filled-in link must be a valid http(s) URL
    for (const platform of LINK_PLATFORMS) {
      const value = links[platform.key].trim();
      if (value && !isValidUrl(value)) {
        next[`link_${platform.key}`] = true;
      }
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const clearFieldError = (field: string) => {
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleLinkChange = (key: LinkPlatformKey, value: string) => {
    setLinks((prev) => ({ ...prev, [key]: value }));
    clearFieldError(`link_${key}`);
  };

  const handleSubmit = async () => {
    if (!validate()) {
      toast.error("Please fill in all required fields correctly");
      return;
    }

    const payload = {
      name: name.trim(),
      relationship: relationship as BrandRelationship,
      authorizationStart,
      authorizationEnd: hasEndDate ? authorizationEnd : undefined,
      hasEndDate,
      authenticationDoc: authenticationDoc ?? undefined,
      links: formValuesToLinks(links),
    };

    try {
      if (isEditMode && brand) {
        await updateBrand({ id: brand.id, data: payload }).unwrap();
        toast.success("Brand updated successfully! It will be re-reviewed.");
      } else {
        await createBrand(payload).unwrap();
        toast.success("Brand submitted successfully and is pending approval!");
      }
      onSuccess();
    } catch (err: any) {
      toast.error(
        err?.data?.message || err?.message || "Failed to save brand"
      );
    }
  };

  return (
    <div
      style={{
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
        display: "flex",
        flexDirection: "column",
        gap: 14,
      }}
    >
      {/* ── Brand identity ── */}
      <SectionCard
        icon={
          <Building2
            size={15}
            color={errors.name ? "#DC2626" : "#1D4ED8"}
          />
        }
        title="Brand Identity"
        subtitle="Tell us which brand you're registering"
        badge="required"
        error={!!errors.name}
      >
        <div>
          <FieldLabel
            required
            info="This will be shown as your brand identity across your storefront"
            hint="Search for an existing brand or type to add a new one"
          >
            Brand Name
          </FieldLabel>
          <BrandNameSelector
            value={name}
            onChange={(val) => {
              setName(val);
              clearFieldError("name");
            }}
            hasError={errors.name}
          />
          {errors.name && (
            <FieldError message="Brand name is required (min 2 characters)" />
          )}
        </div>
      </SectionCard>

      {/* ── Relationship ── */}
      <SectionCard
        icon={
          <ShieldCheck
            size={15}
            color={errors.relationship ? "#DC2626" : "#7C3AED"}
          />
        }
        title="Relationship with the Brand"
        subtitle="This will help us verify your document and assign the right tag"
        badge="required"
        error={!!errors.relationship}
      >
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          {RELATIONSHIP_OPTIONS.map((opt) => (
            <RadioOption
              key={opt.value}
              label={opt.label}
              selected={relationship === opt.value}
              onSelect={() => {
                setRelationship(opt.value);
                clearFieldError("relationship");
              }}
            />
          ))}
        </div>
        {errors.relationship && (
          <FieldError message="Please select your relationship with the brand" />
        )}
      </SectionCard>

      {/* ── Authorization validity ── */}
      <SectionCard
        icon={
          <CalendarDays
            size={15}
            color={
              errors.startDate || errors.endDate ? "#DC2626" : "#0891B2"
            }
          />
        }
        title="Authorization Validity"
        subtitle="The period your brand authorization document is valid for"
        badge="required"
        error={!!(errors.startDate || errors.endDate)}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr auto 1fr",
            gap: 14,
            alignItems: "start",
          }}
          className="auth-validity-grid"
        >
          <div>
            <FieldLabel required>Start Date</FieldLabel>
            <Input
              type="date"
              value={authorizationStart}
              onChange={(e) => {
                setAuthorizationStart(e.target.value);
                clearFieldError("startDate");
              }}
              style={{
                fontSize: 13,
                borderColor: errors.startDate ? "#FCA5A5" : undefined,
              }}
            />
            {errors.startDate && (
              <FieldError message="Start date is required" />
            )}
          </div>

          <div style={{ textAlign: "center", paddingTop: 22 }}>
            <FieldLabel>Has End Date</FieldLabel>
            <div style={{ display: "flex", justifyContent: "center" }}>
              <Toggle checked={hasEndDate} onChange={setHasEndDate} />
            </div>
          </div>

          <div>
            <FieldLabel required={hasEndDate}>End Date</FieldLabel>
            <Input
              type="date"
              value={authorizationEnd}
              onChange={(e) => {
                setAuthorizationEnd(e.target.value);
                clearFieldError("endDate");
              }}
              disabled={!hasEndDate}
              style={{
                fontSize: 13,
                opacity: hasEndDate ? 1 : 0.5,
                borderColor: errors.endDate ? "#FCA5A5" : undefined,
              }}
            />
            {errors.endDate && (
              <FieldError message="End date must be a valid date after the start date" />
            )}
          </div>
        </div>
      </SectionCard>

      {/* ── Authentication document ── */}
      <SectionCard
        icon={
          <ShieldCheck
            size={15}
            color={errors.document ? "#DC2626" : "#16A34A"}
          />
        }
        title="Brand Authentication"
        subtitle="Upload a document proving your authorization"
        badge="required"
        error={!!errors.document}
      >
        <FieldLabel
          required
          info="Accepted formats: PDF, JPG, PNG (max 5 MB)"
          hint="Upload a signed letter, certificate, or authorization proof"
        >
          Authentication Document
        </FieldLabel>
        <BrandDocumentUploader
          value={authenticationDoc}
          onChange={(val) => {
            setAuthenticationDoc(val);
            clearFieldError("document");
          }}
        />
        {errors.document && (
          <FieldError message="Authentication document is required" />
        )}
      </SectionCard>

      {/* ── Links ── */}
      <SectionCard
        icon={<Link2 size={15} color="#D97706" />}
        title="Brand Links"
        subtitle="Add your website and social profiles so buyers can verify your brand"
        badge="optional"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {LINK_PLATFORMS.map((platform) => {
            const fieldError = errors[`link_${platform.key}`];
            return (
              <div
                key={platform.key}
                style={{ display: "flex", alignItems: "flex-start", gap: 10 }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: platform.iconBg,
                    color: platform.iconColor,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    marginTop: 1,
                  }}
                  aria-hidden="true"
                >
                  {platform.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Input
                    value={links[platform.key]}
                    onChange={(e) =>
                      handleLinkChange(platform.key, e.target.value)
                    }
                    placeholder={platform.placeholder}
                    style={{
                      fontSize: 13,
                      borderColor: fieldError ? "#FCA5A5" : undefined,
                    }}
                  />
                  {fieldError && (
                    <FieldError
                      message={`Enter a valid ${platform.label} URL`}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </SectionCard>

      {/* ── Actions ── */}
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: 10,
          paddingTop: 4,
        }}
      >
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          style={{
            padding: "9px 20px",
            borderRadius: 9,
            border: "1.5px solid #E5EAF2",
            background: "#fff",
            fontSize: 13,
            fontWeight: 600,
            color: "#64748B",
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
          style={{
            padding: "9px 28px",
            borderRadius: 9,
            border: "none",
            background: isSubmitting
              ? "#CBD5E1"
              : "linear-gradient(135deg,#1D4ED8,#0891B2)",
            color: "#fff",
            fontSize: 13,
            fontWeight: 700,
            cursor: isSubmitting ? "not-allowed" : "pointer",
            fontFamily: "inherit",
            display: "flex",
            alignItems: "center",
            gap: 7,
          }}
        >
          {isSubmitting ? (
            <>
              <Loader2
                size={14}
                style={{ animation: "spin 1s linear infinite" }}
              />
              Saving…
            </>
          ) : isEditMode ? (
            "Save Changes"
          ) : (
            "Submit Brand"
          )}
        </button>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 640px) {
          .auth-validity-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}