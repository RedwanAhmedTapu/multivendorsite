// tests/pos-nav-order.test.mjs — source-level assertions on the POS navigation.
//   node --test tests/pos-nav-order.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { register } from "node:module";

register("./support/tsx-loader.mjs", import.meta.url);
const T = await import("../src/app/pos/types.ts");

test("nav: Dashboard is first, POS Terminal second", () => {
  assert.equal(T.NAV_ITEMS[0].id, "dashboard");
  assert.equal(T.NAV_ITEMS[1].id, "pos");
});

test("nav: Staff ('users') is absent but Settings is still present", () => {
  const ids = T.NAV_ITEMS.map((i) => i.id);
  assert.equal(ids.includes("users"), false, "Staff entry must be removed from POS nav");
  assert.equal(ids.includes("settings"), true);
  assert.equal(ids.includes("invoices"), true);
});

test("nav: bottom-nav slice(0,5) shows Dashboard, POS, Invoices, Customers, Settings", () => {
  const five = T.NAV_ITEMS.slice(0, 5).map((i) => i.id);
  assert.deepEqual(five, ["dashboard", "pos", "invoices", "customers", "settings"]);
});

test("nav: adminOnly filtering still keeps Staff out for everyone", () => {
  const staff = { isAdmin: true };
  const visible = T.NAV_ITEMS.filter((i) => T.canSeeNavItem(i, staff)).map((i) => i.id);
  assert.equal(visible.includes("users"), false);
  assert.equal(visible.includes("settings"), true, "admins still see Settings");
});