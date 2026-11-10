// src/app/accounting/reports/trial-balance/page.tsx
"use client";

import React, { useState } from "react";
import { useGetTrialBalanceQuery } from "@/features/accountingApi";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar, Download, Printer, AlertCircle, CheckCircle2, Scale } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

// ============================================
// STYLE TOKENS — matches accounts/vouchers/periods/ledger dark cyan/blue glass theme
// ============================================

const glassCard = "rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md";
const darkField =
  "border-white/10 bg-white/5 text-white placeholder:text-white/30 focus-visible:ring-cyan-400/50 focus-visible:border-cyan-400/40";

type TrialBalanceItem = {
  accountCode: string;
  accountName: string;
  accountType: string;
  totalDebit: string;
  totalCredit: string;
};

const SECTION_LABELS: Record<string, string> = {
  ASSET: "Assets",
  LIABILITY: "Liabilities",
  EXPENSE: "Expenses",
  INCOME: "Income",
  EQUITY: "Equity",
};

const formatCurrency = (amount: number | string): string => {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

// ─── Reusable account-class section (screen + print styling both handled here) ───
function TrialBalanceSection({
  classKey,
  items,
}: {
  classKey: string;
  items: TrialBalanceItem[];
}) {
  if (items.length === 0) return null;

  const totalDebit = items.reduce((sum, i) => sum + parseFloat(i.totalDebit || "0"), 0);
  const totalCredit = items.reduce((sum, i) => sum + parseFloat(i.totalCredit || "0"), 0);

  return (
    <>
      <TableRow className="bg-white/[0.03] hover:bg-white/[0.03] border-b-0 print:bg-gray-50">
        <TableCell colSpan={4} className="font-bold text-white/70 py-3 print:text-black print:py-2">
          {SECTION_LABELS[classKey]}
        </TableCell>
      </TableRow>
      {items.map((item) => (
        <TableRow
          key={item.accountCode}
          className="border-b border-white/5 hover:bg-cyan-400/5 transition-colors print:border-gray-300"
        >
          <TableCell className="font-mono text-xs font-semibold text-cyan-300/80 print:text-black print:py-1 print:text-xs">
            {item.accountCode}
          </TableCell>
          <TableCell className="text-xs text-white/70 pl-6 print:text-black print:py-1 print:text-xs">
            {item.accountName}
          </TableCell>
          <TableCell className="text-right text-xs font-semibold text-white/80 font-mono print:text-black print:py-1 print:text-xs">
            {parseFloat(item.totalDebit) !== 0 ? formatCurrency(item.totalDebit) : "0.00"}
          </TableCell>
          <TableCell className="text-right text-xs font-semibold text-white/80 font-mono print:text-black print:py-1 print:text-xs">
            {parseFloat(item.totalCredit) !== 0 ? formatCurrency(item.totalCredit) : "0.00"}
          </TableCell>
        </TableRow>
      ))}
      <TableRow className="bg-white/[0.04] border-y border-white/10 hover:bg-white/[0.04] print:bg-gray-100 print:border-gray-300 print:border-y-2">
        <TableCell colSpan={2} className="font-bold text-right text-white/60 py-3 print:text-black print:py-2 print:text-sm">
          Total
        </TableCell>
        <TableCell className="text-right font-bold text-white font-mono print:text-black print:py-2 print:text-sm">
          {formatCurrency(totalDebit)}
        </TableCell>
        <TableCell className="text-right font-bold text-white font-mono print:text-black print:py-2 print:text-sm">
          {formatCurrency(totalCredit)}
        </TableCell>
      </TableRow>
    </>
  );
}

export default function TrialBalancePage() {
  const [asOfDate, setAsOfDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Get current entity
  const currentUser = { role: "ADMIN" };
  const entityType = currentUser.role === "VENDOR" ? "VENDOR" : "ADMIN";
  const entityId = currentUser.role === "VENDOR" ? "vendor-id" : undefined;

  // Fetch trial balance
  const { data: trialBalanceResponse, isLoading, isFetching } = useGetTrialBalanceQuery({
    entityType,
    entityId,
    asOf: asOfDate,
  });

  const trialBalanceData = trialBalanceResponse?.data;
  const trialBalanceItems = trialBalanceData?.trialBalance || [];
  const totals = trialBalanceData?.totals;

  // Group accounts by class
  const groupedAccounts = React.useMemo(() => {
    const groups: Record<string, typeof trialBalanceItems> = {
      ASSET: [],
      LIABILITY: [],
      EXPENSE: [],
      INCOME: [],
      EQUITY: [],
    };

    trialBalanceItems.forEach(item => {
      // Determine account class from account type or code
      let accountClass = 'ASSET';
      
      if (item.accountType.includes('LIABILITY')) {
        accountClass = 'LIABILITY';
      } else if (item.accountType.includes('EXPENSE') || item.accountCode.startsWith('Ex')) {
        accountClass = 'EXPENSE';
      } else if (item.accountType.includes('INCOME') || item.accountCode.startsWith('In')) {
        accountClass = 'INCOME';
      } else if (item.accountType.includes('EQUITY') || item.accountCode.startsWith('Eq')) {
        accountClass = 'EQUITY';
      } else if (item.accountType.includes('ASSET') || item.accountCode.startsWith('As')) {
        accountClass = 'ASSET';
      }

      groups[accountClass].push(item);
    });

    return groups;
  }, [trialBalanceItems]);

  // Format date display
  const formatDateDisplay = (dateString: string): string => {
    try {
      return format(new Date(dateString), "dd MMM, yyyy");
    } catch {
      return dateString;
    }
  };

  // Handle print
  const handlePrint = () => {
    window.print();
  };

  // Handle export
  const handleExport = () => {
    toast.info("Export functionality coming soon");
  };

  const isBalanced = totals && (totals.difference === "0.00" || parseFloat(totals.difference) === 0);

  if (isLoading) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-slate-950">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-cyan-950" />
        <div className="relative flex flex-col items-center justify-center h-screen gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-white/10 border-t-cyan-400" />
          <span className="text-sm text-white/35 font-medium">Loading trial balance...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 print:bg-white print:min-h-0">
      {/* Background — matches accounts, vouchers, periods & ledger. Hidden on print */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-cyan-950 print:hidden" />
      <div className="absolute -top-24 -left-16 w-72 h-72 rounded-full bg-cyan-500/20 blur-[100px] print:hidden" />
      <div className="absolute top-1/3 -right-24 w-80 h-80 rounded-full bg-blue-600/15 blur-[110px] print:hidden" />
      <div className="absolute bottom-0 left-1/3 w-64 h-64 rounded-full bg-cyan-400/10 blur-[90px] print:hidden" />

      <div className="relative max-w-screen-xl mx-auto p-4 sm:p-6 space-y-5 print:p-0 print:max-w-none">
        {/* Header - Hide on print */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/30 shrink-0">
              <Scale size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">
                Trial Balance
              </h1>
              <p className="text-xs sm:text-sm text-white/35 mt-0.5">
                View account balances and verify double-entry bookkeeping
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleExport}
              className="flex-1 md:flex-none border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white rounded-lg"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handlePrint}
              className="flex-1 md:flex-none border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white rounded-lg"
            >
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
          </div>
        </div>

        {/* Date Filter - Hide on print */}
        <Card className={`${glassCard} print:hidden`}>
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4">
              <div className="space-y-2 flex-1 max-w-xs">
                <Label className="text-white/50 font-semibold text-xs uppercase tracking-wider">
                  As of Date
                </Label>
                <Input
                  type="date"
                  value={asOfDate}
                  onChange={(e) => setAsOfDate(e.target.value)}
                  className={`rounded-lg [color-scheme:dark] ${darkField}`}
                />
              </div>
              <div className="text-xs text-white/40 flex items-center gap-1.5 pb-0.5">
                <Calendar className="h-3.5 w-3.5" />
                Showing balances as of:{" "}
                <span className="font-semibold text-white/70">{formatDateDisplay(asOfDate)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Trial Balance Report */}
        <Card className={`${glassCard} print:shadow-none print:border-0 print:bg-white print:rounded-none`}>
          <CardContent className="p-0">
            {/* Company Header - Show on print */}
            <div className="hidden print:block p-8 border-b-2 border-gray-800">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Anwer Khan Modern Securities Ltd.
                  </h1>
                  <p className="text-sm text-gray-600 font-semibold mt-1">
                    Think Big, Grow Smart.
                  </p>
                  <p className="text-sm text-gray-600 mt-2">
                    Advanced Noorani Tower (Lift- 13), 1 Mohakhali C/A, Dhaka -1212.
                  </p>
                </div>
                <div className="text-right text-sm space-y-1">
                  <div className="flex items-center justify-end gap-2">
                    <span className="text-gray-600">Phone :</span>
                    <span className="font-semibold">+8801897-662155</span>
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <span className="text-gray-600">Mobile :</span>
                    <span className="font-semibold">+8801777-694051</span>
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <span className="text-gray-600">Email :</span>
                    <span className="font-semibold">tradecap196@gmail.com</span>
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <span className="text-gray-600">Web :</span>
                    <span className="font-semibold">www.tradecap.com.bd</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 text-center">
                <h2 className="text-xl font-bold text-gray-900">Trial Balance</h2>
                <p className="text-sm text-gray-600 mt-1">As of {formatDateDisplay(asOfDate)}</p>
              </div>
            </div>

            {/* Screen Header - Hide on print */}
            <div className="border-b border-white/10 px-5 sm:px-6 py-4 print:hidden">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white">
                    Trial Balance Report
                  </h3>
                  <p className="text-xs sm:text-sm text-white/40 mt-0.5">
                    As of {formatDateDisplay(asOfDate)}
                  </p>
                </div>
                {totals && (
                  <div className="text-right">
                    {isBalanced ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-bold text-emerald-300 border border-emerald-400/25">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Balanced
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-400/10 px-3 py-1 text-xs font-bold text-rose-300 border border-rose-400/25">
                        <AlertCircle className="h-3.5 w-3.5" />
                        Out of Balance
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Trial Balance Table */}
            <div className="overflow-x-auto">
              {isLoading || isFetching ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-white/10 border-t-cyan-400" />
                </div>
              ) : (
                <Table className="print:text-black">
                  <TableHeader>
                    <TableRow className="border-b border-white/10 hover:bg-transparent print:border-gray-800 print:border-b-2">
                      <TableHead className="text-xs font-bold text-white/40 w-[120px] print:text-black print:py-2">
                        COA Code
                      </TableHead>
                      <TableHead className="text-xs font-bold text-white/40 print:text-black print:py-2">
                        Chart of Accounts
                      </TableHead>
                      <TableHead className="text-xs font-bold text-white/40 text-right w-[180px] print:text-black print:py-2">
                        Debit
                      </TableHead>
                      <TableHead className="text-xs font-bold text-white/40 text-right w-[180px] print:text-black print:py-2">
                        Credit
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(groupedAccounts).map(([classKey, items]) => (
                      <TrialBalanceSection key={classKey} classKey={classKey} items={items} />
                    ))}

                    {/* Grand Total */}
                    {totals && (
                      <TableRow className="bg-cyan-400/5 hover:bg-cyan-400/5 border-t-2 border-white/20 print:bg-white print:border-gray-900">
                        <TableCell colSpan={2} className="font-bold text-right text-white/70 py-4 print:text-black print:py-3 print:text-base">
                          Grand Total
                        </TableCell>
                        <TableCell className="text-right font-extrabold text-cyan-300 text-lg font-mono border-b-2 border-white/20 py-4 print:text-black print:py-3 print:text-base print:border-gray-900">
                          {formatCurrency(totals.totalDebit)}
                        </TableCell>
                        <TableCell className="text-right font-extrabold text-cyan-300 text-lg font-mono border-b-2 border-white/20 py-4 print:text-black print:py-3 print:text-base print:border-gray-900">
                          {formatCurrency(totals.totalCredit)}
                        </TableCell>
                      </TableRow>
                    )}

                    {trialBalanceItems.length === 0 && (
                      <TableRow className="hover:bg-transparent border-b-0">
                        <TableCell colSpan={4} className="text-center py-12 text-white/30 print:text-gray-500">
                          No data available for the selected date
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </div>

            {/* Balance Status - Hide on print */}
            {totals && parseFloat(totals.difference) !== 0 && (
              <div className="p-4 bg-rose-400/5 border-t border-rose-400/25 print:hidden">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-rose-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-rose-300">Trial Balance is Out of Balance</p>
                    <p className="text-xs text-rose-300/70 mt-1">
                      Difference: ৳ {formatCurrency(Math.abs(parseFloat(totals.difference)))}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}