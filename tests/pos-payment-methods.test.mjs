// tests/pos-payment-methods.test.mjs
//   node --test tests/pos-payment-methods.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { register } from "node:module";

register("./support/tsx-loader.mjs", import.meta.url);
const M = await import("../src/lib/pos/payment-methods.ts");
const Shared = await import("../src/lib/payments/payment-methods.ts");

const ids = (accounts) => M.offeredMethodIds(M.availableTerminalMethods(accounts));
const BANK = { id: "b1", type: "BANK", isActive: true, accountName: "Shop", accountNumber: "123" };
const CARD = { id: "c1", type: "CARD", isActive: true, cardProcessor: "SSLCommerz POS" };
const BKASH = { id: "m1", type: "MOBILE_BANKING", isActive: true, mobileProvider: "BKASH", walletNumber: "017" };
const NAGAD = { id: "m2", type: "MOBILE_BANKING", isActive: true, mobileProvider: "NAGAD", walletNumber: "018" };

test("methods: with no payment account (or a failed/forbidden load) only CASH is offered", () => {
  for (const a of [[], undefined, null, "x", [null, 1]]) assert.deepEqual(ids(a), ["CASH"]);
});

test("methods: same order and labels as Purchase Entry; Cheque never reaches the POS", () => {
  const methods = M.availableTerminalMethods([BANK, CARD, BKASH]);
  const shared = Shared.PAYMENT_METHOD_OPTIONS.map((o) => o.value).filter((v) => v !== "Cheque");
  assert.deepEqual(methods.map((m) => m.value), shared);
  for (const m of methods) assert.equal(m.label, Shared.PAYMENT_METHOD_OPTIONS.find((o) => o.value === m.value).label);
  assert.ok(!methods.some((m) => m.value === "Cheque"));
  // Cheque maps to a BANK account in Purchase Entry — a BANK account must not unlock it at POS.
  assert.ok(!ids([BANK]).includes("CHEQUE"));
});

test("methods: each non-cash method needs an active account of its own type", () => {
  assert.deepEqual(ids([BANK]), ["BANK_TRANSFER", "CASH"]);
  assert.deepEqual(ids([CARD]), ["CASH", "CARD"]);
  assert.deepEqual(ids([{ ...CARD, isActive: false }]), ["CASH"], "inactive accounts are ignored");
});

test("methods: Mobile Banking offers the providers of the vendor's wallets the POS can record", () => {
  const mb = M.availableTerminalMethods([BKASH, NAGAD, { ...BKASH, id: "m3" }]).find((m) => m.value === "Mobile Banking");
  assert.deepEqual(mb.choices, [{ id: "BKASH", label: "bKash" }, { id: "NAGAD", label: "Nagad" }]);
  // Rocket's voucher account isn't in the vendor chart of accounts; Upay/Other have no POS method.
  for (const p of ["ROCKET", "UPAY", "OTHER"]) {
    assert.deepEqual(ids([{ ...BKASH, mobileProvider: p }]), ["CASH"], p);
  }
  // Provider comes from the explicit column, never guessed from a label.
  assert.deepEqual(ids([{ type: "BANK", isActive: true, label: "bKash Merchant" }]), ["BANK_TRANSFER", "CASH"]);
});

test("methods: everything offered is a backend PosPaymentMethod (no supplier-only value)", () => {
  const all = ids([BANK, CARD, BKASH, NAGAD]);
  assert.deepEqual(all, ["BANK_TRANSFER", "CASH", "BKASH", "NAGAD", "CARD"]);
  for (const id of all) assert.ok(["CASH", "CARD", "BKASH", "NAGAD", "BANK_TRANSFER"].includes(id));
});

// ─── receiving account per method ────────────────────────────────────────────

const B2 = { id: "b2", type: "BANK", isActive: true, label: "Shop-2 DBBL", accountNumber: "9876543210", bankBranch: { branchName: "Gulshan", bank: { name: "Dutch-Bangla Bank" } }, chartOfAccountId: "COA_B2" };
const B_OFF = { id: "b3", type: "BANK", isActive: false, accountNumber: "1111" };
const BKASH2 = { id: "m9", type: "MOBILE_BANKING", isActive: true, mobileProvider: "BKASH", walletNumber: "01711112222", walletKind: "Merchant" };
const POOL = [BANK, B2, B_OFF, CARD, BKASH, BKASH2, NAGAD, { id: "r1", type: "MOBILE_BANKING", isActive: true, mobileProvider: "ROCKET" }, { type: "BANK", isActive: true }];
const accIds = (m) => M.accountsForMethod(POOL, m).map((a) => a.id);

test("accounts: each method lists only its own active, identified accounts", () => {
  assert.deepEqual(accIds("BANK_TRANSFER"), ["b1", "b2"], "banks only; inactive and id-less dropped");
  assert.deepEqual(accIds("CARD"), ["c1"]);
  assert.deepEqual(accIds("BKASH"), ["m1", "m9"]);
  assert.deepEqual(accIds("NAGAD"), ["m2"]);
  assert.deepEqual(accIds("CASH"), [], "cash needs no account");
  assert.deepEqual(M.accountsForMethod(undefined, "CARD"), []);
});

test("accounts: labels are meaningful and numbers are masked; no ledger ids leak", () => {
  const [b1, b2] = M.accountsForMethod(POOL, "BANK_TRANSFER");
  assert.deepEqual(b2, { id: "b2", label: "Shop-2 DBBL", detail: "Dutch-Bangla Bank · Gulshan · ••3210" });
  assert.equal(b1.label, "Bank");
  assert.equal(b1.detail, "••123", "bank name falls back to the label; short numbers still masked");
  const w = M.accountsForMethod(POOL, "BKASH").find((a) => a.id === "m9");
  assert.deepEqual(w, { id: "m9", label: "bKash", detail: "Merchant · ••2222" });
  const json = JSON.stringify(M.accountsForMethod(POOL, "BANK_TRANSFER").concat(M.accountsForMethod(POOL, "BKASH")));
  assert.ok(!json.includes("9876543210") && !json.includes("01711112222") && !json.includes("COA_"), "no full numbers or COA ids");
  assert.equal(M.maskTail(""), "");
  assert.equal(M.maskTail(null), "");
});
