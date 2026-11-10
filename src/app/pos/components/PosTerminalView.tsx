// app/pos/components/PosTerminalView.tsx
"use client";

// The POS selling screen — the original terminal (product grid, cart,
// customer, discount, payment, due/over-payment confirmations, receipt) now
// working against the backend instead of local demo data:
//   - products and sellable stock come from GET /pos/products (this vendor only);
//   - the sale is POSTed with variant + location + qty only — the server
//     prices, discounts, taxes and attributes it, deducts stock and posts the
//     accounting voucher in one transaction;
//   - each checkout attempt carries a clientRequestId, and the button is locked
//     while submitting, so a double tap or a retry can't sell twice;
//   - the receipt is shown only from the server's confirmed sale.
// Permissions mirror the server (posDiscount, posCredit); the server re-checks.
// Payment methods come from the Purchase Entry list and the vendor's payment
// accounts (see lib/pos/payment-methods); only the method is sent — the account
// picked for Bank Transfer / Card / bKash / Nagad shows where the customer pays
// and is not saved with the sale (the sale has no column for it yet).

import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, CheckCircle, ChevronRight, Minus, Package, Plus, Search, Trash2, X } from "lucide-react";
import {
  useCreateSaleMutation,
  useGetPosProductsQuery,
  type PosCustomer,
  type PosProduct,
  type PosSale,
  type PosStaff,
} from "@/features/posApi";
import { useGetVendorPaymentAccountsQuery } from "@/features/vendorManageApi";
import { usePermissions } from "@/hooks/usePermissions";
import { estimateSale, newClientRequestId } from "@/lib/pos/sale-math";
import { creditRefusal, creditStatus } from "@/lib/pos/credit";
import { accountsForMethod, availableTerminalMethods, offeredMethodIds, type TerminalMethodId } from "@/lib/pos/payment-methods";
import CustomerPickerModal from "./CustomerPickerModal";
import CustomerFormModal from "./CustomerFormModal";
import ReceiptModal from "./ReceiptModal";
import { fmt } from "../ui";

interface CartLine {
  variantId: string;
  name: string;
  sku: string;
  price: number;
  taxRate: number;
  warehouseId: string;
  rackId: string | null;
  rackCode: string | null;
  available: number;
  qty: number;
}

/** The location a sale takes stock from: default warehouse first, then most stock. */
function sellableLocation(p: PosProduct) {
  return p.locations.find((l) => l.available > 0) ?? null;
}

function errorText(err: unknown): string {
  const e = err as { status?: number; data?: { message?: string; code?: string } };
  if (e?.status === 402) return e.data?.message ?? "Your POS subscription isn't active — the sale was not made.";
  if (e?.status === 403) return e.data?.message ?? "You don't have permission for this sale.";
  return e?.data?.message ?? "The sale could not be completed. Nothing was charged.";
}

export default function PosTerminalView({ staff, storeName, vendorId }: { staff: PosStaff; storeName: string; vendorId: string }) {
  const canDiscount = staff.isAdmin || staff.permissions?.canDiscount === true;
  const canCredit = staff.isAdmin || staff.permissions?.canGrantLoan === true;

  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setQ(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);
  const products = useGetPosProductsQuery(q ? { q } : undefined);
  // Same route as Purchase Entry; the server takes the vendor from the session
  // (any other id 404s) and lets staff read it only with inventoryManagement.
  // Without that, don't call it (a 403 makes the shared base query try a token
  // refresh): the terminal offers Cash only.
  const { can } = usePermissions();
  const accountsReadable = !!vendorId && can("inventoryManagement");
  const payAccounts = useGetVendorPaymentAccountsQuery(vendorId, { skip: !accountsReadable });
  const methods = useMemo(() => availableTerminalMethods(payAccounts.data?.data), [payAccounts.data]);
  const offered = offeredMethodIds(methods);
  const [createSale, { isLoading: submitting }] = useCreateSaleMutation();

  const [activeCat, setActiveCat] = useState("All");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [customer, setCustomer] = useState<PosCustomer | null>(null);
  const [discType, setDiscType] = useState<"PERCENT" | "FLAT">("PERCENT");
  const [discVal, setDiscVal] = useState("");
  const [paidAmt, setPaidAmt] = useState("");
  const [note, setNote] = useState("");
  const [payMethod, setPayMethod] = useState<TerminalMethodId>("CASH");
  const [payAccountId, setPayAccountId] = useState("");
  const methodAccounts = useMemo(() => accountsForMethod(payAccounts.data?.data, payMethod), [payAccounts.data, payMethod]);
  // A method change always drops the previous account (each method has its own
  // account type / provider); a lone matching account is shown, never a default
  // from another method.
  const chooseMethod = (m: TerminalMethodId) => {
    setPayMethod(m);
    const list = accountsForMethod(payAccounts.data?.data, m);
    setPayAccountId(list.length === 1 ? list[0].id : "");
  };
  const [showPicker, setShowPicker] = useState(false);
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [receipt, setReceipt] = useState<{ sale: PosSale; change: number } | null>(null);
  const [toast, setToast] = useState("");
  const [confirm, setConfirm] = useState<null | { kind: "due" | "change"; amount: number }>(null);
  const requestId = useRef<string>(newClientRequestId());
  const lock = useRef(false);

  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current); }, []);
  const showToast = (msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 3500);
  };

  const list = useMemo(() => products.data?.data ?? [], [products.data]);
  const cats = useMemo(() => ["All", ...Array.from(new Set(list.map((p) => p.category)))], [list]);
  const shown = activeCat === "All" ? list : list.filter((p) => p.category === activeCat);

  const addToCart = (p: PosProduct) => {
    const loc = sellableLocation(p);
    if (!loc) return;
    setCart((prev) => {
      const ex = prev.find((x) => x.variantId === p.variantId);
      if (ex) {
        if (ex.qty >= ex.available) {
          showToast("⚠ Max stock reached at this location");
          return prev;
        }
        return prev.map((x) => (x.variantId === p.variantId ? { ...x, qty: x.qty + 1 } : x));
      }
      return [...prev, { variantId: p.variantId, name: p.name, sku: p.sku, price: p.price, taxRate: p.taxRate, warehouseId: loc.warehouseId, rackId: loc.rackId, rackCode: loc.rackCode, available: loc.available, qty: 1 }];
    });
  };
  const chgQty = (id: string, d: number) =>
    setCart((prev) => {
      const item = prev.find((x) => x.variantId === id);
      if (!item) return prev;
      const qty = item.qty + d;
      if (qty <= 0) return prev.filter((x) => x.variantId !== id);
      if (qty > item.available) {
        showToast("⚠ Stock limit");
        return prev;
      }
      return prev.map((x) => (x.variantId === id ? { ...x, qty } : x));
    });
  const removeFromCart = (id: string) => setCart((prev) => prev.filter((x) => x.variantId !== id));
  const resetSale = () => {
    setCart([]);
    setCustomer(null);
    setDiscVal("");
    setPaidAmt("");
    setNote("");
    setPayMethod("CASH");
    setPayAccountId("");
    setDiscType("PERCENT");
    requestId.current = newClientRequestId(); // next sale = new attempt
  };

  const discount = canDiscount ? parseFloat(discVal) || 0 : 0;
  const tendered = parseFloat(paidAmt) || 0;
  const est = estimateSale(cart, { type: discType, value: discount }, tendered);
  // Mirrors the server's credit rule (due + new due <= loanLimit); the server re-checks atomically.
  const credit = creditStatus(customer);
  const creditBlock = customer ? creditRefusal(customer, est.due) : null;

  const submit = async () => {
    if (lock.current || submitting) return; // no double submit
    if (!offered.includes(payMethod)) {
      setConfirm(null);
      chooseMethod("CASH");
      return showToast("⚠ That payment method isn't available any more. Choose another.");
    }
    if (payAccountId && !methodAccounts.some((a) => a.id === payAccountId)) {
      setConfirm(null);
      setPayAccountId("");
      return showToast("⚠ That account doesn't take this payment method. Choose the account again.");
    }
    lock.current = true;
    setConfirm(null);
    try {
      const res = await createSale({
        clientRequestId: requestId.current,
        customerId: customer?.id ?? null,
        items: cart.map((l) => ({ variantId: l.variantId, qty: l.qty, warehouseId: l.warehouseId, rackId: l.rackId })),
        discountType: discType,
        ...(discType === "PERCENT" ? { discountPct: discount } : { discountAmount: discount }),
        paidAmount: tendered,
        paymentMethod: payMethod,
        note: note.trim() || undefined,
      }).unwrap();
      setReceipt({ sale: res.data.sale, change: res.data.change });
      resetSale();
    } catch (err) {
      // Keep the same clientRequestId: if the server did record the sale, a retry returns it.
      showToast(`⚠ ${errorText(err)}`);
    } finally {
      lock.current = false;
    }
  };

  const doCharge = () => {
    if (!cart.length) return showToast("🛒 Cart is empty!");
    if (est.due > 0) {
      if (!customer) return showToast("⚠ Walk-in customers must pay in full. Select a customer for due credit.");
      if (!canCredit) return showToast("⚠ You don't have permission to sell on credit. Take full payment.");
      if (creditBlock) return showToast(`⚠ ${creditBlock}.`);
      return setConfirm({ kind: "due", amount: est.due });
    }
    if (est.change > 0) return setConfirm({ kind: "change", amount: est.change });
    submit();
  };

  const loading = products.isLoading;
  const loadError = products.isError ? errorText(products.error) : null;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex flex-1 overflow-hidden">
        {/* Products */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="bg-white px-4 py-3 border-b border-slate-100 shrink-0">
            <div className="relative mb-3">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-400" />
              <input aria-label="Search products" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, SKU or scan barcode..." className="w-full pl-9 pr-4 py-2.5 text-sm bg-slate-50 border border-cyan-100 rounded-xl focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-50 transition-all" />
            </div>
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
              {cats.map((c) => (
                <button key={c} onClick={() => setActiveCat(c)} className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${activeCat === c ? "bg-cyan-500 text-white border-cyan-500" : "bg-white text-slate-500 border-slate-200 hover:border-cyan-300 hover:text-cyan-600"}`}>{c}</button>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 content-start">
            {loading && <div className="col-span-full py-16 text-center text-sm text-slate-400">Loading products…</div>}
            {loadError && <div role="alert" className="col-span-full py-16 text-center text-sm text-red-600">{loadError}</div>}
            {!loading && !loadError && shown.map((p) => {
              const loc = sellableLocation(p);
              const out = !loc;
              const low = !!loc && loc.available <= 5;
              return (
                <button key={p.variantId} onClick={() => addToCart(p)} disabled={out} aria-label={`Add ${p.name}`} className={`relative bg-white border rounded-xl p-3 text-left transition-all group ${out ? "opacity-40 cursor-not-allowed border-slate-100" : "border-slate-200 hover:border-cyan-400 hover:shadow-md hover:shadow-cyan-50 hover:-translate-y-0.5"}`}>
                  <div className="absolute top-2 right-2 w-5 h-5 bg-cyan-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-sm"><Plus size={11} className="text-white" /></div>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-2 bg-slate-50 overflow-hidden">
                    {p.image ? (
                      <img src={p.image} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <Package size={16} className="text-slate-400" />
                    )}
                  </div>
                  <div className="text-[11px] font-bold text-slate-800 leading-tight mb-1 line-clamp-2">{p.name}</div>
                  <div className="text-xs font-extrabold text-cyan-600">{fmt(p.price)}</div>
                  <div className="flex items-center justify-between mt-1">
                    <span className={`text-[9px] font-semibold ${out ? "text-red-500" : low ? "text-amber-500" : "text-slate-400"}`}>{out ? "Out of stock" : low ? `⚠ ${loc!.available} left` : `${loc!.available} in stock`}</span>
                    <span className="text-[9px] text-slate-300 bg-slate-50 px-1 py-0.5 rounded">{p.taxRate}% VAT</span>
                  </div>
                  {loc?.rackCode && <div className="mt-1 text-[9px] font-bold text-slate-300 bg-slate-50 px-1.5 py-0.5 rounded-md inline-block">📍 {loc.rackCode}</div>}
                </button>
              );
            })}
            {!loading && !loadError && !shown.length && (
              <div className="col-span-full flex flex-col items-center justify-center py-16 text-slate-300">
                <Package size={36} className="mb-3 opacity-40" />
                <p className="text-sm font-medium text-slate-400">No products found</p>
              </div>
            )}
          </div>
        </div>

        {/* Cart */}
        <div className="w-80 xl:w-96 shrink-0 border-l border-slate-100 bg-white flex flex-col">
          <div className="px-4 pt-3 pb-2 border-b border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700">🛒 Current Sale</span>
              <button onClick={resetSale} disabled={submitting} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-500 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all disabled:opacity-50">
                <Trash2 size={12} /> Clear
              </button>
            </div>
            <button onClick={() => setShowPicker(true)} className="w-full flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2 text-left hover:bg-blue-100 transition-all">
              <div className="w-7 h-7 rounded-full bg-blue-200 flex items-center justify-center text-xs font-bold text-blue-700 shrink-0">{customer ? customer.name[0] : "👤"}</div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-blue-700 truncate">{customer ? customer.name : "Walk-in Customer"}</div>
                <div className="text-[10px] text-blue-400">
                  {customer ? (customer.due > 0 ? `${customer.phone} · ⚠ Due: ${fmt(customer.due)}` : customer.phone) : <span className="text-amber-500 font-semibold">⚠ Full payment required for walk-in</span>}
                </div>
              </div>
              <ChevronRight size={13} className="text-blue-300 shrink-0" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-2">
            {!cart.length ? (
              <div className="flex flex-col items-center justify-center h-full gap-2 text-slate-300">
                <span className="text-4xl opacity-20">🛍️</span>
                <span className="text-xs font-semibold text-slate-400">Cart is empty</span>
                <span className="text-[10px] text-slate-300">Tap a product to add</span>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.variantId} className="flex items-center gap-2 py-2 border-b border-slate-50 last:border-0">
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-bold text-slate-800 truncate">{item.name}</div>
                    <div className="text-[9px] text-slate-400">{fmt(item.price)} · {item.taxRate}% VAT{item.rackCode ? ` · 📍 ${item.rackCode}` : ""}</div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <button aria-label={`Less ${item.name}`} onClick={() => chgQty(item.variantId, -1)} className="w-5 h-5 flex items-center justify-center rounded-md border border-slate-200 hover:bg-cyan-50 hover:border-cyan-300 text-slate-500 hover:text-cyan-600 transition-all"><Minus size={10} /></button>
                      <span className="text-xs font-bold w-5 text-center">{item.qty}</span>
                      <button aria-label={`More ${item.name}`} onClick={() => chgQty(item.variantId, 1)} className="w-5 h-5 flex items-center justify-center rounded-md border border-slate-200 hover:bg-cyan-50 hover:border-cyan-300 text-slate-500 hover:text-cyan-600 transition-all"><Plus size={10} /></button>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs font-bold text-slate-800">{fmt(item.price * item.qty)}</div>
                    <button aria-label={`Remove ${item.name}`} onClick={() => removeFromCart(item.variantId)} className="mt-1 w-5 h-5 flex items-center justify-center rounded-md bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-600 transition-all ml-auto"><X size={10} /></button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="border-t border-slate-200 px-4 py-3 space-y-2.5 shrink-0">
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-slate-500"><span>Subtotal</span><span className="font-semibold text-slate-700">{fmt(est.subtotal)}</span></div>
              {est.discountAmount > 0 && <div className="flex justify-between text-xs text-green-600"><span>Discount</span><span className="font-semibold">-{fmt(est.discountAmount)}</span></div>}
              <div className="flex justify-between text-xs text-slate-500"><span>VAT</span><span className="font-semibold text-slate-700">{fmt(est.tax)}</span></div>
            </div>
            <div className="flex justify-between items-center pt-1.5 border-t border-slate-200">
              <span className="text-xs font-extrabold text-slate-800">NET BILLING</span>
              <span className="font-mono text-base font-extrabold text-cyan-600">{fmt(est.netBilling)}</span>
            </div>

            {canDiscount ? (
              <div className="flex items-center gap-1.5">
                <button onClick={() => setDiscType("PERCENT")} className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-all ${discType === "PERCENT" ? "bg-cyan-500 text-white border-cyan-500" : "bg-white text-slate-500 border-slate-200"}`}>% Disc</button>
                <button onClick={() => setDiscType("FLAT")} className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-all ${discType === "FLAT" ? "bg-cyan-500 text-white border-cyan-500" : "bg-white text-slate-500 border-slate-200"}`}>৳ Flat</button>
                <div className="relative flex-1">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400">{discType === "PERCENT" ? "%" : "৳"}</span>
                  <input aria-label="Discount" type="number" min={0} value={discVal} onChange={(e) => setDiscVal(e.target.value)} placeholder="0" className="w-full pl-6 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-100 transition-all" />
                </div>
              </div>
            ) : (
              <div className="text-[10px] text-slate-400">Discounts need the POS Discounts permission.</div>
            )}

            <div role="group" aria-label="Payment method" className="grid grid-cols-4 gap-1">
              {methods.map((m) => {
                const active = m.choices.some((c) => c.id === payMethod);
                return (
                  <button key={m.value} aria-pressed={active} onClick={() => !active && chooseMethod(m.choices[0].id)} className={`py-1.5 rounded-lg border text-[10px] font-bold transition-all ${active ? "bg-cyan-500 text-white border-cyan-500" : "bg-white text-slate-500 border-slate-200 hover:border-cyan-300"}`}>{m.label}</button>
                );
              })}
            </div>
            {(() => {
              const group = methods.find((m) => m.choices.length > 1 && m.choices.some((c) => c.id === payMethod));
              return group ? (
                <div role="group" aria-label={`${group.label} provider`} className="flex gap-1">
                  {group.choices.map((c) => (
                    <button key={c.id} aria-pressed={payMethod === c.id} onClick={() => payMethod !== c.id && chooseMethod(c.id)} className={`flex-1 py-1 rounded-lg border text-[10px] font-bold transition-all ${payMethod === c.id ? "bg-cyan-50 text-cyan-700 border-cyan-400" : "bg-white text-slate-500 border-slate-200 hover:border-cyan-300"}`}>{c.label}</button>
                  ))}
                </div>
              ) : null;
            })()}
            {payMethod !== "CASH" && (
              methodAccounts.length === 0 ? (
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-2 text-[10px] text-amber-600 font-semibold">⚠ No active account for this method.</div>
              ) : methodAccounts.length === 1 ? (
                <div aria-label="Receiving account" className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px]">
                  <span className="text-slate-400">Pays into </span>
                  <span className="font-bold text-slate-700">{methodAccounts[0].label}</span>
                  {methodAccounts[0].detail && <span className="text-slate-400"> · {methodAccounts[0].detail}</span>}
                </div>
              ) : (
                <select aria-label="Receiving account" value={payAccountId} onChange={(e) => setPayAccountId(e.target.value)} className="w-full py-1.5 px-2 text-xs border border-slate-200 rounded-lg">
                  <option value="">Choose the account the customer pays into</option>
                  {methodAccounts.map((a) => (
                    <option key={a.id} value={a.id}>{a.detail ? `${a.label} · ${a.detail}` : a.label}</option>
                  ))}
                </select>
              )
            )}
            {accountsReadable && payAccounts.isLoading ? (
              <div className="text-[10px] text-slate-400">Loading the store&apos;s payment accounts…</div>
            ) : accountsReadable && payAccounts.isError ? (
              <div className="flex items-center gap-2 text-[10px] text-amber-600">
                <span>Couldn&apos;t load the store&apos;s payment accounts — Cash still works.</span>
                <button onClick={() => payAccounts.refetch()} className="font-bold underline">Retry</button>
              </div>
            ) : offered.length === 1 ? (
              <div className="text-[10px] text-slate-400">
                {accountsReadable
                  ? "Card, Bank Transfer and Mobile Banking appear when the store has a matching payment account."
                  : "Only Cash is available on your account. Ask the store owner about other payment methods."}
              </div>
            ) : payMethod !== "CASH" ? (
              <div className="text-[10px] text-slate-400">Shows where the customer pays. The sale records the method only — the account isn&apos;t saved with it yet. No card or wallet charge is made here.</div>
            ) : null}

            <div className="flex gap-1.5">
              <input aria-label="Note" type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Coupon / Note" maxLength={500} className="flex-1 py-1.5 px-2.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-cyan-400 transition-all" />
              <input aria-label="Paid amount" type="number" min={0} value={paidAmt} onChange={(e) => setPaidAmt(e.target.value)} placeholder="Paid ৳" className="w-24 py-1.5 px-2.5 text-xs font-mono border border-slate-200 rounded-lg focus:outline-none focus:border-cyan-400 transition-all" />
            </div>

            {!customer && cart.length > 0 && est.due > 0 && tendered > 0 && (
              <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 rounded-lg px-3 py-1.5">
                <AlertTriangle size={11} className="text-red-500 shrink-0" />
                <span className="text-[10px] font-bold text-red-600">Walk-in customers cannot have due. Pay full amount or select customer.</span>
              </div>
            )}
            {est.due > 0 && customer && (
              <div className="flex justify-between items-center bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5">
                <span className="text-[10px] font-bold text-amber-600">⚠ Due Amount</span>
                <span className="font-mono text-xs font-extrabold text-amber-700">{fmt(est.due)}</span>
              </div>
            )}
            {est.change > 0 && (
              <div className="flex justify-between items-center bg-blue-50 border border-blue-200 rounded-lg px-3 py-1.5">
                <span className="text-[10px] font-bold text-blue-600">Change to return</span>
                <span className="font-mono text-xs font-extrabold text-blue-700">{fmt(est.change)}</span>
              </div>
            )}

            <button onClick={doCharge} disabled={submitting || !cart.length} aria-busy={submitting} className="w-full py-3 bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-sm font-extrabold rounded-xl hover:from-blue-700 hover:to-cyan-600 shadow-lg shadow-blue-200 transition-all hover:shadow-xl active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-60">
              {submitting ? "Processing…" : `⚡ Charge ${fmt(est.netBilling)}`}
            </button>
          </div>
        </div>
      </div>

      {toast && <div role="status" className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[300] rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-lg">{toast}</div>}

      {showPicker && (
        <CustomerPickerModal
          onClose={() => setShowPicker(false)}
          onSelect={(c) => { setCustomer(c); setShowPicker(false); }}
          onAddNew={() => { setShowPicker(false); setShowNewCustomer(true); }}
        />
      )}
      {showNewCustomer && (
        <CustomerFormModal canSetCredit={canCredit} onClose={() => setShowNewCustomer(false)} onSaved={(c) => { setCustomer(c); setShowNewCustomer(false); }} />
      )}

      {confirm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4" role="dialog" aria-modal="true" aria-label={confirm.kind === "due" ? "Confirm credit sale" : "Confirm change"}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm border border-slate-100 p-5">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center shrink-0"><AlertTriangle size={18} className="text-amber-500" /></div>
              <div>
                <div className="font-bold text-slate-800 text-sm mb-1">
                  {confirm.kind === "due" ? (tendered === 0 ? "Full Credit Sale" : "Partial Payment — Due Amount") : "Paid Amount Exceeds Invoice"}
                </div>
                <div className="text-xs text-slate-500 leading-relaxed">
                  {confirm.kind === "due"
                    ? `${customer?.name ?? "The customer"} will have a due of ${fmt(confirm.amount)} after this sale.`
                    : `Return ${fmt(confirm.amount)} change to the customer. Only ${fmt(est.netBilling)} is recorded as paid.`}
                </div>
              </div>
            </div>
            {confirm.kind === "due" && (creditBlock ? (
              <div role="alert" className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
                <div className="flex items-center gap-2 mb-1"><AlertTriangle size={13} className="text-red-500" /><span className="text-xs font-bold text-red-700">{credit.hasFacility ? "Credit Limit Exceeded" : "No Credit Facility"}</span></div>
                <p className="text-xs text-red-600">{creditBlock}. Take full payment instead.</p>
              </div>
            ) : (
              <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-4">
                <div className="flex items-center gap-2 mb-1"><CheckCircle size={13} className="text-green-500" /><span className="text-xs font-bold text-green-700">Credit Facility Enabled</span></div>
                <p className="text-xs text-green-600">
                  Outstanding {fmt(credit.outstanding)} of {fmt(credit.limit)} limit · {fmt(credit.available)} available. This sale adds {fmt(confirm.amount)} to the customer&apos;s due.
                </p>
              </div>
            ))}
            <div className="bg-slate-50 rounded-xl p-3 mb-4 text-xs">
              <div className="flex justify-between"><span className="text-slate-500">Net Billing</span><span className="font-bold">{fmt(est.netBilling)}</span></div>
              <div className="flex justify-between mt-1"><span className="text-slate-500">Paid Now</span><span className="font-bold text-green-600">{fmt(est.paid)}</span></div>
              {confirm.kind === "due" && <div className="flex justify-between mt-1 pt-1 border-t border-slate-200"><span className="font-bold text-slate-700">Due Amount</span><span className="font-bold text-amber-600">{fmt(confirm.amount)}</span></div>}
            </div>
            <div className="flex gap-2.5">
              <button onClick={() => setConfirm(null)} disabled={submitting} className="flex-1 py-2 text-xs font-semibold text-slate-500 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all">Cancel</button>
              <button onClick={submit} disabled={submitting || (confirm.kind === "due" && !!creditBlock)} className="flex-1 py-2 text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-cyan-500 rounded-xl transition-all disabled:opacity-60">
                {submitting ? "Processing…" : confirm.kind === "due" ? "Confirm Sale" : "Confirm & Return Change"}
              </button>
            </div>
          </div>
        </div>
      )}

      {receipt && (
        <ReceiptModal
          sale={receipt.sale}
          storeName={storeName}
          vendorId={vendorId}
          onClose={() => setReceipt(null)}
          onNewSale={() => setReceipt(null)}
        />
      )}
      {receipt && receipt.change > 0 && (
        <div role="status" className="fixed top-4 left-1/2 -translate-x-1/2 z-[400] rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-lg">Return change: {fmt(receipt.change)}</div>
      )}
    </div>
  );
}
