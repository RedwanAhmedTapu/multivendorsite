// src/app/accounting/layout.tsx
import type { Metadata } from 'next';
import { ReactNode } from 'react';
import AccountingLayoutClient from './AccountingLayoutClient';

export const metadata: Metadata = {
  title: 'Accounting Dashboard',
  description: 'Manage your accounting and finances',
};

// Use ReactNode instead of React.ReactNode
export default function AccountingLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <AccountingLayoutClient>{children}</AccountingLayoutClient>;
}