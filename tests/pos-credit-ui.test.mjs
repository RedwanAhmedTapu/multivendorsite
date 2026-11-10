// tests/pos-credit-ui.test.mjs
//   node --test tests/pos-credit-ui.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { register } from "node:module";

register("./support/tsx-loader.mjs", import.meta.url);
const C = await import("../src/lib/pos/credit.ts");

test("credit status: due is the outstanding balance; no facility at limit 0; available never negative", () => {
  assert.deepEqual(C.creditStatus({ loanLimit: 100, due: 60, loanBalance: 0 }), { hasFacility: true, limit: 100, outstanding: 60, available: 40 });
  assert.deepEqual(C.creditStatus({ loanLimit: 0, due: 25 }), { hasFacility: false, limit: 0, outstanding: 25, available: 0 });
  assert.equal(C.creditStatus({ loanLimit: 50, due: 80 }).available, 0);
  assert.deepEqual(C.creditStatus(null), { hasFacility: false, limit: 0, outstanding: 0, available: 0 });
});

test("credit refusal mirrors the server rule and wording", () => {
  assert.equal(C.creditRefusal({ loanLimit: 100, due: 60 }, 0), null, "fully paid");
  assert.equal(C.creditRefusal({ loanLimit: 100, due: 60 }, 40), null, "exactly at the limit");
  assert.equal(C.creditRefusal({ loanLimit: 100, due: 60 }, 40.004), null, "within rounding tolerance");
  assert.equal(C.creditRefusal({ loanLimit: 100, due: 60 }, 41), "Credit limit exceeded: 40.00 available of 100.00, this sale needs 41.00");
  assert.match(C.creditRefusal({ loanLimit: 0, due: 0 }, 1), /no credit facility/);
});
