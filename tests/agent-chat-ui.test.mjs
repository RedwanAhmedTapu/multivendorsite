// node --test tests/ — agent chat in the existing chat UI (P10), static checks.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (p) => readFileSync(new URL(`../src/${p}`, import.meta.url), "utf8");

test("the agent pieces are gated by NEXT_PUBLIC_AGENT_CHAT_ENABLED and render only for agent conversations", () => {
  const ui = read("lib/agent-chat-ui.tsx");
  assert.match(ui, /AGENT_CHAT_UI_ENABLED = process\.env\.NEXT_PUBLIC_AGENT_CHAT_ENABLED === "true"/);
  assert.match(ui, /type === "AGENT_SUPPORT" \|\| type === "AGENT_VENDOR"/);
  const list = read("components/chatbox/ChatList.tsx");
  assert.match(list, /AGENT_CHAT_UI_ENABLED && \(item\.otherParticipant\?\.participantType as string \| undefined\) === "AGENT" && <AgentChatBadge \/>/);
  assert.match(list, /AGENT_CHAT_UI_ENABLED \? \[\.\.\.allConversations\] : allConversations\.filter\(\(c\) => !isAgentConversation\(c\.conversation\.type\)\)/);
  const box = read("components/chatbox/ChatBox.tsx");
  assert.match(box, /AGENT_CHAT_UI_ENABLED && isAgentConversation\(conversation\.conversation\.type\) && <AgentChatNotice \/>/);
});

test("the staff page reuses the existing UnifiedChat and only the agent admin API", () => {
  const page = read("app/admin-dashboard/@main/agents/messages/page.tsx");
  assert.match(page, /import UnifiedChat from "@\/components\/chatbox\/UnifiedChat"/);
  assert.match(page, /useListAgentChatsQuery/);
  assert.match(page, /AgentChatNotice/);
  assert.ok(!/useGetSupportQueueQuery|chatApi\.endpoints/.test(page));
  const ui = read("components/agent-admin/AgentAdminUI.tsx");
  assert.match(ui, /NEXT_PUBLIC_AGENT_CHAT_ENABLED === "true" \? \[\{ href: "\/admin-dashboard\/agents\/messages", label: "Messages" \}\] : \[\]/);
});
