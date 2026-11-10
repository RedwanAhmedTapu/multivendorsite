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
  FolderTree,
} from 'lucide-react';

interface AccountsTreeViewProps {
  accounts: ChartOfAccount[];
}

export default function AccountsTreeView({ accounts }: AccountsTreeViewProps) {
  const [expandedAccounts, setExpandedAccounts] = useState<string[]>([]);
  const [editingAccount, setEditingAccount] = useState<string | null>(null);

  const buildTree = (accounts: ChartOfAccount[]) => {
    const accountMap = new Map<string, ChartOfAccount & { children: ChartOfAccount[] }>();
    const rootAccounts: ChartOfAccount[] = [];

    accounts.forEach((account) => {
      accountMap.set(account.id, { ...account, children: [] });
    });

    accounts.forEach((account) => {
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
    setExpandedAccounts((prev) =>
      prev.includes(accountId) ? prev.filter((id) => id !== accountId) : [...prev, accountId],
    );
  };

  const renderAccount = (
    account: ChartOfAccount & { children: ChartOfAccount[] },
    level: number = 0,
  ) => {
    const isExpanded = expandedAccounts.includes(account.id);
    const hasChildren = account.children.length > 0;
    const isEditing = editingAccount === account.id;

    return (
      <div key={account.id}>
        <div
          className="flex items-center border-b border-slate-50 hover:bg-blue-50/30 transition-colors group"
          style={{ paddingLeft: `${level * 24 + 12}px` }}
        >
          <div className="flex flex-1 items-center py-3">
            {hasChildren ? (
              <button
                onClick={() => toggleAccount(account.id)}
                className="mr-2 text-cyan-400 hover:text-cyan-600 transition-colors"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>
            ) : (
              <div className="mr-6 w-4" />
            )}

            <div className="flex-1">
              <div className="flex items-center">
                <span className="font-mono text-xs font-bold text-cyan-700 bg-cyan-50 border border-cyan-100 rounded px-1.5 py-0.5">
                  {account.code}
                </span>
                <span className="ml-3 text-sm font-medium text-slate-700">{account.name}</span>
                {!account.isActive && (
                  <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500">
                    Inactive
                  </span>
                )}
              </div>
              {account.description && (
                <p className="mt-1 text-xs text-slate-400">{account.description}</p>
              )}
            </div>

            <div className="flex items-center space-x-4 pr-4">
              <span className="text-xs font-semibold text-slate-500 bg-slate-50 rounded-full px-2.5 py-0.5">
                {account.accountType}
              </span>
              <span className="text-xs text-slate-400">{account.nature}</span>
              <span className="text-xs text-slate-400">Level {account.level}</span>

              <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => console.log('View ledger', account.id)}
                  className="rounded-lg p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                  title="View Ledger"
                >
                  <Eye className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setEditingAccount(account.id)}
                  className="rounded-lg p-1.5 text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 transition-colors"
                  title="Edit"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => console.log('Add child to', account.id)}
                  className="rounded-lg p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                  title="Add Sub-Account"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
                {account._count?.ledgerEntries === 0 && (
                  <button
                    onClick={() => console.log('Delete', account.id)}
                    className="rounded-lg p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {isExpanded && hasChildren && (
          <div>{account.children.map((child) => renderAccount(child, level + 1))}</div>
        )}

        {isEditing && (
          <div
            className="bg-gradient-to-r from-blue-50 to-cyan-50 border-l-4 border-cyan-400 p-4"
            style={{ marginLeft: `${level * 24 + 12}px` }}
          >
            <div className="flex items-center space-x-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Code</label>
                <input
                  type="text"
                  defaultValue={account.code}
                  className="w-32 rounded-xl border border-cyan-200 bg-white px-3 py-1.5 text-sm text-slate-700 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-semibold text-slate-500 mb-1">Name</label>
                <input
                  type="text"
                  defaultValue={account.name}
                  className="w-full rounded-xl border border-cyan-200 bg-white px-3 py-1.5 text-sm text-slate-700 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
                />
              </div>
              <div>
                <button
                  onClick={() => setEditingAccount(null)}
                  className="mt-5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-1.5 text-xs font-bold text-white hover:from-blue-700 hover:to-cyan-600 shadow-sm shadow-blue-200 transition-all"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditingAccount(null)}
                  className="ml-2 mt-5 rounded-xl border border-slate-200 bg-white px-4 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-all"
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
      <div className="flex flex-col items-center justify-center py-16 text-slate-300">
        <FolderTree size={36} className="mb-3 opacity-40" />
        <p className="text-sm font-medium text-slate-400">No accounts found</p>
        <p className="text-xs text-slate-300 mt-1">Create your first account to get started</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-blue-100 bg-white shadow-sm shadow-blue-50 overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-12 border-b border-blue-100 bg-gradient-to-r from-blue-50 to-cyan-50 px-6 py-3 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
        <div className="col-span-5">Account Code & Name</div>
        <div className="col-span-2">Type</div>
        <div className="col-span-2">Nature</div>
        <div className="col-span-2">Level</div>
        <div className="col-span-1 text-right">Actions</div>
      </div>

      {/* Account Tree */}
      <div>{accountTree.map((account) => renderAccount(account))}</div>

      {/* Summary */}
      <div className="border-t border-blue-50 bg-slate-50/50 px-6 py-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400">
            Total Accounts: <span className="text-slate-600">{accounts.length}</span>
          </span>
          <button className="rounded-xl border border-cyan-200 bg-white px-3 py-1.5 text-xs font-semibold text-cyan-700 hover:bg-cyan-50 transition-all">
            Expand All
          </button>
        </div>
      </div>
    </div>
  );
}