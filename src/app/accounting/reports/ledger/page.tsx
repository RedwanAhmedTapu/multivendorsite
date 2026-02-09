// src/app/accounting/ledger/page.tsx
"use client";

import React, { useState } from "react";
import { 
  useGetChartOfAccountsQuery,
  useGetLedgerQuery,
} from "@/features/accountingApi";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Calendar, Search, Download, Printer, FileText, Building2, Mail, Phone, Globe } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

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
            General Ledger
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            View detailed account transactions and running balance
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleExport}
            className="border-gray-300 hover:bg-gray-50"
            disabled={!selectedAccount}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handlePrint}
            className="border-gray-300 hover:bg-gray-50"
            disabled={!selectedAccount}
          >
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
        </div>
      </div>

      {/* Filters - Hide on print */}
      <Card className="border-gray-200 shadow-sm print:hidden">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Account Selection */}
            <div className="space-y-2 lg:col-span-2">
              <Label className="text-sm font-semibold text-gray-700">Select Account</Label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Select
                    value={selectedAccountId}
                    onValueChange={(value) => {
                      setSelectedAccountId(value);
                      setPage(1);
                    }}
                  >
                    <SelectTrigger className="border-gray-300 focus:ring-teal-500">
                      <SelectValue placeholder="Choose an account..." />
                    </SelectTrigger>
                    <SelectContent>
                      <div className="p-2">
                        <div className="relative">
                          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                          <Input
                            placeholder="Search accounts..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-8 mb-2"
                          />
                        </div>
                      </div>
                      {filteredAccounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          <span className="font-mono text-teal-600">[{account.code}]</span> {account.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Start Date */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">From Date</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPage(1);
                }}
                className="border-gray-300 focus-visible:ring-teal-500"
              />
            </div>

            {/* End Date */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">To Date</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPage(1);
                }}
                className="border-gray-300 focus-visible:ring-teal-500"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ledger Report */}
      {selectedAccount ? (
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
            <div className="bg-teal-50 dark:bg-teal-950 border-b border-teal-100 px-6 py-4 print:hidden">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-teal-900 dark:text-teal-100">
                    {selectedAccount.name}
                  </h3>
                  <p className="text-sm text-teal-700 dark:text-teal-300">
                    Account Code: <span className="font-mono font-semibold">{selectedAccount.code}</span> | 
                    Period: {formatDateDisplay(startDate)} to {formatDateDisplay(endDate)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-teal-700 dark:text-teal-300 font-semibold">Opening Balance</p>
                  <p className="text-xl font-bold text-teal-900 dark:text-teal-100">
                    ৳ {formatCurrency(openingBalance)}
                  </p>
                </div>
              </div>
            </div>

            {/* Ledger Table */}
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-100 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800 border-b-2 border-gray-800 print:border-gray-800">
                    <TableHead className="font-bold text-gray-900 dark:text-gray-100 w-[100px] print:text-black print:py-2">
                      Trans Date
                    </TableHead>
                    <TableHead className="font-bold text-gray-900 dark:text-gray-100 w-[180px] print:text-black print:py-2">
                      Respective COA
                    </TableHead>
                    <TableHead className="font-bold text-gray-900 dark:text-gray-100 min-w-[250px] print:text-black print:py-2">
                      Description
                    </TableHead>
                    <TableHead className="font-bold text-gray-900 dark:text-gray-100 w-[120px] print:text-black print:py-2">
                      Voucher No
                    </TableHead>
                    <TableHead className="font-bold text-gray-900 dark:text-gray-100 w-[80px] text-center print:text-black print:py-2">
                      Type
                    </TableHead>
                    <TableHead className="font-bold text-gray-900 dark:text-gray-100 w-[130px] text-right print:text-black print:py-2">
                      Debit
                    </TableHead>
                    <TableHead className="font-bold text-gray-900 dark:text-gray-100 w-[130px] text-right print:text-black print:py-2">
                      Credit
                    </TableHead>
                    <TableHead className="font-bold text-gray-900 dark:text-gray-100 w-[150px] text-right print:text-black print:py-2">
                      Balance
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingLedger || isFetching ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-12">
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : ledgerEntries.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-12 text-gray-500">
                        No transactions found for the selected period
                      </TableCell>
                    </TableRow>
                  ) : (
                    ledgerEntries.map((entry, index) => (
                      <TableRow 
                        key={entry.id}
                        className={`
                          ${index % 2 === 0 
                            ? 'bg-white dark:bg-gray-950' 
                            : 'bg-gray-50 dark:bg-gray-900'
                          }
                          hover:bg-teal-50 dark:hover:bg-teal-950 transition-colors border-b border-gray-200 print:border-gray-300
                        `}
                      >
                        <TableCell className="text-sm text-gray-700 dark:text-gray-300 print:text-black print:py-1 print:text-xs">
                          {formatDateDisplay(entry.entryDate)}
                        </TableCell>
                        <TableCell className="text-sm text-gray-900 dark:text-gray-100 print:text-black print:py-1 print:text-xs">
                          {entry.account?.name || 'N/A'}
                        </TableCell>
                        <TableCell className="text-sm text-gray-700 dark:text-gray-300 print:text-black print:py-1 print:text-xs">
                          <div>{entry.description || entry.voucher?.narration || '—'}</div>
                        </TableCell>
                        <TableCell className="font-mono text-sm font-semibold text-teal-700 dark:text-teal-400 print:text-black print:py-1 print:text-xs">
                          {entry.voucher?.voucherNumber || '—'}
                        </TableCell>
                        <TableCell className="text-center print:py-1">
                          <Badge 
                            variant="outline" 
                            className="text-xs font-semibold border-gray-300 print:border-black print:text-black"
                          >
                            {getVoucherTypeBadge(entry.voucher?.voucherType || '')}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-bold text-gray-900 dark:text-gray-100 print:text-black print:py-1 print:text-xs">
                          {parseFloat(entry.debitAmount) > 0 ? formatCurrency(entry.debitAmount) : '0.00'}
                        </TableCell>
                        <TableCell className="text-right font-bold text-gray-900 dark:text-gray-100 print:text-black print:py-1 print:text-xs">
                          {parseFloat(entry.creditAmount) > 0 ? formatCurrency(entry.creditAmount) : '0.00'}
                        </TableCell>
                        <TableCell className="text-right font-bold text-gray-900 dark:text-gray-100 print:text-black print:py-1 print:text-xs">
                          {formatCurrency(entry.runningBalance || '0')}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
                <tfoot className="bg-teal-50 border-t-2 border-teal-200 print:border-t-2 print:border-gray-800">
                  <tr>
                    <td colSpan={5} className="px-4 py-4 text-right font-bold text-gray-900 print:text-black print:py-2 print:text-sm">
                      Totals:
                    </td>
                    <td className="px-4 py-4 text-right font-bold text-gray-900 text-lg print:text-black print:py-2 print:text-sm border-b-2 border-gray-800">
                      {formatCurrency(totalDebit)}
                    </td>
                    <td className="px-4 py-4 text-right font-bold text-gray-900 text-lg print:text-black print:py-2 print:text-sm border-b-2 border-gray-800">
                      {formatCurrency(totalCredit)}
                    </td>
                    <td className="px-4 py-4 text-right font-bold text-gray-900 text-lg print:text-black print:py-2 print:text-sm"></td>
                  </tr>
                  <tr className="print:border-t-2 print:border-gray-800">
                    <td colSpan={7} className="px-4 py-4 text-right font-bold text-gray-900 print:text-black print:py-2 print:text-sm">
                      Closing Balance
                    </td>
                    <td className="px-4 py-4 text-right font-bold text-teal-900 text-xl print:text-black print:py-2 print:text-sm border-b-4 border-gray-900">
                      {formatCurrency(closingBalance)}
                    </td>
                  </tr>
                </tfoot>
              </Table>
            </div>

            {/* Pagination - Hide on print */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50 print:hidden">
                <div className="text-sm text-gray-600">
                  Page {page} of {totalPages} • Showing {ledgerEntries.length} of {pagination?.total || 0} entries
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1 || isLoadingLedger}
                    className="border-gray-300"
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages || isLoadingLedger}
                    className="border-gray-300"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="border-gray-200 shadow-sm">
          <CardContent className="py-16">
            <div className="text-center">
              <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Select an Account
              </h3>
              <p className="text-gray-600">
                Choose an account from the dropdown above to view its general ledger
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}