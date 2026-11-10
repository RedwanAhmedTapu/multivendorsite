"use client";

// Route: /vendor-dashboard/support  (সাইডবার-এ "Contact Admin")
// Vendor এখানে সরাসরি admin support-এর সাথে চ্যাট করবে। otherParticipant
// হিসেবে একটা fixed "admin support" pseudo-participant পাঠানো হচ্ছে।
//
// ⚠️ ব্যাকএন্ড কন্ট্র্যাক্ট (chat.service.ts + schema.prisma অনুযায়ী):
// - "support-inbox" কোনো real Employee.id নয়, তাই এই id সরাসরি
//   ConversationParticipant.employeeId (FK) এ লেখা যাবে না — DB-তে
//   foreign key constraint violation (P2003) হবে।
// - findOrCreateConversation endpoint ব্যবহার করছি, যার otherParticipant
//   shape (id/type/displayName/displayImage) ব্যাকএন্ডে virtual participant
//   হিসেবে হ্যান্ডল হওয়ার কথা: employeeId = null রেখে displayName/displayImage
//   কলামে বসিয়ে দেওয়া হবে, আর real admin assign হবে ConversationAssignment
//   দিয়ে পরে (assign endpoint)।
// - এটা কার্যকর হওয়ার জন্য ব্যাকএন্ডের createConversation/findOrCreateConversation-এ
//   virtual-participant branch থাকা আবশ্যক। এই ফ্রন্টএন্ড ফাইল একা যথেষ্ট না।

import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import UnifiedChat from "@/components/chatbox/UnifiedChat";
import type { FindOrCreateConversationRequest } from "@/features/chatApi";

const SUPPORT_ADMIN_PARTICIPANT: FindOrCreateConversationRequest["otherParticipant"] = {
  id: "support-inbox", // ব্যাকএন্ডে virtual/unassigned sentinel হিসেবে হ্যান্ডল করা হবে
  type: "ADMIN",
  displayName: "Finixmart Support",
  displayImage: null,
};

export default function VendorSupportChatPage() {
  const { accessToken, vendor } = useSelector((s: RootState) => s.auth) as {
    accessToken: string;
    vendor?: { id: string };
  };

  if (!vendor?.id) return null;

  return (
    <UnifiedChat
      layout="fullscreen"
      role="VENDOR"
      currentVendorId={vendor.id}
      accessToken={accessToken}
      conversationType="VENDOR_SUPPORT" // ✅ FIX: "SUPPORT" এই enum value schema.prisma-তে নেই
      otherParticipant={SUPPORT_ADMIN_PARTICIPANT}
    />
  );
}