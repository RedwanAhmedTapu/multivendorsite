"use client";

// Route: /vendor-dashboard/chat/quick-reply — vendor chat settings (Quick replies).
// Data is loaded and saved through the chat API; the vendor is the signed-in
// account (server-side), never an id from the page.

import { QuickReplySettings } from "@/components/chatbox/settings/QuickReplySettings";

export default function Page() {
  return <QuickReplySettings />;
}
