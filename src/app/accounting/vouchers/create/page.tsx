'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import CreateVoucherForm from '../../components/CreateVoucherForm';

export default function CreateVoucherPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/accounting/vouchers"
          className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Vouchers
        </Link>
       
      </div>

      {/* Form */}
      <CreateVoucherForm />
    </div>
  );
}