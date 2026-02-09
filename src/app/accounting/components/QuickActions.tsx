import React from 'react';
import Link from 'next/link';
import {
  Plus,
  FileText,
  CreditCard,
  DollarSign,
  RefreshCw,
  BarChart3,
} from 'lucide-react';

const actions = [
  {
    title: 'Create Voucher',
    description: 'Create a new manual voucher',
    icon: Plus,
    href: '/accounting/vouchers/create',
    color: 'bg-blue-500',
  },
  {
    title: 'Process Payout',
    description: 'Initiate vendor payout',
    icon: DollarSign,
    href: '/accounting/payouts/create',
    color: 'bg-green-500',
  },
  {
    title: 'Initiate Refund',
    description: 'Process customer refund',
    icon: RefreshCw,
    href: '/accounting/refunds/create',
    color: 'bg-red-500',
  },
  {
    title: 'Add Account',
    description: 'Add to chart of accounts',
    icon: BarChart3,
    href: '/accounting/accounts/create',
    color: 'bg-purple-500',
  },
  {
    title: 'Settlement Batch',
    description: 'Process settlement batch',
    icon: CreditCard,
    href: '/accounting/payments/settlements/create',
    color: 'bg-yellow-500',
  },
  {
    title: 'Trial Balance',
    description: 'Generate trial balance',
    icon: FileText,
    href: '/accounting/reports/trial-balance',
    color: 'bg-indigo-500',
  },
];

export default function QuickActions() {
  return (
    <div className="rounded-lg bg-white p-6 shadow">
      <h2 className="mb-4 text-lg font-semibold text-gray-900">Quick Actions</h2>
      <div className="space-y-3">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.title}
              href={action.href}
              className="flex items-center rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50"
            >
              <div className={`${action.color} rounded-lg p-2`}>
                <Icon className="h-5 w-5 text-white" />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-900">{action.title}</h3>
                <p className="text-xs text-gray-500">{action.description}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}