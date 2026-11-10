"use client";

// Route: /vendor-dashboard/chat/auto-reply — vendor chat settings (Auto replies).
// Data is loaded and saved through the chat API; the vendor is the signed-in
// account (server-side), never an id from the page.

import { AutoReplySettings } from "@/components/chatbox/settings/AutoReplySettings";

export default function Page() {
  return <AutoReplySettings />;
}
