// tests/customer-returns-page.test.mjs
//
// The customer returns page must never claim a return request was submitted:
// there is no backend for customer returns. The page used to fake a submit
// (1.2 s timeout → "Return request submitted" + a random RET- reference).
// It now shows an honest "not available online" notice with a support link.
//   node --test tests/customer-returns-page.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { register } from "node:module";

register("./support/tsx-loader.mjs", import.meta.url);

const PAGE = "../src/app/user-dashboard/@main/orders/returns/page.tsx";
const src = readFileSync(new URL(PAGE, import.meta.url), "utf8");

test("returns page renders an unavailable/support notice — no form, no submit, no success claim", async () => {
  const React = await import("react");
  const { renderToStaticMarkup } = await import("react-dom/server");
  const realFetch = globalThis.fetch;
  let fetches = 0;
  globalThis.fetch = async () => (fetches++, new Response("{}"));
  try {
    const { default: ReturnOrderPage } = await import(PAGE);
    const html = renderToStaticMarkup(React.createElement(ReturnOrderPage));
    const text = html.replace(/<[^>]+>/g, " ").replace(/&#x27;|&apos;/g, "'").replace(/\s+/g, " ");

    assert.match(text, /Return requests can't be submitted online yet/);
    assert.match(text, /contact FinixMart support/i);
    assert.match(text, /no return has been requested yet/);
    assert.match(html, /href="\/help-center"/, "support link");
    assert.match(html, /href="\/user-dashboard\/orders"/, "back to my orders");

    assert.doesNotMatch(text, /Return request submitted|has been received|RET-\d/i, "never claims a submission");
    assert.doesNotMatch(text, /Submit return request|Submitting/i, "no submit action");
    assert.doesNotMatch(html, /<form|<button|<input|<textarea/i, "no form controls that look like a working request");
    assert.doesNotMatch(text, /within 7 days|5–7 business days/, "no unverified return-policy promises");
    assert.equal(fetches, 0, "no API call");
  } finally {
    globalThis.fetch = realFetch;
  }
});

test("returns page source has no fake submission path", () => {
  assert.doesNotMatch(src, /setTimeout|Math\.random|setSubmitted|handleSubmit/, "no simulated submit");
  assert.doesNotMatch(src, /useGetOrderByIdQuery|useParams/, "no order lookup on a route without an order id");
});
