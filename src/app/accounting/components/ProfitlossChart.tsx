'use client';

import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { TrendingUp } from 'lucide-react';
import type { ProfitAndLoss } from '@/features/accountingApi';

function formatMoney(v: number) {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(v);
}

export default function ProfitLossChart({ data }: { data?: ProfitAndLoss }) {
  const chartData = useMemo(() => {
    if (!data) return [];
    const income = data.income.accounts.map((a) => ({
      name: a.accountName,
      amount: Number(a.amount),
      type: 'income' as const,
    }));
    const expenses = data.expenses.accounts.map((a) => ({
      name: a.accountName,
      amount: Number(a.amount),
      type: 'expense' as const,
    }));
    return [...income, ...expenses].sort((a, b) => b.amount - a.amount).slice(0, 6);
  }, [data]);

  const netProfit = data ? Number(data.netProfit) : 0;
  const isProfit = netProfit >= 0;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-5">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center shadow-md shadow-cyan-500/30">
            <TrendingUp size={15} className="text-white" />
          </span>
          <span className="text-sm font-bold text-white/80">Profit &amp; Loss Breakdown</span>
        </div>
        <span className={`text-sm font-extrabold ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
          {isProfit ? '+' : ''}
          {formatMoney(netProfit)} ৳
        </span>
      </div>
      <p className="text-xs text-white/35 mb-4">Top income &amp; expense accounts for the period</p>

      {chartData.length === 0 ? (
        <div className="h-56 flex items-center justify-center text-xs text-white/30">
          No data for this period yet
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 16 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" horizontal={false} />
            <XAxis
              type="number"
              tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={110}
              tick={{ fill: 'rgba(255,255,255,0.55)', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                background: '#0f172a',
                border: '1px solid rgba(34,211,238,0.25)',
                borderRadius: 12,
                fontSize: 12,
              }}
              labelStyle={{ color: '#fff' }}
              formatter={(value: number) => [`${formatMoney(value)} ৳`, '']}
            />
            <Bar dataKey="amount" radius={[0, 8, 8, 0]}>
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.type === 'income' ? '#22d3ee' : '#fb7185'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}

      <div className="flex items-center gap-4 mt-2 pl-1">
        <div className="flex items-center gap-1.5 text-[11px] text-white/40">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" /> Income
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-white/40">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-400" /> Expense
        </div>
      </div>
    </div>
  );
}