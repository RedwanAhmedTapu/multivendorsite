import { Metadata } from 'next';
import QuickActions from './components/QuickActions';

export const metadata: Metadata = {
  title: 'Accounting Management | Admin Dashboard',
  description: 'Manage financial transactions, vouchers, accounts, and reports',
};

export default function AccountingPage() {
  return <QuickActions />; // Content will be rendered by @main parallel route
}