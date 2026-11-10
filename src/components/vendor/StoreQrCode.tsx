"use client";
// components/vendor/StoreQrCode.tsx
//
// Shows a scannable QR code + copyable link for a vendor's public storefront
// (/store/[vendorId]). Drop this anywhere in the vendor dashboard — profile
// settings, the store editor, wherever it's useful.
//
// QR rendering: uses api.qrserver.com (free, no key, no npm install needed —
// good since this repo doesn't have a QR library yet). If you'd rather
// generate it locally/offline instead of depending on a third-party image
// service, swap this out for the "qrcode.react" package:
//   npm install qrcode.react
//   import { QRCodeSVG } from "qrcode.react";
//   <QRCodeSVG value={storeUrl} size={220} />
// — same props in, same visual result, just self-hosted.

import { useState } from "react";
import { Copy, Check, Download, Share2, QrCode as QrCodeIcon } from "lucide-react";

interface StoreQrCodeProps {
  vendorId: string;
  storeName?: string;
  /** Override the base site URL (defaults to the current origin, e.g. in SSR contexts). */
  siteUrl?: string;
}

export default function StoreQrCode({ vendorId, storeName, siteUrl }: StoreQrCodeProps) {
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const origin = siteUrl || (typeof window !== "undefined" ? window.location.origin : "");
  const storeUrl = `${origin}/store/${vendorId}`;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&margin=10&data=${encodeURIComponent(
    storeUrl
  )}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(storeUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API can fail on non-HTTPS/older browsers — fall back silently,
      // the link is still visible/selectable for manual copy.
    }
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await fetch(qrImageUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${(storeName || "store").replace(/\s+/g, "-").toLowerCase()}-qr.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      // If the fetch is blocked (e.g. offline), open the image directly so
      // the vendor can still save it manually via right-click.
      window.open(qrImageUrl, "_blank");
    } finally {
      setDownloading(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: storeName ? `${storeName} — visit our store` : "Visit our store",
          url: storeUrl,
        });
      } catch {
        // User cancelled the share sheet — nothing to do.
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-blue-100 shadow-sm shadow-blue-50 overflow-hidden">
      <div className="p-6 border-b border-slate-100 bg-gradient-to-br from-blue-50/50 to-cyan-50/30">
        <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
          <QrCodeIcon size={14} /> Store QR Code
        </label>
        <p className="text-xs text-slate-400 mt-1">
          Print this on packaging, receipts, or a business card — scanning it opens your store instantly.
        </p>
      </div>

      <div className="p-6 flex flex-col sm:flex-row items-center gap-6">
        <div className="w-40 h-40 shrink-0 rounded-xl border border-slate-100 bg-white p-2 flex items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrImageUrl} alt="Store QR code" className="w-full h-full object-contain" />
        </div>

        <div className="w-full flex-1 flex flex-col gap-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Store Link
            </label>
            <div className="flex items-stretch gap-2">
              <input
                readOnly
                value={storeUrl}
                onClick={(e) => (e.target as HTMLInputElement).select()}
                className="flex-1 min-w-0 px-3 py-2.5 text-xs font-medium text-slate-600 bg-slate-50 border border-slate-200 rounded-xl truncate focus:outline-none"
              />
              <button
                onClick={handleCopy}
                className="shrink-0 flex items-center gap-1.5 px-3 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-cyan-500 rounded-xl hover:from-blue-700 hover:to-cyan-600 transition-all"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                <span className="hidden sm:inline">{copied ? "Copied" : "Copy"}</span>
              </button>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all disabled:opacity-60"
            >
              <Download size={14} /> Download QR
            </button>
            <button
              onClick={handleShare}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all"
            >
              <Share2 size={14} /> Share
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}