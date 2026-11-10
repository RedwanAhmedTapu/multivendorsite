'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import CreateVoucherForm from '../../components/CreateVoucherForm';

export default function CreateVoucherPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950">
      {/* Background — matches accounts, dashboard & vouchers */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-cyan-950" />
      <div className="absolute -top-24 -left-16 w-72 h-72 rounded-full bg-cyan-500/20 blur-[100px]" />
      <div className="absolute top-1/3 -right-24 w-80 h-80 rounded-full bg-blue-600/15 blur-[110px]" />
      <div className="absolute bottom-0 left-1/3 w-64 h-64 rounded-full bg-cyan-400/10 blur-[90px]" />

      <div className="relative max-w-screen-xl mx-auto p-4 sm:p-6 space-y-5">
        {/* Header */}
        <div>
          <Link
            href="/accounting/vouchers"
            className="inline-flex items-center text-sm text-white/50 hover:text-cyan-300 transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Vouchers
          </Link>
        </div>

        {/* Form */}
        <CreateVoucherForm />
      </div>
    </div>
  );
}