'use client';

import React from 'react';
import { LayoutDashboard, TrendingUp, Wallet, Receipt, PiggyBank } from 'lucide-react';
import StatCard from './components/StatCard';
import QuickActions from './components/QuickActions';
import ProfitLossChart from './components/ProfitlossChart';
import SalesTrendChart from './components/Salestrendchart';
import CommissionStatusChart from './components/Commissionstatuschart';
import RecentVouchers from './components/RecentVouchers';
import {
  useGetVendorDashboardQuery,
  useGetVendorSalesSummaryQuery,
  useGetVendorPayablesQuery,
  useGetVendorCommissionsQuery,
} from '@/features/accountingApi';

function formatMoney(v: string | number | undefined) {
  if (v === undefined) return '0';
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(Number(v));
}

export default function AccountingPage() {
  const { data: dashboard, isLoading: loadingDashboard } = useGetVendorDashboardQuery();
  const { data: salesSummary, isLoading: loadingSales } = useGetVendorSalesSummaryQuery({});
  const { data: payables, isLoading: loadingPayables } = useGetVendorPayablesQuery();
  const { data: commissions, isLoading: loadingCommissions } = useGetVendorCommissionsQuery({});

  const isLoading = loadingDashboard || loadingSales || loadingPayables || loadingCommissions;

  const netProfit = dashboard?.data?.profitLoss?.netProfit;
  const totalSales = salesSummary?.data?.totalSales;
  const payableBalance = payables?.data?.summary?.balance;
  const totalCommission = commissions?.data?.totalCommission;
  const isProfit = Number(netProfit || 0) >= 0;

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950">
      {/* Background — matches AccountingSidebar */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-cyan-950" />
      <div className="absolute -top-24 -left-16 w-72 h-72 rounded-full bg-cyan-500/20 blur-[100px]" />
      <div className="absolute top-1/3 -right-24 w-80 h-80 rounded-full bg-blue-600/15 blur-[110px]" />
      <div className="absolute bottom-0 left-1/3 w-64 h-64 rounded-full bg-cyan-400/10 blur-[90px]" />

      <div className="relative max-w-screen-xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Page header */}
        <div className="mb-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/30">
            <LayoutDashboard size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Accounting Dashboard
            </h1>
            <p className="text-xs text-white/35 mt-0.5">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
          <StatCard
            label="Total Sales"
            value={isLoading ? '···' : `${formatMoney(totalSales)} ৳`}
            helper={`${salesSummary?.data?.voucherCount ?? 0} vouchers`}
            icon={TrendingUp}
            accent="cyan"
          />
          <StatCard
            label="Net Profit"
            value={isLoading ? '···' : `${formatMoney(netProfit)} ৳`}
            helper={isProfit ? 'Profitable period' : 'Operating at a loss'}
            icon={PiggyBank}
            accent={isProfit ? 'emerald' : 'rose'}
          />
          <StatCard
            label="Payable Balance"
            value={isLoading ? '···' : `${formatMoney(payableBalance)} ৳`}
            helper="Owed to you by the platform"
            icon={Wallet}
            accent="amber"
          />
          <StatCard
            label="Total Commission"
            value={isLoading ? '···' : `${formatMoney(totalCommission)} ৳`}
            helper={`${commissions?.data?.commissionCount ?? 0} records`}
            icon={Receipt}
            accent="cyan"
          />
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-5">
          <div className="space-y-5">
            <ProfitLossChart data={dashboard?.data?.profitLoss} />
            <SalesTrendChart vouchers={salesSummary?.data?.vouchers} />
          </div>

          <div className="space-y-5">
            <QuickActions />
            <CommissionStatusChart commissions={commissions?.data?.commissions} />
            <RecentVouchers vouchers={payables?.data?.recentPayouts} />
          </div>
        </div>
      </div>
    </div>
  );
}