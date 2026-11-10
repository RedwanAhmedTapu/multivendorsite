// tests/product-card-cart.test.mjs
//
// Opt-in Add to Cart on the shared product card. No live API, no live cart:
//   - which action a product gets (lib/product-card/model.ts cardCartAction);
//   - the add flow with MOCKED calls (lib/product-card/cart.ts): signed out →
//     login (+ retry target), success, insufficient stock, auth errors,
//     network failure, preview mode;
//   - the click flow (cardCartClick): the card adds exactly the variant it
//     DISPLAYS (single- or multi-variant); an unidentifiable displayed variant
//     opens the product page with NO request; preview never navigates, adds
//     or opens login;
//   - the REAL card markup: one consistent button label (never "Choose
//     options"), button outside the product link, disabled when confirmed out
//     of stock, label escaping, unchanged link-only card when the button is off;
//   - one-line title truncation (CSS + markup);
//   - the REAL cartWishApi addToCart mutation against a mocked global fetch.
//   node --test tests/product-card-cart.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";
import { register } from "node:module";

register("./support/tsx-loader.mjs", import.meta.url);

const { cardCartAction } = await import("../src/lib/product-card/model.ts");
const cart = await import("../src/lib/product-card/cart.ts");
const { getDefaultProductCardConfig } = await import("../src/lib/product-card/defaults.ts");
const { createElement } = await import("react");
const { renderToStaticMarkup } = await import("react-dom/server");
const { Provider } = await import("react-redux");
const { configureStore } = await import("@reduxjs/toolkit");
const { cartWishApi } = await import("../src/features/cartWishApi.ts");
const { SharedProductCard } = await import("../src/components/product/card/SharedProductCard.tsx");
const { ProductCardConfigProvider } = await import("../src/components/product/card/ProductCardConfigProvider.tsx");

const variant = (over = {}) => ({ id: "v1", price: 2500, specialPrice: 2000, discount: 20, stock: 5, reservedQty: 0, damagedQty: 0, ...over });
const product = (over = {}) => ({
  id: "p1",
  slug: "phone-x",
  name: "Phone X",
  images: [{ url: "http://img/1.jpg", altText: "Phone X" }],
  variants: [variant()],
  vendor: { id: "ven1", storeName: "Finixmart Store", verificationStatus: "VERIFIED" },
  ...over,
});

// ── which action ────────────────────────────────────────────────────────────

test("cardCartAction: adds the DISPLAYED variant (the price shown), never another; unidentifiable → viewProduct; displayed variant sold out → out of stock", async () => {
  const { toProductCardModel, displayedVariant } = await import("../src/lib/product-card/model.ts");
  // Single variant.
  assert.deepEqual(cardCartAction(product()), { kind: "add", productId: "p1", variantId: "v1" });
  assert.deepEqual(cardCartAction(product({ variants: [variant({ stock: undefined, reservedQty: undefined, damagedQty: undefined })] })), { kind: "add", productId: "p1", variantId: "v1" }, "stock unknown → server decides");
  assert.deepEqual(cardCartAction(product({ variants: [variant({ stock: "4" })] })).kind, "add", "numeric strings");

  // Several variants: the card shows the first (API orders by price asc) — that exact one is added.
  const multi = product({
    variants: [
      variant({ id: "cheap", price: 39501, specialPrice: 30366, discount: 23 }),
      variant({ id: "mid", price: 66335, specialPrice: 49481 }),
      variant({ id: "top", price: 115803, specialPrice: 114673 }),
    ],
  });
  const m = toProductCardModel(multi);
  assert.equal(m.priceText, "30,366", "card shows the cheap variant's special price");
  assert.equal(displayedVariant(multi).id, "cheap");
  assert.deepEqual(m.cart, { kind: "add", productId: "p1", variantId: "cheap" }, "adds exactly the displayed variant");
  // Whatever order the payload has, the added variant is the one whose price is displayed.
  const reordered = product({ variants: [variant({ id: "top", price: 115803, specialPrice: 114673 }), variant({ id: "cheap", price: 39501, specialPrice: 30366 })] });
  assert.equal(toProductCardModel(reordered).priceText, "114,673");
  assert.equal(cardCartAction(reordered).variantId, "top", "displayed price ↔ added variant never diverge");
  // A null entry before the displayed variant: display and add both skip it.
  const withNull = product({ variants: [null, variant({ id: "real", price: 900, specialPrice: null })] });
  assert.equal(toProductCardModel(withNull).priceText, "900");
  assert.equal(cardCartAction(withNull).variantId, "real");

  // Displayed variant sold out → disabled (no other variant is substituted).
  assert.deepEqual(cardCartAction(product({ variants: [variant({ stock: 0 })] })), { kind: "outOfStock" });
  assert.deepEqual(cardCartAction(product({ variants: [variant({ stock: 3, reservedQty: 2, damagedQty: 1 })] })), { kind: "outOfStock" }, "stock − reserved − damaged");
  assert.deepEqual(cardCartAction(product({ variants: [variant({ id: "a", stock: 0 }), variant({ id: "b", stock: 9 })] })), { kind: "outOfStock" }, "never switches to another variant");
  // The displayed variant in stock, others sold out → add the displayed one.
  assert.deepEqual(cardCartAction(product({ variants: [variant({ id: "a", stock: 2 }), variant({ id: "b", stock: 0 })] })), { kind: "add", productId: "p1", variantId: "a" });

  // Displayed variant not identifiable → viewProduct (no request ever built).
  for (const [name, p] of [
    ["no variants", product({ variants: [] })],
    ["variants missing", product({ variants: undefined })],
    ["only null variants", product({ variants: [null] })],
    ["campaign payload (no variant id)", product({ variants: [{ price: 100, specialPrice: null, stock: 5 }] })],
    ["empty variant id", product({ variants: [variant({ id: " " })] })],
    ["displayed variant without id, another with id", product({ variants: [{ price: 5, stock: 3 }, variant({ id: "v2" })] })],
    ["price 0", product({ variants: [variant({ price: 0 })] })],
    ["price missing", product({ variants: [variant({ price: null })] })],
    ["price not a number", product({ variants: [variant({ price: "abc" })] })],
    ["campaign payload, sold out", product({ variants: [{ price: 2500, specialPrice: 2000, stock: 0 }] })],
  ]) {
    assert.deepEqual(cardCartAction(p), { kind: "viewProduct" }, name);
  }
  assert.deepEqual(cardCartAction(product({ id: "" })), { kind: "none" }, "no product id → no button");
});

// ── add flow with mocked calls ──────────────────────────────────────────────

function deps(over = {}) {
  const log = { adds: [], logins: [], notes: [] };
  return {
    log,
    deps: {
      preview: false,
      isAuthenticated: true,
      addToCart: async (body) => { log.adds.push(body); return { success: true }; },
      requestLogin: (retry) => log.logins.push(retry),
      notify: (tone, message) => log.notes.push([tone, message]),
      ...over,
    },
  };
}
const target = { productId: "p1", variantId: "v1" };

test("signed in: one request with quantity 1, success message", async () => {
  const { log, deps: d } = deps();
  assert.equal(await cart.cardAddToCart(target, d), "added");
  assert.deepEqual(log.adds, [{ productId: "p1", variantId: "v1", quantity: 1, notes: "" }]);
  assert.deepEqual(log.notes, [["success", "Added to cart!"]]);
  assert.equal(log.logins.length, 0);
});

test("signed out: no request, the login modal opens with the add to retry after login", async () => {
  const { log, deps: d } = deps({ isAuthenticated: false });
  assert.equal(await cart.cardAddToCart(target, d), "login");
  assert.equal(log.adds.length, 0);
  assert.deepEqual(log.logins, [{ kind: "add", productId: "p1", variantId: "v1" }]);
});

test("server errors: insufficient stock shows the server message; 401/403 → session expired + login (no retry); network failure", async () => {
  let { log, deps: d } = deps({ addToCart: async () => { throw { status: 400, data: { success: false, message: "Insufficient stock. Available: 0, Requested: 1" } }; } });
  assert.equal(await cart.cardAddToCart(target, d), "failed");
  assert.deepEqual(log.notes, [["error", "Insufficient stock. Available: 0, Requested: 1"]]);
  assert.equal(log.logins.length, 0);

  for (const status of [401, 403]) {
    ({ log, deps: d } = deps({ addToCart: async () => { throw { status, data: { message: "jwt expired" } }; } }));
    assert.equal(await cart.cardAddToCart(target, d), "failed");
    assert.deepEqual(log.notes, [["error", "Session expired. Please login again."]]);
    assert.deepEqual(log.logins, [null], "login offered, nothing retried automatically");
  }

  ({ log, deps: d } = deps({ addToCart: async () => { throw { status: "FETCH_ERROR", error: "TypeError: Failed to fetch" }; } }));
  await cart.cardAddToCart(target, d);
  assert.match(log.notes[0][1], /Could not reach the server/);

  ({ log, deps: d } = deps({ addToCart: async () => { throw { status: 500, data: {} }; } }));
  await cart.cardAddToCart(target, d);
  assert.deepEqual(log.notes, [["error", "Failed to add to cart"]]);
});

test("preview mode never calls the cart (signed in or not)", async () => {
  for (const isAuthenticated of [true, false]) {
    const { log, deps: d } = deps({ preview: true, isAuthenticated });
    assert.equal(await cart.cardAddToCart(target, d), "preview");
    assert.equal(log.adds.length, 0);
    assert.equal(log.logins.length, 0);
    assert.match(log.notes[0][1], /Preview only/);
  }
});

const unsafeProducts = () => [
  product({ variants: [{ price: 100, stock: 5 }, variant({ id: "v2" })] }),
  product({ variants: [{ price: 100, stock: 5 }] }),
  product({ variants: [variant({ price: 0 })] }),
  product({ variants: [variant({ price: "abc" })] }),
  product({ variants: [] }),
];

test("click, signed in: unidentifiable variant opens the product page with NO cart request; out of stock does nothing", async () => {
  for (const p of unsafeProducts()) {
    const navigations = [];
    const { log, deps: d } = deps({ navigate: (h) => navigations.push(h) });
    assert.equal(await cart.cardCartClick(cardCartAction(p), "/products/phone-x", d), "navigated");
    assert.equal(log.adds.length, 0, "no cart request");
    assert.equal(log.logins.length, 0);
    assert.deepEqual(navigations, ["/products/phone-x"]);
    assert.deepEqual(log.notes, [["info", "Open the product page to add this item to your cart."]]);
  }
  const { log, deps: d } = deps({ navigate: () => assert.fail("must not navigate") });
  assert.equal(await cart.cardCartClick(cardCartAction(product({ variants: [variant({ stock: 0 })] })), "/x", d), "ignored");
  assert.equal(await cart.cardCartClick({ kind: "none" }, "/x", d), "ignored");
  assert.equal(log.adds.length + log.notes.length, 0);
});

test("click, signed out: EVERY clickable card opens the login modal first — no redirect, no cart request", async () => {
  for (const p of [product(), ...unsafeProducts()]) {
    const { log, deps: d } = deps({ isAuthenticated: false, navigate: () => assert.fail("signed out must not redirect to the product page") });
    const action = cardCartAction(p);
    assert.equal(await cart.cardCartClick(action, "/products/phone-x", d), "login");
    assert.equal(log.adds.length, 0, "no request before authentication");
    assert.equal(log.logins.length, 1);
    assert.equal(log.logins[0].kind, action.kind, "the original intent is kept for after login");
  }
  // Out of stock stays disabled: no login modal either.
  const { log, deps: d } = deps({ isAuthenticated: false, navigate: () => assert.fail("no navigation") });
  assert.equal(await cart.cardCartClick(cardCartAction(product({ variants: [variant({ stock: 0 })] })), "/x", d), "ignored");
  assert.equal(log.logins.length, 0);
});

test("click: a single valid variant uses the cart flow (signed out → login with retry target)", async () => {
  const nav = () => assert.fail("must not navigate");
  let { log, deps: d } = deps({ navigate: nav });
  assert.equal(await cart.cardCartClick(cardCartAction(product()), "/products/phone-x", d), "added");
  assert.deepEqual(log.adds, [{ productId: "p1", variantId: "v1", quantity: 1, notes: "" }]);
  ({ log, deps: d } = deps({ isAuthenticated: false, navigate: nav }));
  assert.equal(await cart.cardCartClick(cardCartAction(product()), "/products/phone-x", d), "login");
  assert.deepEqual(log.logins, [{ kind: "add", productId: "p1", variantId: "v1" }]);
  assert.equal(log.adds.length, 0);
});

// ── regression: homepage vs category cards (same shared flow) ───────────────

/**
 * Mirrors CardCartButton: a click runs cardCartClick with the current auth
 * state; requestLogin stores the retry and "opens" the modal; loginSuccess()
 * flips auth on and replays the stored retry (as onLoginSuccess does).
 */
function simulateCard(p, { addToCart, signedIn = false } = {}) {
  const state = { authed: signedIn, modalOpen: false, pending: null, adds: [], navigations: [], notes: [] };
  const run = (action) =>
    cart.cardCartClick(action, `/products/${p.slug}`, {
      preview: false,
      isAuthenticated: state.authed,
      addToCart: addToCart ?? (async (b) => { state.adds.push(b); return { success: true }; }),
      requestLogin: (retry) => { state.pending = retry; state.modalOpen = true; },
      navigate: (h) => state.navigations.push(h),
      notify: (t, m) => state.notes.push([t, m]),
    });
  return {
    state,
    click: () => run(cardCartAction(p)),
    loginSuccess: async () => {
      state.authed = true;
      state.modalOpen = false;
      const retry = state.pending;
      state.pending = null;
      return retry ? run(retry) : null;
    },
  };
}

// Payload shapes as the live APIs return them: homepage "new arrivals" products
// have ONE variant; /category/laptops products have FIVE.
const homepageProduct = () => product({ id: "home-1", slug: "home-item", variants: [variant({ id: "hv1" })] });
const categoryProduct = () =>
  product({ id: "lap-1", slug: "laptop-x", variants: ["a", "b", "c", "d", "e"].map((x, i) => variant({ id: `lv-${x}`, price: 50000 + i * 1000 })) });

test("regression: signed-out click opens the LoginModal on BOTH homepage and category cards (no redirect, no request)", async () => {
  for (const [page, p] of [["homepage", homepageProduct()], ["category", categoryProduct()]]) {
    const card = simulateCard(p);
    assert.equal(await card.click(), "login", page);
    assert.equal(card.state.modalOpen, true, `${page}: login modal opened`);
    assert.deepEqual(card.state.navigations, [], `${page}: no redirect to the product page`);
    assert.deepEqual(card.state.adds, [], `${page}: no cart request before login`);
  }
});

test("after login: the SAME displayed variant is added — single or multi-variant; unidentifiable → product page, no request", async () => {
  const home = simulateCard(homepageProduct());
  await home.click();
  assert.equal(await home.loginSuccess(), "added");
  assert.deepEqual(home.state.adds, [{ productId: "home-1", variantId: "hv1", quantity: 1, notes: "" }]);
  assert.deepEqual(home.state.navigations, []);
  assert.deepEqual(home.state.notes.at(-1), ["success", "Added to cart!"]);

  const cat = simulateCard(categoryProduct());
  assert.equal(await cat.click(), "login");
  assert.deepEqual(cat.state.pending, { kind: "add", productId: "lap-1", variantId: "lv-a" }, "the intended (displayed) variant is remembered");
  assert.equal(await cat.loginSuccess(), "added");
  assert.deepEqual(cat.state.adds, [{ productId: "lap-1", variantId: "lv-a", quantity: 1, notes: "" }], "exactly the displayed variant");
  assert.deepEqual(cat.state.navigations, [], "no redirect to the product page");

  // Retry after login when the variant has meanwhile become invalid: the backend decides, the error is shown.
  const stale = simulateCard(categoryProduct(), { addToCart: async () => { throw { status: 400, data: { message: "This product variant is currently unavailable" } }; } });
  await stale.click();
  assert.equal(await stale.loginSuccess(), "failed");
  assert.deepEqual(stale.state.notes.at(-1), ["error", "This product variant is currently unavailable"]);
  assert.deepEqual(stale.state.navigations, []);

  // Unidentifiable displayed variant: login first, then the product page — never a request.
  for (const p of [product({ slug: "bad", variants: [variant({ price: 0 })] }), product({ slug: "bad", variants: [{ price: 5, stock: 2 }] })]) {
    const c = simulateCard(p);
    assert.equal(await c.click(), "login");
    assert.equal(await c.loginSuccess(), "navigated");
    assert.deepEqual(c.state.adds, []);
    assert.deepEqual(c.state.navigations, ["/products/bad"]);
  }
});

test("signed in: homepage and category cards both add their displayed variant directly (no navigation); API failure shows the server message", async () => {
  for (const [page, p, variantId] of [["homepage", homepageProduct(), "hv1"], ["category", categoryProduct(), "lv-a"]]) {
    const card = simulateCard(p, { signedIn: true });
    assert.equal(await card.click(), "added", page);
    assert.equal(card.state.modalOpen, false);
    assert.deepEqual(card.state.navigations, [], `${page}: never navigates`);
    assert.deepEqual(card.state.adds, [{ productId: p.id, variantId, quantity: 1, notes: "" }], `${page}: displayed variant`);
  }

  const failing = simulateCard(categoryProduct(), {
    signedIn: true,
    addToCart: async () => { throw { status: 400, data: { success: false, message: "Insufficient stock. Available: 0, Requested: 1" } }; },
  });
  assert.equal(await failing.click(), "failed");
  assert.deepEqual(failing.state.notes, [["error", "Insufficient stock. Available: 0, Requested: 1"]]);
  assert.deepEqual(failing.state.navigations, []);

  const offline = simulateCard(categoryProduct(), { signedIn: true, addToCart: async () => { throw { status: "FETCH_ERROR" }; } });
  assert.equal(await offline.click(), "failed");
  assert.match(offline.state.notes[0][1], /Could not reach the server/);

  const soldOut = simulateCard(product({ variants: [variant({ id: "a", stock: 0 }), variant({ id: "b", stock: 5 })] }), { signedIn: true, addToCart: async () => assert.fail("no request") });
  assert.equal(await soldOut.click(), "ignored", "displayed variant sold out: nothing happens (button is disabled)");
});

test("click in the admin preview: never navigates, adds or opens login — for every kind of product", async () => {
  for (const p of [product(), product({ variants: [variant(), variant({ id: "v2" })] }), product({ variants: [{ price: 1 }] })]) {
    for (const isAuthenticated of [true, false]) {
      const { log, deps: d } = deps({ preview: true, isAuthenticated, navigate: () => assert.fail("preview must not navigate") });
      assert.equal(await cart.cardCartClick(cardCartAction(p), "/products/phone-x", d), "preview");
      assert.equal(log.adds.length, 0);
      assert.equal(log.logins.length, 0);
    }
  }
});

// ── the real card ───────────────────────────────────────────────────────────

const store = () =>
  configureStore({
    reducer: { auth: (s = { user: null, accessToken: null }) => s, [cartWishApi.reducerPath]: cartWishApi.reducer },
    middleware: (gDM) => gDM({ serializableCheck: false }).concat(cartWishApi.middleware),
  });

function render(p, { addToCart = false, label, variantStyle, preview = false, context } = {}) {
  const config = getDefaultProductCardConfig();
  config.show.addToCart = addToCart;
  if (label !== undefined) config.addToCart.label = label;
  if (variantStyle) Object.assign(config.addToCart, variantStyle);
  const card = createElement(SharedProductCard, { product: p, preview, context });
  const html = renderToStaticMarkup(createElement(Provider, { store: store() }, createElement(ProductCardConfigProvider, { config }, card)));
  // React 19 hoists an image preload <link> ahead of the markup; drop it so tests see the card root.
  return html.replace(/^(<link rel="preload"[^>]*\/>)+/, "");
}

/** The product <a data-fm-card> element's full markup (first one). */
const productLink = (html) => {
  const start = html.indexOf("<a ");
  let depth = 0;
  const re = /<a\b|<\/a>/g;
  re.lastIndex = start;
  let m;
  while ((m = re.exec(html))) {
    depth += m[0] === "</a>" ? -1 : 1;
    if (depth === 0) return html.slice(start, m.index + 4);
  }
  return html.slice(start);
};

test("button off (default) or not applicable → exactly the link-only card", () => {
  const off = render(product());
  assert.match(off, /^<a [^>]*data-fm-card=""/, "root is the product link");
  assert.doesNotMatch(off, /<button|data-fm-card-root/);
  // Off in settings → link-only card for every kind of product.
  for (const p of [product({ variants: [{ price: 2500, stock: 5 }] }), product({ variants: [variant(), variant({ id: "v2" })] }), product({ variants: [variant({ stock: 0 })] })]) {
    const html = render(p);
    assert.match(html, /^<a [^>]*data-fm-card=""/);
    assert.doesNotMatch(html, /<button|data-fm-card-root/);
  }
  // On, but no product id (no usable link) → no button, link-only markup.
  assert.doesNotMatch(render(product({ id: "" }), { addToCart: true }), /<button|data-fm-card-root/);
});

test("Add to Cart: a real <button> OUTSIDE the product link, label escaped, styling from config", () => {
  const html = render(product(), { addToCart: true, label: "<b>Buy</b>", variantStyle: { variant: "outline", size: "sm", radius: 12, background: "#112233", text: "#ffeedd" } });
  assert.match(html, /^<div [^>]*data-fm-card-root=""/, "root is a div");
  const link = productLink(html);
  assert.match(link, /href="\/products\/phone-x"/);
  assert.match(link, /data-fm-card=""/);
  assert.doesNotMatch(link, /<button/, "the button is not inside the link");
  assert.ok(html.indexOf("<button") > html.indexOf(link) + link.length - 1, "button after the link closes");
  assert.match(html, /<button type="button"[^>]*aria-label="&lt;b&gt;Buy&lt;\/b&gt;: Phone X"/);
  assert.match(html, /&lt;b&gt;Buy&lt;\/b&gt;<\/button>/, "label is text, never markup");
  assert.doesNotMatch(html, /<b>Buy<\/b>/);
  assert.match(html, /border-radius:12px/);
  assert.match(html, /background-color:#112233/);
  assert.match(html, /border-color:#112233/, "outline uses the color for its border");
  assert.match(html, /color:#ffeedd/);
  assert.match(html, /h-8 text-xs/, "small size");
  assert.doesNotMatch(html, /data-fm-cart-preview/, "live card is not in preview mode");
  // Default label.
  assert.match(render(product(), { addToCart: true }), />Add to Cart<\/button>/);
});

test("one consistent label on every card that shows the button — 'Choose options' never appears", () => {
  const cases = {
    add: product(),
    options: product({ variants: [variant(), variant({ id: "v2", price: 2700 })] }),
    noVariantId: product({ variants: [{ price: 2500, specialPrice: 2000, stock: 5 }] }),
    invalidPrice: product({ variants: [variant({ price: 0 })] }),
    outOfStock: product({ variants: [variant({ stock: 0 })] }),
  };
  for (const [name, p] of Object.entries(cases)) {
    for (const label of [undefined, "Buy now"]) {
      const html = render(p, { addToCart: true, label });
      const expected = label ?? "Add to Cart";
      assert.doesNotMatch(html, /Choose options/i, `${name}: no "Choose options"`);
      const buttons = html.match(/<button\b[^>]*>[^<]*<\/button>/g) ?? [];
      assert.equal(buttons.length, 1, `${name}: exactly one button`);
      assert.ok(buttons[0].endsWith(`>${expected}</button>`), `${name}: label "${expected}" (got ${buttons[0]})`);
      const link = productLink(html);
      assert.doesNotMatch(link, /<button/, `${name}: button outside the product link`);
      assert.equal((html.match(/<a\b/g) ?? []).length, 1, `${name}: the product link is the only link`);
    }
  }
  const options = render(cases.options, { addToCart: true });
  assert.match(options, /data-fm-cart="add"/, "multi-variant cards add directly");
  assert.match(options, /data-fm-variant="v1"/, "the displayed (first, cheapest) variant");
  assert.match(options, /aria-label="Add to Cart: Phone X"/);
  assert.doesNotMatch(options, /<button[^>]*\sdisabled=""/);
  const missing = render(cases.noVariantId, { addToCart: true });
  assert.match(missing, /data-fm-cart="viewProduct"/);
  assert.doesNotMatch(missing, /data-fm-variant=/, "no variant id exposed when unidentifiable");
  assert.match(missing, /aria-label="Add to Cart: Phone X — opens the product page to add it"/);

  const oos = render(cases.outOfStock, { addToCart: true });
  assert.match(oos, /<button type="button" disabled=""[^>]*aria-label="Add to Cart: Phone X — out of stock"[^>]*title="Out of stock"[^>]*>Add to Cart<\/button>/);
});

test("preview cards mark the button as preview; storefront context keeps the button", () => {
  assert.match(render(product(), { addToCart: true, preview: true }), /data-fm-cart-preview=""/);
  assert.match(render(product(), { addToCart: true, context: "storefront" }), /<button type="button"/);
});

// ── the real cartWishApi mutation against a mocked fetch ───────────────────

test("RTK: the card flow sends exactly one POST /cart-wish/cart/items with the admin-free shopper token; errors surface", async () => {
  const realFetch = globalThis.fetch;
  const requests = [];
  const queue = [];
  globalThis.fetch = async (input, init) => {
    const req = input instanceof Request ? input : new Request(input, init);
    requests.push({ method: req.method, url: req.url, body: req.method === "GET" ? null : JSON.parse(await req.text()), auth: req.headers.get("authorization") });
    const [status, json] = queue.shift() ?? [200, { success: true, data: {} }];
    return new Response(JSON.stringify(json), { status, headers: { "Content-Type": "application/json" } });
  };
  try {
    const s = configureStore({
      reducer: { auth: (st = { user: { id: "u1" }, accessToken: "shopper-token" }) => st, [cartWishApi.reducerPath]: cartWishApi.reducer },
      middleware: (gDM) => gDM({ serializableCheck: false }).concat(cartWishApi.middleware),
    });
    const addToCart = (body) => s.dispatch(cartWishApi.endpoints.addToCart.initiate(body)).unwrap();
    const notes = [];
    const d = { preview: false, isAuthenticated: true, addToCart, requestLogin: () => {}, notify: (t, m) => notes.push([t, m]) };

    queue.push([201, { success: true, data: { id: "ci1" } }]);
    assert.equal(await cart.cardAddToCart(target, d), "added");
    queue.push([400, { success: false, message: "Insufficient stock. Available: 0, Requested: 1" }]);
    assert.equal(await cart.cardAddToCart(target, d), "failed");
    assert.deepEqual(notes, [["success", "Added to cart!"], ["error", "Insufficient stock. Available: 0, Requested: 1"]]);

    // Preview: nothing reaches fetch.
    const before = requests.length;
    await cart.cardAddToCart(target, { ...d, preview: true });
    assert.equal(requests.length, before, "preview made no request");

    const posts = requests.filter((r) => r.method === "POST");
    assert.equal(posts.length, 2);
    for (const p of posts) {
      assert.equal(new URL(p.url).pathname, "/api/cart-wish/cart/items");
      assert.deepEqual(p.body, { productId: "p1", variantId: "v1", quantity: 1, notes: "" });
      assert.equal(p.auth, "Bearer shopper-token");
    }
  } finally {
    globalThis.fetch = realFetch;
  }
});

test("RTK (category, 5 variants): signed-out click sends nothing; after login the retry POSTs the displayed variant and the cart count refetches", async () => {
  const realFetch = globalThis.fetch;
  const requests = [];
  let countSub = null;
  globalThis.fetch = async (input, init) => {
    const req = input instanceof Request ? input : new Request(input, init);
    const path = new URL(req.url).pathname;
    requests.push({ method: req.method, path, body: req.method === "GET" ? null : JSON.parse(await req.text()) });
    const json = path.endsWith("/count") ? { success: true, data: { count: requests.length } } : { success: true, data: { id: "ci1" } };
    return new Response(JSON.stringify(json), { status: 200, headers: { "Content-Type": "application/json" } });
  };
  try {
    let auth = { user: null, accessToken: null };
    const s = configureStore({
      reducer: { auth: (st = auth, a) => (a.type === "test/login" ? { user: { id: "u1" }, accessToken: "fresh-token" } : st), [cartWishApi.reducerPath]: cartWishApi.reducer },
      middleware: (gDM) => gDM({ serializableCheck: false }).concat(cartWishApi.middleware),
    });
    const addToCart = (body) => s.dispatch(cartWishApi.endpoints.addToCart.initiate(body)).unwrap();
    const card = simulateCard(categoryProduct(), { addToCart });

    assert.equal(await card.click(), "login");
    assert.equal(requests.length, 0, "nothing sent while signed out");

    s.dispatch({ type: "test/login" }); // LoginModal stores the credentials before onLoginSuccess
    countSub = s.dispatch(cartWishApi.endpoints.getCartCount.initiate()); // the header's cart badge
    await countSub;
    assert.equal(await card.loginSuccess(), "added");
    await new Promise((r) => setTimeout(r, 30)); // tag-driven refetch

    const posts = requests.filter((r) => r.method === "POST");
    assert.equal(posts.length, 1);
    assert.equal(posts[0].path, "/api/cart-wish/cart/items");
    assert.deepEqual(posts[0].body, { productId: "lap-1", variantId: "lv-a", quantity: 1, notes: "" }, "the category card's displayed variant");
    const countGets = requests.filter((r) => r.method === "GET" && r.path === "/api/cart-wish/cart/count");
    assert.ok(countGets.length >= 2, "addToCart invalidates the cart count (header badge refetches)");
  } finally {
    countSub?.unsubscribe(); // never leave a live subscription behind (keeps node --test from exiting)
    globalThis.fetch = realFetch;
  }
});

// ── one-line title ──────────────────────────────────────────────────────────

test("title: one line with an ellipsis (no line clamp), configured size / weight / color kept, full name in the tooltip", async () => {
  const { readFileSync } = await import("node:fs");
  const css = readFileSync(new URL("../src/components/product/card/SharedProductCard.module.css", import.meta.url), "utf8");
  const rule = css.match(/\.title \{([^}]*)\}/)[1];
  for (const decl of ["white-space: nowrap", "overflow: hidden", "text-overflow: ellipsis", "min-width: 0", "max-width: 100%", "display: block"]) {
    assert.ok(rule.includes(decl), `.title has ${decl}`);
  }
  for (const decl of ["font-size: var(--fmc-title-m)", "font-weight: var(--fmc-title-weight)"]) assert.ok(rule.includes(decl), `.title keeps ${decl}`);
  assert.doesNotMatch(css, /line-clamp|-webkit-box|--fmc-title-lines/, "no multi-line clamping anywhere in the card CSS");
  for (const sel of [".card {", ".cardBody {", ".content {"]) {
    const block = css.slice(css.indexOf(sel), css.indexOf("}", css.indexOf(sel)));
    assert.ok(block.includes("min-width: 0"), `${sel} min-width: 0 (long titles can't widen grid tracks)`);
  }
  for (const bp of ["768px", "1024px"]) {
    const media = css.slice(css.indexOf(`@media (min-width: ${bp})`));
    assert.match(media, /\.title \{\s*font-size: var\(--fmc-title-[td]\);\s*\}/, `${bp}: only the size changes`);
  }

  const longEn = "Lenovo ThinkPad X1 Carbon Gen 12 Intel Core Ultra 7 155U 32GB RAM 1TB SSD 14 inch 2.8K OLED Touch Laptop";
  const longBn = "স্যামসাং গ্যালাক্সি বুক৪ প্রো ইন্টেল কোর আল্ট্রা ৭ ল্যাপটপ ১৬ জিবি র‍্যাম ৫১২ জিবি এসএসডি";
  for (const name of [longEn, longBn]) {
    const config = getDefaultProductCardConfig();
    config.title.color = "#123456";
    config.title.weight = "bold";
    const html = renderToStaticMarkup(createElement(Provider, { store: store() }, createElement(ProductCardConfigProvider, { config }, createElement(SharedProductCard, { product: product({ name }) }))));
    assert.ok(html.includes(`class="text-gray-800 mb-2 hover:text-teal-700 transition-colors title" style="color:#123456" title="${name}">${name}</h3>`), "full name rendered (CSS truncates) with tooltip + color");
    assert.match(html, /--fmc-title-weight:700/);
  }
});
