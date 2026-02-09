'use client';

import React, { useState } from 'react';
import { ChartOfAccount } from '@/features/accountingApi';
import {
  ChevronRight,
  ChevronDown,
  Plus,
  Pencil,
  Trash2,
  Eye,
} from 'lucide-react';

interface AccountsTreeViewProps {
  accounts: ChartOfAccount[];
}

export default function AccountsTreeView({ accounts }: AccountsTreeViewProps) {
  const [expandedAccounts, setExpandedAccounts] = useState<string[]>([]);
  const [editingAccount, setEditingAccount] = useState<string | null>(null);

  // Build tree structure
  const buildTree = (accounts: ChartOfAccount[]) => {
    const accountMap = new Map<string, ChartOfAccount & { children: ChartOfAccount[] }>();
    const rootAccounts: ChartOfAccount[] = [];

    // Initialize all accounts with children array
    accounts.forEach(account => {
      accountMap.set(account.id, { ...account, children: [] });
    });

    // Build tree structure
    accounts.forEach(account => {
      const node = accountMap.get(account.id)!;
      if (account.parentId && accountMap.has(account.parentId)) {
        const parent = accountMap.get(account.parentId)!;
        parent.children.push(node);
      } else {
        rootAccounts.push(node);
      }
    });

    return rootAccounts;
  };

  const toggleAccount = (accountId: string) => {
    setExpandedAccounts(prev =>
      prev.includes(accountId)
        ? prev.filter(id => id !== accountId)
        : [...prev, accountId]
    );
  };

  const renderAccount = (account: ChartOfAccount & { children: ChartOfAccount[] }, level: number = 0) => {
    const isExpanded = expandedAccounts.includes(account.id);
    const hasChildren = account.children.length > 0;
    const isEditing = editingAccount === account.id;

    return (
      <div key={account.id}>
        <div
          className="flex items-center border-b border-gray-100 hover:bg-gray-50"
          style={{ paddingLeft: `${level * 24 + 12}px` }}
        >
          <div className="flex flex-1 items-center py-3">
            {hasChildren ? (
              <button
                onClick={() => toggleAccount(account.id)}
                className="mr-2 text-gray-400 hover:text-gray-600"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>
            ) : (
              <div className="mr-6 w-4" /> // Spacing for alignment
            )}
            
            <div className="flex-1">
              <div className="flex items-center">
                <span className="font-mono text-sm font-medium text-gray-900">
                  {account.code}
                </span>
                <span className="ml-4 text-sm text-gray-900">{account.name}</span>
                {!account.isActive && (
                  <span className="ml-2 rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                    Inactive
                  </span>
                )}
              </div>
              {account.description && (
                <p className="mt-1 text-xs text-gray-500">{account.description}</p>
              )}
            </div>

            <div className="flex items-center space-x-4 pr-4">
              <span className="text-sm text-gray-600">{account.accountType}</span>
              <span className="text-sm text-gray-600">{account.nature}</span>
              <span className="text-sm text-gray-600">
                Level {account.level}
              </span>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => console.log('View ledger', account.id)}
                  className="rounded p-1 text-gray-400 hover:text-gray-600"
                  title="View Ledger"
                >
                  <Eye className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setEditingAccount(account.id)}
                  className="rounded p-1 text-gray-400 hover:text-blue-600"
                  title="Edit"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => console.log('Add child to', account.id)}
                  className="rounded p-1 text-gray-400 hover:text-green-600"
                  title="Add Sub-Account"
                >
                  <Plus className="h-4 w-4" />
                </button>
                {account._count?.ledgerEntries === 0 && (
                  <button
                    onClick={() => console.log('Delete', account.id)}
                    className="rounded p-1 text-gray-400 hover:text-red-600"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {isExpanded && hasChildren && (
          <div>
            {account.children.map(child => renderAccount(child, level + 1))}
          </div>
        )}

        {isEditing && (
          <div
            className="bg-blue-50 border-l-4 border-blue-500 p-4"
            style={{ marginLeft: `${level * 24 + 12}px` }}
          >
            <div className="flex items-center space-x-4">
              <div>
                <label className="block text-xs font-medium text-gray-700">Code</label>
                <input
                  type="text"
                  defaultValue={account.code}
                  className="mt-1 block w-32 rounded-md border border-gray-300 px-3 py-1 text-sm"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  defaultValue={account.name}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-1 text-sm"
                />
              </div>
              <div>
                <button
                  onClick={() => setEditingAccount(null)}
                  className="mt-6 rounded bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditingAccount(null)}
                  className="ml-2 mt-6 rounded border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const accountTree = buildTree(accounts);

  if (accountTree.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">No accounts found. Create your first account to get started.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200">
      {/* Header */}
      <div className="grid grid-cols-12 border-b border-gray-200 bg-gray-50 px-6 py-3 text-xs font-medium uppercase tracking-wider text-gray-500">
        <div className="col-span-5">Account Code & Name</div>
        <div className="col-span-2">Type</div>
        <div className="col-span-2">Nature</div>
        <div className="col-span-2">Level</div>
        <div className="col-span-1 text-right">Actions</div>
      </div>

      {/* Account Tree */}
      <div>
        {accountTree.map(account => renderAccount(account))}
      </div>

      {/* Summary */}
      <div className="border-t border-gray-200 bg-gray-50 px-6 py-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">
            Total Accounts: {accounts.length}
          </span>
          <button className="rounded-md border border-gray-300 bg-white px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50">
            Expand All
          </button>
        </div>
      </div>
    </div>
  );
}