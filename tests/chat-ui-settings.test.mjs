// tests/chat-ui-settings.test.mjs
//
// Chat UI redesign + vendor chat settings.
//   1. pure (lib/chat/chat-settings.ts): validation mirrors the backend DTOs;
//      request bodies are whitelisted (never vendorId / scope / counters);
//      platform vs own quick replies are decided from the server row; error
//      copy never echoes server text;
//   2. runtime (jsdom, real store + RTK Query, fetch stubbed — no backend):
//      auto-reply, quick-reply and notification settings load and persist
//      through the real endpoints, with validation, loading, empty, error +
//      retry and 403 states; the composer's quick-reply picker inserts text
//      and writes nothing; ChatList is keyboard-operable with an error state;
//      ChatBox shows no fabricated "Online", a load-error retry, the real
//      sender of platform messages, and the picker only for vendors.
//   ChatBox is rendered with NO access token, so socketService never opens a
//   socket in these tests.
//   node --test tests/chat-ui-settings.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";
import { register, createRequire } from "node:module";
import { format } from "node:util";

register("./support/tsx-loader.mjs", import.meta.url);
const require = createRequire(import.meta.url);
const L = await import("../src/lib/chat/chat-settings.ts");

// ── 1. pure ────────────────────────────────────────────────────────────

test("auto-reply drafts: validation mirrors the backend; the body is whitelisted", () => {
  const d = { ...L.emptyAutoReplyDraft(), name: "  Welcome ", message: " Hi there ", triggerType: "FIRST_MESSAGE" };
  assert.deepEqual(L.validateAutoReplyDraft(d), {});
  const body = L.toAutoReplyPayload(d);
  assert.deepEqual(body, { name: "Welcome", triggerType: "FIRST_MESSAGE", message: "Hi there", messageType: "TEXT", keywords: [], maxTriggersPerConv: 1, isActive: true });
  for (const k of ["vendorId", "scope", "triggerCount", "id"]) assert.ok(!(k in body), `${k} is never sent`);
  const bad = L.validateAutoReplyDraft({ ...d, name: " ", message: "", triggerType: "KEYWORD", keywordsText: " , ", maxTriggersPerConv: "0" });
  assert.deepEqual(Object.keys(bad).sort(), ["keywords", "maxTriggersPerConv", "message", "name"]);
  assert.ok(L.validateAutoReplyDraft({ ...d, name: "x".repeat(121) }).name);
  assert.ok(L.validateAutoReplyDraft({ ...d, triggerType: "AWAY_MODE" }).triggerType, "unsupported triggers aren't offered");
  assert.deepEqual(L.toAutoReplyPayload({ ...d, triggerType: "KEYWORD", keywordsText: "Ship, ship ,delivery" }).keywords, ["Ship", "delivery"]);
  assert.deepEqual(L.SUPPORTED_AUTO_REPLY_TRIGGERS.map((t) => t.value).sort(), ["FIRST_MESSAGE", "KEYWORD"]);
  assert.equal(L.autoReplyToDraft({ triggerType: "INACTIVITY" }).triggerType, "FIRST_MESSAGE");
});

test("quick-reply drafts: validation, whitelisted body, and update clears optional fields", () => {
  const d = { ...L.emptyQuickReplyDraft(), name: "Delivery", content: "1–2 days" };
  assert.deepEqual(L.validateQuickReplyDraft(d), {});
  assert.deepEqual(L.toQuickReplyPayload(d), { name: "Delivery", content: "1–2 days", keywords: [] });
  assert.deepEqual(L.toQuickReplyPayload(d, "update"), { name: "Delivery", content: "1–2 days", keywords: [], shortcut: "", category: "" });
  const bad = L.validateQuickReplyDraft({ ...d, name: "", content: "  ", shortcut: "two words" });
  assert.deepEqual(Object.keys(bad).sort(), ["content", "name", "shortcut"]);
  const body = L.toQuickReplyPayload({ ...d, shortcut: "del" });
  for (const k of ["vendorId", "scope", "employeeId", "usageCount"]) assert.ok(!(k in body));
});

test("quick-reply source is the server row's ownership; error copy never echoes server text", () => {
  assert.equal(L.quickReplySource({ scope: "GLOBAL", vendorId: null }), "platform");
  assert.equal(L.quickReplySource({ scope: "GLOBAL", vendorId: "VB" }), "yours", "a vendor-owned legacy GLOBAL row is not 'FinixMart'");
  assert.equal(L.quickReplySource({ scope: "VENDOR", vendorId: "VA" }), "yours");
  for (const status of [400, 403, 404, 500, 503, "FETCH_ERROR", undefined]) {
    const msg = L.friendlyError({ status, data: { error: "PrismaClientKnownRequestError at db.internal:5432" } });
    assert.ok(msg && !/prisma|5432|internal/i.test(msg), `${status}: ${msg}`);
  }
  assert.equal(L.senderTypeLabel("ADMIN"), "FinixMart Support");
  assert.equal(L.conversationTypeLabel("PRODUCT_INQUIRY"), "Product inquiry");
});

// ── 2. runtime harness ─────────────────────────────────────────────────

let JSDOM = null;
try {
  ({ JSDOM } = require("jsdom"));
} catch {
  JSDOM = null;
}
const skip = JSDOM ? false : "jsdom is not installed (it is only a transitive dependency)";
const API = "/api/chat";

async function render(make, handler, fn, { user = { id: "U_VA", rawId: "U_VA", role: "VENDOR", vendorId: "VA" }, accessToken = "token" } = {}) {
  const dom = new JSDOM("<!doctype html><html><body><div id=root></div></body></html>", { url: "http://localhost:3000/vendor-dashboard/chat", pretendToBeVisual: true });
  const g = globalThis;
  const saved = {};
  const setGlobal = (k, v) => {
    saved[k] = Object.getOwnPropertyDescriptor(g, k);
    Object.defineProperty(g, k, { value: v, configurable: true, writable: true });
  };
  for (const k of ["window", "document", "navigator", "HTMLElement", "Node", "Element", "MutationObserver", "getComputedStyle", "Event", "MouseEvent", "KeyboardEvent", "FocusEvent", "CustomEvent", "PointerEvent", "InputEvent", "NodeFilter", "localStorage", "requestAnimationFrame", "cancelAnimationFrame"])
    setGlobal(k, k === "window" ? dom.window : dom.window[k]);
  for (const k of Object.getOwnPropertyNames(dom.window)) if (/^(HTML|SVG)\w*Element$/.test(k) && !(k in saved)) setGlobal(k, dom.window[k]);
  dom.window.Element.prototype.scrollIntoView = () => {};
  g.IS_REACT_ACT_ENVIRONMENT = true;
  const errors = [];
  const realError = console.error;
  console.error = (...a) => errors.push(format(...a));
  const calls = [];
  const realFetch = g.fetch;
  g.fetch = async (input, init) => {
    const req = input instanceof Request ? input : new Request(input, init);
    const url = new URL(req.url);
    let body = null;
    try {
      body = req.method === "GET" ? null : await req.clone().json();
    } catch {
      body = null;
    }
    calls.push({ method: req.method, path: url.pathname, query: Object.fromEntries(url.searchParams), body });
    const [status, json] = handler(req.method, url.pathname, body, url) ?? [404, { error: "not stubbed" }];
    return new Response(JSON.stringify(json), { status, headers: { "content-type": "application/json" } });
  };
  const React = await import("react");
  const { act } = React;
  const { createRoot } = await import("react-dom/client");
  const { Provider } = await import("react-redux");
  const { configureStore } = await import("@reduxjs/toolkit");
  const { chatApi } = await import("../src/features/chatApi.ts");
  const authReducer = (await import("../src/features/authSlice.ts")).default;
  const store = configureStore({
    reducer: { auth: authReducer, [chatApi.reducerPath]: chatApi.reducer },
    middleware: (gd) => gd({ serializableCheck: false, immutableCheck: false }).concat(chatApi.middleware),
    preloadedState: { auth: { user, accessToken } },
  });
  const root = createRoot(dom.window.document.getElementById("root"));
  const run = async (f) => {
    try {
      await act(f);
    } catch (e) {
      errors.push(String(e?.message || e));
    }
  };
  const wait = (ms) => run(() => new Promise((r) => setTimeout(r, ms)));
  const doc = dom.window.document;
  const setValue = async (el, value) => {
    assert.ok(el, "field exists");
    const proto = el.tagName === "TEXTAREA" ? dom.window.HTMLTextAreaElement.prototype : dom.window.HTMLInputElement.prototype;
    await run(async () => {
      Object.getOwnPropertyDescriptor(proto, "value").set.call(el, value);
      el.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
    });
  };
  const ui = {
    doc,
    calls,
    wait,
    errors,
    text: () => doc.body.textContent.replace(/\s+/g, " "),
    button: (label) => [...doc.querySelectorAll("button")].find((b) => b.textContent.trim().startsWith(label) || b.getAttribute("aria-label") === label),
    byLabel: (label) => doc.getElementById([...doc.querySelectorAll("label")].find((l) => l.textContent.trim().startsWith(label))?.htmlFor ?? "") ?? doc.querySelector(`[aria-label="${label}"]`),
    setValue,
    click: async (el) => {
      assert.ok(el, "element to click exists");
      await run(async () => el.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true })));
      await wait(60);
    },
    submit: async (form) => {
      await run(async () => form.dispatchEvent(new dom.window.Event("submit", { bubbles: true, cancelable: true })));
      await wait(80);
    },
    writes: () => calls.filter((c) => c.method !== "GET"),
  };
  try {
    await run(async () => root.render(React.createElement(Provider, { store }, await make(React))));
    await wait(120);
    await fn(ui);
  } finally {
    await run(async () => root.unmount());
    store.dispatch(chatApi.util.resetApiState());
    console.error = realError;
    g.fetch = realFetch;
    for (const [k, d] of Object.entries(saved)) {
      if (d) Object.defineProperty(g, k, d);
      else delete g[k];
    }
    delete g.IS_REACT_ACT_ENVIRONMENT;
    dom.window.close();
  }
}
const ok = (data) => [200, { success: true, data }];
const noise = (errors) => errors.filter((m) => !/not wrapped in act|ReactDOMTestUtils|Failed to fetch messages/.test(m));

const RULE = (over = {}) => ({ id: "AR1", name: "Welcome", triggerType: "FIRST_MESSAGE", isActive: true, keywords: [], matchType: "CONTAINS", inactivitySeconds: null, message: "Thanks for messaging us!", messageType: "TEXT", mediaUrl: null, scope: "VENDOR", vendorId: "VA", maxTriggersPerConv: 1, cooldownSeconds: 0, triggerCount: 3, ...over });

test("auto replies: own rules load from /mine; create sends a whitelisted body; validation blocks bad input", { skip }, async () => {
  let rules = [RULE(), RULE({ id: "AR2", name: "Shipping", triggerType: "KEYWORD", keywords: ["delivery"], isActive: false })];
  const make = async (React) => React.createElement((await import("../src/components/chatbox/settings/AutoReplySettings.tsx")).AutoReplySettings);
  await render(make, (m, p, body) => {
    if (m === "GET" && p === `${API}/auto-replies/mine`) return ok(rules);
    if (m === "POST" && p === `${API}/auto-replies`) {
      rules = [...rules, { ...RULE({ id: "AR3" }), ...body }];
      return [201, { success: true, data: rules.at(-1) }];
    }
  }, async (ui) => {
    const t = ui.text();
    for (const s of ["Welcome", "First message", "Thanks for messaging us!", "sent 3 times", "Shipping", "Keyword", "delivery", "Off"]) assert.ok(t.includes(s), s);
    assert.ok(!ui.calls.some((c) => c.path === `${API}/auto-replies`), "the trigger-engine list isn't used for management");
    await ui.click(ui.button("New auto reply"));
    const form = ui.doc.querySelector('form[aria-label="New auto reply"]');
    await ui.submit(form);
    assert.deepEqual(ui.writes(), [], "invalid → nothing sent");
    assert.ok(ui.text().includes("Give the rule a name.") && ui.text().includes("Write the reply customers will receive."));
    await ui.setValue(ui.byLabel("Name"), "Order help");
    await ui.click([...ui.doc.querySelectorAll('input[type="radio"]')].find((r) => r.parentElement.textContent.includes("Keyword")));
    await ui.setValue(ui.byLabel("Keywords"), "order, ORDER, status");
    await ui.setValue(ui.byLabel("Reply"), "Share your order number and we'll check.");
    await ui.submit(ui.doc.querySelector('form[aria-label="New auto reply"]'));
    const post = ui.writes()[0];
    assert.equal(post.method, "POST");
    assert.deepEqual(post.body, { name: "Order help", triggerType: "KEYWORD", message: "Share your order number and we'll check.", messageType: "TEXT", keywords: ["order", "status"], maxTriggersPerConv: 1, isActive: true });
    await ui.wait(120);
    assert.ok(ui.text().includes("Auto reply created."));
    assert.ok(ui.text().includes("Order help"), "the list re-fetched");
    assert.deepEqual(noise(ui.errors), []);
  });
});

test("auto replies: toggle, edit and delete persist through PATCH / DELETE; failures show safe copy", { skip }, async () => {
  let rules = [RULE()];
  let failNext = false;
  const make = async (React) => React.createElement((await import("../src/components/chatbox/settings/AutoReplySettings.tsx")).AutoReplySettings);
  await render(make, (m, p, body) => {
    if (m === "GET" && p === `${API}/auto-replies/mine`) return ok(rules);
    if (m === "PATCH" && p === `${API}/auto-replies/AR1`) {
      if (failNext) return [500, { error: "PrismaClientUnknownRequestError: connect ECONNREFUSED 10.0.0.5:5432" }];
      rules = [{ ...rules[0], ...body }];
      return ok(rules[0]);
    }
    if (m === "DELETE" && p === `${API}/auto-replies/AR1`) {
      rules = [];
      return ok(null);
    }
  }, async (ui) => {
    await ui.click(ui.doc.querySelector('[role="switch"][aria-label="Turn off Welcome"]'));
    assert.deepEqual(ui.writes()[0], { method: "PATCH", path: `${API}/auto-replies/AR1`, query: {}, body: { isActive: false } });
    await ui.wait(100);
    assert.ok(ui.text().includes("“Welcome” is off."));
    await ui.click(ui.button("Edit Welcome"));
    await ui.setValue(ui.byLabel("Reply"), "Updated text");
    failNext = true;
    await ui.submit(ui.doc.querySelector('form[aria-label="Edit auto reply"]'));
    assert.ok(ui.text().includes("Couldn't save right now"), ui.text().slice(0, 200));
    assert.ok(!/Prisma|ECONNREFUSED|10\.0\.0\.5/.test(ui.text()), "no internal error text");
    failNext = false;
    await ui.submit(ui.doc.querySelector('form[aria-label="Edit auto reply"]'));
    assert.equal(ui.writes().at(-1).body.message, "Updated text");
    await ui.wait(100);
    await ui.click(ui.button("Delete Welcome"));
    assert.ok(ui.text().includes("Delete “Welcome”?"), "asks first");
    assert.ok(!ui.writes().some((w) => w.method === "DELETE"));
    await ui.click([...ui.doc.querySelectorAll("button")].find((b) => b.textContent.trim() === "Delete"));
    assert.equal(ui.writes().at(-1).method, "DELETE");
    await ui.wait(120);
    assert.ok(ui.text().includes("No auto replies yet"));
    for (const w of ui.writes()) assert.ok(!w.body || (!("vendorId" in w.body) && !("scope" in w.body)), "no ownership fields sent");
  });
});

test("auto replies: error with retry, and 403 for non-owners (no retry, no server text)", { skip }, async () => {
  const make = async (React) => React.createElement((await import("../src/components/chatbox/settings/AutoReplySettings.tsx")).AutoReplySettings);
  let fail = true;
  await render(make, (m, p) => (p === `${API}/auto-replies/mine` ? (fail ? [500, { error: "stack trace at line 42" }] : ok([RULE()])) : undefined), async (ui) => {
    assert.ok(ui.text().includes("Couldn't load auto replies"));
    assert.ok(!ui.text().includes("stack trace"));
    fail = false;
    await ui.click(ui.button("Try again"));
    await ui.wait(100);
    assert.ok(ui.text().includes("Welcome"));
  });
  await render(make, (m, p) => (p === `${API}/auto-replies/mine` ? [403, { error: "Forbidden" }] : undefined), async (ui) => {
    assert.ok(ui.text().includes("Only the store owner can manage auto replies."));
    assert.equal(ui.button("Try again"), undefined);
    assert.equal(ui.button("New auto reply"), undefined);
  }, { user: { id: "E1", role: "EMPLOYEE", vendorId: "VA" } });
});

const QR = (over = {}) => ({ id: "Q1", name: "Delivery time", content: "1–2 days inside Dhaka.", category: "Shipping", shortcut: "delivery", matchType: "CONTAINS", keywords: ["delivery"], scope: "VENDOR", vendorId: "VA", isActive: true, sortOrder: 0, usageCount: 2, ...over });

test("quick replies: own list from GET /chat/quick-replies; create, edit (clears a field), hide and delete persist", { skip }, async () => {
  let items = [QR()];
  const make = async (React) => React.createElement((await import("../src/components/chatbox/settings/QuickReplySettings.tsx")).QuickReplySettings);
  await render(make, (m, p, body) => {
    if (m === "GET" && p === `${API}/quick-replies`) return ok(items);
    if (m === "POST" && p === `${API}/quick-replies`) {
      items = [...items, QR({ id: "Q2", ...body, category: body.category ?? null, shortcut: body.shortcut ?? null })];
      return [201, { success: true, data: items.at(-1) }];
    }
    if (m === "PATCH" && p.startsWith(`${API}/quick-replies/`)) {
      const id = p.split("/").at(-1);
      items = items.map((q) => (q.id === id ? { ...q, ...body } : q));
      return ok(items.find((q) => q.id === id));
    }
    if (m === "DELETE" && p.startsWith(`${API}/quick-replies/`)) {
      items = items.filter((q) => q.id !== p.split("/").at(-1));
      return ok(null);
    }
  }, async (ui) => {
    for (const s of ["Delivery time", "/delivery", "Shipping", "1–2 days inside Dhaka.", "Used 2 times"]) assert.ok(ui.text().includes(s), s);
    await ui.click(ui.button("New quick reply"));
    await ui.setValue(ui.byLabel("Name"), "Returns");
    await ui.setValue(ui.byLabel("Message"), "You can return within 7 days.");
    await ui.submit(ui.doc.querySelector('form[aria-label="New quick reply"]'));
    assert.deepEqual(ui.writes()[0].body, { name: "Returns", content: "You can return within 7 days.", keywords: [] });
    await ui.wait(120);
    assert.ok(ui.text().includes("Returns"));
    await ui.click(ui.button("Edit Delivery time"));
    await ui.setValue(ui.byLabel("Shortcut"), "");
    await ui.submit(ui.doc.querySelector('form[aria-label="Edit quick reply"]'));
    assert.equal(ui.writes().at(-1).method, "PATCH");
    assert.equal(ui.writes().at(-1).body.shortcut, "", "clearing a shortcut is sent");
    await ui.wait(100);
    await ui.click(ui.doc.querySelector('[role="switch"][aria-label="Hide Delivery time in chat"]'));
    assert.deepEqual(ui.writes().at(-1).body, { isActive: false });
    await ui.wait(100);
    await ui.click(ui.button("Delete Returns"));
    const card = [...ui.doc.querySelectorAll("li")].find((li) => li.textContent.includes("Delete “Returns”?"));
    await ui.click([...card.querySelectorAll("button")].find((b) => b.textContent.trim() === "Delete"));
    assert.equal(ui.writes().at(-1).method, "DELETE");
    assert.equal(ui.writes().at(-1).path, `${API}/quick-replies/Q2`);
    for (const w of ui.writes()) assert.ok(!w.body || (!("vendorId" in w.body) && !("scope" in w.body)));
    assert.deepEqual(noise(ui.errors), []);
  });
});

test("notifications: the two honoured settings persist via PATCH; unsupported ones are listed, never saved", { skip }, async () => {
  let settings = { id: "N1", ownerType: "VENDOR", isEnabled: true, soundEnabled: true, vibrationEnabled: true, showPreview: true, showSender: true, eventSettings: {}, quietHoursEnabled: false, quietHoursStart: null, quietHoursEnd: null, quietHoursTz: null };
  const make = async (React) => React.createElement((await import("../src/components/chatbox/settings/ChatNotificationSettings.tsx")).ChatNotificationSettings);
  await render(make, (m, p, body) => {
    if (p !== `${API}/notifications`) return undefined;
    if (m === "PATCH") settings = { ...settings, ...body };
    return ok(settings);
  }, async (ui) => {
    for (const s of ["Message notifications", "Notification sound", "Not available yet", "Away message", "Business hours", "Quiet hours"]) assert.ok(ui.text().includes(s), s);
    assert.equal(ui.doc.querySelectorAll('[role="switch"]').length, 2, "only the two working settings are switches");
    await ui.click(ui.doc.querySelector('[role="switch"][aria-label="Notification sound"]'));
    assert.deepEqual(ui.writes()[0].body, { soundEnabled: false });
    await ui.wait(100);
    await ui.click(ui.doc.querySelector('[role="switch"][aria-label="Message notifications"]'));
    assert.deepEqual(ui.writes()[1].body, { isEnabled: false });
    await ui.wait(100);
    assert.equal(ui.doc.querySelector('[role="switch"][aria-label="Notification sound"]').disabled, true, "sound depends on notifications");
    assert.ok(ui.text().includes("Saved."));
  });
});

test("composer quick-reply picker: platform rows labelled from the server row; picking inserts text and writes nothing", { skip }, async () => {
  const picked = [];
  const make = async (React) => React.createElement((await import("../src/components/chatbox/QuickReplyPicker.tsx")).QuickReplyPicker, { onPick: (c) => picked.push(c), onClose: () => {} });
  await render(make, (m, p, _b, url) => {
    if (p !== `${API}/quick-replies/suggestions`) return undefined;
    const rows = [QR(), QR({ id: "QP", name: "Welcome to FinixMart", content: "Hello from FinixMart", scope: "GLOBAL", vendorId: null, shortcut: null })];
    const q = url.searchParams.get("q");
    return ok(q ? rows.filter((r) => r.name.toLowerCase().includes(q)) : rows);
  }, async (ui) => {
    assert.ok(ui.text().includes("Delivery time") && ui.text().includes("Welcome to FinixMart"));
    const options = [...ui.doc.querySelectorAll(".quick-reply-option")];
    assert.ok(options[1].textContent.includes("FinixMart") && !options[0].textContent.includes("FinixMart"), "only the platform row carries the FinixMart label");
    await ui.setValue(ui.doc.querySelector('[aria-label="Search quick replies"]'), "deliv");
    await ui.wait(300);
    assert.equal(ui.calls.at(-1).query.q, "deliv");
    await ui.click(ui.doc.querySelector(".quick-reply-option"));
    assert.deepEqual(picked, ["1–2 days inside Dhaka."]);
    assert.deepEqual(ui.writes(), [], "picking never sends or edits anything");
    assert.ok(ui.doc.querySelector('a[href="/vendor-dashboard/chat/quick-reply"]'));
  });
});

const CONV = (over = {}) => ({
  id: "P_VA",
  unreadCount: 2,
  isPinned: false,
  lastReadMessageId: null,
  userId: null,
  vendorId: "VA",
  employeeId: null,
  deliveryPersonId: null,
  otherParticipant: { id: "U_C", participantType: "CUSTOMER", displayName: "Rahim", displayImage: null },
  conversation: { id: "C1", type: "PRODUCT_INQUIRY", status: "OPEN", title: null, lastMessageAt: new Date().toISOString(), lastMessageText: "Is this in stock?", lastMessageType: "TEXT", lastSenderId: "U_C", lastSenderType: "CUSTOMER", priority: "NORMAL" },
  ...over,
});

test("chat list: rows are buttons with accessible names; error + retry; settings link only for vendors", { skip }, async () => {
  const selected = [];
  const { ChatList } = await import("../src/components/chatbox/ChatList.tsx");
  let fail = true;
  await render((React) => React.createElement(ChatList, { role: "VENDOR", currentVendorId: "VA", onSelectConversation: (c) => selected.push(c.conversation.id) }), (m, p) =>
    p === `${API}/conversations` ? (fail ? [500, { error: "db exploded" }] : [200, { success: true, data: [CONV()], hasMore: false, nextCursor: null }]) : undefined, async (ui) => {
    assert.ok(ui.text().includes("Couldn't load conversations"));
    assert.ok(!ui.text().includes("db exploded"));
    fail = false;
    await ui.click(ui.button("Try again"));
    await ui.wait(100);
    const row = [...ui.doc.querySelectorAll("button.chat-list-item")][0];
    assert.ok(row, "the conversation row is a button");
    assert.match(row.getAttribute("aria-label"), /Rahim, 2 unread/);
    await ui.click(row);
    assert.deepEqual(selected, ["C1"]);
    assert.ok(ui.doc.querySelector('a[aria-label="Chat settings"][href="/vendor-dashboard/chat/auto-reply"]'));
    await ui.setValue(ui.doc.querySelector('[aria-label="Search conversations"]'), "stock");
    assert.ok(ui.text().includes("Rahim"), "search also matches the last message");
  });
  await render((React) => React.createElement(ChatList, { role: "USER", onSelectConversation: () => {} }), (m, p) => (p === `${API}/conversations` ? [200, { success: true, data: [], hasMore: false, nextCursor: null }] : undefined), async (ui) => {
    assert.equal(ui.doc.querySelector('a[aria-label="Chat settings"]'), null, "customers get no settings link");
    assert.ok(ui.text().includes("No conversations yet"));
  }, { user: { id: "U_C", role: "USER" } });
});

const MSG = (over = {}) => ({ id: "M1", conversationId: "C1", clientId: null, content: "Is this in stock?", messageType: "TEXT", status: "SENT", createdAt: "2026-10-20T08:00:00.000Z", replyToId: null, quickReplyId: null, senderType: "CUSTOMER", senderId: "U_C", senderVendorId: null, senderEmployeeId: null, senderDeliveryPersonId: null, media: null, reactions: [], ...over });

test("chat box: no fabricated 'Online'; load error with retry; platform messages show their real sender; quick replies for vendors only", { skip }, async () => {
  const ChatBox = (await import("../src/components/chatbox/ChatBox.tsx")).default;
  let fail = true;
  const handler = (m, p, _b, url) => {
    if (p === `${API}/messages/conversation/C1`) return fail ? [500, { error: "internal" }] : ok([MSG({ id: "M2", content: "Hi! Our team replies within 2 hours.", senderType: "ADMIN", senderId: null, createdAt: "2026-10-20T08:00:05.000Z" }), MSG()]);
    if (p === `${API}/notifications`) return ok({ isEnabled: true, soundEnabled: false });
    if (p === `${API}/quick-replies/suggestions`) return ok([QR()]);
    if (p === `${API}/read-receipts`) return ok(null);
  };
  await render((React) => React.createElement(ChatBox, { conversation: CONV(), role: "VENDOR", currentVendorId: "VA", onClose: () => {} }), handler, async (ui) => {
    assert.ok(!ui.text().includes("Online"), "no presence claim the client can't back");
    assert.ok(ui.text().includes("Product inquiry"));
    assert.ok(ui.text().includes("Couldn't load messages"));
    assert.ok(!ui.text().includes("No messages yet"), "a failure isn't shown as an empty chat");
    fail = false;
    await ui.click(ui.button("Try again"));
    await ui.wait(150);
    assert.ok(ui.text().includes("Is this in stock?"));
    assert.ok(ui.text().includes("FinixMart Support"), "the platform auto-reply is attributed to FinixMart, not the customer");
    for (const label of ["Back to conversations", "Chat options", "Attach an image", "Insert a quick reply", "Record a voice message"]) assert.ok(ui.button(label), label);
    await ui.click(ui.button("Insert a quick reply"));
    await ui.wait(300);
    await ui.click(ui.doc.querySelector(".quick-reply-option"));
    assert.equal(ui.doc.querySelector('textarea[aria-label="Message"]').value, "1–2 days inside Dhaka.");
    assert.ok(!ui.calls.some((c) => c.method === "POST" && c.path === `${API}/messages`), "inserting doesn't send");
  }, { accessToken: null });
  await render((React) => React.createElement(ChatBox, { conversation: CONV({ otherParticipant: { id: "VA", participantType: "VENDOR", displayName: "Store A", displayImage: null } }), role: "USER", onClose: () => {} }), (m, p) => (p === `${API}/messages/conversation/C1` ? ok([]) : p === `${API}/notifications` ? ok({ isEnabled: true, soundEnabled: true }) : undefined), async (ui) => {
    assert.equal(ui.button("Insert a quick reply"), undefined, "customers have no quick replies");
    assert.ok(ui.text().includes("No messages yet"));
  }, { user: { id: "U_C", role: "USER" }, accessToken: null });
});
