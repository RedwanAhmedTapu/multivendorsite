// node --test tests/ — unified admin Live Chat, static checks.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (p) => readFileSync(new URL(`../src/${p}`, import.meta.url), "utf8");
const page = read("app/admin-dashboard/@main/chat/page.tsx");

test("an ADMIN is not blocked: identity comes from /auth/me, and only an EMPLOYEE without a profile is stopped", () => {
  assert.match(page, /const employeeId = me\?\.employeeId \?\? null/);
  assert.match(page, /const employeeWithoutProfile = role === "EMPLOYEE" && !employeeId/);
  assert.ok(!/user\?\.employeeId/.test(page), "never the login-time Redux employeeId");
  assert.ok(!page.includes("backend team"), "the old admin-blocking message is gone");
});

test("tabs and queries follow permissions; the agent tab needs agentManagement (owners pass)", () => {
  assert.match(page, /const canSupport = can\("customerSupport"\)/);
  assert.match(page, /const canAgents = AGENT_CHAT_UI_ENABLED && can\("agentManagement"\)/);
  assert.match(page, /skip: !ready \|\| !canSupport/);
  assert.match(page, /skip: !ready \|\| !canAgents/);
  assert.match(page, /\.\.\.\(canAgents \? \(\[\{ key: "AGENT", label: "Agents" \}\] as const\) : \[\]\)/);
  for (const label of ['label: "All"', 'label: "Customers"', 'label: "Vendors"']) assert.ok(page.includes(label), label);
});

test("agent-vendor conversations open read-only: no composer, a logged-view notice, no assign or status controls", () => {
  assert.match(page, /readOnly: !row\.staffMayWrite/);
  assert.match(page, /readOnly=\{selected\.readOnly\}/);
  assert.match(page, /Every view is logged/);
  assert.match(page, /\{selected\.support && \(/, "the status bar is for support conversations only");
  const box = read("components/chatbox/ChatBox.tsx");
  assert.match(box, /\{!readOnly && \(\s*<div\s+style=\{\{\s*position: "relative",\s*padding: "12px 20px 16px"/);
});

test("ChatBox is unchanged for other callers: the new props are optional and inert when absent", () => {
  const box = read("components/chatbox/ChatBox.tsx");
  assert.match(box, /myEmployeeId\?: string \| null;/);
  assert.match(box, /readOnly\?: boolean;/);
  assert.match(box, /if \(myEmployeeId\) \{/);
  const unified = read("components/chatbox/UnifiedChat.tsx");
  assert.ok(!/myEmployeeId|readOnly/.test(unified), "customer and vendor chat don't pass them");
});

test("New chat offers only what the permissions allow and reuses conversations through the server", () => {
  const dialog = read("components/admin-inbox/NewChatDialog.tsx");
  assert.match(dialog, /canSupport \? \(\["VENDOR", "CUSTOMER"\] as const\) : \[\]/);
  assert.match(dialog, /canAgents \? \(\["AGENT"\] as const\) : \[\]/);
  assert.match(dialog, /useStaffStartMutation/);
  assert.match(dialog, /useOpenAgentChatMutation/);
  const api = read("features/adminInboxApi.ts");
  assert.ok(api.includes("/chat/conversations/staff-lookup") && api.includes("/chat/conversations/staff-start"));
});

test("times are Asia/Dhaka, and agent rows carry names only", () => {
  assert.match(read("components/admin-inbox/InboxBits.tsx"), /const TZ = "Asia\/Dhaka"/);
  const fromAgent = page.slice(page.indexOf("function fromAgent"), page.indexOf("/** The participant-row shape"));
  assert.ok(!/phone|email|address|customer/i.test(fromAgent), "no customer data in agent rows");
});
