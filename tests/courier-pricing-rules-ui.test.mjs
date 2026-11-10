// tests/courier-pricing-rules-ui.test.mjs
//
// Courier Pricing Rules admin surface (frontend):
//   - the endpoint slice: routes, methods, tag invalidation, injected into the
//     existing `courierApi` slice rather than a second `createApi`;
//   - vendor-scoped pricing is not accepted from the client;
//   - the admin UI: the Pricing Rules tab, the hooks it uses, the client-side
//     mirror of the backend validation, and the safe-deactivation path;
//   - no rate is ever invented or prefilled client-side.
//
// Source-level checks (the page needs the app's store and API hooks to render,
// which is the same approach as the other UI suites here). Backend contract
// strings are asserted against the routes in
// multivendorbackend/src/routes/courier.routes.ts.
//
// Run with:
//   node --test tests/courier-pricing-rules-ui.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const api = readFileSync(
  new URL("../src/features/courierPricingRulesApi.ts", import.meta.url),
  "utf8"
);
const page = readFileSync(
  new URL("../src/app/admin-dashboard/@main/courier/page.tsx", import.meta.url),
  "utf8"
);

// ── API layer: one shared slice, injected ───────────────────────────────────

test("pricing rules are injected into the existing courierApi slice", () => {
  assert.match(api, /import \{ courierApi, type ApiResponse \} from "\.\/courierApi"/);
  assert.match(api, /courierApi\s*\n?\s*\.enhanceEndpoints\(\{ addTagTypes: \["CourierPricingRules"\] \}\)/);
  assert.match(api, /\.injectEndpoints\(\{/);
  // A second createApi would mean a second reducerPath and a cache the rest of
  // the courier dashboard cannot share.
  assert.doesNotMatch(api, /createApi\(/, "must not create a second API slice");
  assert.doesNotMatch(api, /reducerPath:/, "no new reducerPath declaration");
});

test("every endpoint targets the backend admin route and verb", () => {
  const expected = [
    ["/courier/admin/pricing-rules", "GET"],
    ["/courier/admin/pricing-rules", "POST"],
    ["/courier/admin/pricing-rules/\\$\\{id\\}", "PUT"],
    ["/courier/admin/pricing-rules/\\$\\{id\\}/toggle", "PATCH"],
    ["/courier/admin/pricing-rules/\\$\\{id\\}", "DELETE"],
  ];
  for (const [path, method] of expected) {
    const urlPattern = path.includes("\\$")
      ? new RegExp("url: `" + path + "`,[\\s\\S]{0,80}?method: \"" + method + "\"")
      : new RegExp('url: "' + path + '",[\\s\\S]{0,120}?method: "' + method + '"');
    assert.match(api, urlPattern, `${method} ${path}`);
  }
  // The safe-deactivation verb is a PATCH on /toggle, not a status body.
  assert.doesNotMatch(api, /method: "PATCH",[\s\S]{0,60}?body:/);
});

test("list queries provide per-id and LIST tags; writes invalidate them", () => {
  assert.match(api, /providesTags: \(result\) =>/);
  assert.match(api, /type: "CourierPricingRules" as const,\s*\n\s*id,/);
  assert.match(api, /\{ type: "CourierPricingRules" as const, id: "LIST" \}/);

  // create -> list only; update/toggle/delete -> list + the affected row.
  assert.match(
    api,
    /createPricingRule[\s\S]*?invalidatesTags: \[\{ type: "CourierPricingRules", id: "LIST" \}\]/
  );
  const perIdInvalidations = api.match(
    /invalidatesTags: \(result, error, \{ id \}\) => \[\s*\n\s*\{ type: "CourierPricingRules", id: "LIST" \},\s*\n\s*\{ type: "CourierPricingRules", id \},/g
  );
  assert.equal(
    perIdInvalidations?.length,
    3,
    "update, toggle and delete each invalidate the list and the row"
  );
});

test("all six hooks are exported for the UI", () => {
  for (const hook of [
    "useGetPricingRulesQuery",
    "useLazyGetPricingRulesQuery",
    "useCreatePricingRuleMutation",
    "useUpdatePricingRuleMutation",
    "useTogglePricingRuleMutation",
    "useDeletePricingRuleMutation",
  ]) {
    assert.match(api, new RegExp("\\b" + hook + ","), `${hook} exported`);
  }
});

test("vendor-scoped pricing cannot be sent by the client", () => {
  const createType = api.slice(
    api.indexOf("export interface CreatePricingRuleRequest"),
    api.indexOf("export interface UpdatePricingRuleRequest")
  );
  assert.ok(createType.length > 0, "create request type exists");
  assert.doesNotMatch(createType, /vendorId/, "no vendorId on create");
  assert.doesNotMatch(api, /vendorId\?:/, "vendorId is never an optional request field");
  // The model keeps it (always null) so the UI can show platform-wide scope.
  assert.match(createType, /courierProviderId: string;/);
});

// ── Admin UI: tab, hooks, validation, safe deactivation ────────────────────

test("the Pricing Rules tab is wired into the courier admin page", () => {
  assert.match(page, /<TabsTrigger\s*\n\s*value="pricing"/);
  assert.match(page, /<TabsContent value="pricing" className="space-y-6">\s*\n\s*<PricingRulesManagement \/>/);
  assert.match(page, /function PricingRulesManagement\(\)/);
  // five tabs now, so the responsive grid must fit five columns
  assert.match(page, /md:grid-cols-5/);
});

test("the tab uses this feature's hooks, not ad-hoc fetch", () => {
  assert.match(page, /from "@\/features\/courierPricingRulesApi"/);
  for (const hook of [
    "useGetPricingRulesQuery",
    "useCreatePricingRuleMutation",
    "useUpdatePricingRuleMutation",
    "useTogglePricingRuleMutation",
    "useDeletePricingRuleMutation",
  ]) {
    assert.match(page, new RegExp("\\b" + hook + "\\b"), `${hook} used`);
  }
  assert.doesNotMatch(page, /fetch\(\s*["'`]\/api\/courier\/admin\/pricing-rules/, "no hand-rolled fetch");
});

test("client-side validation mirrors the backend rules", () => {
  assert.match(page, /function validatePricingRuleForm/);
  assert.match(page, /must be a finite non-negative number/);
  assert.match(page, /must be greater than minimum weight/);
  assert.match(page, /Valid-to must be strictly after valid-from/);
  assert.match(page, /Base price is required/);
  assert.match(page, /Priority must be a whole number/);
  // parity with the backend's rejections, verified in
  // multivendorbackend/tests/courier-pricing-rules.test.ts
  assert.match(page, /Unsupported|delivery type is fixed to standard \(NORMAL\) delivery/);
});

test("no rate is invented, prefilled or hardcoded", () => {
  // The create form starts with an empty base price, never a default number.
  const emptyForm = page.slice(
    page.indexOf("const EMPTY_PRICING_RULE_FORM"),
    page.indexOf("/** Empty string -> fallback")
  );
  assert.ok(emptyForm.length > 0, "empty form constant exists");
  assert.match(emptyForm, /basePrice: ""/);
  assert.doesNotMatch(emptyForm, /basePrice: \d/, "no default base price");
  // Money only ever comes from the form or from a loaded rule.
  assert.doesNotMatch(page, /basePrice: \d/);
  assert.doesNotMatch(page, /perKgCharge: \d/);
  assert.match(page, /basePrice: Number\(form\.basePrice\)/);
});

test("deactivation is offered and deletion warns before it breaks checkout", () => {
  // Toggle = the safe deactivation path.
  assert.match(page, /togglePricingRule\(\{ id: rule\.id \}\)/);
  assert.match(page, /"Deactivate rule" : "Activate rule"/);
  assert.match(page, /Pricing rule deactivated/);
  // Hard delete sits behind a confirmation that names the checkout risk.
  assert.match(page, /<AlertDialog/);
  assert.match(page, /checkout quotes for the lane will fail/);
  assert.match(page, /deactivate it/);
});

test("server errors are surfaced to the admin", () => {
  assert.match(page, /error\?\.data\?\.message \|\| "Please try again"/);
  assert.match(page, /toast\.success\("Pricing rule created"\)/);
  assert.match(page, /toast\.success\("Pricing rule updated"\)/);
  assert.match(page, /toast\.success\("Pricing rule deleted"\)/);
});

test("the UI states that rates must be business approved", () => {
  assert.match(page, /Enter business-approved rates only/);
  assert.match(page, /no rate is ever invented here/);
});

test("an untouched validity date is never resent when editing", () => {
  // The stored validFrom/validTo are timestamps; the date inputs are
  // day-granular, so re-sending an unchanged day truncated to midnight would
  // silently shift the rule's validity window. Unchanged dates must stay out
  // of the PUT body.
  assert.match(page, /const \[loadedDates, setLoadedDates\] = useState/);
  assert.match(page, /if \(form\.validFrom !== loadedDates\.validFrom\) \{/);
  assert.match(page, /if \(form\.validTo !== loadedDates\.validTo\) \{/);
  assert.doesNotMatch(page, /\.\.\.\(form\.validTo \? \{ validTo:/, "no unconditional validTo");
  assert.doesNotMatch(page, /const shared = \{/, "unconditional date bag is gone");
});

test("clearing valid-to clears the end date, and valid-from cannot be cleared", () => {
  // Omitting the key would make the backend keep the stored value, so an
  // emptied box must be sent as an explicit null.
  assert.match(page, /body\.validTo = form\.validTo === "" \? null : toIso\(form\.validTo\)/);
  // validFrom is a non-nullable column: refuse rather than silently ignore.
  assert.match(page, /Valid-from is required and cannot be cleared/);
});
