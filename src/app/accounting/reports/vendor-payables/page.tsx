// src/app/accounting/reports/vendor-payables/page.tsx
"use client";

import React, { useState } from "react";
import { 
  useGetVendorPayableReportQuery,
  useGetVendorPayablesDetailedQuery,
} from "@/features/accountingApi";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Search, 
  Download, 
  Printer, 
  Eye, 
  TrendingUp, 
  TrendingDown, 
  DollarSign,
  Calendar,
  Package,
  AlertCircle,
  CheckCircle,
  MoreVertical
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { format } from "date-fns";

export default function VendorPayablesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedVendor, setSelectedVendor] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Get current user role
  const currentUser = { role: "ADMIN" };
  const isAdmin = currentUser.role === "ADMIN";

  // Fetch vendor payables
  const { data: payablesResponse, isLoading } = useGetVendorPayableReportQuery(
    {},
    { skip: !isAdmin }
  );

  // Fetch detailed vendor payables with recent vouchers
  const { data: detailedResponse, isLoading: isLoadingDetailed } = useGetVendorPayablesDetailedQuery(
    undefined,
    { skip: !isAdmin }
  );

  const vendorPayables = payablesResponse?.data || [];
  const detailedPayables = detailedResponse?.data || [];

  // Filter vendors by search
  const filteredVendors = vendorPayables.filter(vendor => {
    const searchLower = searchTerm.toLowerCase();
    return (
      vendor.vendorId.toLowerCase().includes(searchLower) ||
      vendor.balance.toString().includes(searchLower)
    );
  });

  // Calculate summary statistics
  const calculateSummary = () => {
    let totalPayable = 0;
    let totalPaid = 0;
    let totalBalance = 0;
    let vendorsWithBalance = 0;

    vendorPayables.forEach(vendor => {
      totalPayable += parseFloat(vendor.totalPayable || "0");
      totalPaid += parseFloat(vendor.totalPaid || "0");
      totalBalance += parseFloat(vendor.balance || "0");
      if (parseFloat(vendor.balance) > 0) {
        vendorsWithBalance++;
      }
    });

    return {
      totalPayable,
      totalPaid,
      totalBalance,
      totalVendors: vendorPayables.length,
      vendorsWithBalance,
    };
  };

  const summary = calculateSummary();

  // Format currency
  const formatCurrency = (amount: number | string): string => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Format date display
  const formatDateDisplay = (dateString: string | null | undefined): string => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), "dd MMM, yyyy");
    } catch {
      return 'N/A';
    }
  };

  // Get balance status badge
  const getBalanceStatus = (balance: string) => {
    const bal = parseFloat(balance);
    if (bal === 0) {
      return (
        <Badge className="bg-emerald-100 text-emerald-800 border border-emerald-200">
          <CheckCircle className="h-3 w-3 mr-1" />
          Settled
        </Badge>
      );
    } else if (bal < 50000) {
      return (
        <Badge className="bg-amber-100 text-amber-800 border border-amber-200">
          <AlertCircle className="h-3 w-3 mr-1" />
          Low Balance
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-rose-100 text-rose-800 border border-rose-200">
          <AlertCircle className="h-3 w-3 mr-1" />
          Outstanding
        </Badge>
      );
    }
  };

  // Handle view details
  const handleViewDetails = (vendor: any) => {
    // Find detailed vendor with vouchers
    const detailed = detailedPayables.find(v => v.vendorId === vendor.vendorId);
    setSelectedVendor(detailed || vendor);
    setIsDetailsOpen(true);
  };

  // Handle print
  const handlePrint = () => {
    window.print();
  };

  // Handle export
  const handleExport = () => {
    toast.info("Export functionality coming soon");
  };

  if (!isAdmin) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-rose-200">
          <CardContent className="py-12">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-rose-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Access Denied
              </h3>
              <p className="text-gray-600">
                You don't have permission to view vendor payables.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading || isLoadingDetailed) {
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
            Vendor Payables
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Track outstanding vendor balances and payment history
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 print:hidden">
        <Card className="border-teal-200 bg-teal-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-teal-700">Total Vendors</p>
                <p className="text-2xl font-bold text-teal-900 mt-1">
                  {summary.totalVendors}
                </p>
              </div>
              <div className="h-12 w-12 bg-teal-100 rounded-full flex items-center justify-center">
                <Package className="h-6 w-6 text-teal-600" />
              </div>
            </div>
            <p className="text-xs text-teal-600 mt-2">
              {summary.vendorsWithBalance} with outstanding balance
            </p>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">Total Payable</p>
                <p className="text-2xl font-bold text-blue-900 mt-1">
                  ৳ {formatCurrency(summary.totalPayable)}
                </p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <p className="text-xs text-blue-600 mt-2">
              Gross payable amount
            </p>
          </CardContent>
        </Card>

        <Card className="border-emerald-200 bg-emerald-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-emerald-700">Total Paid</p>
                <p className="text-2xl font-bold text-emerald-900 mt-1">
                  ৳ {formatCurrency(summary.totalPaid)}
                </p>
              </div>
              <div className="h-12 w-12 bg-emerald-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
            <p className="text-xs text-emerald-600 mt-2">
              {((summary.totalPaid / summary.totalPayable) * 100).toFixed(1)}% paid
            </p>
          </CardContent>
        </Card>

        <Card className="border-rose-200 bg-rose-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-rose-700">Outstanding</p>
                <p className="text-2xl font-bold text-rose-900 mt-1">
                  ৳ {formatCurrency(summary.totalBalance)}
                </p>
              </div>
              <div className="h-12 w-12 bg-rose-100 rounded-full flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-rose-600" />
              </div>
            </div>
            <p className="text-xs text-rose-600 mt-2">
              Pending settlement
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search Filter - Hide on print */}
      <Card className="border-gray-200 shadow-sm print:hidden">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by vendor ID or balance..."
              className="pl-10 border-gray-300 focus-visible:ring-teal-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Vendor Payables Table */}
      <Card className="border-gray-200 shadow-sm print:shadow-none print:border-0">
        <CardContent className="p-0">
          {/* Print Header */}
          <div className="hidden print:block p-8 border-b-2 border-gray-800">
            <div className="text-center mb-4">
              <h1 className="text-2xl font-bold text-gray-900">
                Anwer Khan Modern Securities Ltd.
              </h1>
              <p className="text-sm text-gray-600 font-semibold mt-1">
                Think Big, Grow Smart.
              </p>
            </div>
            <div className="text-center">
              <h2 className="text-xl font-bold text-gray-900">Vendor Payables Report</h2>
              <p className="text-sm text-gray-600 mt-1">
                As of {formatDateDisplay(new Date().toISOString())}
              </p>
            </div>
          </div>

          {/* Screen Header - Hide on print */}
          <div className="bg-teal-50 dark:bg-teal-950 border-b border-teal-100 px-6 py-4 print:hidden">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-teal-900 dark:text-teal-100">
                  All Vendors
                </h3>
                <p className="text-sm text-teal-700 dark:text-teal-300">
                  {filteredVendors.length} {filteredVendors.length === 1 ? 'vendor' : 'vendors'} found
                </p>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-100 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800 border-b-2 border-gray-200">
                  <TableHead className="font-bold text-gray-700 dark:text-gray-300 w-[150px]">
                    Vendor ID
                  </TableHead>
                  <TableHead className="font-bold text-gray-700 dark:text-gray-300 text-right">
                    Total Sales
                  </TableHead>
                  <TableHead className="font-bold text-gray-700 dark:text-gray-300 text-right">
                    Commission
                  </TableHead>
                  <TableHead className="font-bold text-gray-700 dark:text-gray-300 text-right">
                    Total Payable
                  </TableHead>
                  <TableHead className="font-bold text-gray-700 dark:text-gray-300 text-right">
                    Total Paid
                  </TableHead>
                  <TableHead className="font-bold text-gray-700 dark:text-gray-300 text-right">
                    Balance
                  </TableHead>
                  <TableHead className="font-bold text-gray-700 dark:text-gray-300 text-center">
                    Orders
                  </TableHead>
                  <TableHead className="font-bold text-gray-700 dark:text-gray-300 w-[120px]">
                    Last Sale
                  </TableHead>
                  <TableHead className="font-bold text-gray-700 dark:text-gray-300 w-[120px]">
                    Status
                  </TableHead>
                  <TableHead className="text-right font-bold text-gray-700 dark:text-gray-300 w-[80px] print:hidden">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVendors.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-12 text-gray-500">
                      No vendors found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredVendors.map((vendor, index) => (
                    <TableRow 
                      key={vendor.id}
                      className={`
                        ${index % 2 === 0 
                          ? 'bg-white dark:bg-gray-950' 
                          : 'bg-gray-50 dark:bg-gray-900'
                        }
                        hover:bg-teal-50 dark:hover:bg-teal-950 transition-colors border-b border-gray-100
                      `}
                    >
                      <TableCell className="font-mono font-bold text-sm text-teal-700 dark:text-teal-400">
                        {vendor.vendorId}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-gray-900 dark:text-gray-100">
                        ৳ {formatCurrency(vendor.totalSales)}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-gray-900 dark:text-gray-100">
                        ৳ {formatCurrency(vendor.totalCommission)}
                      </TableCell>
                      <TableCell className="text-right font-bold text-blue-700 dark:text-blue-400">
                        ৳ {formatCurrency(vendor.totalPayable)}
                      </TableCell>
                      <TableCell className="text-right font-bold text-emerald-700 dark:text-emerald-400">
                        ৳ {formatCurrency(vendor.totalPaid)}
                      </TableCell>
                      <TableCell className="text-right font-bold text-rose-700 dark:text-rose-400">
                        ৳ {formatCurrency(vendor.balance)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="font-semibold">
                          {vendor.totalOrders}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                        {formatDateDisplay(vendor.lastSaleAt)}
                      </TableCell>
                      <TableCell>
                        {getBalanceStatus(vendor.balance)}
                      </TableCell>
                      <TableCell className="text-right print:hidden">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="h-8 w-8 hover:bg-teal-100 dark:hover:bg-teal-900"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel className="text-gray-700">Actions</DropdownMenuLabel>
                            <DropdownMenuItem
                              className="cursor-pointer"
                              onClick={() => handleViewDetails(vendor)}
                            >
                              <Eye className="h-4 w-4 mr-2 text-gray-600" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="cursor-pointer">
                              <Calendar className="h-4 w-4 mr-2 text-teal-600" />
                              Payment History
                            </DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer">
                              <DollarSign className="h-4 w-4 mr-2 text-emerald-600" />
                              Process Payment
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
              {filteredVendors.length > 0 && (
                <tfoot className="bg-teal-50 border-t-2 border-teal-200">
                  <tr>
                    <td className="px-4 py-4 font-bold text-gray-900">
                      Total ({filteredVendors.length} vendors)
                    </td>
                    <td className="px-4 py-4 text-right font-bold text-gray-900">
                      ৳ {formatCurrency(summary.totalPayable)}
                    </td>
                    <td className="px-4 py-4 text-right font-bold text-gray-900">
                      —
                    </td>
                    <td className="px-4 py-4 text-right font-bold text-blue-800">
                      ৳ {formatCurrency(summary.totalPayable)}
                    </td>
                    <td className="px-4 py-4 text-right font-bold text-emerald-800">
                      ৳ {formatCurrency(summary.totalPaid)}
                    </td>
                    <td className="px-4 py-4 text-right font-bold text-rose-800 text-lg">
                      ৳ {formatCurrency(summary.totalBalance)}
                    </td>
                    <td colSpan={4}></td>
                  </tr>
                </tfoot>
              )}
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Vendor Details Dialog */}
      <VendorDetailsDialog
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        vendor={selectedVendor}
        formatCurrency={formatCurrency}
        formatDateDisplay={formatDateDisplay}
      />
    </div>
  );
}

// Vendor Details Dialog Component
function VendorDetailsDialog({ open, onOpenChange, vendor, formatCurrency, formatDateDisplay }: any) {
  if (!vendor) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900">
            Vendor Details
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            Complete payable information for vendor {vendor.vendorId}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-xs text-blue-700 font-semibold">Total Sales</p>
              <p className="text-xl font-bold text-blue-900 mt-1">
                ৳ {formatCurrency(vendor.totalSales)}
              </p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <p className="text-xs text-purple-700 font-semibold">Commission</p>
              <p className="text-xl font-bold text-purple-900 mt-1">
                ৳ {formatCurrency(vendor.totalCommission)}
              </p>
            </div>
            <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
              <p className="text-xs text-emerald-700 font-semibold">Paid</p>
              <p className="text-xl font-bold text-emerald-900 mt-1">
                ৳ {formatCurrency(vendor.totalPaid)}
              </p>
            </div>
            <div className="p-4 bg-rose-50 rounded-lg border border-rose-200">
              <p className="text-xs text-rose-700 font-semibold">Balance Due</p>
              <p className="text-xl font-bold text-rose-900 mt-1">
                ৳ {formatCurrency(vendor.balance)}
              </p>
            </div>
          </div>

          {/* Vendor Info */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div>
              <Label className="text-xs text-gray-600 font-semibold">Vendor ID</Label>
              <p className="font-mono font-bold text-teal-700">{vendor.vendorId}</p>
            </div>
            <div>
              <Label className="text-xs text-gray-600 font-semibold">Total Orders</Label>
              <p className="font-semibold text-gray-900">{vendor.totalOrders}</p>
            </div>
            <div>
              <Label className="text-xs text-gray-600 font-semibold">Last Sale</Label>
              <p className="font-semibold text-gray-900">{formatDateDisplay(vendor.lastSaleAt)}</p>
            </div>
            <div>
              <Label className="text-xs text-gray-600 font-semibold">Last Payment</Label>
              <p className="font-semibold text-gray-900">{formatDateDisplay(vendor.lastPaymentAt)}</p>
            </div>
          </div>

          {/* Recent Vouchers */}
          {vendor.recentVouchers && vendor.recentVouchers.length > 0 && (
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-gray-700">Recent Transactions</Label>
              <div className="overflow-hidden rounded-lg border-2 border-gray-200">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-100">
                      <TableHead className="font-bold text-gray-700">Voucher #</TableHead>
                      <TableHead className="font-bold text-gray-700">Date</TableHead>
                      <TableHead className="font-bold text-gray-700">Type</TableHead>
                      <TableHead className="font-bold text-gray-700">Narration</TableHead>
                      <TableHead className="font-bold text-gray-700 text-right">Amount</TableHead>
                      <TableHead className="font-bold text-gray-700">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vendor.recentVouchers.map((voucher: any, index: number) => (
                      <TableRow key={voucher.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <TableCell className="font-mono text-sm font-semibold text-teal-600">
                          {voucher.voucherNumber}
                        </TableCell>
                        <TableCell className="text-sm">
                          {formatDateDisplay(voucher.voucherDate)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {voucher.voucherType}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm max-w-xs truncate">
                          {voucher.narration}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          ৳ {formatCurrency(voucher.totalDebit)}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={voucher.status === 'POSTED' ? 'default' : 'outline'}
                            className={
                              voucher.status === 'POSTED' 
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : ''
                            }
                          >
                            {voucher.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}