"use client";

// Route: /vendor-dashboard/chat/notification — vendor chat settings (Chat notifications).
// Data is loaded and saved through the chat API; the vendor is the signed-in
// account (server-side), never an id from the page.

import { ChatNotificationSettings } from "@/components/chatbox/settings/ChatNotificationSettings";

export default function Page() {
  return <ChatNotificationSettings />;
}
