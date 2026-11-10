// tests/vendor-cod-confirm-dialog.test.mjs
//
// Runtime check of the vendor's manual COD confirmation dialog for an
// ELIGIBLE (low-risk, codReviewRequired: false) PENDING COD order: the REAL
// VendorOrderDetailDrawer is rendered with the real RTK Query store in jsdom
// (network stubbed via fetch), "Manually Confirm COD" opens the dialog, the
// "Verified by" input (the shadcn <Input>) accepts a name, and Confirm sends
// PATCH /api/vendor-orders/VO1/confirm-cod with exactly
// { confirmedByName, note? }. Regression: the dialog used <Input> without
// importing it, so opening it threw "Input is not defined".
//   node --test tests/vendor-cod-confirm-dialog.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";
import { register, createRequire } from "node:module";
import { format } from "node:util";

register("./support/tsx-loader.mjs", import.meta.url);
const require = createRequire(import.meta.url);

let JSDOM = null;
try {
  ({ JSDOM } = require("jsdom"));
} catch {
  JSDOM = null;
}
const skip = JSDOM ? false : "jsdom is not installed (it is only a transitive dependency)";

/** A low-risk PENDING COD vendor order (the server says no fraud review is needed). */
const VENDOR_ORDER = {
  id: "VO1",
  orderId: "O1",
  vendorId: "V1",
  status: "PENDING",
  fulfillmentStatus: "UNFULFILLED",
  subtotal: "1000",
  shippingCost: "60",
  createdAt: "2026-10-18T08:00:00.000Z",
  shippedAt: null,
  deliveredAt: null,
  cancelledAt: null,
  codReviewRequired: false,
  // What GET /vendor-orders/:id derives for this order (low risk, stock reserved).
  vendorActions: { nextStatus: null, canConfirmCod: true, canMarkForDelivery: false, canConfirmReturn: false, notes: [] },
  courierOrders: [],
  returns: [],
  vendor: { id: "V1", storeName: "Store One" },
  items: [
    {
      id: "OI1",
      quantity: 1,
      price: "1000",
      variant: { id: "VAR1", sku: "SKU-1", name: null, price: "1000", product: { id: "P1", name: "Phone X", slug: "phone-x", images: [] }, images: [] },
      allocations: [],
    },
  ],
  order: {
    id: "O1",
    orderNumber: "ORD-1",
    status: "PENDING",
    paymentStatus: "PENDING",
    paymentmethod: "COD",
    totalAmount: "1060",
    createdAt: "2026-10-18T08:00:00.000Z",
    confirmedAt: null,
    payments: [],
    user: { id: "U1", name: "Customer", email: null, phone: "01700000000" },
    address: { receiverFullName: "Customer", phone: "01700000000", address: "House 1", city: "Dhaka", landmark: null, location: { name: "Dhanmondi" } },
  },
};

async function withDom(fn) {
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
    if (req.method === "GET" && url.pathname === "/api/vendor-orders/VO1") return Response.json({ success: true, data: VENDOR_ORDER });
    if (req.method === "PATCH" && url.pathname === "/api/vendor-orders/VO1/confirm-cod") return Response.json({ success: true, data: { success: true } });
    return Response.json({ success: false, message: `unexpected ${req.method} ${url.pathname}` }, { status: 404 });
  };

  // Import AFTER the DOM globals exist (Radix decides its layout-effect hook at load time).
  const React = await import("react");
  const { act } = React;
  const { createRoot } = await import("react-dom/client");
  const { Provider } = await import("react-redux");
  const { configureStore } = await import("@reduxjs/toolkit");
  const { vendorOrderApi } = await import("../src/features/vendorOrderApi.ts");
  const authReducer = (await import("../src/features/authSlice.ts")).default;
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

test("eligible low-risk COD order: the dialog opens, takes the verifier's name and sends the confirmation", { skip }, async () => {
  await withDom(async (ui, React) => {
    const { VendorOrderDetailDrawer } = await import("../src/app/vendor-dashboard/@main/orders/components/VendorOrderDetailDrawer.tsx");
    await ui.render(React.createElement(VendorOrderDetailDrawer, { vendorOrderId: "VO1", onClose: () => {} }));
    assert.ok(ui.text().includes("ORD-1") || ui.text().includes("VO1") || ui.text().includes("Phone X"), "the drawer loaded the order");
    assert.ok(!ui.text().includes("Awaiting FinixMart review"), "low-risk: no fraud-review notice");

    await ui.click(ui.button("Manually Confirm COD"));
    const dialog = ui.doc.querySelector('[role="dialog"]:last-of-type');
    const nameInput = [...ui.doc.querySelectorAll('[role="dialog"] input')].find((i) => i.placeholder === "Your name");
    assert.ok(nameInput, "the 'Verified by' input renders inside the dialog");
    assert.deepEqual(ui.errors.filter((m) => /Input is not defined|is not defined/.test(m)), [], "no ReferenceError while rendering the dialog");

    await ui.type(nameInput, "  Rahim (store staff) ");
    const confirm = [...dialog.querySelectorAll("button")].find((b) => /^Confirm/.test(b.textContent.trim()));
    await ui.click(confirm);

    const patches = ui.calls.filter((c) => c.method === "PATCH");
    assert.deepEqual(patches.map((c) => c.path), ["/api/vendor-orders/VO1/confirm-cod"]);
    assert.deepEqual(patches[0].body, { confirmedByName: "Rahim (store staff)" }, "trimmed name; empty note omitted");
    assert.deepEqual(ui.errors.filter((m) => !/not wrapped in act|ReactDOMTestUtils|Warning: Missing `Description`|aria-describedby/.test(m)), []);
  });
});
