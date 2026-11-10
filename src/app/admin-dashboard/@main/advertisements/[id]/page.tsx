"use client";

// Admin → Advertisements → review details (frontend-only; decisions are not saved).
import { useParams } from "next/navigation";
import { AdminAdReviewScreen } from "@/components/ads/AdminAdsScreens";

export default function AdminAdvertisementReviewPage() {
  const { id } = useParams<{ id: string }>();
  return <AdminAdReviewScreen id={id} />;
}
