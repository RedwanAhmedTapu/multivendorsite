'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  FileText,
  BarChart3,
  CreditCard,
  RefreshCw,
  DollarSign,
  Calculator,
  Calendar,
  PieChart,
  Settings,
  ChevronDown,
} from 'lucide-react';

const navigation = [
  {
    name: 'Dashboard',
    href: '/accounting',
    icon: Home,
  },
  {
    name: 'Vouchers',
    href: '/accounting/vouchers',
    icon: FileText,
    subItems: [
      { name: 'All Vouchers', href: '/accounting/vouchers' },
      { name: 'Create Voucher', href: '/accounting/vouchers/create' },
      { name: 'Posted Vouchers', href: '/accounting/vouchers?status=POSTED' },
    ],
  },
  {
    name: 'Chart of Accounts',
    href: '/accounting/accounts',
    icon: BarChart3,
  },
  {
    name: 'Payments',
    href: '/accounting/payments',
    icon: CreditCard,
    subItems: [
      { name: 'Transactions', href: '/accounting/payments/transactions' },
      { name: 'Settlements', href: '/accounting/payments/settlements' },
    ],
  },
  {
    name: 'Refunds',
    href: '/accounting/refunds',
    icon: RefreshCw,
  },
  {
    name: 'Payouts',
    href: '/accounting/payouts',
    icon: DollarSign,
  },
  {
    name: 'Commissions',
    href: '/accounting/commissions',
    icon: Calculator,
  },
  {
    name: 'Accounting Periods',
    href: '/accounting/periods',
    icon: Calendar,
  },
  {
    name: 'Reports',
    href: '/accounting/reports',
    icon: PieChart,
    subItems: [
      { name: 'Trial Balance', href: '/accounting/reports/trial-balance' },
      { name: 'Profit & Loss', href: '/accounting/reports/profit-loss' },
      { name: 'Ledger Statements', href: '/accounting/reports/ledger' },
      { name: 'Vendor Payables', href: '/accounting/reports/vendor-payables' },
    ],
  },
  {
    name: 'Settings',
    href: '/accounting/settings',
    icon: Settings,
  },
];

export default function AccountingSidebar() {
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const toggleItem = (name: string) => {
    setExpandedItems(prev =>
      prev.includes(name)
        ? prev.filter(item => item !== name)
        : [...prev, name]
    );
  };

  return (
    <div className="flex w-64 flex-col bg-white border-r border-gray-200">
      <div className="flex h-16 items-center border-b border-gray-200 px-4">
        <h2 className="text-xl font-semibold text-gray-800">Accounting</h2>
      </div>
      
      <nav className="flex-1 space-y-1 p-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href || 
            (item.subItems && item.subItems.some(sub => pathname.startsWith(sub.href)));
          
          const Icon = item.icon;
          const hasSubItems = item.subItems && item.subItems.length > 0;
          const isExpanded = expandedItems.includes(item.name);

          return (
            <div key={item.name}>
              <button
                onClick={() => hasSubItems ? toggleItem(item.name) : undefined}
                className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg ${
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Link
                  href={hasSubItems ? '#' : item.href}
                  className="flex items-center flex-1"
                >
                  <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
                  {item.name}
                </Link>
                {hasSubItems && (
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${
                      isExpanded ? 'rotate-180' : ''
                    }`}
                  />
                )}
              </button>

              {hasSubItems && isExpanded && (
                <div className="ml-8 mt-1 space-y-1">
                  {item.subItems.map((subItem) => (
                    <Link
                      key={subItem.name}
                      href={subItem.href}
                      className={`block px-3 py-2 text-sm rounded-lg ${
                        pathname === subItem.href
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {subItem.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </div>
  );
}