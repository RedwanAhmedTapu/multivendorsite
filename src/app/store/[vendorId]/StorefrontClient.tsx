"use client";

// src/app/store/[vendorId]/StorefrontClient.tsx
//
// Public storefront — what a customer lands on after clicking a vendor's
// store name/link from a product detail page. Read-only: no drag-drop, no
// selection rings, no ComponentHandler edit controls, no config panel —
// just the vendor's PUBLISHED decoration rendered with real data.
//
// Split out of page.tsx (which is now a Server Component) so this route
// can carry SEO metadata (generateMetadata + JSON-LD) — a "use client"
// page.tsx can't export generateMetadata, so all the interactive/data
// logic lives here instead, driven by a `vendorId` prop rather than
// useParams().
//
// Data flow:
//   GET /store-decoration/storefront/:vendorId  (public, no auth — see
//   storeEditorApi.ts's getStorefront + the backend's
//   getPublishedDecoration/DECORATION_FULL include) returns the vendor's
//   live StoreDecoration: every visible component, each with its saved
//   config AND its real linked products/categories (not placeholders).
//
// Reuses the EXACT same conversion helpers the admin editor uses
// (resolveModuleMeta / componentToFormData, now in ./decorationShared.ts)
// so a component renders identically here and in the editor's preview —
// no separate "storefront renderer" to keep in sync by hand.

import { useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { Loader2, Store as StoreIcon, AlertTriangle } from "lucide-react";
import { useGetStorefrontQuery } from "@/features/storeEditorApi";
import UnifiedChat from "@/components/chatbox/UnifiedChat"; // ⚠️ adjust path if it lives elsewhere
import { VendorProductsTab } from "./VendorProductsTab";
import {
  resolveModuleMeta,
  componentToFormData,
  DEFAULT_HEADER_FORM_DATA,
} from "../../store-editor/decorationShared";
import { extractHeaderStyles, extractVoucherFormData } from "../../store-editor/PreviewArea";
import { useViewport } from "../../store-editor/Useviewport";

// Same component set as the editor's PreviewArea.tsx COMPONENT_MAP — kept
// as a separate map (rather than importing PreviewArea's, which isn't
// exported and carries editor-only concerns like drag/drop) since this
// page only ever needs the "what does this component look like" part.
import { StoreHeader } from "../../store-editor/componentspreview/StoreHeader";
import { CategoryList } from "../../store-editor/componentspreview/CategoryList";
import { SmartCategory } from "../../store-editor/componentspreview/SmartCategory";
import { ThreeBanners } from "../../store-editor/componentspreview/ThreeBanners";
import { CountdownProducts } from "../../store-editor/componentspreview/CountdownProducts";
import { BannerCarousel } from "../../store-editor/componentspreview/BannerCarosoel";
import { SingleBanner } from "../../store-editor/componentspreview/SingleBanner";
import { FourBanners } from "../../store-editor/componentspreview/FourBanners";
import { FiveBanners } from "../../store-editor/componentspreview/FiveBanners";
import { MultipleBanners } from "../../store-editor/componentspreview/MultipleBanner";
import { ProductsCarousel } from "../../store-editor/componentspreview/ProductCarosoel";
import { ProductRecommendation } from "../../store-editor/componentspreview/ProductRecommendation";
import { SliderProduct } from "../../store-editor/componentspreview/SliderProduct";
import { ThreeColumnsProducts } from "../../store-editor/componentspreview/ThreeColumnsProducts";
import { Voucher } from "../../store-editor/componentspreview/Voucher";
import ProductHighlight from "../../store-editor/componentspreview/ProductHighlight";

const COMPONENT_MAP = {
  categoryBar: StoreHeader,
  brandList: CategoryList,
  categoryAuto: SmartCategory,
  graphicThreeImages: ThreeBanners,
  countdownProduct: CountdownProducts,
  graphicCarousel: BannerCarousel,
  graphicOneImage: SingleBanner,
  fourBannersA: FourBanners,
  fiveBannersA: FiveBanners,
  graphicMultiImages: MultipleBanners,
  carouselProductRecommend: ProductsCarousel,
  productRecommendation: ProductRecommendation,
  sliderRecommend: SliderProduct,
  productPromotion: ProductHighlight,
  threeColumnProducts: ThreeColumnsProducts,
  voucher: Voucher,
} as const;

interface StorefrontClientProps {
  vendorId: string;
  // Passed down from the server page's own fetch, purely so StoreHeader's
  // chat-modal display name/logo can use real data instead of the
  // hardcoded "Store" placeholder the moment we have a real vendor
  // endpoint wired in here (see the TODO further down).
  initialVendor?: { storeName?: string; logo?: string } | null;
}

export default function StorefrontClient({ vendorId, initialVendor }: StorefrontClientProps) {
  const viewMode = useViewport();
  const accessToken = useSelector((s: RootState) => s.auth.accessToken as string) ?? "";

  const [activeTab, setActiveTab] = useState<"store" | "products">("store");
  const [chatOpen, setChatOpen] = useState(false);

  const { data, isLoading, isError } = useGetStorefrontQuery(vendorId, { skip: !vendorId });
  const decoration = data?.data;

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 text-gray-400">
        <Loader2 size={24} className="animate-spin" />
        <p className="text-sm">Loading store…</p>
      </div>
    );
  }

  // No published decoration yet (vendor hasn't published a store layout,
  // or the vendorId is wrong) — a plain fallback instead of a blank page.
  if (isError || !decoration) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 text-center px-4">
        <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center">
          <StoreIcon size={24} className="text-gray-400" />
        </div>
        <p className="text-base font-semibold text-gray-700">This store isn't set up yet</p>
        <p className="text-sm text-gray-400 max-w-sm">
          The seller hasn't published a storefront layout, or this link is no longer valid.
        </p>
      </div>
    );
  }

  const components = [...decoration.components]
    .filter((c) => c.isVisible)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="min-h-screen bg-gray-50">
      {components.length === 0 && (
        <div className="flex items-center gap-2 justify-center py-16 text-gray-400 text-sm">
          <AlertTriangle size={16} />
          This store's layout is empty.
        </div>
      )}

      {components.map((c) => {
        const meta = resolveModuleMeta(c);
        const Comp = meta ? (COMPONENT_MAP as Record<string, any>)[meta.type] : undefined;
        if (!Comp) return null; // unknown/future component type — skip rather than crash the whole page

        const base = meta.type === "categoryBar" ? DEFAULT_HEADER_FORM_DATA : {};
        const formData = { ...base, ...componentToFormData(c) };

        // The Store Header is the only component with tabs/chat — it's
        // also the only one rendered regardless of which tab is active
        // (it's the persistent top band). Every other component is only
        // shown while the "store" tab is active; "products" swaps them
        // all out for VendorProductsTab below.
        if (meta.type === "categoryBar") {
          return (
            <Comp
              key={c.id}
              styles={extractHeaderStyles(formData)}
              viewMode={viewMode}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              onChatClick={() => setChatOpen(true)}
            />
          );
        }

        if (activeTab !== "store") return null;

        if (meta.type === "voucher") {
          return <Comp key={c.id} formData={extractVoucherFormData(formData)} viewMode={viewMode} />;
        }
        return <Comp key={c.id} formData={formData} viewMode={viewMode} />;
      })}

      {activeTab === "products" && <VendorProductsTab vendorId={vendorId} />}

      {/* Chat modal — imports the same UnifiedChat used everywhere else
         (product page popup, dashboard fullscreen inbox, etc.), just
         wrapped in an overlay here since the storefront has nowhere else
         to dock it. */}
      {chatOpen && (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={() => setChatOpen(false)}
        >
          <div onClick={(e) => e.stopPropagation()} className="relative">
            <UnifiedChat
              layout="popup"
              role="USER"
              accessToken={accessToken}
              otherParticipant={{
                id: vendorId,
                type: "VENDOR",
                // TODO: StoreHeader's name/rating/follower-count/logo are
                // still hardcoded ("Ecom", "4.8", "12.5k", a fixed image
                // URL) rather than pulled from real vendor data. Now that
                // the server page.tsx fetches vendor public info for SEO
                // (`initialVendor` above), swap it in here once you
                // confirm the real vendor-info endpoint shape:
                displayName: initialVendor?.storeName || "Store",
              }}
              onClose={() => setChatOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}