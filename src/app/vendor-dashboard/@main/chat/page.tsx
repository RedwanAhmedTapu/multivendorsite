
"use client"
import { RootState } from "@/store/store";
import { redirect } from "next/navigation";
import { useSelector } from "react-redux";
import MessagingPage from "@/components/chatbox/MessagingPage";

// app/(vendor-dashboard)/messages/page.tsx
export default function VendorMessagingPage() {
  const user = useSelector((state: RootState) => state.auth.user);
  const accessToken = useSelector((state: RootState) => state.auth.accessToken);

  if (!user || !user.vendorId || !accessToken) redirect("/vendor/login");

  return (
    <MessagingPage
      role="VENDOR"
      currentVendorId={user.vendorId}
      accessToken={accessToken}  
    />
  );
}