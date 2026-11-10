"use client";

import UnifiedChat from "@/components/chatbox/UnifiedChat";

interface MessagingPageProps {
  role: "VENDOR" | "ADMIN" | "USER" | "EMPLOYEE" | "DELIVERY";
  currentVendorId?: string;
  accessToken: string;
}

export default function MessagingPage({
  role,
  currentVendorId,
  accessToken,
}: MessagingPageProps) {
  return (
    <UnifiedChat
      layout="fullscreen"
      role={role}
      currentVendorId={currentVendorId}
      accessToken={accessToken}
    />
  );
}