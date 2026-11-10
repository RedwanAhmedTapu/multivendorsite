"use client";

// Route: /vendor-dashboard/chat
// Vendor সব customer-এর সাথে product নিয়ে যে চ্যাট করে, সেগুলোর তালিকা +
// থ্রেড এখানে দেখাবে। কোনো otherParticipant/productId পাস করা হচ্ছে না —
// তাই component সরাসরি "list" ভিউতে খুলবে, ChatList থেকে বেছে নিলে থ্রেড খুলবে।

import { useSelector } from "react-redux";
import { redirect } from "next/navigation";
import { RootState } from "@/store/store";
import UnifiedChat from "@/components/chatbox/UnifiedChat";

export default function VendorLiveChatPage() {
   const user = useSelector((state: RootState) => state.auth.user);
  const accessToken = useSelector((state: RootState) => state.auth.accessToken);
  const vendorId = user?.vendorId;

  if (!user || !vendorId || !accessToken) redirect("/vendor/login");


  return (
    <UnifiedChat
      layout="fullscreen"
      role="VENDOR"
      currentVendorId={vendorId}
      accessToken={accessToken}
    />
  );
}