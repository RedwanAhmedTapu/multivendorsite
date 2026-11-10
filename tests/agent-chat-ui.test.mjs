// node --test tests/ — agent chat in the existing chat UI (P10), static checks.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (p) => readFileSync(new URL(`../src/${p}`, import.meta.url), "utf8");

test("agent chat is on by default (kill switch: \"0\" / \"false\") and the pieces render only for agent conversations", () => {
  const ui = read("lib/agent-chat-ui.tsx");
  assert.match(ui, /AGENT_CHAT_UI_ENABLED = !\/\^\(0\|false\)\$\/i\.test\(\(process\.env\.NEXT_PUBLIC_AGENT_CHAT_ENABLED \?\? ""\)\.trim\(\)\)/);
  const rule = (v) => !/^(0|false)$/i.test((v ?? "").trim());
  for (const v of [undefined, "", "1", "true"]) assert.equal(rule(v), true, String(v));
  for (const v of ["0", "false", "FALSE"]) assert.equal(rule(v), false, String(v));
  assert.match(ui, /type === "AGENT_SUPPORT" \|\| type === "AGENT_VENDOR"/);
  const list = read("components/chatbox/ChatList.tsx");
  assert.match(list, /AGENT_CHAT_UI_ENABLED && \(item\.otherParticipant\?\.participantType as string \| undefined\) === "AGENT" && <AgentChatBadge \/>/);
  assert.match(list, /AGENT_CHAT_UI_ENABLED \? \[\.\.\.allConversations\] : allConversations\.filter\(\(c\) => !isAgentConversation\(c\.conversation\.type\)\)/);
  const box = read("components/chatbox/ChatBox.tsx");
  assert.match(box, /AGENT_CHAT_UI_ENABLED && isAgentConversation\(conversation\.conversation\.type\) && <AgentChatNotice \/>/);
});

test("the old agent messages route redirects to the unified Live Chat page", () => {
  const page = read("app/admin-dashboard/@main/agents/messages/page.tsx");
  assert.match(page, /redirect\("\/admin-dashboard\/chat\?tab=agents"\)/);
  const ui = read("components/agent-admin/AgentAdminUI.tsx");
  assert.match(ui, /AGENT_CHAT_UI_ENABLED \? \[\{ href: "\/admin-dashboard\/agents\/messages", label: "Messages" \}\] : \[\]/);
});
