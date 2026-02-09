// src/app/accounting/reports/trial-balance/page.tsx
"use client";

import React, { useState } from "react";
import { useGetTrialBalanceQuery } from "@/features/accountingApi";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar, Download, Printer, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

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

  // Calculate group totals
  const calculateGroupTotals = (items: typeof trialBalanceItems) => {
    let totalDebit = 0;
    let totalCredit = 0;

    items.forEach(item => {
      totalDebit += parseFloat(item.totalDebit || "0");
      totalCredit += parseFloat(item.totalCredit || "0");
    });

    return { totalDebit, totalCredit };
  };

  // Format date display
  const formatDateDisplay = (dateString: string): string => {
    try {
      return format(new Date(dateString), "dd MMM, yyyy");
    } catch {
      return dateString;
    }
  };

  // Format currency
  const formatCurrency = (amount: number | string): string => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Handle print
  const handlePrint = () => {
    window.print();
  };

  // Handle export
  const handleExport = () => {
    toast.info("Export functionality coming soon");
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6 print:p-0">
      {/* Header - Hide on print */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            Trial Balance
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            View account balances and verify double-entry bookkeeping
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleExport}
            className="border-gray-300 hover:bg-gray-50"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handlePrint}
            className="border-gray-300 hover:bg-gray-50"
          >
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
        </div>
      </div>

      {/* Date Filter - Hide on print */}
      <Card className="border-gray-200 shadow-sm print:hidden">
        <CardContent className="p-6">
          <div className="flex items-end gap-4">
            <div className="space-y-2 flex-1 max-w-xs">
              <Label className="text-sm font-semibold text-gray-700">As of Date</Label>
              <Input
                type="date"
                value={asOfDate}
                onChange={(e) => setAsOfDate(e.target.value)}
                className="border-gray-300 focus-visible:ring-teal-500"
              />
            </div>
            <div className="text-sm text-gray-600">
              <Calendar className="h-4 w-4 inline mr-1" />
              Showing balances as of: <span className="font-semibold">{formatDateDisplay(asOfDate)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Trial Balance Report */}
      <Card className="border-gray-200 shadow-sm print:shadow-none print:border-0">
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
          <div className="bg-teal-50 dark:bg-teal-950 border-b border-teal-100 px-6 py-4 print:hidden">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-teal-900 dark:text-teal-100">
                  Trial Balance Report
                </h3>
                <p className="text-sm text-teal-700 dark:text-teal-300">
                  As of {formatDateDisplay(asOfDate)}
                </p>
              </div>
              {totals && (
                <div className="text-right">
                  <p className="text-xs text-teal-700 dark:text-teal-300 font-semibold">
                    {totals.difference === "0.00" || parseFloat(totals.difference) === 0 ? (
                      <span className="text-emerald-600">✓ Balanced</span>
                    ) : (
                      <span className="text-rose-600">⚠ Out of Balance</span>
                    )}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Trial Balance Table */}
          <div className="overflow-x-auto">
            {isLoading || isFetching ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-100 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800 border-b-2 border-gray-800 print:border-gray-800">
                    <TableHead className="font-bold text-gray-900 dark:text-gray-100 w-[120px] print:text-black print:py-2">
                      COA Code
                    </TableHead>
                    <TableHead className="font-bold text-gray-900 dark:text-gray-100 print:text-black print:py-2">
                      Chart of Accounts
                    </TableHead>
                    <TableHead className="font-bold text-gray-900 dark:text-gray-100 text-right w-[180px] print:text-black print:py-2">
                      Debit
                    </TableHead>
                    <TableHead className="font-bold text-gray-900 dark:text-gray-100 text-right w-[180px] print:text-black print:py-2">
                      Credit
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* Assets Section */}
                  {groupedAccounts.ASSET.length > 0 && (
                    <>
                      <TableRow className="bg-gray-50 dark:bg-gray-900">
                        <TableCell colSpan={4} className="font-bold text-gray-900 dark:text-gray-100 py-3 print:text-black print:py-2">
                          Assets
                        </TableCell>
                      </TableRow>
                      {groupedAccounts.ASSET.map((item, index) => (
                        <TableRow 
                          key={item.accountCode}
                          className="border-b border-gray-200 hover:bg-teal-50 dark:hover:bg-teal-950 print:border-gray-300"
                        >
                          <TableCell className="font-mono text-sm text-teal-700 dark:text-teal-400 print:text-black print:py-1 print:text-xs">
                            {item.accountCode}
                          </TableCell>
                          <TableCell className="text-sm text-gray-900 dark:text-gray-100 print:text-black print:py-1 print:text-xs pl-6">
                            {item.accountName}
                          </TableCell>
                          <TableCell className="text-right font-semibold text-gray-900 dark:text-gray-100 print:text-black print:py-1 print:text-xs">
                            {parseFloat(item.totalDebit) !== 0 ? formatCurrency(item.totalDebit) : '0.00'}
                          </TableCell>
                          <TableCell className="text-right font-semibold text-gray-900 dark:text-gray-100 print:text-black print:py-1 print:text-xs">
                            {parseFloat(item.totalCredit) !== 0 ? formatCurrency(item.totalCredit) : '0.00'}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-gray-100 dark:bg-gray-800 border-y-2 border-gray-300">
                        <TableCell colSpan={2} className="font-bold text-right text-gray-900 py-3 print:text-black print:py-2 print:text-sm">
                          Total
                        </TableCell>
                        <TableCell className="text-right font-bold text-gray-900 print:text-black print:py-2 print:text-sm">
                          {formatCurrency(calculateGroupTotals(groupedAccounts.ASSET).totalDebit)}
                        </TableCell>
                        <TableCell className="text-right font-bold text-gray-900 print:text-black print:py-2 print:text-sm">
                          {formatCurrency(calculateGroupTotals(groupedAccounts.ASSET).totalCredit)}
                        </TableCell>
                      </TableRow>
                    </>
                  )}

                  {/* Liabilities Section */}
                  {groupedAccounts.LIABILITY.length > 0 && (
                    <>
                      <TableRow className="bg-gray-50 dark:bg-gray-900">
                        <TableCell colSpan={4} className="font-bold text-gray-900 dark:text-gray-100 py-3 print:text-black print:py-2">
                          Liabilities
                        </TableCell>
                      </TableRow>
                      {groupedAccounts.LIABILITY.map((item, index) => (
                        <TableRow 
                          key={item.accountCode}
                          className="border-b border-gray-200 hover:bg-teal-50 dark:hover:bg-teal-950 print:border-gray-300"
                        >
                          <TableCell className="font-mono text-sm text-teal-700 dark:text-teal-400 print:text-black print:py-1 print:text-xs">
                            {item.accountCode}
                          </TableCell>
                          <TableCell className="text-sm text-gray-900 dark:text-gray-100 print:text-black print:py-1 print:text-xs pl-6">
                            {item.accountName}
                          </TableCell>
                          <TableCell className="text-right font-semibold text-gray-900 dark:text-gray-100 print:text-black print:py-1 print:text-xs">
                            {parseFloat(item.totalDebit) !== 0 ? formatCurrency(item.totalDebit) : '0.00'}
                          </TableCell>
                          <TableCell className="text-right font-semibold text-gray-900 dark:text-gray-100 print:text-black print:py-1 print:text-xs">
                            {parseFloat(item.totalCredit) !== 0 ? formatCurrency(item.totalCredit) : '0.00'}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-gray-100 dark:bg-gray-800 border-y-2 border-gray-300">
                        <TableCell colSpan={2} className="font-bold text-right text-gray-900 py-3 print:text-black print:py-2 print:text-sm">
                          Total
                        </TableCell>
                        <TableCell className="text-right font-bold text-gray-900 print:text-black print:py-2 print:text-sm">
                          {formatCurrency(calculateGroupTotals(groupedAccounts.LIABILITY).totalDebit)}
                        </TableCell>
                        <TableCell className="text-right font-bold text-gray-900 print:text-black print:py-2 print:text-sm">
                          {formatCurrency(calculateGroupTotals(groupedAccounts.LIABILITY).totalCredit)}
                        </TableCell>
                      </TableRow>
                    </>
                  )}

                  {/* Expenses Section */}
                  {groupedAccounts.EXPENSE.length > 0 && (
                    <>
                      <TableRow className="bg-gray-50 dark:bg-gray-900">
                        <TableCell colSpan={4} className="font-bold text-gray-900 dark:text-gray-100 py-3 print:text-black print:py-2">
                          Expenses
                        </TableCell>
                      </TableRow>
                      {groupedAccounts.EXPENSE.map((item, index) => (
                        <TableRow 
                          key={item.accountCode}
                          className="border-b border-gray-200 hover:bg-teal-50 dark:hover:bg-teal-950 print:border-gray-300"
                        >
                          <TableCell className="font-mono text-sm text-teal-700 dark:text-teal-400 print:text-black print:py-1 print:text-xs">
                            {item.accountCode}
                          </TableCell>
                          <TableCell className="text-sm text-gray-900 dark:text-gray-100 print:text-black print:py-1 print:text-xs pl-6">
                            {item.accountName}
                          </TableCell>
                          <TableCell className="text-right font-semibold text-gray-900 dark:text-gray-100 print:text-black print:py-1 print:text-xs">
                            {parseFloat(item.totalDebit) !== 0 ? formatCurrency(item.totalDebit) : '0.00'}
                          </TableCell>
                          <TableCell className="text-right font-semibold text-gray-900 dark:text-gray-100 print:text-black print:py-1 print:text-xs">
                            {parseFloat(item.totalCredit) !== 0 ? formatCurrency(item.totalCredit) : '0.00'}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-gray-100 dark:bg-gray-800 border-y-2 border-gray-300">
                        <TableCell colSpan={2} className="font-bold text-right text-gray-900 py-3 print:text-black print:py-2 print:text-sm">
                          Total
                        </TableCell>
                        <TableCell className="text-right font-bold text-gray-900 print:text-black print:py-2 print:text-sm">
                          {formatCurrency(calculateGroupTotals(groupedAccounts.EXPENSE).totalDebit)}
                        </TableCell>
                        <TableCell className="text-right font-bold text-gray-900 print:text-black print:py-2 print:text-sm">
                          {formatCurrency(calculateGroupTotals(groupedAccounts.EXPENSE).totalCredit)}
                        </TableCell>
                      </TableRow>
                    </>
                  )}

                  {/* Income Section */}
                  {groupedAccounts.INCOME.length > 0 && (
                    <>
                      <TableRow className="bg-gray-50 dark:bg-gray-900">
                        <TableCell colSpan={4} className="font-bold text-gray-900 dark:text-gray-100 py-3 print:text-black print:py-2">
                          Income
                        </TableCell>
                      </TableRow>
                      {groupedAccounts.INCOME.map((item, index) => (
                        <TableRow 
                          key={item.accountCode}
                          className="border-b border-gray-200 hover:bg-teal-50 dark:hover:bg-teal-950 print:border-gray-300"
                        >
                          <TableCell className="font-mono text-sm text-teal-700 dark:text-teal-400 print:text-black print:py-1 print:text-xs">
                            {item.accountCode}
                          </TableCell>
                          <TableCell className="text-sm text-gray-900 dark:text-gray-100 print:text-black print:py-1 print:text-xs pl-6">
                            {item.accountName}
                          </TableCell>
                          <TableCell className="text-right font-semibold text-gray-900 dark:text-gray-100 print:text-black print:py-1 print:text-xs">
                            {parseFloat(item.totalDebit) !== 0 ? formatCurrency(item.totalDebit) : '0.00'}
                          </TableCell>
                          <TableCell className="text-right font-semibold text-gray-900 dark:text-gray-100 print:text-black print:py-1 print:text-xs">
                            {parseFloat(item.totalCredit) !== 0 ? formatCurrency(item.totalCredit) : '0.00'}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-gray-100 dark:bg-gray-800 border-y-2 border-gray-300">
                        <TableCell colSpan={2} className="font-bold text-right text-gray-900 py-3 print:text-black print:py-2 print:text-sm">
                          Total
                        </TableCell>
                        <TableCell className="text-right font-bold text-gray-900 print:text-black print:py-2 print:text-sm">
                          {formatCurrency(calculateGroupTotals(groupedAccounts.INCOME).totalDebit)}
                        </TableCell>
                        <TableCell className="text-right font-bold text-gray-900 print:text-black print:py-2 print:text-sm">
                          {formatCurrency(calculateGroupTotals(groupedAccounts.INCOME).totalCredit)}
                        </TableCell>
                      </TableRow>
                    </>
                  )}

                  {/* Equity Section */}
                  {groupedAccounts.EQUITY.length > 0 && (
                    <>
                      <TableRow className="bg-gray-50 dark:bg-gray-900">
                        <TableCell colSpan={4} className="font-bold text-gray-900 dark:text-gray-100 py-3 print:text-black print:py-2">
                          Equity
                        </TableCell>
                      </TableRow>
                      {groupedAccounts.EQUITY.map((item, index) => (
                        <TableRow 
                          key={item.accountCode}
                          className="border-b border-gray-200 hover:bg-teal-50 dark:hover:bg-teal-950 print:border-gray-300"
                        >
                          <TableCell className="font-mono text-sm text-teal-700 dark:text-teal-400 print:text-black print:py-1 print:text-xs">
                            {item.accountCode}
                          </TableCell>
                          <TableCell className="text-sm text-gray-900 dark:text-gray-100 print:text-black print:py-1 print:text-xs pl-6">
                            {item.accountName}
                          </TableCell>
                          <TableCell className="text-right font-semibold text-gray-900 dark:text-gray-100 print:text-black print:py-1 print:text-xs">
                            {parseFloat(item.totalDebit) !== 0 ? formatCurrency(item.totalDebit) : '0.00'}
                          </TableCell>
                          <TableCell className="text-right font-semibold text-gray-900 dark:text-gray-100 print:text-black print:py-1 print:text-xs">
                            {parseFloat(item.totalCredit) !== 0 ? formatCurrency(item.totalCredit) : '0.00'}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-gray-100 dark:bg-gray-800 border-y-2 border-gray-300">
                        <TableCell colSpan={2} className="font-bold text-right text-gray-900 py-3 print:text-black print:py-2 print:text-sm">
                          Total
                        </TableCell>
                        <TableCell className="text-right font-bold text-gray-900 print:text-black print:py-2 print:text-sm">
                          {formatCurrency(calculateGroupTotals(groupedAccounts.EQUITY).totalDebit)}
                        </TableCell>
                        <TableCell className="text-right font-bold text-gray-900 print:text-black print:py-2 print:text-sm">
                          {formatCurrency(calculateGroupTotals(groupedAccounts.EQUITY).totalCredit)}
                        </TableCell>
                      </TableRow>
                    </>
                  )}

                  {/* Grand Total */}
                  {totals && (
                    <TableRow className="bg-teal-50 border-t-4 border-gray-900 print:bg-white">
                      <TableCell colSpan={2} className="font-bold text-right text-gray-900 py-4 print:text-black print:py-3 print:text-base">
                        Grand Total
                      </TableCell>
                      <TableCell className="text-right font-bold text-gray-900 text-lg border-b-4 border-gray-900 py-4 print:text-black print:py-3 print:text-base">
                        {formatCurrency(totals.totalDebit)}
                      </TableCell>
                      <TableCell className="text-right font-bold text-gray-900 text-lg border-b-4 border-gray-900 py-4 print:text-black print:py-3 print:text-base">
                        {formatCurrency(totals.totalCredit)}
                      </TableCell>
                    </TableRow>
                  )}

                  {trialBalanceItems.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-12 text-gray-500">
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
            <div className="p-4 bg-rose-50 border-t-2 border-rose-200 print:hidden">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-rose-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-rose-800">Trial Balance is Out of Balance</p>
                  <p className="text-xs text-rose-700 mt-1">
                    Difference: ৳ {formatCurrency(Math.abs(parseFloat(totals.difference)))}
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}