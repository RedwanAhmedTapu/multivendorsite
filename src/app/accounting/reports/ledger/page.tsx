// src/app/accounting/ledger/page.tsx
"use client";

import React, { useState } from "react";
import { 
  useGetChartOfAccountsQuery,
  useGetLedgerQuery,
} from "@/features/accountingApi";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Download, Printer, FileText, BookOpen } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

// ============================================
// STYLE TOKENS — matches accounts/vouchers/periods dark cyan/blue glass theme
// ============================================

const glassCard = "rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md";
const darkField =
  "border-white/10 bg-white/5 text-white placeholder:text-white/30 focus-visible:ring-cyan-400/50 focus-visible:border-cyan-400/40";

export default function GeneralLedgerPage() {
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [startDate, setStartDate] = useState<string>(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const limit = 50;

  // Get current entity
  const currentUser = { role: "ADMIN" };
  const entityType = currentUser.role === "VENDOR" ? "VENDOR" : "ADMIN";
  const entityId = currentUser.role === "VENDOR" ? "vendor-id" : undefined;

  // Fetch chart of accounts
  const { data: accountsResponse, isLoading: isLoadingAccounts } = useGetChartOfAccountsQuery({
    entityType,
    entityId,
  });

  // Fetch ledger entries for selected account
  const { data: ledgerResponse, isLoading: isLoadingLedger, isFetching } = useGetLedgerQuery(
    {
      accountId: selectedAccountId,
      entityType,
      entityId,
      startDate,
      endDate,
      page,
      limit,
    },
    {
      skip: !selectedAccountId,
    }
  );

  const accounts = accountsResponse?.data || [];
  const ledgerEntries = ledgerResponse?.data || [];
  const pagination = ledgerResponse?.pagination;
  const totalPages = pagination?.pages || 1;

  // Get selected account details
  const selectedAccount = accounts.find(acc => acc.id === selectedAccountId);

  // Filter accounts by search
  const filteredAccounts = accounts.filter(account =>
    account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    account.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate totals
  const calculateTotals = () => {
    let totalDebit = 0;
    let totalCredit = 0;

    ledgerEntries.forEach(entry => {
      totalDebit += parseFloat(entry.debitAmount || "0");
      totalCredit += parseFloat(entry.creditAmount || "0");
    });

    return { totalDebit, totalCredit };
  };

  const { totalDebit, totalCredit } = calculateTotals();

  // Get opening balance (this should come from API ideally)
  const openingBalance = ledgerEntries.length > 0 
    ? parseFloat(ledgerEntries[0].runningBalance || "0") - parseFloat(ledgerEntries[0].debitAmount || "0") + parseFloat(ledgerEntries[0].creditAmount || "0")
    : 0;

  const closingBalance = ledgerEntries.length > 0
    ? parseFloat(ledgerEntries[ledgerEntries.length - 1].runningBalance || "0")
    : openingBalance;

  // Format date display
  const formatDateDisplay = (dateString: string): string => {
    try {
      return format(new Date(dateString), "dd-MMM-yyyy");
    } catch {
      return dateString;
    }
  };

  // Format currency
  const formatCurrency = (amount: number | string): string => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Get voucher type badge
  const getVoucherTypeBadge = (type: string) => {
    const shortTypes: Record<string, string> = {
      "JOURNAL": "JV",
      "RECEIPT": "RV",
      "PAYMENT": "PV",
      "SALES": "SV",
      "PURCHASE": "PUR",
      "EXPENSE": "EV",
      "DELIVERY": "DV",
      "COMMISSION": "COV",
      "SETTLEMENT": "SV",
      "REFUND": "RV",
      "PAYOUT": "PO",
      "OPENING": "OV",
      "CLOSING": "CV",
    };

    return shortTypes[type] || type;
  };

  // Handle print
  const handlePrint = () => {
    if (!selectedAccount) {
      toast.error("Please select an account first");
      return;
    }
    window.print();
  };

  // Handle export
  const handleExport = () => {
    if (!selectedAccount) {
      toast.error("Please select an account first");
      return;
    }
    toast.info("Export functionality coming soon");
  };

  if (isLoadingAccounts) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-slate-950">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-cyan-950" />
        <div className="relative flex flex-col items-center justify-center h-screen gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-white/10 border-t-cyan-400" />
          <span className="text-sm text-white/35 font-medium">Loading accounts...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 print:bg-white print:min-h-0">
      {/* Background — matches accounts, vouchers & periods. Hidden on print */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-cyan-950 print:hidden" />
      <div className="absolute -top-24 -left-16 w-72 h-72 rounded-full bg-cyan-500/20 blur-[100px] print:hidden" />
      <div className="absolute top-1/3 -right-24 w-80 h-80 rounded-full bg-blue-600/15 blur-[110px] print:hidden" />
      <div className="absolute bottom-0 left-1/3 w-64 h-64 rounded-full bg-cyan-400/10 blur-[90px] print:hidden" />

      <div className="relative max-w-screen-xl mx-auto p-4 sm:p-6 space-y-5 print:p-0 print:max-w-none">
        {/* Header - Hide on print */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/30 shrink-0">
              <BookOpen size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">
                General Ledger
              </h1>
              <p className="text-xs sm:text-sm text-white/35 mt-0.5">
                View detailed account transactions and running balance
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleExport}
              className="flex-1 md:flex-none border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white rounded-lg disabled:opacity-30"
              disabled={!selectedAccount}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handlePrint}
              className="flex-1 md:flex-none border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white rounded-lg disabled:opacity-30"
              disabled={!selectedAccount}
            >
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
          </div>
        </div>

        {/* Filters - Hide on print */}
        <Card className={`${glassCard} print:hidden`}>
          <CardContent className="p-4 sm:p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Account Selection */}
              <div className="space-y-2 lg:col-span-2">
                <Label className="text-white/50 font-semibold text-xs uppercase tracking-wider">
                  Select Account
                </Label>
                <Select
                  value={selectedAccountId}
                  onValueChange={(value) => {
                    setSelectedAccountId(value);
                    setPage(1);
                  }}
                >
                  <SelectTrigger className={`rounded-lg ${darkField}`}>
                    <SelectValue placeholder="Choose an account..." />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-white/10 text-white">
                    <div className="p-2">
                      <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-white/30" />
                        <Input
                          placeholder="Search accounts..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className={`pl-8 mb-2 rounded-lg ${darkField}`}
                        />
                      </div>
                    </div>
                    {filteredAccounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        <span className="font-mono text-cyan-300">[{account.code}]</span> {account.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Start Date */}
              <div className="space-y-2">
                <Label className="text-white/50 font-semibold text-xs uppercase tracking-wider">
                  From Date
                </Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setPage(1);
                  }}
                  className={`rounded-lg [color-scheme:dark] ${darkField}`}
                />
              </div>

              {/* End Date */}
              <div className="space-y-2">
                <Label className="text-white/50 font-semibold text-xs uppercase tracking-wider">
                  To Date
                </Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setPage(1);
                  }}
                  className={`rounded-lg [color-scheme:dark] ${darkField}`}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ledger Report */}
        {selectedAccount ? (
          <Card className={`${glassCard} print:shadow-none print:border-0 print:bg-white print:rounded-none`}>
            <CardContent className="p-0">
              {/* Company Header - Show on print only */}
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
                  <h2 className="text-xl font-bold text-gray-900">General Ledger</h2>
                </div>

                <div className="mt-4 flex justify-between items-center text-sm">
                  <div>
                    <p className="font-bold">
                      Date: <span className="font-normal">{formatDateDisplay(startDate)} To {formatDateDisplay(endDate)}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">
                      Opening Balance: <span className="font-normal">৳ {formatCurrency(openingBalance)}</span>
                    </p>
                  </div>
                </div>

                <div className="mt-2">
                  <p className="font-bold text-sm">
                    Ledger COA Name: <span className="font-normal">{selectedAccount.name} ({selectedAccount.code})</span>
                  </p>
                </div>
              </div>

              {/* Screen Header - Hide on print */}
              <div className="border-b border-white/10 px-5 sm:px-6 py-4 print:hidden">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-white">
                      {selectedAccount.name}
                    </h3>
                    <p className="text-xs sm:text-sm text-white/40 mt-0.5">
                      Account Code: <span className="font-mono font-semibold text-cyan-300/80">{selectedAccount.code}</span>
                      {" · "}Period: {formatDateDisplay(startDate)} to {formatDateDisplay(endDate)}
                    </p>
                  </div>
                  <div className="sm:text-right">
                    <p className="text-xs text-white/40 font-semibold uppercase tracking-wider">Opening Balance</p>
                    <p className="text-xl font-bold text-cyan-300">
                      ৳ {formatCurrency(openingBalance)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Ledger Table */}
              <div className="overflow-x-auto">
                <Table className="print:text-black">
                  <TableHeader>
                    <TableRow className="border-b border-white/10 hover:bg-transparent print:border-gray-800 print:border-b-2">
                      <TableHead className="text-xs font-bold text-white/40 w-[100px] print:text-black print:py-2">
                        Trans Date
                      </TableHead>
                      <TableHead className="text-xs font-bold text-white/40 w-[180px] print:text-black print:py-2">
                        Respective COA
                      </TableHead>
                      <TableHead className="text-xs font-bold text-white/40 min-w-[250px] print:text-black print:py-2">
                        Description
                      </TableHead>
                      <TableHead className="text-xs font-bold text-white/40 w-[120px] print:text-black print:py-2">
                        Voucher No
                      </TableHead>
                      <TableHead className="text-xs font-bold text-white/40 w-[80px] text-center print:text-black print:py-2">
                        Type
                      </TableHead>
                      <TableHead className="text-xs font-bold text-white/40 w-[130px] text-right print:text-black print:py-2">
                        Debit
                      </TableHead>
                      <TableHead className="text-xs font-bold text-white/40 w-[130px] text-right print:text-black print:py-2">
                        Credit
                      </TableHead>
                      <TableHead className="text-xs font-bold text-white/40 w-[150px] text-right print:text-black print:py-2">
                        Balance
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingLedger || isFetching ? (
                      <TableRow className="hover:bg-transparent border-b-0">
                        <TableCell colSpan={8} className="text-center py-12">
                          <div className="flex items-center justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-2 border-white/10 border-t-cyan-400" />
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : ledgerEntries.length === 0 ? (
                      <TableRow className="hover:bg-transparent border-b-0">
                        <TableCell colSpan={8} className="text-center py-12 text-white/30 print:text-gray-500">
                          No transactions found for the selected period
                        </TableCell>
                      </TableRow>
                    ) : (
                      ledgerEntries.map((entry, index) => (
                        <TableRow 
                          key={entry.id}
                          className={`
                            ${index % 2 === 0 ? 'bg-transparent' : 'bg-white/[0.02]'}
                            border-b border-white/5 hover:bg-cyan-400/5 transition-colors
                            print:border-gray-300 print:bg-white
                          `}
                        >
                          <TableCell className="text-xs text-white/50 print:text-black print:py-1 print:text-xs">
                            {formatDateDisplay(entry.entryDate)}
                          </TableCell>
                          <TableCell className="text-xs text-white/70 print:text-black print:py-1 print:text-xs">
                            {entry.account?.name || 'N/A'}
                          </TableCell>
                          <TableCell className="text-xs text-white/50 print:text-black print:py-1 print:text-xs">
                            <div>{entry.description || entry.voucher?.narration || '—'}</div>
                          </TableCell>
                          <TableCell className="font-mono text-xs font-semibold text-cyan-300/80 print:text-black print:py-1 print:text-xs">
                            {entry.voucher?.voucherNumber || '—'}
                          </TableCell>
                          <TableCell className="text-center print:py-1">
                            <Badge 
                              variant="outline" 
                              className="text-[10px] font-semibold border-white/15 bg-white/5 text-white/50 rounded-full print:border-black print:text-black print:bg-transparent"
                            >
                              {getVoucherTypeBadge(entry.voucher?.voucherType || '')}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-bold text-white/80 font-mono text-xs print:text-black print:py-1 print:text-xs">
                            {parseFloat(entry.debitAmount) > 0 ? formatCurrency(entry.debitAmount) : '0.00'}
                          </TableCell>
                          <TableCell className="text-right font-bold text-white/80 font-mono text-xs print:text-black print:py-1 print:text-xs">
                            {parseFloat(entry.creditAmount) > 0 ? formatCurrency(entry.creditAmount) : '0.00'}
                          </TableCell>
                          <TableCell className="text-right font-bold text-cyan-300 font-mono text-xs print:text-black print:py-1 print:text-xs">
                            {formatCurrency(entry.runningBalance || '0')}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                  <tfoot className="bg-white/[0.03] border-t border-white/10 print:bg-white print:border-t-2 print:border-gray-800">
                    <tr>
                      <td colSpan={5} className="px-4 py-4 text-right text-sm font-bold text-white/60 print:text-black print:py-2 print:text-sm">
                        Totals:
                      </td>
                      <td className="px-4 py-4 text-right font-bold text-white text-base font-mono print:text-black print:py-2 print:text-sm border-b-2 border-white/10 print:border-gray-800">
                        {formatCurrency(totalDebit)}
                      </td>
                      <td className="px-4 py-4 text-right font-bold text-white text-base font-mono print:text-black print:py-2 print:text-sm border-b-2 border-white/10 print:border-gray-800">
                        {formatCurrency(totalCredit)}
                      </td>
                      <td className="px-4 py-4 text-right print:py-2"></td>
                    </tr>
                    <tr>
                      <td colSpan={7} className="px-4 py-4 text-right text-sm font-bold text-white/60 print:text-black print:py-2 print:text-sm">
                        Closing Balance
                      </td>
                      <td className="px-4 py-4 text-right font-extrabold text-cyan-300 text-lg font-mono print:text-black print:py-2 print:text-sm border-b-4 border-white/20 print:border-gray-900">
                        {formatCurrency(closingBalance)}
                      </td>
                    </tr>
                  </tfoot>
                </Table>
              </div>

              {/* Pagination - Hide on print */}
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t border-white/10 print:hidden">
                  <div className="text-xs text-white/40">
                    Page <span className="font-semibold text-white/70">{page}</span> of{" "}
                    <span className="font-semibold text-white/70">{totalPages}</span> · Showing{" "}
                    <span className="font-semibold text-white/70">{ledgerEntries.length}</span> of{" "}
                    <span className="font-semibold text-white/70">{pagination?.total || 0}</span> entries
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1 || isLoadingLedger}
                      className="rounded-lg border-white/10 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white text-xs h-8 disabled:opacity-30"
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages || isLoadingLedger}
                      className="rounded-lg border-white/10 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white text-xs h-8 disabled:opacity-30"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card className={`${glassCard} print:hidden`}>
            <CardContent className="py-16">
              <div className="text-center">
                <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-3">
                  <FileText className="h-5 w-5 text-white/25" />
                </div>
                <h3 className="text-sm font-semibold text-white/60 mb-1">
                  Select an Account
                </h3>
                <p className="text-xs text-white/30">
                  Choose an account from the dropdown above to view its general ledger
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}