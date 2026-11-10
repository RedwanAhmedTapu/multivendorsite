'use client';

import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Wallet } from 'lucide-react';
import type { CommissionRecord } from '@/features/accountingApi';

const STATUS_COLORS: Record<string, string> = {
  PENDING: '#fbbf24',
  RECOGNIZED: '#22d3ee',
  PAID: '#34d399',
  REVERSED: '#fb7185',
};

function formatMoney(v: number) {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(v);
}

export default function CommissionStatusChart({ commissions }: { commissions?: CommissionRecord[] }) {
  const chartData = useMemo(() => {
    if (!commissions || commissions.length === 0) return [];
    const byStatus = new Map<string, number>();
    commissions.forEach((c) => {
      byStatus.set(c.status, (byStatus.get(c.status) || 0) + Number(c.commissionAmount || 0));
    });
    return Array.from(byStatus.entries()).map(([status, amount]) => ({ status, amount }));
  }, [commissions]);

  const total = chartData.reduce((s, d) => s + d.amount, 0);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-5">
      <div className="flex items-center gap-2.5 mb-1">
        <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center shadow-md shadow-cyan-500/30">
          <Wallet size={15} className="text-white" />
        </span>
        <span className="text-sm font-bold text-white/80">Commission by Status</span>
      </div>
      <p className="text-xs text-white/35 mb-2">How your commission is distributed</p>

      {chartData.length === 0 ? (
        <div className="h-52 flex items-center justify-center text-xs text-white/30">
          No commission records yet
        </div>
      ) : (
        <div className="relative">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={chartData}
                dataKey="amount"
                nameKey="status"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={3}
                stroke="none"
              >
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={STATUS_COLORS[entry.status] || '#94a3b8'} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: '#0f172a',
                  border: '1px solid rgba(34,211,238,0.25)',
                  borderRadius: 12,
                  fontSize: 12,
                }}
                formatter={(value: number, name: string) => [`${formatMoney(value)} ৳`, name]}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-[10px] text-white/35 uppercase tracking-wider">Total</span>
            <span className="text-sm font-extrabold text-white">{formatMoney(total)} ৳</span>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-2 pl-1">
        {chartData.map((d) => (
          <div key={d.status} className="flex items-center gap-1.5 text-[11px] text-white/40">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ background: STATUS_COLORS[d.status] || '#94a3b8' }}
            />
            {d.status.charAt(0) + d.status.slice(1).toLowerCase()}
          </div>
        ))}
      </div>
    </div>
  );
}