"use client";

// Vendor → Advertisements → campaign details (frontend-only preview).
import { useParams } from "next/navigation";
import { VendorAdDetailsScreen } from "@/components/ads/VendorAdsScreens";

export default function AdvertisementDetailsPage() {
  const { id } = useParams<{ id: string }>();
  return <VendorAdDetailsScreen id={id} />;
}
