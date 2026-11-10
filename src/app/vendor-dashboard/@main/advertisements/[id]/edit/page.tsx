"use client";

// Vendor → Advertisements → edit (frontend-only preview; nothing is saved).
import { useParams } from "next/navigation";
import { VendorAdEditScreen } from "@/components/ads/VendorAdsScreens";

export default function EditAdvertisementPage() {
  const { id } = useParams<{ id: string }>();
  return <VendorAdEditScreen id={id} />;
}
