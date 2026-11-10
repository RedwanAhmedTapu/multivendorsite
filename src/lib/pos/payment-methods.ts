// lib/pos/payment-methods.ts
//
// Which payment methods the POS terminal may OFFER, and what each one sends to
// POST /pos/sales.
//
// Source of truth: the Purchase Entry form's methods and labels
// (@/lib/payments/payment-methods) and the vendor's own payment accounts from
// the same API it uses (GET /vendormanagement/:vendorId/payment-accounts,
// VendorPaymentAccount — vendor-owned CURRENT_ASSET ledger accounts, not
// supplier records and not payout accounts).
//
// POS rules — methods the backend accepts (PosPaymentMethod) AND can post to a
// ledger account every vendor has (accounting.services PAYMENT_COA_NAME):
//   Cash           → CASH. Counter cash; needs no account; always offered.
//   Card           → CARD, when an active CARD account exists.
//   Bank Transfer  → BANK_TRANSFER, when an active BANK account exists.
//   Mobile Banking → one choice per provider of an active MOBILE_BANKING
//                    account: BKASH, NAGAD.
//   Cheque         → never offered: the POS has no cheque method.
// Not offered: ROCKET (its voucher posts to a "Rocket Wallet" account that the
// vendor chart of accounts never creates, so the sale would fail), and
// providers UPAY / OTHER (the POS enum cannot record them).
//
// Only the method is sent. A POS sale has no column for a VendorPaymentAccount
// (PosSale.bankAccountId references the legacy PosBankAccount) and the voucher
// debits a ledger chosen by method name, so the account the cashier picks
// (accountsForMethod) only shows where the customer pays — it is not saved
// with the sale. Picking Card, bKash, etc. is not a gateway charge.

import type { PosPaymentMethod } from "@/features/posApi";
import type { MobileBankingProvider, PaymentInstrumentType } from "@/features/vendorManageApi";
import { PAYMENT_METHOD_OPTIONS, PAYMENT_METHOD_TO_TYPE } from "@/lib/payments/payment-methods";

/** The POS methods a terminal may send. */
export type TerminalMethodId = Extract<PosPaymentMethod, "CASH" | "CARD" | "BANK_TRANSFER" | "BKASH" | "NAGAD">;

export type TerminalChoice = { id: TerminalMethodId; label: string };

/** One shared method as shown on the terminal; Mobile Banking carries its providers. */
export type TerminalMethod = { value: string; label: string; choices: TerminalChoice[] };

const SINGLE: Record<string, TerminalMethodId> = { Cash: "CASH", Card: "CARD", "Bank Transfer": "BANK_TRANSFER" };

const WALLETS: Partial<Record<MobileBankingProvider, TerminalChoice>> = {
  BKASH: { id: "BKASH", label: "bKash" },
  NAGAD: { id: "NAGAD", label: "Nagad" },
};

type AccountLike = {
  id?: string;
  type?: PaymentInstrumentType;
  isActive?: boolean;
  label?: string | null;
  accountNumber?: string | null;
  bankBranch?: { branchName?: string | null; bank?: { name?: string | null } | null } | null;
  mobileProvider?: MobileBankingProvider | null;
  walletNumber?: string | null;
  walletKind?: string | null;
  cardProcessor?: string | null;
  merchantId?: string | null;
};

function activeAccounts(accounts: unknown): AccountLike[] {
  if (!Array.isArray(accounts)) return [];
  return accounts.filter((a): a is AccountLike => !!a && typeof a === "object" && (a as AccountLike).isActive !== false);
}

/** The terminal's methods, in the Purchase Entry order, given the vendor's payment accounts. */
export function availableTerminalMethods(accounts: unknown): TerminalMethod[] {
  const active = activeAccounts(accounts);
  const hasType = (t: PaymentInstrumentType) => active.some((a) => a.type === t);
  const out: TerminalMethod[] = [];
  for (const opt of PAYMENT_METHOD_OPTIONS) {
    const type = PAYMENT_METHOD_TO_TYPE[opt.value];
    if (opt.value === "Mobile Banking") {
      const seen = new Set<string>();
      const choices: TerminalChoice[] = [];
      for (const a of active) {
        const w = a.type === "MOBILE_BANKING" && a.mobileProvider ? WALLETS[a.mobileProvider] : undefined;
        if (w && !seen.has(w.id)) {
          seen.add(w.id);
          choices.push(w);
        }
      }
      if (choices.length) out.push({ value: opt.value, label: opt.label, choices });
      continue;
    }
    const id = SINGLE[opt.value];
    if (!id) continue; // e.g. Cheque
    if (type && !hasType(type)) continue;
    out.push({ value: opt.value, label: opt.label, choices: [{ id, label: opt.label }] });
  }
  return out;
}

/** Every method id the terminal may send right now. */
export function offeredMethodIds(methods: TerminalMethod[]): TerminalMethodId[] {
  return methods.flatMap((m) => m.choices.map((c) => c.id));
}

/** An account the cashier can pick for a method — masked, no ledger ids. */
export type TerminalAccount = { id: string; label: string; detail: string };

/** Last four characters only; the full number never reaches the terminal UI. */
export function maskTail(v: string | null | undefined): string {
  const t = (v ?? "").trim();
  return t ? `••${t.slice(-4)}` : "";
}

function matches(a: AccountLike, method: TerminalMethodId): boolean {
  if (method === "BANK_TRANSFER") return a.type === "BANK";
  if (method === "CARD") return a.type === "CARD";
  if (method === "BKASH" || method === "NAGAD") return a.type === "MOBILE_BANKING" && a.mobileProvider === method;
  return false; // CASH needs no account
}

/** The vendor's active accounts that can receive this method; empty for Cash. */
export function accountsForMethod(accounts: unknown, method: TerminalMethodId): TerminalAccount[] {
  return activeAccounts(accounts)
    .filter((a) => typeof a.id === "string" && a.id !== "" && matches(a, method))
    .map((a) => {
      if (a.type === "BANK") {
        const bank = a.bankBranch?.bank?.name ?? "Bank";
        return { id: a.id!, label: a.label || bank, detail: [a.label ? bank : null, a.bankBranch?.branchName, maskTail(a.accountNumber)].filter(Boolean).join(" · ") };
      }
      if (a.type === "MOBILE_BANKING") {
        const provider = WALLETS[a.mobileProvider!]?.label ?? "Wallet";
        return { id: a.id!, label: a.label || provider, detail: [a.label ? provider : null, a.walletKind, maskTail(a.walletNumber)].filter(Boolean).join(" · ") };
      }
      return { id: a.id!, label: a.label || a.cardProcessor || "Card", detail: [a.label ? a.cardProcessor : null, maskTail(a.merchantId)].filter(Boolean).join(" · ") };
    });
}
