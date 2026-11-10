// src/app/accounting/AccountingLayoutClient.tsx
'use client';

import React from 'react';
import AccountingSidebar from './components/AccountingSidebar';

interface AccountingLayoutClientProps {
  children: React.ReactNode;
}

export default function AccountingLayoutClient({
  children,
}: Readonly<AccountingLayoutClientProps>) {
  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-cyan-50/20 font-sans">
      <AccountingSidebar />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}