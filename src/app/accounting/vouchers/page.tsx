// src/app/accounting/vouchers/page.tsx
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  useGetVouchersQuery, 
  usePostVoucherMutation,
  useLockVoucherMutation,
  useReverseVoucherMutation,
  useCancelVoucherMutation,
} from "@/features/accountingApi";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Search, Filter, Eye, Check, RotateCcw, FileText, Download, MoreVertical, AlertCircle, Lock, XCircle } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { format } from "date-fns";

export default function VouchersPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [voucherTypeFilter, setVoucherTypeFilter] = useState<string>("all");
  const [selectedVoucher, setSelectedVoucher] = useState<any>(null);
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false);
  const [isReverseDialogOpen, setIsReverseDialogOpen] = useState(false);
  const [isLockDialogOpen, setIsLockDialogOpen] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [reverseReason, setReverseReason] = useState("");
  const [cancelReason, setCancelReason] = useState("");
  
  // Get current entity
  const currentUser = { role: "ADMIN" };
  const entityType = currentUser.role === "VENDOR" ? "VENDOR" : "ADMIN";
  const entityId = currentUser.role === "VENDOR" ? "vendor-id" : undefined;
  
  // Fetch vouchers
  const [page, setPage] = useState(1);
  const limit = 20;
  
  const { data: vouchersResponse, isLoading, refetch } = useGetVouchersQuery({
    entityType,
    entityId,
    page,
    limit,
    status: statusFilter !== "all" ? statusFilter : undefined,
    voucherType: voucherTypeFilter !== "all" ? voucherTypeFilter : undefined,
  });
  
  // Mutations
  const [postVoucher, { isLoading: isPosting }] = usePostVoucherMutation();
  const [lockVoucher, { isLoading: isLocking }] = useLockVoucherMutation();
  const [reverseVoucher, { isLoading: isReversing }] = useReverseVoucherMutation();
  const [cancelVoucher, { isLoading: isCanceling }] = useCancelVoucherMutation();
  
  const vouchers = vouchersResponse?.data || [];
  const totalPages = vouchersResponse?.pagination?.pages || 1;
  
  // Filter vouchers by search term
  const filteredVouchers = vouchers.filter(voucher => {
    const matchesSearch = searchTerm === "" || 
      voucher.voucherNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      voucher.narration.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });
  
  // Handle post voucher
  const handlePostVoucher = async (voucherId: string) => {
    try {
      await postVoucher(voucherId).unwrap();
      toast.success("Voucher posted successfully");
      refetch();
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to post voucher");
    }
  };
  
  // Handle lock voucher
  const handleLockVoucher = async () => {
    if (!selectedVoucher) return;
    
    try {
      await lockVoucher(selectedVoucher.id).unwrap();
      toast.success("Voucher locked successfully");
      setIsLockDialogOpen(false);
      setSelectedVoucher(null);
      refetch();
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to lock voucher");
    }
  };
  
  // Handle reverse voucher
  const handleReverseVoucher = async () => {
    if (!selectedVoucher || !reverseReason.trim()) {
      toast.error("Please provide a reason for reversal");
      return;
    }
    
    try {
      await reverseVoucher({
        id: selectedVoucher.id,
        data: { reason: reverseReason.trim() },
      }).unwrap();
      
      toast.success("Voucher reversed successfully");
      setReverseReason("");
      setIsReverseDialogOpen(false);
      setSelectedVoucher(null);
      refetch();
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to reverse voucher");
    }
  };
  
  // Handle cancel voucher
  const handleCancelVoucher = async () => {
    if (!selectedVoucher || !cancelReason.trim()) {
      toast.error("Please provide a reason for cancellation");
      return;
    }
    
    try {
      await cancelVoucher({
        id: selectedVoucher.id,
        data: { reason: cancelReason.trim() },
      }).unwrap();
      
      toast.success("Voucher cancelled successfully");
      setCancelReason("");
      setIsCancelDialogOpen(false);
      setSelectedVoucher(null);
      refetch();
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to cancel voucher");
    }
  };
  
  // Get voucher status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "DRAFT":
        return (
          <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700 dark:bg-amber-900 dark:text-amber-300">
            Draft
          </Badge>
        );
      case "POSTED":
        return (
          <Badge className="bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-900 dark:text-emerald-300">
            Posted
          </Badge>
        );
      case "REVERSED":
        return (
          <Badge className="bg-rose-100 text-rose-800 border border-rose-200 dark:bg-rose-900 dark:text-rose-300">
            Reversed
          </Badge>
        );
      case "CANCELLED":
        return (
          <Badge className="bg-gray-100 text-gray-800 border border-gray-300 dark:bg-gray-800 dark:text-gray-300">
            Cancelled
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };
  
  // Get voucher type badge
  const getVoucherTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      "RECEIPT": "bg-emerald-100 text-emerald-800 border-emerald-200",
      "PAYMENT": "bg-rose-100 text-rose-800 border-rose-200",
      "JOURNAL": "bg-teal-100 text-teal-800 border-teal-200",
      "SALES": "bg-purple-100 text-purple-800 border-purple-200",
      "PURCHASE": "bg-orange-100 text-orange-800 border-orange-200",
      "EXPENSE": "bg-red-100 text-red-800 border-red-200",
      "DELIVERY": "bg-blue-100 text-blue-800 border-blue-200",
      "COMMISSION": "bg-indigo-100 text-indigo-800 border-indigo-200",
      "SETTLEMENT": "bg-cyan-100 text-cyan-800 border-cyan-200",
      "REFUND": "bg-pink-100 text-pink-800 border-pink-200",
      "PAYOUT": "bg-violet-100 text-violet-800 border-violet-200",
      "OPENING": "bg-lime-100 text-lime-800 border-lime-200",
      "CLOSING": "bg-slate-100 text-slate-800 border-slate-200",
    };
    
    return (
      <Badge className={`${colors[type] || "bg-gray-100 text-gray-800 border-gray-200"} border font-medium`}>
        {type.replace(/_/g, ' ')}
      </Badge>
    );
  };
  
  // Format date display
  const formatDateDisplay = (dateString: string): string => {
    try {
      return format(new Date(dateString), "dd MMM, yyyy");
    } catch {
      return dateString;
    }
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
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            Vouchers
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Create and manage accounting vouchers
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="border-gray-300 hover:bg-gray-50">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          
          <Button 
            onClick={() => router.push("/accounting/vouchers/create")}
            className="bg-teal-600 hover:bg-teal-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Voucher
          </Button>
        </div>
      </div>
      
      {/* Filters */}
      <Card className="border-gray-200 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by voucher number or narration..."
                  className="pl-10 border-gray-300 focus-visible:ring-teal-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px] border-gray-300 focus:ring-teal-500">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="POSTED">Posted</SelectItem>
                <SelectItem value="REVERSED">Reversed</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={voucherTypeFilter} onValueChange={setVoucherTypeFilter}>
              <SelectTrigger className="w-[180px] border-gray-300 focus:ring-teal-500">
                <SelectValue placeholder="Voucher Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="RECEIPT">Receipt</SelectItem>
                <SelectItem value="PAYMENT">Payment</SelectItem>
                <SelectItem value="JOURNAL">Journal</SelectItem>
                <SelectItem value="SALES">Sales</SelectItem>
                <SelectItem value="PURCHASE">Purchase</SelectItem>
                <SelectItem value="EXPENSE">Expense</SelectItem>
                <SelectItem value="DELIVERY">Delivery</SelectItem>
                <SelectItem value="COMMISSION">Commission</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline" size="icon" className="border-gray-300 hover:bg-gray-50">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Vouchers Table */}
      <Card className="border-gray-200 shadow-sm">
        <CardHeader className="bg-teal-50 dark:bg-teal-950 border-b border-teal-100">
          <CardTitle className="text-teal-900 dark:text-teal-100">All Vouchers</CardTitle>
          <CardDescription className="text-teal-700 dark:text-teal-300">
            {filteredVouchers.length} {filteredVouchers.length === 1 ? 'voucher' : 'vouchers'} found
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-100 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800 border-b-2 border-gray-200">
                  <TableHead className="font-bold text-gray-700 dark:text-gray-300 w-[140px]">
                    Voucher #
                  </TableHead>
                  <TableHead className="font-bold text-gray-700 dark:text-gray-300 w-[140px]">
                    Date
                  </TableHead>
                  <TableHead className="font-bold text-gray-700 dark:text-gray-300 w-[140px]">
                    Type
                  </TableHead>
                  <TableHead className="font-bold text-gray-700 dark:text-gray-300 min-w-[300px]">
                    Narration
                  </TableHead>
                  <TableHead className="font-bold text-gray-700 dark:text-gray-300 text-right w-[140px]">
                    Amount
                  </TableHead>
                  <TableHead className="font-bold text-gray-700 dark:text-gray-300 w-[120px]">
                    Status
                  </TableHead>
                  <TableHead className="text-right font-bold text-gray-700 dark:text-gray-300 w-[80px]">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVouchers.map((voucher, index) => (
                  <TableRow 
                    key={voucher.id}
                    className={`
                      ${index % 2 === 0 
                        ? 'bg-white dark:bg-gray-950' 
                        : 'bg-gray-50 dark:bg-gray-900'
                      }
                      hover:bg-teal-50 dark:hover:bg-teal-950 transition-colors border-b border-gray-100
                    `}
                  >
                    <TableCell className="font-mono font-bold text-sm text-teal-700 dark:text-teal-400">
                      {voucher.voucherNumber}
                    </TableCell>
                    <TableCell className="text-sm text-gray-700 dark:text-gray-300">
                      {formatDateDisplay(voucher.voucherDate)}
                    </TableCell>
                    <TableCell>
                      {getVoucherTypeBadge(voucher.voucherType)}
                    </TableCell>
                    <TableCell className="text-sm text-gray-900 dark:text-gray-100">
                      <div className="max-w-md truncate">
                        {voucher.narration}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-bold text-gray-900 dark:text-gray-100">
                      ৳ {parseFloat(voucher.totalDebit).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(voucher.status)}
                    </TableCell>
                    <TableCell className="text-right">
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
                            onClick={() => {
                              setSelectedVoucher(voucher);
                              setViewDetailsOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4 mr-2 text-gray-600" />
                            View Details
                          </DropdownMenuItem>
                          
                          {voucher.status === "DRAFT" && !voucher.isLocked && (
                            <>
                              <DropdownMenuItem
                                className="cursor-pointer"
                                onClick={() => handlePostVoucher(voucher.id)}
                                disabled={isPosting}
                              >
                                <Check className="h-4 w-4 mr-2 text-emerald-600" />
                                Post Voucher
                              </DropdownMenuItem>
                              
                              <DropdownMenuItem
                                className="cursor-pointer"
                                onClick={() => {
                                  setSelectedVoucher(voucher);
                                  setIsCancelDialogOpen(true);
                                }}
                              >
                                <XCircle className="h-4 w-4 mr-2 text-amber-600" />
                                Cancel Voucher
                              </DropdownMenuItem>
                            </>
                          )}
                          
                          {voucher.status === "POSTED" && !voucher.isLocked && !voucher.isReversed && (
                            <>
                              <DropdownMenuItem
                                className="cursor-pointer"
                                onClick={() => {
                                  setSelectedVoucher(voucher);
                                  setIsLockDialogOpen(true);
                                }}
                              >
                                <Lock className="h-4 w-4 mr-2 text-blue-600" />
                                Lock Voucher
                              </DropdownMenuItem>
                              
                              <DropdownMenuSeparator />
                              
                              <DropdownMenuItem
                                className="text-rose-600 cursor-pointer focus:text-rose-600 focus:bg-rose-50"
                                onClick={() => {
                                  setSelectedVoucher(voucher);
                                  setIsReverseDialogOpen(true);
                                }}
                              >
                                <RotateCcw className="h-4 w-4 mr-2" />
                                Reverse Voucher
                              </DropdownMenuItem>
                            </>
                          )}
                          
                          <DropdownMenuSeparator />
                          
                          <DropdownMenuItem className="cursor-pointer">
                            <FileText className="h-4 w-4 mr-2 text-gray-600" />
                            Download PDF
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50">
              <div className="text-sm text-gray-600">
                Page {page} of {totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="border-gray-300"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="border-gray-300"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
          
          {filteredVouchers.length === 0 && (
            <div className="text-center py-16 bg-gray-50 dark:bg-gray-900">
              <div className="text-gray-500 dark:text-gray-400 text-lg mb-2">
                No vouchers found
              </div>
              <p className="text-sm text-gray-400 dark:text-gray-500">
                {searchTerm || statusFilter !== "all" || voucherTypeFilter !== "all"
                  ? "Try adjusting your filters"
                  : "Create your first voucher to get started"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* View Voucher Details Dialog */}
      <VoucherDetailsDialog
        open={viewDetailsOpen}
        onOpenChange={setViewDetailsOpen}
        voucher={selectedVoucher}
      />
      
      {/* Reverse Voucher Dialog */}
      <AlertDialog open={isReverseDialogOpen} onOpenChange={setIsReverseDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-rose-700">
              <AlertCircle className="h-5 w-5" />
              Reverse Voucher
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reverse voucher <strong className="text-gray-900">{selectedVoucher?.voucherNumber}</strong>?
              This action will create a reversing entry and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reverse-reason" className="font-semibold">
                Reason for Reversal <span className="text-rose-500">*</span>
              </Label>
              <Textarea
                id="reverse-reason"
                placeholder="Enter the reason for reversing this voucher..."
                value={reverseReason}
                onChange={(e) => setReverseReason(e.target.value)}
                rows={4}
                className="border-gray-300 focus-visible:ring-rose-500"
                required
              />
            </div>
          </div>
          
          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={() => {
                setReverseReason("");
                setIsReverseDialogOpen(false);
                setSelectedVoucher(null);
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReverseVoucher}
              className="bg-rose-600 hover:bg-rose-700"
              disabled={!reverseReason.trim() || isReversing}
            >
              {isReversing ? "Reversing..." : "Reverse Voucher"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Lock Voucher Dialog */}
      <AlertDialog open={isLockDialogOpen} onOpenChange={setIsLockDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-blue-700">
              <Lock className="h-5 w-5" />
              Lock Voucher
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to lock voucher <strong className="text-gray-900">{selectedVoucher?.voucherNumber}</strong>?
              Once locked, this voucher cannot be modified or reversed without administrative approval.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-1">Important:</p>
                <p>Locking a voucher will prevent any changes or reversals. This action is typically used for audited or finalized vouchers.</p>
              </div>
            </div>
          </div>
          
          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={() => {
                setIsLockDialogOpen(false);
                setSelectedVoucher(null);
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLockVoucher}
              className="bg-blue-600 hover:bg-blue-700"
              disabled={isLocking}
            >
              {isLocking ? "Locking..." : "Lock Voucher"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Cancel Voucher Dialog */}
      <AlertDialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-amber-700">
              <XCircle className="h-5 w-5" />
              Cancel Voucher
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel voucher <strong className="text-gray-900">{selectedVoucher?.voucherNumber}</strong>?
              This will mark the voucher as cancelled and it cannot be posted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="cancel-reason" className="font-semibold">
                Reason for Cancellation <span className="text-amber-500">*</span>
              </Label>
              <Textarea
                id="cancel-reason"
                placeholder="Enter the reason for cancelling this voucher..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={4}
                className="border-gray-300 focus-visible:ring-amber-500"
                required
              />
            </div>
          </div>
          
          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={() => {
                setCancelReason("");
                setIsCancelDialogOpen(false);
                setSelectedVoucher(null);
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelVoucher}
              className="bg-amber-600 hover:bg-amber-700"
              disabled={!cancelReason.trim() || isCanceling}
            >
              {isCanceling ? "Cancelling..." : "Cancel Voucher"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Voucher Details Dialog Component
function VoucherDetailsDialog({ open, onOpenChange, voucher }: any) {
  if (!voucher) return null;
  
  const formatDateDisplay = (dateString: string): string => {
    try {
      return format(new Date(dateString), "dd MMM, yyyy");
    } catch {
      return dateString;
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900">Voucher Details</DialogTitle>
          <DialogDescription className="text-gray-600">
            Complete information for voucher {voucher.voucherNumber}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Voucher Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-teal-50 rounded-lg border border-teal-200">
            <div className="space-y-1">
              <Label className="text-xs text-gray-600 font-semibold">Voucher Number</Label>
              <div className="font-mono font-bold text-teal-700">{voucher.voucherNumber}</div>
            </div>
            
            <div className="space-y-1">
              <Label className="text-xs text-gray-600 font-semibold">Date</Label>
              <div className="font-medium text-gray-900">
                {formatDateDisplay(voucher.voucherDate)}
              </div>
            </div>
            
            <div className="space-y-1">
              <Label className="text-xs text-gray-600 font-semibold">Type</Label>
              <div>
                <Badge className="bg-teal-100 text-teal-800 border border-teal-200">
                  {voucher.voucherType}
                </Badge>
              </div>
            </div>
            
            <div className="space-y-1">
              <Label className="text-xs text-gray-600 font-semibold">Status</Label>
              <div>
                {voucher.status === "DRAFT" && (
                  <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">
                    Draft
                  </Badge>
                )}
                {voucher.status === "POSTED" && (
                  <Badge className="bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Posted
                  </Badge>
                )}
                {voucher.status === "REVERSED" && (
                  <Badge className="bg-rose-100 text-rose-800 border border-rose-200">
                    Reversed
                  </Badge>
                )}
                {voucher.status === "CANCELLED" && (
                  <Badge className="bg-gray-100 text-gray-800 border border-gray-300">
                    Cancelled
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          {/* Narration */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-gray-700">Narration</Label>
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-900">{voucher.narration}</p>
            </div>
          </div>
          
          {/* Voucher Entries */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold text-gray-700">Ledger Entries</Label>
            <div className="overflow-hidden rounded-lg border-2 border-gray-200">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-100 hover:bg-gray-100 border-b-2 border-gray-200">
                    <TableHead className="font-bold text-gray-700">Code</TableHead>
                    <TableHead className="font-bold text-gray-700">Account</TableHead>
                    <TableHead className="text-right font-bold text-gray-700">Debit (৳)</TableHead>
                    <TableHead className="text-right font-bold text-gray-700">Credit (৳)</TableHead>
                    <TableHead className="font-bold text-gray-700">Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(voucher.ledgerEntries || []).map((entry: any, index: number) => (
                    <TableRow 
                      key={entry.id}
                      className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                    >
                      <TableCell className="font-mono text-sm font-semibold text-teal-600">
                        {entry.account?.code || "N/A"}
                      </TableCell>
                      <TableCell className="font-medium text-gray-900">
                        {entry.account?.name || "N/A"}
                      </TableCell>
                      <TableCell className="text-right font-bold text-emerald-700">
                        {parseFloat(entry.debitAmount) > 0 
                          ? parseFloat(entry.debitAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right font-bold text-rose-700">
                        {parseFloat(entry.creditAmount) > 0 
                          ? parseFloat(entry.creditAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                          : "—"}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {entry.description || "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <tfoot className="bg-teal-50 border-t-2 border-teal-200">
                  <tr>
                    <td colSpan={2} className="px-4 py-4 text-right font-bold text-gray-900">
                      Totals:
                    </td>
                    <td className="px-4 py-4 text-right font-bold text-emerald-800 text-lg">
                      ৳ {parseFloat(voucher.totalDebit).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-4 text-right font-bold text-rose-800 text-lg">
                      ৳ {parseFloat(voucher.totalCredit).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </Table>
            </div>
          </div>
          
          {/* Additional Info */}
          {voucher.internalNotes && (
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">Internal Notes</Label>
              <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                <p className="text-sm text-gray-700">{voucher.internalNotes}</p>
              </div>
            </div>
          )}
        </div>
        
        <DialogFooter className="border-t pt-4">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="border-gray-300"
          >
            Close
          </Button>
          <Button className="bg-teal-600 hover:bg-teal-700">
            <FileText className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}