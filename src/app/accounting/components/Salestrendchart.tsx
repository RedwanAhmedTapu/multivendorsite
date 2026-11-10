'use client';

import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { LineChart as LineChartIcon } from 'lucide-react';
import type { Voucher } from '@/features/accountingApi';

function formatMoney(v: number) {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(v);
}

export default function SalesTrendChart({ vouchers }: { vouchers?: Voucher[] }) {
  const chartData = useMemo(() => {
    if (!vouchers || vouchers.length === 0) return [];

    const byMonth = new Map<string, number>();
    [...vouchers]
      .sort((a, b) => new Date(a.voucherDate).getTime() - new Date(b.voucherDate).getTime())
      .forEach((v) => {
        const d = new Date(v.voucherDate);
        const key = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        byMonth.set(key, (byMonth.get(key) || 0) + Number(v.totalCredit || 0));
      });

    return Array.from(byMonth.entries()).map(([month, amount]) => ({ month, amount }));
  }, [vouchers]);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-5">
      <div className="flex items-center gap-2.5 mb-1">
        <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-md shadow-cyan-500/30">
          <LineChartIcon size={15} className="text-white" />
        </span>
        <span className="text-sm font-bold text-white/80">Sales Trend</span>
      </div>
      <p className="text-xs text-white/35 mb-4">Revenue recorded per month</p>

      {chartData.length === 0 ? (
        <div className="h-56 flex items-center justify-center text-xs text-white/30">
          No sales recorded yet
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={chartData} margin={{ left: -18, right: 8 }}>
            <defs>
              <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.45} />
                <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis
              dataKey="month"
              tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11 }}
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
              formatter={(value: number) => [`${formatMoney(value)} ৳`, 'Revenue']}
            />
            <Area type="monotone" dataKey="amount" stroke="#22d3ee" strokeWidth={2.5} fill="url(#salesFill)" />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}