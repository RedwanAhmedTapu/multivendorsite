"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import {
  ShoppingCart, Package, Search, X, Plus, Minus, Trash2,
  User, ChevronDown, ChevronRight, Building2, CreditCard,
  Smartphone, Banknote, Circle, Tag, FileText, Bell,
  ToggleLeft, ToggleRight, BarChart2, BookOpen, PieChart,
  Users, LayoutGrid, AlertTriangle, CheckCircle, Loader2,
  Printer, Download, RefreshCw, PauseCircle, Hash,
  TrendingUp, DollarSign, Clock, Save, Edit2,
  ChevronLeft, Eye, Filter, Calendar, Layers, Receipt,
  ArrowUpRight, ArrowDownRight, Wallet, ShieldCheck,
  Phone, Mail, MapPin, Info, CreditCard as IDCard,
  UserPlus, Star, Percent, Minus as MinusIcon,
  Settings, ArrowUpDown, ArrowUp, ArrowDown, Boxes,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Product {
  id: number;
  name: string;
  price: number;
  cost: number;
  cat: string;
  icon: string;
  posStock: number;
  sku: string;
  brand: string;
  unit: string;
  taxRate: number;
  comparePrice: number;
  status: string;
  lowAlert: number;
  rack?: string; // Fix 8: rack location
}

interface CartItem {
  id: number;
  icon: string;
  name: string;
  price: number;
  cost: number;
  taxRate: number;
  sku: string;
  unit: string;
  qty: number;
}

interface Customer {
  id: number;
  name: string;
  phone: string;
  email: string;
  nid: string;
  referrerName: string;
  referrerEmail: string;
  loanLimit: number;
  loanBalance: number;
  loanInterestRate: number;
  loanTenureDays: number;
  creditScore: string;
  orders: number;
  spent: number;
  due: number;
  last: string;
  note: string;
  address: string;
}

interface SaleRecord {
  id: string;
  voucherNo: string;
  date: string;
  time: string;
  custId: number | null;
  custName: string;
  items: { name: string; qty: number; price: number; cost: number; icon: string }[];
  subtotal: number;
  discount: number;
  discPct: number;
  discountType: string;
  discRaw: number;
  tax: number;
  netBilling: number;
  paidAmount: number;
  dueAmount: number;
  cogs: number;
  payment: string;
  status: string;
  note: string;
  loanEnabled: boolean; // whether customer had loan facility at time of sale
}

interface StoreSettings {
  storeName: string;
  vendorId: string;
  banks: { id: number; bankName: string; accountName: string; accountNo: string; routing: string; branch: string }[];
}

// ─── Initial Data ─────────────────────────────────────────────────────────────
const INITIAL_PRODUCTS: Product[] = [
  { id: 1, name: "Samsung Galaxy A54 128GB", price: 38500, cost: 28000, cat: "Electronics", icon: "📱", posStock: 14, sku: "EL-SA54-128", brand: "Samsung", unit: "pcs", taxRate: 5, comparePrice: 42000, status: "Active", lowAlert: 3, rack: "A-01" },
  { id: 2, name: "Men's Polo T-Shirt (M)", price: 890, cost: 550, cat: "Fashion", icon: "👕", posStock: 42, sku: "FA-MPT-M", brand: "Own Brand", unit: "pcs", taxRate: 5, comparePrice: 1200, status: "Active", lowAlert: 5, rack: "C-03" },
  { id: 3, name: "Basmati Rice 5kg", price: 680, cost: 520, cat: "Groceries", icon: "🌾", posStock: 28, sku: "GR-BR5K", brand: "Pran", unit: "kg", taxRate: 0, comparePrice: 0, status: "Active", lowAlert: 10, rack: "G-02" },
  { id: 4, name: "Wireless Bluetooth Earbuds", price: 2200, cost: 1600, cat: "Electronics", icon: "🎧", posStock: 9, sku: "EL-WBE-01", brand: "Realme", unit: "pcs", taxRate: 5, comparePrice: 2800, status: "Active", lowAlert: 3, rack: "A-03" },
  { id: 5, name: "Cooking Oil 5L", price: 820, cost: 680, cat: "Groceries", icon: "🫙", posStock: 5, sku: "GR-CO5L", brand: "Soyabin", unit: "L", taxRate: 0, comparePrice: 0, status: "Active", lowAlert: 8, rack: "G-05" },
  { id: 6, name: "Ladies Kurti (L)", price: 1250, cost: 800, cat: "Fashion", icon: "👗", posStock: 18, sku: "FA-LK-L", brand: "Own Brand", unit: "pcs", taxRate: 5, comparePrice: 1600, status: "Active", lowAlert: 5, rack: "C-07" },
  { id: 7, name: "USB-C Fast Charger 65W", price: 1450, cost: 980, cat: "Electronics", icon: "🔌", posStock: 0, sku: "EL-USBC-65", brand: "Anker", unit: "pcs", taxRate: 5, comparePrice: 1800, status: "Active", lowAlert: 3, rack: "A-05" },
  { id: 8, name: "Green Tea 25 Bags", price: 320, cost: 200, cat: "Groceries", icon: "🍵", posStock: 60, sku: "GR-GT25", brand: "Ispahani", unit: "box", taxRate: 0, comparePrice: 0, status: "Active", lowAlert: 10, rack: "G-01" },
  { id: 9, name: "Moisturizing Face Cream", price: 680, cost: 420, cat: "Beauty & Health", icon: "🧴", posStock: 7, sku: "BH-MFC-01", brand: "Pond's", unit: "pcs", taxRate: 5, comparePrice: 850, status: "Active", lowAlert: 5, rack: "D-02" },
  { id: 10, name: "Kids Drawing Set", price: 450, cost: 280, cat: "Toys", icon: "🎨", posStock: 22, sku: "TO-KDS-01", brand: "Faber", unit: "set", taxRate: 5, comparePrice: 600, status: "Active", lowAlert: 5, rack: "F-04" },
];

const INITIAL_CUSTOMERS: Customer[] = [
  { id: 1, name: "Fatima Khanam", phone: "01712-111222", email: "fatima@gmail.com", nid: "1234567890123", referrerName: "Mehdi Hassan", referrerEmail: "mehdi.h@yahoo.com", loanLimit: 50000, loanBalance: 0, loanInterestRate: 12, loanTenureDays: 30, creditScore: "Excellent", orders: 24, spent: 42800, due: 0, last: "2026-04-18", note: "Loyal customer", address: "House 12, Mirpur-10, Dhaka" },
  { id: 2, name: "Mehdi Hassan", phone: "01812-222333", email: "mehdi.h@yahoo.com", nid: "9876543210123", referrerName: "", referrerEmail: "", loanLimit: 30000, loanBalance: 5000, loanInterestRate: 15, loanTenureDays: 60, creditScore: "Good", orders: 18, spent: 38200, due: 5000, last: "2026-04-17", note: "", address: "Road 5, Dhanmondi, Dhaka" },
  { id: 3, name: "Nasrin Akter", phone: "01912-333444", email: "nasrin.akter@email.com", nid: "1122334455667", referrerName: "Fatima Khanam", referrerEmail: "fatima@gmail.com", loanLimit: 100000, loanBalance: 0, loanInterestRate: 10, loanTenureDays: 90, creditScore: "Excellent", orders: 31, spent: 68500, due: 0, last: "2026-04-19", note: "VIP customer", address: "Flat 4B, Gulshan-2, Dhaka" },
  { id: 4, name: "Sumaiya Islam", phone: "01512-555666", email: "sumaiya.i@gmail.com", nid: "5566778899001", referrerName: "Nasrin Akter", referrerEmail: "nasrin.akter@email.com", loanLimit: 75000, loanBalance: 15000, loanInterestRate: 12, loanTenureDays: 30, creditScore: "Good", orders: 42, spent: 94500, due: 15000, last: "2026-04-20", note: "Top buyer", address: "Plot 7, Uttara Sector-9, Dhaka" },
];

const INITIAL_SETTINGS: StoreSettings = {
  storeName: "Rahman's Store",
  vendorId: "FMV-2847",
  banks: [
    { id: 1, bankName: "Dutch-Bangla Bank Ltd", accountName: "Rahman Trading", accountNo: "1234567890", routing: "090261234", branch: "Mirpur Branch" },
  ],
};

const CAT_COLORS: Record<string, string> = {
  Electronics: "bg-blue-50 text-blue-600",
  Fashion: "bg-purple-50 text-purple-600",
  Groceries: "bg-green-50 text-green-600",
  "Home & Kitchen": "bg-orange-50 text-orange-600",
  Books: "bg-amber-50 text-amber-600",
  Sports: "bg-teal-50 text-teal-600",
  "Beauty & Health": "bg-pink-50 text-pink-600",
  Toys: "bg-indigo-50 text-indigo-600",
  Automotive: "bg-slate-50 text-slate-600",
};

const PAYMENT_METHODS = [
  { id: "Cash", icon: <Banknote size={14} />, label: "Cash" },
  { id: "Card", icon: <CreditCard size={14} />, label: "Card" },
  { id: "bKash", icon: <Smartphone size={14} />, label: "bKash" },
  { id: "Nagad", icon: <Circle size={14} />, label: "Nagad" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmt(n: number) { return "৳" + n.toLocaleString(); }
function fmtD(n: number) { return "৳" + n.toFixed(2); }
let _seq = 1;
function nextVoucher() { return `POSV-2026-${String(_seq++).padStart(4, "0")}`; }
function nextInvId(len: number) { return `INV-${1009 + len}`; }

function useLocalStorage<T>(key: string, init: T): [T, (v: T | ((prev: T) => T)) => void] {
  const [state, setState] = useState<T>(() => {
    if (typeof window === "undefined") return init;
    try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : init; } catch { return init; }
  });
  const set = useCallback((v: T | ((prev: T) => T)) => {
    setState(prev => {
      const next = typeof v === "function" ? (v as (p: T) => T)(prev) : v;
      try { localStorage.setItem(key, JSON.stringify(next)); } catch {}
      return next;
    });
  }, [key]);
  return [state, set];
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function NavLink({ icon, label, active, badge, onClick }: { icon: React.ReactNode; label: string; active: boolean; badge?: number; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-xs font-semibold transition-all group ${
        active ? "bg-cyan-500 text-white shadow-md shadow-cyan-200" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
      }`}
    >
      <span className={`w-7 h-7 flex items-center justify-center rounded-lg text-sm transition-all ${active ? "bg-white/20" : "bg-slate-100 group-hover:bg-slate-200"}`}>{icon}</span>
      <span className="flex-1">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${active ? "bg-white/20 text-white" : "bg-cyan-50 text-cyan-600"}`}>{badge}</span>
      )}
    </button>
  );
}

function Badge({ children, color = "gray" }: { children: React.ReactNode; color?: "green" | "red" | "amber" | "blue" | "purple" | "teal" | "gray" }) {
  const cls = { green: "bg-green-50 text-green-700 border-green-200", red: "bg-red-50 text-red-700 border-red-200", amber: "bg-amber-50 text-amber-700 border-amber-200", blue: "bg-blue-50 text-blue-700 border-blue-200", purple: "bg-purple-50 text-purple-700 border-purple-200", teal: "bg-teal-50 text-teal-700 border-teal-200", gray: "bg-slate-100 text-slate-600 border-slate-200" }[color];
  return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${cls}`}>{children}</span>;
}

// ─── Confirmation Dialog ──────────────────────────────────────────────────────
function ConfirmDialog({ title, message, confirmLabel, confirmColor, onConfirm, onCancel, children }: {
  title: string; message: string; confirmLabel: string; confirmColor: string;
  onConfirm: () => void; onCancel: () => void; children?: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm border border-slate-100 p-5">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center shrink-0"><AlertTriangle size={18} className="text-amber-500" /></div>
          <div>
            <div className="font-bold text-slate-800 text-sm mb-1">{title}</div>
            <div className="text-xs text-slate-500 leading-relaxed">{message}</div>
          </div>
        </div>
        {children}
        <div className="flex gap-2.5 mt-4">
          <button onClick={onCancel} className="flex-1 py-2 text-xs font-semibold text-slate-500 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all">Cancel</button>
          <button onClick={onConfirm} className={`flex-1 py-2 text-xs font-bold text-white rounded-xl transition-all ${confirmColor}`}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

// ─── Customer Modal with 3 Tabs ───────────────────────────────────────────────
// Fix 7: current balance field is read-only (not editable)
function CustomerModal({ onClose, onSave, editData }: { onClose: () => void; onSave: (c: Omit<Customer, "id" | "orders" | "spent" | "due" | "last">) => void; editData?: Customer }) {
  const [tab, setTab] = useState(0);
  const [form, setForm] = useState({
    name: editData?.name || "", phone: editData?.phone || "", address: editData?.address || "",
    note: editData?.note || "",
    email: editData?.email || "", nid: editData?.nid || "", referrerName: editData?.referrerName || "", referrerEmail: editData?.referrerEmail || "",
    loanLimit: editData?.loanLimit || 0, loanBalance: editData?.loanBalance || 0, loanInterestRate: editData?.loanInterestRate || 12, loanTenureDays: editData?.loanTenureDays || 30, creditScore: editData?.creditScore || "Good",
  });
  const upd = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));
  const inp = "w-full bg-white border border-cyan-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 placeholder-slate-300 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 transition-all";

  const tabs = [
    { label: "Basic Info", icon: <User size={13} /> },
    { label: "Identity", icon: <IDCard size={13} /> },
    { label: "Loan / Credit", icon: <Wallet size={13} /> },
  ];

  const handleSave = () => {
    if (!form.name || !form.phone) return;
    onSave({ name: form.name, phone: form.phone, address: form.address, note: form.note, email: form.email, nid: form.nid, referrerName: form.referrerName, referrerEmail: form.referrerEmail, loanLimit: Number(form.loanLimit), loanBalance: Number(form.loanBalance), loanInterestRate: Number(form.loanInterestRate), loanTenureDays: Number(form.loanTenureDays), creditScore: form.creditScore });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-cyan-100 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center"><UserPlus size={15} className="text-white" /></div>
            <span className="font-bold text-slate-700">{editData ? "Edit Customer" : "Add Customer"}</span>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 transition-colors"><X size={16} /></button>
        </div>
        <div className="flex gap-1 px-4 pt-3 pb-0 border-b border-slate-100">
          {tabs.map((t, i) => (
            <button key={i} onClick={() => setTab(i)} className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-lg border-b-2 transition-all ${tab === i ? "border-cyan-500 text-cyan-600 bg-cyan-50" : "border-transparent text-slate-400 hover:text-slate-600"}`}>
              {t.icon}{t.label}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {tab === 0 && (
            <>
              <div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Full Name <span className="text-rose-500">*</span></label><input className={inp} placeholder="Customer's full name" value={form.name} onChange={e => upd("name", e.target.value)} /></div>
              <div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Phone <span className="text-rose-500">*</span></label><div className="relative"><Phone size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-400" /><input className={inp + " pl-9"} placeholder="01XXX-XXXXXX" value={form.phone} onChange={e => upd("phone", e.target.value)} /></div></div>
              <div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Address</label><div className="relative"><MapPin size={13} className="absolute left-3 top-3 text-cyan-400" /><textarea className={inp + " pl-9 resize-none"} rows={2} placeholder="Full address" value={form.address} onChange={e => upd("address", e.target.value)} /></div></div>
              <div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Internal Note</label><textarea className={inp + " resize-none"} rows={2} placeholder="VIP, special preference..." value={form.note} onChange={e => upd("note", e.target.value)} /></div>
            </>
          )}
          {tab === 1 && (
            <>
              <div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Email Address</label><div className="relative"><Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-400" /><input type="email" className={inp + " pl-9"} placeholder="customer@email.com" value={form.email} onChange={e => upd("email", e.target.value)} /></div></div>
              <div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">National ID (NID)</label><div className="relative"><ShieldCheck size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-400" /><input className={inp + " pl-9 font-mono"} placeholder="13-digit NID number" maxLength={17} value={form.nid} onChange={e => upd("nid", e.target.value)} /></div></div>
              <div className="h-px bg-slate-100 my-1" />
              <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
                <div className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-3">Referrer Information</div>
                <div className="space-y-3">
                  <div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Referrer Name</label><input className={inp} placeholder="Who referred this customer?" value={form.referrerName} onChange={e => upd("referrerName", e.target.value)} /></div>
                  <div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Referrer Email</label><input type="email" className={inp} placeholder="referrer@email.com" value={form.referrerEmail} onChange={e => upd("referrerEmail", e.target.value)} /></div>
                </div>
              </div>
            </>
          )}
          {tab === 2 && (
            <>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
                <AlertTriangle size={13} className="text-amber-500 mt-0.5 shrink-0" />
                <p className="text-xs text-amber-700">Loan limits are subject to credit assessment. Ensure NID is verified before enabling credit.</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Loan / Credit Limit (৳)</label>
                  <input type="number" min={0} className={inp + " font-mono"} placeholder="0" value={form.loanLimit || ""} onChange={e => upd("loanLimit", e.target.value)} />
                </div>
                {/* Fix 7: Current balance is read-only */}
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">
                    Current Balance (৳)
                    <span className="ml-1 text-[9px] text-slate-300 normal-case font-normal">(auto)</span>
                  </label>
                  <div className={inp + " font-mono bg-slate-50 text-slate-400 cursor-not-allowed border-slate-200 flex items-center"}>
                    {fmt(Number(form.loanBalance) || 0)}
                  </div>
                  <p className="text-[9px] text-slate-400 mt-1">Updated automatically from transactions</p>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Interest Rate (%/year)</label>
                  <input type="number" min={0} max={100} step={0.5} className={inp + " font-mono"} placeholder="12" value={form.loanInterestRate || ""} onChange={e => upd("loanInterestRate", e.target.value)} />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Loan Tenure (Days)</label>
                  <input type="number" min={1} className={inp + " font-mono"} placeholder="30" value={form.loanTenureDays || ""} onChange={e => upd("loanTenureDays", e.target.value)} />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Credit Score</label>
                <select className={inp + " appearance-none cursor-pointer"} value={form.creditScore} onChange={e => upd("creditScore", e.target.value)}>
                  {["Excellent", "Good", "Fair", "Poor", "No History"].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              {form.loanLimit > 0 && (
                <div className="bg-gradient-to-r from-cyan-50 to-blue-50 rounded-xl p-4 border border-cyan-100">
                  <div className="text-[10px] font-bold text-cyan-500 uppercase tracking-widest mb-2">Loan Summary</div>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between"><span className="text-slate-500">Available Credit</span><span className="font-bold text-green-600 font-mono">{fmt(Number(form.loanLimit) - Number(form.loanBalance))}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Monthly Interest</span><span className="font-bold font-mono text-slate-700">{fmt(Math.round(Number(form.loanBalance) * Number(form.loanInterestRate) / 1200))}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Utilization</span><span className={`font-bold font-mono ${Number(form.loanBalance) / Number(form.loanLimit) > 0.8 ? "text-red-600" : "text-slate-700"}`}>{form.loanLimit > 0 ? Math.round(Number(form.loanBalance) / Number(form.loanLimit) * 100) : 0}%</span></div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
        <div className="flex gap-2.5 px-5 py-4 border-t border-slate-100">
          <button onClick={() => tab > 0 ? setTab(t => t - 1) : onClose()} className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-500 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all">
            <ChevronLeft size={13} />{tab > 0 ? "Back" : "Cancel"}
          </button>
          {tab < 2 ? (
            <button onClick={() => setTab(t => t + 1)} className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-xs font-bold rounded-xl hover:from-blue-700 hover:to-cyan-600 transition-all">
              Next <ChevronRight size={13} />
            </button>
          ) : (
            <button onClick={handleSave} className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-xs font-bold rounded-xl hover:from-blue-700 hover:to-cyan-600 transition-all">
              <Save size={13} /> Save Customer
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Receipt Modal ────────────────────────────────────────────────────────────
function ReceiptModal({ sale, onClose, onNewSale, storeName, vendorId }: { sale: SaleRecord; onClose: () => void; onNewSale: () => void; storeName: string; vendorId: string }) {
  let discLabel = "";
  if (sale.discount > 0) discLabel = sale.discountType === "flat" ? `Flat ৳${sale.discRaw}` : `${sale.discPct}% on subtotal`;

  // ── Build balanced double-entry journal ──────────────────────────────────
  // Revenue side: Gross Revenue = Subtotal (before discount/tax)
  // Net billing = subtotal - discount + tax
  // DR: Cash/Bank (paidAmount) + Receivable (dueAmount) + SalesDiscount (discount)
  // CR: Sales Revenue (subtotal) + VAT Payable (tax)
  // COGS: DR COGS / CR Inventory (self-balancing)
  const dueAcctLabel = sale.loanEnabled ? "Receivable (Customer A/C)" : "Receivable — Uncredited Customer";
  const entries: { type: string; acct: string; amt: number }[] = [];
  if (sale.paidAmount > 0) entries.push({ type: "DR", acct: "Cash / Bank", amt: sale.paidAmount });
  if (sale.dueAmount > 0) entries.push({ type: "DR", acct: dueAcctLabel, amt: sale.dueAmount });
  if (sale.discount > 0) entries.push({ type: "DR", acct: "Sales Discount Account", amt: sale.discount });
  entries.push({ type: "CR", acct: "Sales Revenue (Gross)", amt: sale.subtotal });
  if (sale.tax > 0) entries.push({ type: "CR", acct: "VAT Payable", amt: sale.tax });
  if (sale.cogs > 0) {
    entries.push({ type: "DR", acct: "Cost of Goods Sold (COGS)", amt: sale.cogs });
    entries.push({ type: "CR", acct: "Inventory Asset", amt: sale.cogs });
  }
  const totalDR = entries.filter(e => e.type === "DR").reduce((s, e) => s + e.amt, 0);
  const totalCR = entries.filter(e => e.type === "CR").reduce((s, e) => s + e.amt, 0);
  const balanced = Math.abs(totalDR - totalCR) < 0.01;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl border border-cyan-100 flex flex-col max-h-[92vh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            {sale.paidAmount === 0 && sale.dueAmount > 0
              ? <><AlertTriangle size={18} className="text-amber-500" /><span className="font-bold text-slate-700">Credit Sale Recorded</span></>
              : sale.dueAmount > 0
                ? <><CheckCircle size={18} className="text-blue-500" /><span className="font-bold text-slate-700">Partial Payment — Due Pending</span></>
                : <><CheckCircle size={18} className="text-green-500" /><span className="font-bold text-slate-700">Payment Successful</span></>
            }
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 transition-colors"><X size={16} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          <div className="bg-slate-50 border border-dashed border-slate-300 rounded-xl p-5 font-mono text-xs">
            <div className="text-center mb-3"><div className="text-lg font-bold">🏪 {storeName}</div><div className="text-slate-400 text-[10px]">FinixMart Vendor · {vendorId} · Dhaka<br />{sale.date} at {sale.time}</div></div>
            <hr className="border-dashed border-slate-300 my-3" />
            <div className="space-y-1">
              <div className="flex justify-between"><span>Invoice #</span><b>{sale.id}</b></div>
              <div className="flex justify-between"><span>Voucher #</span><b className="text-teal-600">{sale.voucherNo}</b></div>
              <div className="flex justify-between"><span>Customer</span><span>{sale.custName}</span></div>
              <div className="flex justify-between"><span>Payment</span><span>{sale.payment}</span></div>
            </div>
            <hr className="border-dashed border-slate-300 my-3" />
            <div className="space-y-1">
              {sale.items.map((it, i) => (
                <div key={i} className="grid grid-cols-[1fr_auto_auto] gap-2">
                  <span className="truncate">{it.icon} {it.name}</span>
                  <span className="text-slate-400">×{it.qty}</span>
                  <span className="text-right">{fmt(it.price * it.qty)}</span>
                </div>
              ))}
            </div>
            <hr className="border-dashed border-slate-300 my-3" />
            <div className="space-y-1">
              <div className="flex justify-between"><span>Subtotal</span><span>{fmt(sale.subtotal)}</span></div>
              <div className="flex justify-between"><span>VAT</span><span>{fmt(sale.tax)}</span></div>
              {sale.discount > 0 && <div className="flex justify-between text-green-600"><span>Discount ({discLabel})</span><span>-{fmt(sale.discount)}</span></div>}
              <div className="flex justify-between font-bold border-t border-slate-400 pt-2 mt-1"><span>Net Billing</span><span>{fmt(sale.netBilling)}</span></div>
              {sale.paidAmount > 0 && <div className="flex justify-between"><span>Paid</span><span className="text-green-700 font-bold">{fmt(sale.paidAmount)}</span></div>}
              {sale.dueAmount > 0 && sale.paidAmount === 0
                ? <div className="flex justify-between font-bold text-amber-600"><span>⚠ Credit Sale (Full Due)</span><span>{fmt(sale.dueAmount)}</span></div>
                : sale.dueAmount > 0
                  ? <div className="flex justify-between font-bold text-amber-600"><span>Due</span><span>{fmt(sale.dueAmount)}</span></div>
                  : <div className="flex justify-between text-green-600 font-bold"><span>✓ Fully Paid</span><span>{fmt(0)}</span></div>
              }
            </div>
            <div className="text-center text-slate-400 text-[10px] mt-4">🌐 finixmart.com/rahman-store · Thank you!</div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2"><BookOpen size={14} className="text-teal-600" /><span className="font-bold text-sm text-slate-700">Accounting Voucher</span><span className="font-mono text-[10px] bg-teal-50 text-teal-600 border border-teal-200 px-2 py-0.5 rounded-full">{sale.voucherNo}</span></div>
              {balanced ? <Badge color="green"><CheckCircle size={10} /> Balanced</Badge> : <Badge color="red"><AlertTriangle size={10} /> Check</Badge>}
            </div>
            <table className="w-full text-xs border border-slate-200 rounded-xl overflow-hidden">
              <thead><tr className="bg-slate-800 text-white"><th className="px-3 py-2 text-left w-12">Type</th><th className="px-3 py-2 text-left">Account</th><th className="px-3 py-2 text-right w-24">Debit</th><th className="px-3 py-2 text-right w-24">Credit</th></tr></thead>
              <tbody>
                {entries.map((e, i) => (
                  <tr key={i} className="border-b border-slate-50">
                    <td className="px-3 py-2"><span className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded ${e.type === "DR" ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"}`}>{e.type}</span></td>
                    <td className="px-3 py-2 font-medium text-slate-700">{e.acct}</td>
                    <td className="px-3 py-2 text-right font-mono font-semibold text-red-600">{e.type === "DR" ? fmtD(e.amt) : ""}</td>
                    <td className="px-3 py-2 text-right font-mono font-semibold text-green-600">{e.type === "CR" ? fmtD(e.amt) : ""}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot><tr className="bg-slate-800 text-white"><td colSpan={2} className="px-3 py-2 font-bold">TOTAL</td><td className="px-3 py-2 text-right font-mono font-bold">{fmtD(totalDR)}</td><td className="px-3 py-2 text-right font-mono font-bold">{fmtD(totalCR)}</td></tr></tfoot>
            </table>
          </div>
        </div>
        <div className="flex gap-2.5 px-5 py-4 border-t border-slate-100 flex-wrap">
          <button className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-500 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all"><Printer size={13} /> Print</button>
          <button onClick={onNewSale} className="ml-auto flex items-center gap-1.5 px-5 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-xs font-bold rounded-xl hover:from-blue-700 hover:to-cyan-600 shadow-md shadow-blue-200 transition-all">Done & New Sale <ChevronRight size={13} /></button>
        </div>
      </div>
    </div>
  );
}

// ─── Settings View ────────────────────────────────────────────────────────────
// Fix 2: Settings page with bank info management
function SettingsView({ settings, setSettings }: { settings: StoreSettings; setSettings: (v: StoreSettings | ((p: StoreSettings) => StoreSettings)) => void }) {
  const [showAddBank, setShowAddBank] = useState(false);
  const [bankForm, setBankForm] = useState({ bankName: "", accountName: "", accountNo: "", routing: "", branch: "" });
  const inp = "w-full bg-white border border-cyan-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 placeholder-slate-300 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 transition-all";

  const addBank = () => {
    if (!bankForm.bankName || !bankForm.accountNo) return;
    setSettings(p => ({ ...p, banks: [...p.banks, { ...bankForm, id: Date.now() }] }));
    setBankForm({ bankName: "", accountName: "", accountNo: "", routing: "", branch: "" });
    setShowAddBank(false);
  };

  const removeBank = (id: number) => setSettings(p => ({ ...p, banks: p.banks.filter(b => b.id !== id) }));

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="bg-white px-5 py-4 border-b border-slate-100 shrink-0">
        <div className="text-sm font-bold text-slate-800">Store Settings</div>
        <div className="text-[10px] text-slate-400">Configure your store, payment & bank details</div>
      </div>
      <div className="p-5 max-w-2xl space-y-6">
        {/* Store Info */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <div className="text-xs font-bold text-slate-700 mb-4 flex items-center gap-2"><Building2 size={14} className="text-cyan-500" />Store Information</div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Store Name</label>
              <input className={inp} value={settings.storeName} onChange={e => setSettings(p => ({ ...p, storeName: e.target.value }))} />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Vendor ID</label>
              <input className={inp + " font-mono bg-slate-50 text-slate-400"} value={settings.vendorId} readOnly />
            </div>
          </div>
        </div>

        {/* Bank Accounts */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="text-xs font-bold text-slate-700 flex items-center gap-2"><CreditCard size={14} className="text-cyan-500" />Bank Accounts for Card Payments</div>
            <button onClick={() => setShowAddBank(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl shadow-sm hover:from-blue-700 hover:to-cyan-600 transition-all"><Plus size={12} /> Add Bank</button>
          </div>
          {settings.banks.length === 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-2">
              <AlertTriangle size={13} className="text-amber-500 mt-0.5 shrink-0" />
              <p className="text-xs text-amber-700">No bank accounts added. Add bank details so Card payment routing is shown correctly at checkout.</p>
            </div>
          )}
          <div className="space-y-3">
            {settings.banks.map(bank => (
              <div key={bank.id} className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-xl border border-blue-100 p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="text-sm font-bold text-slate-800">{bank.bankName}</div>
                    <div className="text-xs text-slate-500">{bank.branch}</div>
                  </div>
                  <button onClick={() => removeBank(bank.id)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-600 transition-all"><X size={13} /></button>
                </div>
                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div><div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Account Name</div><div className="font-semibold text-slate-700">{bank.accountName}</div></div>
                  <div><div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Account No.</div><div className="font-mono font-semibold text-slate-700">{bank.accountNo}</div></div>
                  <div><div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Routing No.</div><div className="font-mono font-semibold text-slate-700">{bank.routing || "—"}</div></div>
                </div>
              </div>
            ))}
          </div>

          {/* Add Bank Form */}
          {showAddBank && (
            <div className="mt-4 p-4 bg-cyan-50 border border-cyan-100 rounded-xl space-y-3">
              <div className="text-xs font-bold text-cyan-600 mb-1">New Bank Account</div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Bank Name <span className="text-rose-500">*</span></label><input className={inp} placeholder="e.g. Dutch-Bangla Bank" value={bankForm.bankName} onChange={e => setBankForm(p => ({ ...p, bankName: e.target.value }))} /></div>
                <div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Branch</label><input className={inp} placeholder="Branch name" value={bankForm.branch} onChange={e => setBankForm(p => ({ ...p, branch: e.target.value }))} /></div>
                <div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Account Name</label><input className={inp} placeholder="As per cheque" value={bankForm.accountName} onChange={e => setBankForm(p => ({ ...p, accountName: e.target.value }))} /></div>
                <div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Account No. <span className="text-rose-500">*</span></label><input className={inp + " font-mono"} placeholder="Account number" value={bankForm.accountNo} onChange={e => setBankForm(p => ({ ...p, accountNo: e.target.value }))} /></div>
                <div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Routing No.</label><input className={inp + " font-mono"} placeholder="9-digit routing" value={bankForm.routing} onChange={e => setBankForm(p => ({ ...p, routing: e.target.value }))} /></div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShowAddBank(false)} className="px-4 py-2 text-xs font-semibold text-slate-500 border border-slate-200 rounded-xl hover:bg-white transition-all">Cancel</button>
                <button onClick={addBank} className="px-4 py-2 text-xs font-bold bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl transition-all flex items-center gap-1.5"><Save size={12} />Save Bank</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── POS Terminal View ────────────────────────────────────────────────────────
function POSView({ products, setProducts, customers, setCustomers, sales, setSales, settings }: {
  products: Product[]; setProducts: (v: Product[] | ((p: Product[]) => Product[])) => void;
  customers: Customer[]; setCustomers: (v: Customer[] | ((p: Customer[]) => Customer[])) => void;
  sales: SaleRecord[]; setSales: (v: SaleRecord[] | ((p: SaleRecord[]) => SaleRecord[])) => void;
  settings: StoreSettings;
}) {
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState("All");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selCustomer, setSelCustomer] = useState<Customer | null>(null);
  const [discType, setDiscType] = useState<"pct" | "flat">("pct");
  const [discVal, setDiscVal] = useState("");
  const [paidAmt, setPaidAmt] = useState("");
  const [coupon, setCoupon] = useState("");
  const [payMethod, setPayMethod] = useState("Cash");
  const [showCustPicker, setShowCustPicker] = useState(false);
  const [receipt, setReceipt] = useState<SaleRecord | null>(null);
  const [toast, setToast] = useState("");
  const [custSearch, setCustSearch] = useState("");

  // Fix confirmations
  const [confirmDue, setConfirmDue] = useState<null | { due: number; isFullDue: boolean; hasLoan: boolean; custName: string; onConfirm: () => void }>(null);
  const [confirmOverpay, setConfirmOverpay] = useState<null | { extra: number; hasLoan: boolean; custName: string; onConfirm: () => void }>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const cats = ["All", ...Array.from(new Set(products.map(p => p.cat)))];
  const filtered = products.filter(p => (activeCat === "All" || p.cat === activeCat) && (p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase())));
  const filteredCusts = customers.filter(c => !custSearch || c.name.toLowerCase().includes(custSearch.toLowerCase()) || c.phone.includes(custSearch) || c.email.toLowerCase().includes(custSearch.toLowerCase()));

  const addToCart = (p: Product) => {
    if (p.posStock === 0) return;
    setCart(prev => {
      const ex = prev.find(x => x.id === p.id);
      if (ex) {
        if (ex.qty >= p.posStock) { showToast("⚠ Max stock reached"); return prev; }
        return prev.map(x => x.id === p.id ? { ...x, qty: x.qty + 1 } : x);
      }
      return [...prev, { id: p.id, icon: p.icon, name: p.name, price: p.price, cost: p.cost, taxRate: p.taxRate, sku: p.sku, unit: p.unit, qty: 1 }];
    });
  };
  const chgQty = (id: number, d: number) => {
    setCart(prev => {
      const item = prev.find(x => x.id === id);
      const prod = products.find(x => x.id === id);
      if (!item) return prev;
      const newQty = item.qty + d;
      if (newQty <= 0) return prev.filter(x => x.id !== id);
      if (prod && newQty > prod.posStock) { showToast("⚠ Stock limit"); return prev; }
      return prev.map(x => x.id === id ? { ...x, qty: newQty } : x);
    });
  };
  const removeFromCart = (id: number) => setCart(prev => prev.filter(x => x.id !== id));
  const clearCart = () => { setCart([]); setSelCustomer(null); setDiscVal(""); setPaidAmt(""); setCoupon(""); setPayMethod("Cash"); setDiscType("pct"); };

  // Financials
  const sub = cart.reduce((a, x) => a + x.price * x.qty, 0);
  const rawDisc = parseFloat(discVal) || 0;
  let discAmt = 0, discPct = 0;
  if (discType === "pct") { discPct = Math.min(rawDisc, 100); discAmt = Math.round(sub * discPct / 100); }
  else { discAmt = Math.min(Math.round(rawDisc), sub); discPct = sub > 0 ? Math.round(discAmt / sub * 100) : 0; }
  const taxAmt = cart.reduce((a, x) => a + Math.round(x.price * x.qty * x.taxRate / 100), 0);
  const netBilling = sub - discAmt + taxAmt;
  const paid = parseFloat(paidAmt) || 0;
  const due = Math.max(0, netBilling - paid);
  const extra = Math.max(0, paid - netBilling);

  const isWalkIn = !selCustomer;
  const hasLoanEnabled = selCustomer ? selCustomer.loanLimit > 0 : false;
  const availableCredit = selCustomer ? selCustomer.loanLimit - selCustomer.loanBalance : 0;

  const executeSale = (overridePaid?: number) => {
    // Use exactly what was typed; 0 means full credit/due sale — do NOT fall back to netBilling
    const paidAmount = overridePaid !== undefined ? overridePaid : paid;
    const dueAmount = Math.max(0, netBilling - paidAmount);
    const cogs = cart.reduce((a, x) => a + x.qty * (x.cost || 0), 0);
    const now = new Date();
    const newSale: SaleRecord = {
      id: nextInvId(sales.length), voucherNo: nextVoucher(),
      date: now.toISOString().split("T")[0],
      time: now.toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit", hour12: true }),
      custId: selCustomer?.id || null, custName: selCustomer?.name || "Walk-in",
      items: cart.map(i => ({ name: i.name, qty: i.qty, price: i.price, cost: i.cost, icon: i.icon })),
      subtotal: sub, discount: discAmt, discPct, discountType: discType, discRaw: rawDisc,
      tax: taxAmt, netBilling, paidAmount, dueAmount, cogs, payment: payMethod,
      status: dueAmount > 0 ? "Pending" : "Paid", note: coupon,
      loanEnabled: hasLoanEnabled,
    };
    setProducts(prev => prev.map(p => {
      const ci = cart.find(x => x.id === p.id);
      return ci ? { ...p, posStock: Math.max(0, p.posStock - ci.qty) } : p;
    }));
    setSales(prev => [newSale, ...prev]);
    setReceipt(newSale);
  };

  const doCharge = () => {
    if (!cart.length) { showToast("🛒 Cart is empty!"); return; }

    // Fix 1: Walk-in customers cannot have due
    if (isWalkIn && (paid === 0 || paid < netBilling)) {
      showToast("⚠ Walk-in customers must pay in full. Select a customer for due credit.");
      return;
    }

    // Fix 5: Overpayment check
    if (paid > netBilling) {
      const _paidSnap = paid;
      setConfirmOverpay({
        extra: paid - netBilling,
        hasLoan: hasLoanEnabled,
        custName: selCustomer?.name || "",
        onConfirm: () => { setConfirmOverpay(null); executeSale(_paidSnap); }
      });
      return;
    }

    // Fix 3 & 4: Due amount confirmation — when paid=0 it is a full credit sale
    if (due > 0) {
      const isFullDue = paid === 0;
      const _paidSnap = paid;
      setConfirmDue({
        due,
        isFullDue,
        hasLoan: hasLoanEnabled,
        custName: selCustomer?.name || "",
        onConfirm: () => { setConfirmDue(null); executeSale(_paidSnap); }
      });
      return;
    }

    executeSale(paid);
  };

  // Card payment: show bank info from settings
  const cardBanks = settings.banks;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Toolbar */}
      <div className="bg-white px-4 py-3 border-b border-slate-100 flex items-center justify-between shrink-0">
        <div>
          <div className="text-sm font-bold text-slate-800">POS Terminal</div>
          <div className="text-[10px] text-slate-400">{new Date().toLocaleDateString("en-BD", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={clearCart} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-500 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all"><Trash2 size={12} /> Clear</button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-500 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all"><PauseCircle size={12} /> Hold</button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Products Panel */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="bg-white px-4 py-3 border-b border-slate-100 shrink-0">
            <div className="relative mb-3">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, SKU or scan barcode..." className="w-full pl-9 pr-4 py-2.5 text-sm bg-slate-50 border border-cyan-100 rounded-xl focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-50 transition-all" />
            </div>
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
              {cats.map(c => (
                <button key={c} onClick={() => setActiveCat(c)} className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${activeCat === c ? "bg-cyan-500 text-white border-cyan-500" : "bg-white text-slate-500 border-slate-200 hover:border-cyan-300 hover:text-cyan-600"}`}>{c}</button>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 content-start">
            {filtered.map(p => {
              const outOfStock = p.posStock === 0;
              const lowStock = p.posStock > 0 && p.posStock <= p.lowAlert;
              return (
                <button key={p.id} onClick={() => !outOfStock && addToCart(p)} disabled={outOfStock} className={`relative bg-white border rounded-xl p-3 text-left transition-all group ${outOfStock ? "opacity-40 cursor-not-allowed border-slate-100" : "border-slate-200 hover:border-cyan-400 hover:shadow-md hover:shadow-cyan-50 hover:-translate-y-0.5"}`}>
                  <div className="absolute top-2 right-2 w-5 h-5 bg-cyan-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-sm"><Plus size={11} className="text-white" /></div>
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xl mb-2 ${CAT_COLORS[p.cat]?.split(" ")[0] || "bg-slate-50"}`}>{p.icon}</div>
                  <div className="text-[11px] font-bold text-slate-800 leading-tight mb-1 line-clamp-2">{p.name}</div>
                  <div className="text-xs font-extrabold text-cyan-600">{fmt(p.price)}</div>
                  <div className="flex items-center justify-between mt-1">
                    <span className={`text-[9px] font-semibold ${outOfStock ? "text-red-500" : lowStock ? "text-amber-500" : "text-slate-400"}`}>{outOfStock ? "Out of stock" : lowStock ? `⚠ ${p.posStock} left` : `${p.posStock} ${p.unit}`}</span>
                    <span className="text-[9px] text-slate-300 bg-slate-50 px-1 py-0.5 rounded">{p.taxRate}% VAT</span>
                  </div>
                  {/* Fix 8: show rack */}
                  {p.rack && <div className="mt-1 text-[9px] font-bold text-slate-300 bg-slate-50 px-1.5 py-0.5 rounded-md inline-block">📍 {p.rack}</div>}
                </button>
              );
            })}
            {!filtered.length && (
              <div className="col-span-full flex flex-col items-center justify-center py-16 text-slate-300">
                <Package size={36} className="mb-3 opacity-40" />
                <p className="text-sm font-medium text-slate-400">No products found</p>
              </div>
            )}
          </div>
        </div>

        {/* Cart Panel */}
        <div className="w-80 xl:w-96 shrink-0 border-l border-slate-100 bg-white flex flex-col">
          {/* Customer */}
          <div className="px-4 pt-3 pb-2 border-b border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700">🛒 Current Sale</span>
              <span className="text-[10px] text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full">{cart.reduce((a, x) => a + x.qty, 0)} items</span>
            </div>
            <button onClick={() => setShowCustPicker(true)} className="w-full flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2 text-left hover:bg-blue-100 transition-all">
              <div className="w-7 h-7 rounded-full bg-blue-200 flex items-center justify-center text-xs font-bold text-blue-700 shrink-0">{selCustomer ? selCustomer.name[0] : "👤"}</div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-blue-700 truncate">{selCustomer ? selCustomer.name : "Walk-in Customer"}</div>
                <div className="text-[10px] text-blue-400">
                  {selCustomer ? (
                    selCustomer.due > 0 ? `${selCustomer.phone} · ⚠ Due: ${fmt(selCustomer.due)}` : selCustomer.phone
                  ) : (
                    <span className="text-amber-500 font-semibold">⚠ Full payment required for walk-in</span>
                  )}
                </div>
              </div>
              <ChevronRight size={13} className="text-blue-300 shrink-0" />
            </button>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto px-3 py-2">
            {!cart.length ? (
              <div className="flex flex-col items-center justify-center h-full gap-2 text-slate-300">
                <span className="text-4xl opacity-20">🛍️</span>
                <span className="text-xs font-semibold text-slate-400">Cart is empty</span>
                <span className="text-[10px] text-slate-300">Tap a product to add</span>
              </div>
            ) : (
              cart.map(item => (
                <div key={item.id} className="flex items-center gap-2 py-2 border-b border-slate-50 last:border-0">
                  <span className="text-base">{item.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-bold text-slate-800 truncate">{item.name}</div>
                    <div className="text-[9px] text-slate-400">{fmt(item.price)}/{item.unit} · {item.taxRate}% VAT</div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <button onClick={() => chgQty(item.id, -1)} className="w-5 h-5 flex items-center justify-center rounded-md border border-slate-200 hover:bg-cyan-50 hover:border-cyan-300 text-slate-500 hover:text-cyan-600 transition-all"><Minus size={10} /></button>
                      <span className="text-xs font-bold w-5 text-center">{item.qty}</span>
                      <button onClick={() => chgQty(item.id, 1)} className="w-5 h-5 flex items-center justify-center rounded-md border border-slate-200 hover:bg-cyan-50 hover:border-cyan-300 text-slate-500 hover:text-cyan-600 transition-all"><Plus size={10} /></button>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs font-bold text-slate-800">{fmt(item.price * item.qty)}</div>
                    <button onClick={() => removeFromCart(item.id)} className="mt-1 w-5 h-5 flex items-center justify-center rounded-md bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-600 transition-all ml-auto"><X size={10} /></button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Cart Footer */}
          <div className="border-t border-slate-200 px-4 py-3 space-y-2.5 shrink-0">
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-slate-500"><span>Subtotal</span><span className="font-semibold text-slate-700">{fmt(sub)}</span></div>
              {discAmt > 0 && <div className="flex justify-between text-xs text-green-600"><span>Discount</span><span className="font-semibold">-{fmt(discAmt)}</span></div>}
              <div className="flex justify-between text-xs text-slate-500"><span>VAT</span><span className="font-semibold text-slate-700">{fmt(taxAmt)}</span></div>
            </div>
            <div className="flex justify-between items-center pt-1.5 border-t border-slate-200">
              <span className="text-xs font-extrabold text-slate-800">NET BILLING</span>
              <span className="font-mono text-base font-extrabold text-cyan-600">{fmt(netBilling)}</span>
            </div>

            {/* Discount */}
            <div className="flex items-center gap-1.5">
              <button onClick={() => setDiscType("pct")} className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-all ${discType === "pct" ? "bg-cyan-500 text-white border-cyan-500" : "bg-white text-slate-500 border-slate-200"}`}>% Disc</button>
              <button onClick={() => setDiscType("flat")} className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-all ${discType === "flat" ? "bg-cyan-500 text-white border-cyan-500" : "bg-white text-slate-500 border-slate-200"}`}>৳ Flat</button>
              <div className="relative flex-1">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400">{discType === "pct" ? "%" : "৳"}</span>
                <input type="number" min={0} value={discVal} onChange={e => setDiscVal(e.target.value)} placeholder="0" className="w-full pl-6 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-100 transition-all" />
              </div>
              {discAmt > 0 && <span className="text-[10px] font-bold text-green-600 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full whitespace-nowrap">{discType === "pct" ? `${discPct}% off` : `-${fmt(discAmt)}`}</span>}
            </div>

            {/* Payment Methods */}
            <div className="grid grid-cols-4 gap-1">
              {PAYMENT_METHODS.map(m => (
                <button key={m.id} onClick={() => setPayMethod(m.id)} className={`flex flex-col items-center gap-0.5 py-1.5 rounded-lg border text-[10px] font-bold transition-all ${payMethod === m.id ? "bg-cyan-500 text-white border-cyan-500" : "bg-white text-slate-500 border-slate-200 hover:border-cyan-300"}`}>
                  <span>{m.icon}</span><span>{m.label}</span>
                </button>
              ))}
            </div>

            {/* Fix 2: Card payment bank info */}
            {payMethod === "Card" && cardBanks.length > 0 && (
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-2.5 space-y-1.5">
                <div className="text-[9px] font-bold text-blue-500 uppercase tracking-widest">Card Payment — Transfer To:</div>
                {cardBanks.map(b => (
                  <div key={b.id} className="text-[10px] text-blue-700 space-y-0.5">
                    <div className="font-bold">{b.bankName} {b.branch && `· ${b.branch}`}</div>
                    <div className="font-mono">A/C: {b.accountNo} {b.routing && `· Routing: ${b.routing}`}</div>
                  </div>
                ))}
              </div>
            )}
            {payMethod === "Card" && cardBanks.length === 0 && (
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-2 text-[10px] text-amber-600 font-semibold">⚠ No bank configured. Add bank info in Settings.</div>
            )}

            {/* Note + Paid */}
            <div className="flex gap-1.5">
              <input type="text" value={coupon} onChange={e => setCoupon(e.target.value)} placeholder="Coupon / Note" className="flex-1 py-1.5 px-2.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-cyan-400 transition-all" />
              <input type="number" min={0} value={paidAmt} onChange={e => setPaidAmt(e.target.value)} placeholder="Paid ৳" className="w-24 py-1.5 px-2.5 text-xs font-mono border border-slate-200 rounded-lg focus:outline-none focus:border-cyan-400 transition-all" />
            </div>

            {/* Fix 1: Walk-in due warning */}
            {isWalkIn && cart.length > 0 && paid < netBilling && paid !== 0 && (
              <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 rounded-lg px-3 py-1.5">
                <AlertTriangle size={11} className="text-red-500 shrink-0" />
                <span className="text-[10px] font-bold text-red-600">Walk-in customers cannot have due. Pay full amount or select customer.</span>
              </div>
            )}

            {due > 0 && !isWalkIn && (
              <div className="flex justify-between items-center bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5">
                <span className="text-[10px] font-bold text-amber-600">⚠ Due Amount</span>
                <span className="font-mono text-xs font-extrabold text-amber-700">{fmt(due)}</span>
              </div>
            )}

            {extra > 0 && (
              <div className="flex justify-between items-center bg-blue-50 border border-blue-200 rounded-lg px-3 py-1.5">
                <span className="text-[10px] font-bold text-blue-600">Change / Extra</span>
                <span className="font-mono text-xs font-extrabold text-blue-700">{fmt(extra)}</span>
              </div>
            )}

            <button onClick={doCharge} className="w-full py-3 bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-sm font-extrabold rounded-xl hover:from-blue-700 hover:to-cyan-600 shadow-lg shadow-blue-200 transition-all hover:shadow-xl active:scale-[0.98] flex items-center justify-center gap-2">
              ⚡ Charge {fmt(netBilling)}
            </button>
          </div>
        </div>
      </div>

      {/* Customer Picker */}
      {showCustPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-cyan-100">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <span className="font-bold text-slate-700">Select Customer</span>
              <button onClick={() => setShowCustPicker(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 transition-colors"><X size={16} /></button>
            </div>
            <div className="p-4">
              <div className="relative mb-3"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-400" /><input autoFocus value={custSearch} onChange={e => setCustSearch(e.target.value)} placeholder="Search by name, phone..." className="w-full pl-9 py-2.5 text-sm bg-slate-50 border border-cyan-100 rounded-xl focus:outline-none focus:border-cyan-300 transition-all" /></div>
              <div className="max-h-64 overflow-y-auto space-y-1.5">
                {filteredCusts.map(c => (
                  <button key={c.id} onClick={() => { setSelCustomer(c); setShowCustPicker(false); setCustSearch(""); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border border-slate-100 hover:bg-cyan-50 hover:border-cyan-200 text-left transition-all">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-200 to-cyan-200 flex items-center justify-center text-sm font-bold text-blue-700 shrink-0">{c.name[0]}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-slate-700">{c.name}</div>
                      <div className="text-xs text-slate-400">{c.phone} · {c.email}</div>
                      {c.due > 0 && <div className="text-[10px] text-amber-500 font-semibold">Due: {fmt(c.due)}</div>}
                      {c.loanLimit > 0 && <div className="text-[10px] text-green-500 font-semibold">Credit Limit: {fmt(c.loanLimit)} · Available: {fmt(c.loanLimit - c.loanBalance)}</div>}
                    </div>
                    <div className="text-xs font-bold text-cyan-600">{c.orders} orders</div>
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-2 px-4 pb-4">
              <button onClick={() => { setSelCustomer(null); setShowCustPicker(false); setCustSearch(""); }} className="flex-1 py-2 text-xs font-semibold text-slate-500 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all">Walk-in</button>
            </div>
          </div>
        </div>
      )}

      {/* Fix 3 & 4: Due Confirmation Dialog */}
      {confirmDue && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm border border-slate-100 p-5">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center shrink-0"><AlertTriangle size={18} className="text-amber-500" /></div>
              <div>
                <div className="font-bold text-slate-800 text-sm mb-1">
                  {confirmDue.isFullDue ? "Full Credit Sale" : "Partial Payment — Due Amount"}
                </div>
                <div className="text-xs text-slate-500 leading-relaxed">
                  {confirmDue.isFullDue
                    ? `This is a full credit sale of ${fmt(confirmDue.due)} for ${confirmDue.custName}.`
                    : `${confirmDue.custName} will have a due of ${fmt(confirmDue.due)} after this sale.`}
                </div>
              </div>
            </div>

            {/* Fix 4: Loan check */}
            {confirmDue.hasLoan ? (
              <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-4">
                <div className="flex items-center gap-2 mb-1"><CheckCircle size={13} className="text-green-500" /><span className="text-xs font-bold text-green-700">Credit Facility Enabled</span></div>
                <p className="text-xs text-green-600">This customer has an approved credit limit. The due amount will be posted to <b>Receivable (Customer A/C)</b> in accounting.</p>
                {availableCredit > 0 && (
                  <p className="text-xs text-green-600 mt-1">Available credit: <b>{fmt(availableCredit)}</b></p>
                )}
              </div>
            ) : (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4">
                <div className="flex items-center gap-2 mb-1"><AlertTriangle size={13} className="text-amber-500" /><span className="text-xs font-bold text-amber-700">No Credit/Loan Facility</span></div>
                <p className="text-xs text-amber-600">This customer does not have an approved credit limit. Consider enabling a loan facility from the <b>Customers</b> section before allowing credit sales.</p>
              </div>
            )}

            <div className="bg-slate-50 rounded-xl p-3 mb-4">
              <div className="flex justify-between text-xs"><span className="text-slate-500">Net Billing</span><span className="font-bold">{fmt(netBilling)}</span></div>
              <div className="flex justify-between text-xs mt-1"><span className="text-slate-500">Paid Now</span><span className="font-bold text-green-600">{fmt(paid || 0)}</span></div>
              <div className="flex justify-between text-xs mt-1 pt-1 border-t border-slate-200"><span className="font-bold text-slate-700">Due Amount</span><span className="font-bold text-amber-600">{fmt(confirmDue.due)}</span></div>
            </div>

            <div className="flex gap-2.5">
              <button onClick={() => setConfirmDue(null)} className="flex-1 py-2 text-xs font-semibold text-slate-500 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all">Cancel</button>
              {confirmDue.hasLoan ? (
                <button onClick={confirmDue.onConfirm} className="flex-1 py-2 text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-cyan-500 rounded-xl transition-all hover:from-blue-700 hover:to-cyan-600">Confirm & Post to Receivable</button>
              ) : (
                <button onClick={confirmDue.onConfirm} className="flex-1 py-2 text-xs font-bold text-white bg-amber-500 rounded-xl transition-all hover:bg-amber-600">Proceed Without Credit</button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Fix 5: Overpayment Confirmation Dialog */}
      {confirmOverpay && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm border border-slate-100 p-5">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0"><AlertTriangle size={18} className="text-blue-500" /></div>
              <div>
                <div className="font-bold text-slate-800 text-sm mb-1">Paid Amount Exceeds Invoice</div>
                <div className="text-xs text-slate-500 leading-relaxed">
                  The paid amount is more than the net billing by <b className="text-blue-600">{fmt(confirmOverpay.extra)}</b>.
                </div>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-3 mb-4">
              <div className="flex justify-between text-xs"><span className="text-slate-500">Net Billing</span><span className="font-bold">{fmt(netBilling)}</span></div>
              <div className="flex justify-between text-xs mt-1"><span className="text-slate-500">Paid Amount</span><span className="font-bold text-blue-600">{fmt(paid)}</span></div>
              <div className="flex justify-between text-xs mt-1 pt-1 border-t border-slate-200"><span className="font-bold text-slate-700">Change / Extra</span><span className="font-bold text-blue-600">{fmt(confirmOverpay.extra)}</span></div>
            </div>

            {confirmOverpay.hasLoan ? (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4">
                <p className="text-xs text-blue-700">The extra <b>{fmt(confirmOverpay.extra)}</b> can be treated as advance credit for <b>{confirmOverpay.custName}</b>. Proceed to record the sale with extra amount returned as change.</p>
              </div>
            ) : (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4">
                <p className="text-xs text-amber-700">Please adjust the paid amount to match the invoice amount of <b>{fmt(netBilling)}</b> before charging.</p>
              </div>
            )}

            <div className="flex gap-2.5">
              <button onClick={() => setConfirmOverpay(null)} className="flex-1 py-2 text-xs font-semibold text-slate-500 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all">
                {confirmOverpay.hasLoan ? "Cancel" : "Fix Amount"}
              </button>
              {confirmOverpay.hasLoan && (
                <button onClick={confirmOverpay.onConfirm} className="flex-1 py-2 text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-cyan-500 rounded-xl transition-all">Proceed & Return Change</button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {receipt && <ReceiptModal sale={receipt} onClose={() => setReceipt(null)} onNewSale={() => { setReceipt(null); clearCart(); }} storeName={settings.storeName} vendorId={settings.vendorId} />}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-[200] bg-slate-900 text-white px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xl animate-in slide-in-from-bottom-2">
          {toast}
        </div>
      )}
    </div>
  );
}

// ─── Invoices View ────────────────────────────────────────────────────────────
function InvoicesView({ sales }: { sales: SaleRecord[] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const filtered = sales.filter(s =>
    (!search || s.id.toLowerCase().includes(search.toLowerCase()) || s.custName.toLowerCase().includes(search.toLowerCase())) &&
    (!statusFilter || s.status === statusFilter)
  );

  return (
    <div className="flex flex-col h-full">
      <div className="bg-white px-5 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
        <div><div className="text-sm font-bold text-slate-800">Invoices & Receipts</div><div className="text-[10px] text-slate-400">All sales records with accounting vouchers</div></div>
        <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-500 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all"><Download size={13} /> Export CSV</button>
      </div>
      <div className="bg-white px-5 py-3 border-b border-slate-100 flex items-center gap-3 shrink-0">
        <div className="relative flex-1 max-w-xs"><Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-400" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search invoice, customer..." className="w-full pl-8 py-2 text-xs bg-slate-50 border border-cyan-100 rounded-xl focus:outline-none focus:border-cyan-300 transition-all" /></div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="py-2 px-3 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none cursor-pointer">
          <option value="">All Status</option><option>Paid</option><option>Pending</option>
        </select>
      </div>
      <div className="flex-1 overflow-auto p-5">
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
          <table className="w-full text-xs min-w-[900px]">
            <thead><tr className="bg-slate-50 border-b border-slate-100">{["Invoice #","Date","Customer","Items","Gross","Discount","VAT","Net Bill","Paid","Due","Payment","Status","Actions"].map(h => <th key={h} className="px-3 py-2.5 text-left text-[10px] font-extrabold text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>)}</tr></thead>
            <tbody>
              {!filtered.length ? <tr><td colSpan={13} className="px-3 py-12 text-center text-slate-400 text-sm">No invoices found</td></tr> : filtered.map(s => (
                <tr key={s.id} className="border-b border-slate-50 hover:bg-blue-50/30 transition-colors">
                  <td className="px-3 py-2.5"><span className="font-mono font-semibold text-cyan-600">{s.id}</span></td>
                  <td className="px-3 py-2.5 text-slate-500">{s.date}</td>
                  <td className="px-3 py-2.5 font-semibold text-slate-700">{s.custName}</td>
                  <td className="px-3 py-2.5 text-center">{s.items.reduce((a, x) => a + x.qty, 0)}</td>
                  <td className="px-3 py-2.5">{fmt(s.subtotal)}</td>
                  <td className="px-3 py-2.5"><span className="text-green-600 font-semibold">{s.discount > 0 ? `-${fmt(s.discount)}` : "—"}</span></td>
                  <td className="px-3 py-2.5">{fmt(s.tax)}</td>
                  <td className="px-3 py-2.5 font-bold text-slate-800">{fmt(s.netBilling)}</td>
                  <td className="px-3 py-2.5 text-green-600 font-bold">{fmt(s.paidAmount)}</td>
                  <td className="px-3 py-2.5"><span className={s.dueAmount > 0 ? "text-amber-600 font-bold" : "text-slate-300"}>{fmt(s.dueAmount)}</span></td>
                  <td className="px-3 py-2.5"><Badge color="blue">{s.payment}</Badge></td>
                  <td className="px-3 py-2.5"><Badge color={s.status === "Paid" ? "green" : "amber"}>{s.status}</Badge></td>
                  <td className="px-3 py-2.5"><button className="px-2 py-1 text-[10px] font-bold text-slate-500 border border-slate-200 rounded-lg hover:bg-slate-50 transition-all flex items-center gap-1"><Eye size={10} /> View</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-3 flex gap-5 text-xs text-slate-500">
          <span>Showing <b>{filtered.length}</b> invoices</span>
          <span>Total: <b className="text-cyan-600">{fmt(filtered.reduce((a, s) => a + s.netBilling, 0))}</b></span>
          <span>Collected: <b className="text-green-600">{fmt(filtered.reduce((a, s) => a + s.paidAmount, 0))}</b></span>
          <span>Due: <b className="text-amber-500">{fmt(filtered.reduce((a, s) => a + s.dueAmount, 0))}</b></span>
        </div>
      </div>
    </div>
  );
}

// ─── Products View ────────────────────────────────────────────────────────────
// Fix 8: rack field added to add/edit product
function ProductsView({ products, setProducts }: { products: Product[]; setProducts: (v: Product[] | ((p: Product[]) => Product[])) => void }) {
  const [search, setSearch] = useState("");
  const [editProd, setEditProd] = useState<Product | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", price: "", cost: "", cat: "", taxRate: "5", posStock: "", unit: "pcs", brand: "", sku: "", lowAlert: "5", comparePrice: "", rack: "" });

  const upd = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));
  const catIcons: Record<string, string> = { Electronics: "💻", Fashion: "👗", Groceries: "🛒", "Home & Kitchen": "🏠", Books: "📚", Sports: "⚽", "Beauty & Health": "💄", Toys: "🎮", Automotive: "🚗" };

  const filtered = products.filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase()));
  const inp = "w-full bg-white border border-cyan-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 transition-all";

  const saveProduct = () => {
    if (!form.name || !form.price || !form.cat) return;
    setProducts(prev => [...prev, { id: Date.now(), name: form.name, price: parseFloat(form.price), cost: parseFloat(form.cost) || 0, cat: form.cat, icon: catIcons[form.cat] || "📦", posStock: parseInt(form.posStock) || 0, sku: form.sku || "SKU-" + Date.now().toString().slice(-5), brand: form.brand || "Own Brand", unit: form.unit, taxRate: parseFloat(form.taxRate) || 0, comparePrice: parseFloat(form.comparePrice) || 0, status: "Active", lowAlert: parseInt(form.lowAlert) || 5, rack: form.rack }]);
    setShowAdd(false);
    setForm({ name: "", price: "", cost: "", cat: "", taxRate: "5", posStock: "", unit: "pcs", brand: "", sku: "", lowAlert: "5", comparePrice: "", rack: "" });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="bg-white px-5 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
        <div><div className="text-sm font-bold text-slate-800">My Products</div><div className="text-[10px] text-slate-400">Manage inventory, cost prices & rack locations</div></div>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl shadow-md shadow-blue-200 hover:from-blue-700 hover:to-cyan-600 transition-all"><Plus size={13} /> Add Product</button>
      </div>
      <div className="bg-white px-5 py-3 border-b border-slate-100 shrink-0">
        <div className="relative max-w-xs"><Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-400" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products..." className="w-full pl-8 py-2 text-xs bg-slate-50 border border-cyan-100 rounded-xl focus:outline-none focus:border-cyan-300 transition-all" /></div>
      </div>
      <div className="flex-1 overflow-auto p-5">
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
          <table className="w-full text-xs min-w-[900px]">
            <thead><tr className="bg-slate-50 border-b border-slate-100">{["Product","SKU","Category","Sell Price","Cost Price","Stock","Rack","VAT","Status","Actions"].map(h => <th key={h} className="px-3 py-2.5 text-left text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">{h}</th>)}</tr></thead>
            <tbody>
              {filtered.map(p => {
                const stk = p.posStock; const low = stk > 0 && stk <= p.lowAlert; const out = stk === 0;
                return (
                  <tr key={p.id} className="border-b border-slate-50 hover:bg-blue-50/30 transition-colors">
                    <td className="px-3 py-2.5"><div className="flex items-center gap-2"><span className="text-lg">{p.icon}</span><div><div className="font-bold text-slate-700">{p.name}</div><div className="text-[10px] text-slate-400">{p.brand}</div></div></div></td>
                    <td className="px-3 py-2.5"><span className="font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded">{p.sku}</span></td>
                    <td className="px-3 py-2.5"><Badge color="blue">{p.cat}</Badge></td>
                    <td className="px-3 py-2.5 font-bold text-slate-800">{fmt(p.price)}</td>
                    <td className="px-3 py-2.5 font-bold text-teal-600">{fmt(p.cost)}</td>
                    <td className="px-3 py-2.5 font-bold text-center">{stk}</td>
                    {/* Fix 8: Rack column */}
                    <td className="px-3 py-2.5">
                      {p.rack ? (
                        <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-lg border border-slate-200">
                          <Boxes size={10} /> {p.rack}
                        </span>
                      ) : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-3 py-2.5"><Badge color="teal">{p.taxRate}%</Badge></td>
                    <td className="px-3 py-2.5"><Badge color={out ? "red" : low ? "amber" : "green"}>{out ? "Out of Stock" : low ? "Low Stock" : "In Stock"}</Badge></td>
                    <td className="px-3 py-2.5"><button onClick={() => setEditProd(p)} className="px-2 py-1 text-[10px] font-bold text-slate-500 border border-slate-200 rounded-lg hover:bg-slate-50 transition-all flex items-center gap-1"><Edit2 size={10} /> Edit</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Product Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-cyan-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 sticky top-0 bg-white">
              <span className="font-bold text-slate-700">Add New Product</span>
              <button onClick={() => setShowAdd(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 transition-colors"><X size={16} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Product Name <span className="text-rose-500">*</span></label><input className={inp} placeholder="e.g. Samsung Galaxy A54" value={form.name} onChange={e => upd("name", e.target.value)} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Category <span className="text-rose-500">*</span></label><select className={inp + " appearance-none cursor-pointer"} value={form.cat} onChange={e => upd("cat", e.target.value)}><option value="">Select...</option>{Object.keys(catIcons).map(c => <option key={c}>{c}</option>)}</select></div>
                <div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Brand</label><input className={inp} placeholder="Brand name" value={form.brand} onChange={e => upd("brand", e.target.value)} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Selling Price (৳) <span className="text-rose-500">*</span></label><input type="number" className={inp + " font-mono"} placeholder="0.00" value={form.price} onChange={e => upd("price", e.target.value)} /></div>
                <div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Cost Price (৳) <span className="text-teal-500 text-[9px]">COGS</span></label><input type="number" className={inp + " font-mono"} placeholder="0.00" value={form.cost} onChange={e => upd("cost", e.target.value)} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Initial Stock</label><input type="number" className={inp + " font-mono"} placeholder="0" value={form.posStock} onChange={e => upd("posStock", e.target.value)} /></div>
                <div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">VAT Rate (%)</label><select className={inp + " appearance-none cursor-pointer"} value={form.taxRate} onChange={e => upd("taxRate", e.target.value)}>{["0","5","7.5","10","15"].map(v => <option key={v} value={v}>{v}%</option>)}</select></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">SKU</label><input className={inp + " font-mono"} placeholder="Auto-generated" value={form.sku} onChange={e => upd("sku", e.target.value)} /></div>
                <div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Unit</label><select className={inp + " appearance-none cursor-pointer"} value={form.unit} onChange={e => upd("unit", e.target.value)}>{["pcs","kg","g","L","ml","box","set"].map(u => <option key={u}>{u}</option>)}</select></div>
              </div>
              {/* Fix 8: Rack field */}
              <div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block flex items-center gap-1"><Boxes size={10} /> Rack / Shelf Location</label><input className={inp + " font-mono"} placeholder="e.g. A-01, B-03, G-Shelf2" value={form.rack} onChange={e => upd("rack", e.target.value)} /></div>
              <div className="flex gap-2.5 pt-2">
                <button onClick={() => setShowAdd(false)} className="px-4 py-2 text-xs font-semibold text-slate-500 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all">Cancel</button>
                <button onClick={saveProduct} className="flex-1 py-2 text-xs font-bold bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl shadow-md shadow-blue-200 hover:from-blue-700 hover:to-cyan-600 transition-all flex items-center justify-center gap-1.5"><Save size={13} /> Save Product</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {editProd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-cyan-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 sticky top-0 bg-white">
              <span className="font-bold text-slate-700">Edit — {editProd.name}</span>
              <button onClick={() => setEditProd(null)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 transition-colors"><X size={16} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Product Name</label><input className={inp} defaultValue={editProd.name} id="ep_name" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Selling Price</label><input type="number" className={inp + " font-mono"} defaultValue={editProd.price} id="ep_price" /></div>
                <div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Cost Price</label><input type="number" className={inp + " font-mono"} defaultValue={editProd.cost} id="ep_cost" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Stock</label><input type="number" className={inp + " font-mono"} defaultValue={editProd.posStock} id="ep_stock" /></div>
                <div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">VAT Rate</label><select className={inp + " appearance-none cursor-pointer"} defaultValue={editProd.taxRate} id="ep_tax">{["0","5","7.5","10","15"].map(v => <option key={v} value={v}>{v}%</option>)}</select></div>
              </div>
              {/* Fix 8: Rack in edit */}
              <div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block flex items-center gap-1"><Boxes size={10} /> Rack / Shelf Location</label><input className={inp + " font-mono"} defaultValue={editProd.rack || ""} id="ep_rack" placeholder="e.g. A-01" /></div>
              <div className="flex gap-2.5 pt-2">
                <button onClick={() => setEditProd(null)} className="px-4 py-2 text-xs font-semibold text-slate-500 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all">Cancel</button>
                <button onClick={() => {
                  const nameEl = document.getElementById("ep_name") as HTMLInputElement;
                  const priceEl = document.getElementById("ep_price") as HTMLInputElement;
                  const costEl = document.getElementById("ep_cost") as HTMLInputElement;
                  const stockEl = document.getElementById("ep_stock") as HTMLInputElement;
                  const taxEl = document.getElementById("ep_tax") as HTMLSelectElement;
                  const rackEl = document.getElementById("ep_rack") as HTMLInputElement;
                  setProducts(prev => prev.map(p => p.id === editProd.id ? { ...p, name: nameEl?.value || p.name, price: parseFloat(priceEl?.value) || p.price, cost: parseFloat(costEl?.value) || 0, posStock: parseInt(stockEl?.value) || 0, taxRate: parseFloat(taxEl?.value) || 0, rack: rackEl?.value || p.rack } : p));
                  setEditProd(null);
                }} className="flex-1 py-2 text-xs font-bold bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl shadow-md shadow-blue-200 hover:from-blue-700 hover:to-cyan-600 transition-all flex items-center justify-center gap-1.5"><Save size={13} /> Save</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Customers View ───────────────────────────────────────────────────────────
// Fix 6: Sortable columns
type SortField = "due" | "spent" | "orders" | "last";
type SortDir = "asc" | "desc";

function CustomersView({ customers, setCustomers }: { customers: Customer[]; setCustomers: (v: Customer[] | ((p: Customer[]) => Customer[])) => void }) {
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("desc"); }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown size={10} className="text-slate-300" />;
    return sortDir === "asc" ? <ArrowUp size={10} className="text-cyan-500" /> : <ArrowDown size={10} className="text-cyan-500" />;
  };

  const SortTh = ({ field, label }: { field: SortField; label: string }) => (
    <th className="px-3 py-2.5 text-left text-[10px] font-extrabold text-slate-400 uppercase tracking-wider whitespace-nowrap cursor-pointer hover:text-cyan-600 select-none" onClick={() => handleSort(field)}>
      <span className="flex items-center gap-1">{label}<SortIcon field={field} /></span>
    </th>
  );

  let filtered = customers.filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search) || c.email.toLowerCase().includes(search.toLowerCase()));

  if (sortField) {
    filtered = [...filtered].sort((a, b) => {
      let va: any, vb: any;
      if (sortField === "due") { va = a.due; vb = b.due; }
      else if (sortField === "spent") { va = a.spent; vb = b.spent; }
      else if (sortField === "orders") { va = a.orders; vb = b.orders; }
      else if (sortField === "last") { va = a.last; vb = b.last; }
      if (va < vb) return sortDir === "asc" ? -1 : 1;
      if (va > vb) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }

  return (
    <div className="flex flex-col h-full">
      <div className="bg-white px-5 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
        <div><div className="text-sm font-bold text-slate-800">Customers</div><div className="text-[10px] text-slate-400">Customer database with credit & loan tracking</div></div>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl shadow-md shadow-blue-200 hover:from-blue-700 hover:to-cyan-600 transition-all"><UserPlus size={13} /> Add Customer</button>
      </div>
      <div className="bg-white px-5 py-3 border-b border-slate-100 shrink-0 flex items-center gap-3">
        <div className="relative max-w-xs"><Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-400" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, phone or email..." className="w-full pl-8 py-2 text-xs bg-slate-50 border border-cyan-100 rounded-xl focus:outline-none focus:border-cyan-300 transition-all" /></div>
        {sortField && (
          <button onClick={() => { setSortField(null); }} className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-semibold text-slate-500 border border-slate-200 rounded-lg hover:bg-slate-50 transition-all">
            <X size={10} /> Clear sort
          </button>
        )}
      </div>
      <div className="flex-1 overflow-auto p-5">
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
          <table className="w-full text-xs min-w-[900px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {["Customer","Phone","Email","NID"].map(h => <th key={h} className="px-3 py-2.5 text-left text-[10px] font-extrabold text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>)}
                <SortTh field="orders" label="Orders" />
                <SortTh field="spent" label="Spent" />
                <SortTh field="due" label="Due / Loan" />
                {["Credit Score"].map(h => <th key={h} className="px-3 py-2.5 text-left text-[10px] font-extrabold text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>)}
                <SortTh field="last" label="Last Visit" />
                <th className="px-3 py-2.5 text-left text-[10px] font-extrabold text-slate-400 uppercase tracking-wider whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id} className="border-b border-slate-50 hover:bg-blue-50/30 transition-colors">
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-200 to-cyan-200 flex items-center justify-center text-sm font-bold text-blue-700 shrink-0">{c.name[0]}</div>
                      <div><div className="font-bold text-slate-700">{c.name}</div>{c.note && <div className="text-[9px] text-amber-500">★ {c.note}</div>}</div>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 font-mono text-slate-600">{c.phone}</td>
                  <td className="px-3 py-2.5 text-slate-500">{c.email || "—"}</td>
                  <td className="px-3 py-2.5"><span className="font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded">{c.nid || "—"}</span></td>
                  <td className="px-3 py-2.5 text-center font-bold">{c.orders}</td>
                  <td className="px-3 py-2.5 font-bold text-cyan-600">{fmt(c.spent)}</td>
                  <td className="px-3 py-2.5">
                    {c.due > 0 ? <span className="text-amber-600 font-bold">{fmt(c.due)}</span> : <span className="text-slate-300">—</span>}
                    {c.loanLimit > 0 && <div className="text-[9px] text-slate-400 mt-0.5">Limit: {fmt(c.loanLimit)}</div>}
                  </td>
                  <td className="px-3 py-2.5"><Badge color={c.creditScore === "Excellent" ? "green" : c.creditScore === "Good" ? "teal" : c.creditScore === "Fair" ? "amber" : "red"}>{c.creditScore}</Badge></td>
                  <td className="px-3 py-2.5 text-slate-500">{c.last}</td>
                  <td className="px-3 py-2.5"><button className="px-2 py-1 text-[10px] font-bold text-slate-500 border border-slate-200 rounded-lg hover:bg-slate-50 transition-all flex items-center gap-1"><Eye size={10} /> View</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {showAdd && (
        <CustomerModal
          onClose={() => setShowAdd(false)}
          onSave={(data) => {
            setCustomers(prev => [...prev, { ...data, id: Date.now(), orders: 0, spent: 0, due: 0, last: new Date().toISOString().split("T")[0] }]);
            setShowAdd(false);
          }}
        />
      )}
    </div>
  );
}

// ─── Dashboard View ───────────────────────────────────────────────────────────
function DashboardView({ sales, products }: { sales: SaleRecord[]; products: Product[] }) {
  const totalRev = sales.reduce((a, s) => a + s.netBilling, 0);
  const totalCOGS = sales.reduce((a, s) => a + s.cogs, 0);
  const totalDisc = sales.reduce((a, s) => a + s.discount, 0);
  const grossProfit = totalRev - totalCOGS - totalDisc;
  const totalDues = sales.reduce((a, s) => a + s.dueAmount, 0);

  const sold: Record<string, number> = {};
  sales.forEach(s => s.items.forEach(i => { sold[i.name] = (sold[i.name] || 0) + i.price * i.qty; }));
  const top5 = Object.entries(sold).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const maxAmt = top5[0]?.[1] || 1;

  const payMethods: Record<string, number> = {};
  sales.forEach(s => { payMethods[s.payment] = (payMethods[s.payment] || 0) + s.netBilling; });
  const pmTotal = Object.values(payMethods).reduce((a, b) => a + b, 0) || 1;

  const last7 = sales.slice(0, 7).reverse();
  const maxBar = Math.max(...last7.map(s => s.netBilling), 1);

  const stats = [
    { label: "Total Revenue", value: fmt(totalRev), icon: <DollarSign size={18} />, sub: `${sales.length} orders`, trend: "up" },
    { label: "Gross Profit", value: fmt(grossProfit), icon: <TrendingUp size={18} />, sub: grossProfit >= 0 ? "▲ Profitable" : "▼ Loss", trend: grossProfit >= 0 ? "up" : "down" },
    { label: "Total Orders", value: String(sales.length), icon: <ShoppingCart size={18} />, sub: "All time", trend: "up" },
    { label: "Outstanding Dues", value: fmt(totalDues), icon: <AlertTriangle size={18} />, sub: "Receivable", trend: "neutral" },
  ];

  return (
    <div className="flex-1 overflow-y-auto p-5 space-y-5">
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
            <div className="flex items-start justify-between mb-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${i === 0 ? "bg-blue-50 text-blue-500" : i === 1 ? "bg-green-50 text-green-500" : i === 2 ? "bg-cyan-50 text-cyan-500" : "bg-amber-50 text-amber-500"}`}>{s.icon}</div>
              <span className={`text-[10px] font-bold flex items-center gap-0.5 ${s.trend === "up" ? "text-green-500" : s.trend === "down" ? "text-red-500" : "text-slate-400"}`}>{s.trend === "up" ? <ArrowUpRight size={11} /> : s.trend === "down" ? <ArrowDownRight size={11} /> : null}</span>
            </div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{s.label}</div>
            <div className="text-xl font-extrabold text-slate-900 tracking-tight">{s.value}</div>
            <div className={`text-[10px] mt-1 font-semibold ${s.trend === "up" ? "text-green-500" : s.trend === "down" ? "text-red-500" : "text-slate-400"}`}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
          <div className="text-xs font-bold text-slate-700 mb-4">Revenue — Last 7 Sales</div>
          {last7.length ? (
            <div className="flex items-end gap-2 h-32">
              {last7.map((s, i) => (
                <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1 h-full group">
                  <div className="relative w-full" style={{ height: `${Math.round(s.netBilling / maxBar * 100)}%` }}>
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-blue-500 to-cyan-400 rounded-t-lg group-hover:from-blue-600 group-hover:to-cyan-500 transition-colors" style={{ minHeight: 4 }}>
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 bg-slate-800 text-white text-[9px] font-bold px-1.5 py-0.5 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">{fmt(s.netBilling)}</div>
                    </div>
                  </div>
                  <div className="text-[9px] font-semibold text-slate-400 truncate w-full text-center">{s.id.split("-").slice(-1)[0]}</div>
                </div>
              ))}
            </div>
          ) : <div className="h-32 flex items-center justify-center text-slate-400 text-sm">No sales yet</div>}
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
          <div className="text-xs font-bold text-slate-700 mb-4">Top Selling Products</div>
          <div className="space-y-3">
            {top5.length ? top5.map(([name, amt], i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-blue-50 text-blue-500 text-[10px] font-bold flex items-center justify-center shrink-0">{i + 1}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-bold text-slate-700 truncate">{name.length > 20 ? name.slice(0, 20) + "…" : name}</div>
                  <div className="h-1 bg-slate-100 rounded-full mt-1"><div className="h-full bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full" style={{ width: `${Math.round(amt / maxAmt * 100)}%` }} /></div>
                </div>
                <div className="text-xs font-bold text-cyan-600 font-mono whitespace-nowrap">{fmt(amt)}</div>
              </div>
            )) : <div className="text-slate-400 text-xs text-center py-6">No data yet</div>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
          <div className="text-xs font-bold text-slate-700 mb-4">Payment Methods</div>
          {Object.entries(payMethods).length ? (
            <div className="space-y-3">
              {Object.entries(payMethods).map(([m, v]) => (
                <div key={m}>
                  <div className="flex justify-between text-xs mb-1"><span className="text-slate-600">{m}</span><span className="font-bold">{Math.round(v / pmTotal * 100)}%</span></div>
                  <div className="h-1.5 bg-slate-100 rounded-full"><div className="h-full bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full transition-all" style={{ width: `${Math.round(v / pmTotal * 100)}%` }} /></div>
                </div>
              ))}
            </div>
          ) : <div className="text-slate-400 text-xs text-center py-6">No data yet</div>}
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
          <div className="text-xs font-bold text-slate-700 mb-4">P&L Summary</div>
          <div className="space-y-2 text-xs">
            {[
              { label: "Gross Revenue", val: sales.reduce((a, s) => a + s.subtotal, 0), color: "text-blue-600" },
              { label: "VAT Collected", val: sales.reduce((a, s) => a + s.tax, 0), color: "text-purple-600" },
              { label: "Discounts Given", val: -totalDisc, color: "text-red-500" },
              { label: "Net Revenue", val: totalRev, color: "text-slate-700" },
              { label: "COGS", val: -totalCOGS, color: "text-red-500" },
            ].map((row, i) => (
              <div key={i} className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">{row.label}</span>
                <span className={`font-bold font-mono ${row.color}`}>{row.val < 0 ? "-" : ""}{fmt(Math.abs(row.val))}</span>
              </div>
            ))}
            <div className={`flex justify-between py-2 px-3 rounded-xl mt-1 ${grossProfit >= 0 ? "bg-green-50" : "bg-red-50"}`}>
              <span className="font-extrabold text-slate-700">Gross Profit</span>
              <span className={`font-extrabold font-mono ${grossProfit >= 0 ? "text-green-600" : "text-red-600"}`}>{fmt(grossProfit)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100"><div className="text-xs font-bold text-slate-700">Recent Transactions</div></div>
        <table className="w-full text-xs min-w-[700px]">
          <thead><tr className="bg-slate-50 border-b border-slate-100">{["Invoice","Customer","Net Billing","Paid","Due","Payment","Status"].map(h => <th key={h} className="px-3 py-2 text-left text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">{h}</th>)}</tr></thead>
          <tbody>
            {!sales.length ? <tr><td colSpan={7} className="px-3 py-8 text-center text-slate-400">No sales yet. Make your first sale!</td></tr> : sales.slice(0, 6).map(s => (
              <tr key={s.id} className="border-b border-slate-50 hover:bg-blue-50/30 transition-colors">
                <td className="px-3 py-2"><span className="font-mono font-semibold text-cyan-600">{s.id}</span></td>
                <td className="px-3 py-2 font-semibold text-slate-700">{s.custName}</td>
                <td className="px-3 py-2 font-bold">{fmt(s.netBilling)}</td>
                <td className="px-3 py-2 text-green-600 font-semibold">{fmt(s.paidAmount)}</td>
                <td className="px-3 py-2"><span className={s.dueAmount > 0 ? "text-amber-600 font-semibold" : "text-slate-300"}>{fmt(s.dueAmount)}</span></td>
                <td className="px-3 py-2"><Badge color="blue">{s.payment}</Badge></td>
                <td className="px-3 py-2"><Badge color={s.status === "Paid" ? "green" : "amber"}>{s.status}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Accounting View ──────────────────────────────────────────────────────────
function AccountingView({ sales }: { sales: SaleRecord[] }) {
  const [search, setSearch] = useState("");
  // Each sale contributes: DR = paid + due + discount + cogs; CR = subtotal + tax + cogs
  // which always equals since: paid+due = netBilling = subtotal-discount+tax
  // so paid+due+discount = subtotal+tax, and both sides add cogs
  const totalDR = sales.reduce((a, s) => a + s.paidAmount + s.dueAmount + s.discount + s.cogs, 0);
  const totalCR = sales.reduce((a, s) => a + s.subtotal + s.tax + s.cogs, 0);
  const isBalanced = Math.abs(totalDR - totalCR) < 0.01;

  return (
    <div className="flex flex-col h-full">
      <div className="bg-white px-5 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
        <div><div className="text-sm font-bold text-slate-800">Voucher Journal</div><div className="text-[10px] text-slate-400">Double-entry accounting — every POS sale auto-generates vouchers</div></div>
        <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-500 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all"><Download size={13} /> Export CSV</button>
      </div>
      <div className="bg-white px-5 py-3 border-b border-slate-100 flex items-center gap-4 shrink-0">
        <div className="relative max-w-xs"><Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-400" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search voucher, invoice..." className="w-full pl-8 py-2 text-xs bg-slate-50 border border-cyan-100 rounded-xl focus:outline-none focus:border-cyan-300 transition-all" /></div>
        <div className="flex items-center gap-4 text-xs text-slate-500">
          <span>Vouchers: <b className="text-cyan-600">{sales.length}</b></span>
          <span>Total DR: <b className="text-red-600">{fmt(totalDR)}</b></span>
          <span>Total CR: <b className="text-green-600">{fmt(totalCR)}</b></span>
          {isBalanced ? <Badge color="green"><CheckCircle size={10} /> Balanced</Badge> : <Badge color="red"><AlertTriangle size={10} /> Unbalanced</Badge>}
        </div>
      </div>
      <div className="flex-1 overflow-auto p-5">
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
          <table className="w-full text-xs min-w-[900px]">
            <thead><tr className="bg-slate-50 border-b border-slate-100">{["Voucher No","Date","Invoice Ref","Customer","Account (DR)","Amount DR","Account (CR)","Amount CR","Remarks"].map(h => <th key={h} className="px-3 py-2.5 text-left text-[10px] font-extrabold text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>)}</tr></thead>
            <tbody>
              {!sales.length ? <tr><td colSpan={9} className="px-3 py-12 text-center text-slate-400 text-sm">No vouchers found. Make sales to generate vouchers.</td></tr> : sales.filter(s => !search || s.id.toLowerCase().includes(search.toLowerCase()) || s.custName.toLowerCase().includes(search.toLowerCase()) || s.voucherNo.toLowerCase().includes(search.toLowerCase())).map(s => {
                // Balanced double-entry: each row is one DR + one CR line
                // DR: Cash/Bank (paid) | Receivable (due) | SalesDiscount (disc) | COGS
                // CR: SalesRevenue (subtotal) | VATPayable (tax) | Inventory (cogs)
                const jRows: { drAcct: string; crAcct: string; dr: number; cr: number; remark: string }[] = [];
                const dueLabel = s.loanEnabled ? "Receivable (Customer A/C)" : "Receivable — Uncredited";
                if (s.paidAmount > 0) jRows.push({ drAcct: "Cash / Bank", crAcct: "Sales Revenue (Gross)", dr: s.paidAmount, cr: s.paidAmount, remark: `${s.payment} received` });
                if (s.dueAmount > 0) jRows.push({ drAcct: dueLabel, crAcct: "Sales Revenue (Gross)", dr: s.dueAmount, cr: s.dueAmount, remark: `Credit — due from ${s.custName}` });
                if (s.discount > 0) jRows.push({ drAcct: "Sales Discount Account", crAcct: "—", dr: s.discount, cr: 0, remark: "Discount allowed" });
                if (s.tax > 0) jRows.push({ drAcct: "—", crAcct: "VAT Payable", dr: 0, cr: s.tax, remark: "VAT collected" });
                if (s.cogs > 0) jRows.push({ drAcct: "Cost of Goods Sold (COGS)", crAcct: "Inventory Asset", dr: s.cogs, cr: s.cogs, remark: "COGS reduction" });
                if (!jRows.length) jRows.push({ drAcct: "Cash / Bank", crAcct: "Sales Revenue", dr: s.netBilling, cr: s.netBilling, remark: "Sale" });
                return jRows.map((e, i) => (
                  <tr key={`${s.id}-${i}`} className={`border-b border-slate-50 hover:bg-blue-50/30 transition-colors ${i === 0 ? "" : "bg-slate-50/30"}`}>
                    {i === 0 && <td className="px-3 py-2.5" rowSpan={jRows.length}><span className="font-mono font-semibold text-teal-600 text-[10px]">{s.voucherNo}</span></td>}
                    {i === 0 && <td className="px-3 py-2.5" rowSpan={jRows.length}><span className="text-slate-500">{s.date}</span></td>}
                    {i === 0 && <td className="px-3 py-2.5" rowSpan={jRows.length}><span className="font-mono font-semibold text-cyan-600">{s.id}</span></td>}
                    {i === 0 && <td className="px-3 py-2.5" rowSpan={jRows.length}><span className="font-semibold text-slate-700">{s.custName}</span></td>}
                    <td className="px-3 py-2.5 font-medium text-slate-700">{e.drAcct === "—" ? <span className="text-slate-300">—</span> : e.drAcct}</td>
                    <td className="px-3 py-2.5 text-right font-mono font-bold text-red-600">{e.dr > 0 ? fmtD(e.dr) : <span className="text-slate-300">—</span>}</td>
                    <td className="px-3 py-2.5 font-medium text-slate-700">{e.crAcct === "—" ? <span className="text-slate-300">—</span> : e.crAcct}</td>
                    <td className="px-3 py-2.5 text-right font-mono font-bold text-green-600">{e.cr > 0 ? fmtD(e.cr) : <span className="text-slate-300">—</span>}</td>
                    <td className="px-3 py-2.5 text-slate-400 text-[10px]">{e.remark}</td>
                  </tr>
                ));
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function FinixMartPOS() {
  const [products, setProducts] = useLocalStorage<Product[]>("fxm_products", INITIAL_PRODUCTS);
  const [customers, setCustomers] = useLocalStorage<Customer[]>("fxm_customers", INITIAL_CUSTOMERS);
  const [sales, setSales] = useLocalStorage<SaleRecord[]>("fxm_sales", []);
  const [settings, setSettings] = useLocalStorage<StoreSettings>("fxm_settings", INITIAL_SETTINGS);
  const [activeView, setActiveView] = useState<string>("pos");
  const [storeOnline, setStoreOnline] = useState(true);
  const [syncLabel, setSyncLabel] = useState("Synced · 2m ago");
  const [clock, setClock] = useState("");
  const [notifOpen, setNotifOpen] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setClock(new Date().toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true })), 1000);
    return () => clearInterval(t);
  }, []);

  const today = new Date().toISOString().split("T")[0];
  const todaySales = sales.filter(s => s.date === today);
  const todayRev = todaySales.reduce((a, s) => a + s.netBilling, 0);

  const sync = () => { setSyncLabel("Syncing..."); setTimeout(() => setSyncLabel("Synced · just now"), 1500); };

  const navItems = [
    { id: "pos", icon: <ShoppingCart size={15} />, label: "POS Terminal", group: "Sales" },
    { id: "invoices", icon: <Receipt size={15} />, label: "Invoices", group: "Sales", badge: sales.length },
    { id: "products", icon: <Package size={15} />, label: "My Products", group: "Products" },
    { id: "customers", icon: <Users size={15} />, label: "Customers", group: "Customers" },
    { id: "accounting", icon: <BookOpen size={15} />, label: "Voucher Journal", group: "Accounting" },
    { id: "dashboard", icon: <BarChart2 size={15} />, label: "Dashboard", group: "Insights" },
    { id: "settings", icon: <Settings size={15} />, label: "Settings", group: "Config" },
  ];

  const groups = ["Sales", "Products", "Customers", "Accounting", "Insights", "Config"];

  const lowStockCount = products.filter(p => p.posStock <= p.lowAlert && p.posStock > 0).length;
  const outOfStockCount = products.filter(p => p.posStock === 0).length;
  const notifications = [
    { id: 1, icon: "💡", msg: "Discount supports % and ৳ Flat modes", time: "Just now", read: false },
    ...(lowStockCount > 0 ? [{ id: 2, icon: "⚠️", msg: `${lowStockCount} product(s) running low on stock`, time: "5m ago", read: false }] : []),
    ...(outOfStockCount > 0 ? [{ id: 3, icon: "📦", msg: `${outOfStockCount} product(s) are out of stock`, time: "10m ago", read: false }] : []),
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100 font-sans" style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
      {/* Sidebar */}
      <aside className="w-56 shrink-0 bg-white border-r border-slate-100 flex flex-col shadow-sm">
        <div className="px-4 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center font-extrabold text-white text-sm shadow-md shadow-blue-200">F</div>
            <div>
              <div className="text-sm font-extrabold text-slate-900 tracking-tight">Finix<span className="text-cyan-500">Mart</span></div>
              <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Vendor POS</div>
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
          {groups.map(group => {
            const items = navItems.filter(n => n.group === group);
            if (!items.length) return null;
            return (
              <div key={group}>
                <div className="text-[9px] font-extrabold text-slate-300 uppercase tracking-[1px] px-2 mb-1.5">{group}</div>
                <div className="space-y-0.5">
                  {items.map(item => <NavLink key={item.id} icon={item.icon} label={item.label} active={activeView === item.id} badge={(item as any).badge} onClick={() => setActiveView(item.id)} />)}
                </div>
              </div>
            );
          })}
        </div>
        <div className="px-3 py-3 border-t border-slate-100">
          <div className="bg-slate-50 rounded-xl p-3">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[10px] font-bold text-slate-600">Store Online</span>
              <button onClick={() => setStoreOnline(s => !s)} className={`w-9 h-5 rounded-full transition-all relative ${storeOnline ? "bg-green-500" : "bg-slate-300"}`}>
                <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-0.5 transition-all shadow-sm ${storeOnline ? "left-4.5 translate-x-0.5" : "left-0.5"}`} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <div className="bg-white rounded-lg p-2 border border-slate-100"><div className="text-xs font-extrabold text-slate-900">{fmt(todayRev)}</div><div className="text-[9px] text-slate-400">Today Sales</div></div>
              <div className="bg-white rounded-lg p-2 border border-slate-100"><div className="text-xs font-extrabold text-slate-900">{todaySales.length}</div><div className="text-[9px] text-slate-400">Orders</div></div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="bg-white border-b border-slate-100 px-5 h-14 flex items-center gap-3 shrink-0 shadow-sm">
          <div className="text-[10px] text-slate-400 flex items-center gap-1">
            <Building2 size={12} className="text-cyan-500" /><span className="font-semibold text-cyan-600">FinixMart</span>
            <ChevronRight size={11} /><span>Vendor</span><ChevronRight size={11} />
            <span className="font-semibold text-slate-700">{navItems.find(n => n.id === activeView)?.label || "POS"}</span>
          </div>
          <div onClick={sync} className="flex items-center gap-1.5 bg-green-50 border border-green-200 rounded-full px-2.5 py-1 cursor-pointer hover:bg-green-100 transition-all">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] font-bold text-green-600">{syncLabel}</span>
          </div>
          <div className="ml-auto flex items-center gap-2.5">
            <div className="font-mono text-xs text-slate-400 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-lg">{clock}</div>
            <div className="relative">
              <button onClick={() => setNotifOpen(o => !o)} className="relative w-8 h-8 flex items-center justify-center rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 transition-all">
                <Bell size={14} />
                {notifications.filter(n => !n.read).length > 0 && <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 border border-white" />}
              </button>
              {notifOpen && (
                <div className="absolute top-full right-0 mt-1.5 w-72 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100"><span className="text-xs font-bold">Notifications</span><button onClick={() => setNotifOpen(false)} className="text-xs text-cyan-500 font-semibold">Close</button></div>
                  <div>{notifications.map(n => (
                    <div key={n.id} className={`flex gap-3 px-4 py-3 border-b border-slate-50 hover:bg-slate-50 transition-colors ${!n.read ? "bg-blue-50/60" : ""}`}>
                      <span>{n.icon}</span>
                      <div><div className="text-xs font-semibold text-slate-700 leading-snug">{n.msg}</div><div className="text-[10px] text-slate-400 mt-0.5">{n.time}</div></div>
                    </div>
                  ))}</div>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-full pl-1 pr-3 py-1 cursor-pointer hover:bg-slate-100 transition-all">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center text-[11px] font-bold text-white">RA</div>
              <div><div className="text-[11px] font-bold text-slate-700">{settings.storeName}</div><div className="text-[9px] text-slate-400">{settings.vendorId}</div></div>
            </div>
          </div>
        </header>

        {/* Views */}
        <div className="flex-1 overflow-hidden">
          {activeView === "pos" && <POSView products={products} setProducts={setProducts} customers={customers} setCustomers={setCustomers} sales={sales} setSales={setSales} settings={settings} />}
          {activeView === "invoices" && <InvoicesView sales={sales} />}
          {activeView === "products" && <ProductsView products={products} setProducts={setProducts} />}
          {activeView === "customers" && <CustomersView customers={customers} setCustomers={setCustomers} />}
          {activeView === "accounting" && <AccountingView sales={sales} />}
          {activeView === "dashboard" && (
            <div className="flex flex-col h-full overflow-hidden">
              <div className="bg-white px-5 py-4 border-b border-slate-100 shrink-0"><div className="text-sm font-bold text-slate-800">Dashboard</div><div className="text-[10px] text-slate-400">Your store performance at a glance</div></div>
              <DashboardView sales={sales} products={products} />
            </div>
          )}
          {activeView === "settings" && <SettingsView settings={settings} setSettings={setSettings} />}
        </div>
      </div>

      {notifOpen && <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />}
    </div>
  );
}