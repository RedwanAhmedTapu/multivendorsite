// tests/support/vendor-drawer-harness.mjs
//
// jsdom + real RTK Query store for rendering the vendor order drawer with a
// stubbed backend (GET /api/vendor-orders/VO1 answers `vendorOrder`).
// Extracted from vendor-cod-confirm-dialog.test.mjs so several tests share it.
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { format } from "node:util";

const require = createRequire(import.meta.url);
let JSDOM = null;
try {
  ({ JSDOM } = require("jsdom"));
} catch {
  JSDOM = null;
}
export const skip = JSDOM ? false : "jsdom is not installed (it is only a transitive dependency)";

export async function withDom(vendorOrder, fn, extraRoutes = () => null) {
  const dom = new JSDOM("<!doctype html><html><body><div id=root></div></body></html>", { url: "http://localhost:3000/vendor-dashboard/orders", pretendToBeVisual: true });
  const g = globalThis;
  const saved = {};
  const setGlobal = (k, v) => {
    saved[k] = Object.getOwnPropertyDescriptor(g, k);
    Object.defineProperty(g, k, { value: v, configurable: true, writable: true });
  };
  for (const k of ["window", "document", "navigator", "HTMLElement", "Node", "Element", "MutationObserver", "getComputedStyle", "Event", "CustomEvent", "MouseEvent", "KeyboardEvent", "FocusEvent", "PointerEvent", "NodeFilter", "localStorage"]) {
    setGlobal(k, k === "window" ? dom.window : dom.window[k]);
  }
  setGlobal("requestAnimationFrame", (cb) => setTimeout(cb, 0));
  setGlobal("cancelAnimationFrame", clearTimeout);
  for (const k of Object.getOwnPropertyNames(dom.window)) {
    if (/^(HTML|SVG)\w*Element$|^(DocumentFragment|ShadowRoot|Text|Range|Selection|DOMRect)$/.test(k) && !(k in saved)) setGlobal(k, dom.window[k]);
  }
  g.IS_REACT_ACT_ENVIRONMENT = true;
  const errors = [];
  const realError = console.error;
  console.error = (...a) => errors.push(format(...a));
  const realFetch = g.fetch;
  const calls = [];
  g.fetch = async (input, init) => {
    const req = input instanceof Request ? input : new Request(input, init);
    const url = new URL(req.url);
    const body = req.method === "GET" ? null : await req.text().then((t) => (t ? JSON.parse(t) : null));
    calls.push({ method: req.method, path: url.pathname, body });
    if (req.method === "GET" && url.pathname === "/api/vendor-orders/VO1") return Response.json({ success: true, data: vendorOrder });
    if (req.method === "PATCH" && url.pathname === "/api/vendor-orders/VO1/confirm-cod") return Response.json({ success: true, data: { success: true } });
    const extra = await extraRoutes(req.method, url, body);
    if (extra) return Response.json(extra[1], { status: extra[0] });
    return Response.json({ success: false, message: `unexpected ${req.method} ${url.pathname}` }, { status: 404 });
  };

  // Import AFTER the DOM globals exist (Radix decides its layout-effect hook at load time).
  const React = await import("react");
  const { act } = React;
  const { createRoot } = await import("react-dom/client");
  const { Provider } = await import("react-redux");
  const { configureStore } = await import("@reduxjs/toolkit");
  const { vendorOrderApi } = await import("../../src/features/vendorOrderApi.ts");
  const authReducer = (await import("../../src/features/authSlice.ts")).default;
  const store = configureStore({
    reducer: { auth: authReducer, [vendorOrderApi.reducerPath]: vendorOrderApi.reducer },
    middleware: (gd) => gd({ serializableCheck: false, immutableCheck: false }).concat(vendorOrderApi.middleware),
  });

  let root;
  const run = async (f) => {
    try {
      await act(f);
    } catch (err) {
      for (const e of err?.errors ?? [err]) errors.push(String(e?.message ?? e));
    }
  };
  const settle = async () => {
    for (let i = 0; i < 4; i++) await run(() => new Promise((r) => setTimeout(r, 30)));
  };
  const doc = dom.window.document;
  const ui = {
    doc,
    errors,
    calls,
    text: () => doc.body.textContent,
    button: (label) => [...doc.querySelectorAll("button")].find((b) => b.textContent.trim().startsWith(label)),
    click: async (el) => {
      assert.ok(el, "element to click exists");
      await run(async () => el.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true })));
      await settle();
    },
    type: async (el, value) => {
      assert.ok(el, "input exists");
      await run(async () => {
        Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, "value").set.call(el, value);
        el.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
      });
      await settle();
    },
    render: async (element) => {
      root = createRoot(doc.getElementById("root"));
      await run(async () => root.render(React.createElement(Provider, { store }, element)));
      await settle();
    },
  };
  try {
    await fn(ui, React);
  } finally {
    if (root) {
      try {
        await act(async () => root.unmount());
      } catch {
        /* ignore */
      }
    }
    await new Promise((r) => setTimeout(r, 60)); // Radix restores focus on a timer after unmount
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
