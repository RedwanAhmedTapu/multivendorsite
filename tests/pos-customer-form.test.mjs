// tests/pos-customer-form.test.mjs
//   node --test tests/pos-customer-form.test.mjs
//
// The customer modal's pure model: what an edit starts from, what the server
// is sent, and what the Loan Summary shows. The backend test
// (multivendorbackend/tests/pos-credit.test.ts) proves the server drops any
// balance field that slips into a payload anyway.
import { test } from "node:test";
import assert from "node:assert/strict";
import { register } from "node:module";

register("./support/tsx-loader.mjs", import.meta.url);
const F = await import("../src/lib/pos/customer.ts");

const customer = {
  id: "C1", vendorId: "V1", name: "Karim", phone: "017", email: "karim@x.com", nid: "1990",
  address: "Dhaka", note: "VIP", referrerName: "Rahim", referrerEmail: "rahim@x.com",
  loanLimit: 5000, loanBalance: 480, loanInterestRate: 12, loanTenureDays: 30, creditScore: "Good",
  walletBalance: 120, due: 480, orders: 7, spent: 40000, lastOrderAt: "2026-01-01", createdAt: "2025-01-01",
};

test("initial form: keeps the editable fields, treats a 0 limit as empty, defaults terms", () => {
  const f = F.initialCustomerForm(customer);
  assert.deepEqual(
    { name: f.name, phone: f.phone, email: f.email, nid: f.nid, address: f.address, note: f.note, referrerName: f.referrerName, referrerEmail: f.referrerEmail },
    { name: "Karim", phone: "017", email: "karim@x.com", nid: "1990", address: "Dhaka", note: "VIP", referrerName: "Rahim", referrerEmail: "rahim@x.com" },
  );
  assert.equal(f.loanLimit, "5000");
  assert.equal(F.initialCustomerForm({ ...customer, loanLimit: 0 }).loanLimit, "", "0 is shown as the placeholder");
  const blank = F.initialCustomerForm(null);
  assert.deepEqual([blank.loanInterestRate, blank.loanTenureDays, blank.creditScore], ["12", "30", "Good"]);
});

test("payload: an edit sends the whitelist only — never due, loanBalance, wallet, orders or spent", () => {
  const form = { ...F.initialCustomerForm(customer), name: "  Karim Uddin ", loanLimit: "6000.456", loanInterestRate: "10", loanTenureDays: "45", creditScore: "Fair" };
  const body = F.customerPayload(form, true);
  assert.deepEqual(body, {
    name: "Karim Uddin", phone: "017", email: "karim@x.com", nid: "1990", address: "Dhaka", note: "VIP",
    referrerName: "Rahim", referrerEmail: "rahim@x.com",
    loanLimit: 6000.46, loanInterestRate: 10, loanTenureDays: 45, creditScore: "Fair",
  });
  for (const k of ["due", "loanBalance", "walletBalance", "orders", "spent", "lastOrderAt"]) {
    assert.ok(!(k in body), `${k} is not sent`);
  }
});

test("payload: without posCredit no credit term or score is sent at all", () => {
  const body = F.customerPayload(F.initialCustomerForm(customer), false);
  assert.deepEqual(body, {
    name: "Karim", phone: "017", email: "karim@x.com", nid: "1990", address: "Dhaka", note: "VIP",
    referrerName: "Rahim", referrerEmail: "rahim@x.com",
  });
});

test("validation mirrors the server: name + phone required, limit/rate/tenure/score checked", () => {
  const good = F.initialCustomerForm(customer);
  assert.equal(F.customerFormError(good, true), null);
  assert.match(F.customerFormError({ ...good, name: " " }, true), /Name and phone/);
  assert.match(F.customerFormError({ ...good, phone: "" }, true), /Name and phone/);
  assert.match(F.customerFormError({ ...good, loanLimit: "-1" }, true), /0 or more/);
  assert.match(F.customerFormError({ ...good, loanInterestRate: "101" }, true), /between 0 and 100/);
  assert.match(F.customerFormError({ ...good, loanTenureDays: "1.5" }, true), /whole number/);
  assert.match(F.customerFormError({ ...good, creditScore: "Platinum" }, true), /valid credit score/);
  assert.equal(F.customerFormError({ ...good, creditScore: "Platinum" }, false), null, "without posCredit the score is not sent, so it is not checked");
});

test("loan summary is derived from the form plus the server-owned balance", () => {
  assert.deepEqual(F.loanSummaryFor("5000", 480, "12"), { limit: 5000, outstanding: 480, available: 4520, monthlyInterest: 5, utilization: 10 });
  assert.deepEqual(F.loanSummaryFor("", 480, "12"), { limit: 0, outstanding: 480, available: 0, monthlyInterest: 5, utilization: 0 }, "no facility → nothing available");
  assert.equal(F.loanSummaryFor("100", 200, "12").available, 0, "available never goes negative");
  assert.equal(F.loanSummaryFor("1000", 900, "12").utilization, 90);
  assert.deepEqual(F.loanSummaryFor("abc", 0, ""), { limit: 0, outstanding: 0, available: 0, monthlyInterest: 0, utilization: 0 }, "typing junk never throws");
});
