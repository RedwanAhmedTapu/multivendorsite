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
import {
  Plus,
  Search,
  Filter,
  Eye,
  Check,
  RotateCcw,
  FileText,
  Download,
  MoreVertical,
  AlertCircle,
  Lock,
  XCircle,
  Receipt,
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { format } from "date-fns";

// ============================================
// STYLE MAPS — dark cyan/blue glass theme
// ============================================

const STATUS_STYLES: Record<string, string> = {
  DRAFT: "border border-amber-400/30 bg-amber-400/10 text-amber-300",
  POSTED: "border border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
  REVERSED: "border border-rose-400/30 bg-rose-400/10 text-rose-300",
  CANCELLED: "border border-white/15 bg-white/5 text-white/45",
};

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  POSTED: "Posted",
  REVERSED: "Reversed",
  CANCELLED: "Cancelled",
};

const VOUCHER_TYPE_STYLES: Record<string, string> = {
  RECEIPT: "border-emerald-400/25 bg-emerald-400/10 text-emerald-300",
  PAYMENT: "border-rose-400/25 bg-rose-400/10 text-rose-300",
  JOURNAL: "border-teal-400/25 bg-teal-400/10 text-teal-300",
  SALES: "border-purple-400/25 bg-purple-400/10 text-purple-300",
  PURCHASE: "border-orange-400/25 bg-orange-400/10 text-orange-300",
  EXPENSE: "border-red-400/25 bg-red-400/10 text-red-300",
  DELIVERY: "border-blue-400/25 bg-blue-400/10 text-blue-300",
  COMMISSION: "border-indigo-400/25 bg-indigo-400/10 text-indigo-300",
  SETTLEMENT: "border-cyan-400/25 bg-cyan-400/10 text-cyan-300",
  REFUND: "border-pink-400/25 bg-pink-400/10 text-pink-300",
  PAYOUT: "border-violet-400/25 bg-violet-400/10 text-violet-300",
  OPENING: "border-lime-400/25 bg-lime-400/10 text-lime-300",
  CLOSING: "border-white/20 bg-white/5 text-white/50",
};

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

const glassCard = "rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md";
const darkField =
  "border-white/10 bg-white/5 text-white placeholder:text-white/30 focus-visible:ring-cyan-400/50 focus-visible:border-cyan-400/40";
const dialogSurface = "bg-slate-900 border border-white/10 text-white";

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
  const [limit, setLimit] = useState(10);

  const handleLimitChange = (value: string) => {
    setLimit(Number(value));
    setPage(1);
  };

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
  const totalItems = vouchersResponse?.pagination?.total || 0;
  const rangeStart = totalItems === 0 ? 0 : (page - 1) * limit + 1;
  const rangeEnd = totalItems === 0 ? 0 : Math.min(page * limit, totalItems);

  // Filter vouchers by search term
  const filteredVouchers = vouchers.filter((voucher) => {
    const matchesSearch =
      searchTerm === "" ||
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

  const getStatusBadge = (status: string) => (
    <Badge className={`${STATUS_STYLES[status] || "border-white/15 bg-white/5 text-white/50"} font-medium`}>
      {STATUS_LABELS[status] || status}
    </Badge>
  );

  const getVoucherTypeBadge = (type: string) => (
    <Badge className={`${VOUCHER_TYPE_STYLES[type] || "border-white/15 bg-white/5 text-white/50"} border font-medium`}>
      {type.replace(/_/g, " ")}
    </Badge>
  );

  // Format date display
  const formatDateDisplay = (dateString: string): string => {
    try {
      return format(new Date(dateString), "dd MMM, yyyy");
    } catch {
      return dateString;
    }
  };

  const renderVoucherActions = (voucher: any) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-white/50 hover:bg-white/10 hover:text-white">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 bg-slate-900 border border-white/10 text-white/80">
        <DropdownMenuLabel className="text-white/40">Actions</DropdownMenuLabel>
        <DropdownMenuItem
          className="cursor-pointer focus:bg-white/10 focus:text-white"
          onClick={() => {
            setSelectedVoucher(voucher);
            setViewDetailsOpen(true);
          }}
        >
          <Eye className="h-4 w-4 mr-2 text-cyan-300" />
          View Details
        </DropdownMenuItem>

        {voucher.status === "DRAFT" && !voucher.isLocked && (
          <>
            <DropdownMenuItem
              className="cursor-pointer focus:bg-white/10 focus:text-white"
              onClick={() => handlePostVoucher(voucher.id)}
              disabled={isPosting}
            >
              <Check className="h-4 w-4 mr-2 text-emerald-400" />
              Post Voucher
            </DropdownMenuItem>

            <DropdownMenuItem
              className="cursor-pointer focus:bg-white/10 focus:text-white"
              onClick={() => {
                setSelectedVoucher(voucher);
                setIsCancelDialogOpen(true);
              }}
            >
              <XCircle className="h-4 w-4 mr-2 text-amber-400" />
              Cancel Voucher
            </DropdownMenuItem>
          </>
        )}

        {voucher.status === "POSTED" && !voucher.isLocked && !voucher.isReversed && (
          <>
            <DropdownMenuItem
              className="cursor-pointer focus:bg-white/10 focus:text-white"
              onClick={() => {
                setSelectedVoucher(voucher);
                setIsLockDialogOpen(true);
              }}
            >
              <Lock className="h-4 w-4 mr-2 text-blue-400" />
              Lock Voucher
            </DropdownMenuItem>

            <DropdownMenuSeparator className="bg-white/10" />

            <DropdownMenuItem
              className="text-rose-400 cursor-pointer focus:text-rose-300 focus:bg-rose-400/10"
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

        <DropdownMenuSeparator className="bg-white/10" />

        <DropdownMenuItem className="cursor-pointer focus:bg-white/10 focus:text-white">
          <FileText className="h-4 w-4 mr-2 text-white/50" />
          Download PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  if (isLoading) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-slate-950">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-cyan-950" />
        <div className="relative flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950">
      {/* Background — matches sidebar & dashboard */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-cyan-950" />
      <div className="absolute -top-24 -left-16 w-72 h-72 rounded-full bg-cyan-500/20 blur-[100px]" />
      <div className="absolute top-1/3 -right-24 w-80 h-80 rounded-full bg-blue-600/15 blur-[110px]" />
      <div className="absolute bottom-0 left-1/3 w-64 h-64 rounded-full bg-cyan-400/10 blur-[90px]" />

      <div className="relative max-w-screen-xl mx-auto p-4 sm:p-6 space-y-5 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/30 shrink-0">
              <Receipt size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">Vouchers</h1>
              <p className="text-xs sm:text-sm text-white/35 mt-0.5">Create and manage accounting vouchers</p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 sm:flex-none border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>

            <Button
              onClick={() => router.push("/accounting/vouchers/create")}
              className="flex-1 sm:flex-none bg-gradient-to-r from-cyan-400 to-blue-500 hover:opacity-90 text-white border-0 shadow-lg shadow-cyan-500/30"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Voucher
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className={glassCard}>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                  <Input
                    placeholder="Search by voucher number or narration..."
                    className={`pl-10 ${darkField}`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className={`w-full md:w-[170px] ${darkField}`}>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-white/10 text-white">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="POSTED">Posted</SelectItem>
                  <SelectItem value="REVERSED">Reversed</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>

              <Select value={voucherTypeFilter} onValueChange={setVoucherTypeFilter}>
                <SelectTrigger className={`w-full md:w-[170px] ${darkField}`}>
                  <SelectValue placeholder="Voucher Type" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-white/10 text-white">
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

              <Button
                variant="outline"
                size="icon"
                className="border-white/10 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white shrink-0"
              >
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Vouchers — desktop table */}
        <Card className={`${glassCard} hidden md:block`}>
          <CardHeader className="border-b border-white/10">
            <CardTitle className="text-white">All Vouchers</CardTitle>
            <CardDescription className="text-white/35">
              {filteredVouchers.length} {filteredVouchers.length === 1 ? "voucher" : "vouchers"} found
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-white/10 hover:bg-transparent">
                    <TableHead className="font-bold text-white/40 w-[140px]">Voucher #</TableHead>
                    <TableHead className="font-bold text-white/40 w-[130px]">Date</TableHead>
                    <TableHead className="font-bold text-white/40 w-[140px]">Type</TableHead>
                    <TableHead className="font-bold text-white/40 min-w-[260px]">Narration</TableHead>
                    <TableHead className="font-bold text-white/40 text-right w-[140px]">Amount</TableHead>
                    <TableHead className="font-bold text-white/40 w-[120px]">Status</TableHead>
                    <TableHead className="text-right font-bold text-white/40 w-[70px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVouchers.map((voucher, index) => (
                    <TableRow
                      key={voucher.id}
                      className={`${index % 2 === 0 ? "bg-transparent" : "bg-white/[0.02]"} border-b border-white/5 hover:bg-cyan-400/5 transition-colors`}
                    >
                      <TableCell className="font-mono font-bold text-sm text-cyan-300">
                        {voucher.voucherNumber}
                      </TableCell>
                      <TableCell className="text-sm text-white/60">{formatDateDisplay(voucher.voucherDate)}</TableCell>
                      <TableCell>{getVoucherTypeBadge(voucher.voucherType)}</TableCell>
                      <TableCell className="text-sm text-white/80">
                        <div className="max-w-md truncate">{voucher.narration}</div>
                      </TableCell>
                      <TableCell className="text-right font-bold text-white">
                        ৳ {parseFloat(voucher.totalDebit).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell>{getStatusBadge(voucher.status)}</TableCell>
                      <TableCell className="text-right">{renderVoucherActions(voucher)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {filteredVouchers.length > 0 && (
              <div className="p-4 border-t border-white/10">
                <PaginationControls
                  page={page}
                  totalPages={totalPages}
                  limit={limit}
                  onLimitChange={handleLimitChange}
                  onPrev={() => setPage((p) => Math.max(1, p - 1))}
                  onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
                  rangeStart={rangeStart}
                  rangeEnd={rangeEnd}
                  totalItems={totalItems}
                />
              </div>
            )}

            {filteredVouchers.length === 0 && <EmptyState searchTerm={searchTerm} statusFilter={statusFilter} voucherTypeFilter={voucherTypeFilter} />}
          </CardContent>
        </Card>

        {/* Vouchers — mobile card list */}
        <div className="md:hidden space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-sm font-bold text-white/70">All Vouchers</span>
            <span className="text-xs text-white/35">
              {filteredVouchers.length} {filteredVouchers.length === 1 ? "voucher" : "vouchers"}
            </span>
          </div>

          {filteredVouchers.length === 0 ? (
            <Card className={glassCard}>
              <CardContent className="p-0">
                <EmptyState searchTerm={searchTerm} statusFilter={statusFilter} voucherTypeFilter={voucherTypeFilter} />
              </CardContent>
            </Card>
          ) : (
            filteredVouchers.map((voucher) => (
              <Card key={voucher.id} className={glassCard}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3 mb-2.5">
                    <div className="min-w-0">
                      <p className="font-mono font-bold text-sm text-cyan-300 truncate">{voucher.voucherNumber}</p>
                      <p className="text-xs text-white/35 mt-0.5">{formatDateDisplay(voucher.voucherDate)}</p>
                    </div>
                    {renderVoucherActions(voucher)}
                  </div>

                  <p className="text-sm text-white/80 line-clamp-2 mb-3">{voucher.narration}</p>

                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {getVoucherTypeBadge(voucher.voucherType)}
                      {getStatusBadge(voucher.status)}
                    </div>
                    <span className="text-sm font-bold text-white shrink-0">
                      ৳ {parseFloat(voucher.totalDebit).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))
          )}

          {filteredVouchers.length > 0 && (
            <Card className={glassCard}>
              <CardContent className="p-4">
                <PaginationControls
                  page={page}
                  totalPages={totalPages}
                  limit={limit}
                  onLimitChange={handleLimitChange}
                  onPrev={() => setPage((p) => Math.max(1, p - 1))}
                  onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
                  rangeStart={rangeStart}
                  rangeEnd={rangeEnd}
                  totalItems={totalItems}
                />
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* View Voucher Details Dialog */}
      <VoucherDetailsDialog open={viewDetailsOpen} onOpenChange={setViewDetailsOpen} voucher={selectedVoucher} />

      {/* Reverse Voucher Dialog */}
      <AlertDialog open={isReverseDialogOpen} onOpenChange={setIsReverseDialogOpen}>
        <AlertDialogContent className={dialogSurface}>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-rose-400">
              <AlertCircle className="h-5 w-5" />
              Reverse Voucher
            </AlertDialogTitle>
            <AlertDialogDescription className="text-white/50">
              Are you sure you want to reverse voucher{" "}
              <strong className="text-white">{selectedVoucher?.voucherNumber}</strong>? This action will create a
              reversing entry and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reverse-reason" className="font-semibold text-white/70">
                Reason for Reversal <span className="text-rose-400">*</span>
              </Label>
              <Textarea
                id="reverse-reason"
                placeholder="Enter the reason for reversing this voucher..."
                value={reverseReason}
                onChange={(e) => setReverseReason(e.target.value)}
                rows={4}
                className={darkField}
                required
              />
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel
              className="border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
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
              className="bg-rose-500 hover:bg-rose-600 text-white"
              disabled={!reverseReason.trim() || isReversing}
            >
              {isReversing ? "Reversing..." : "Reverse Voucher"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Lock Voucher Dialog */}
      <AlertDialog open={isLockDialogOpen} onOpenChange={setIsLockDialogOpen}>
        <AlertDialogContent className={dialogSurface}>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-blue-300">
              <Lock className="h-5 w-5" />
              Lock Voucher
            </AlertDialogTitle>
            <AlertDialogDescription className="text-white/50">
              Are you sure you want to lock voucher{" "}
              <strong className="text-white">{selectedVoucher?.voucherNumber}</strong>? Once locked, this voucher
              cannot be modified or reversed without administrative approval.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="rounded-xl bg-blue-400/10 border border-blue-400/20 p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-300 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-100/80">
                <p className="font-semibold mb-1 text-blue-200">Important:</p>
                <p>Locking a voucher will prevent any changes or reversals. This action is typically used for audited or finalized vouchers.</p>
              </div>
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel
              className="border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
              onClick={() => {
                setIsLockDialogOpen(false);
                setSelectedVoucher(null);
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLockVoucher}
              className="bg-gradient-to-r from-cyan-400 to-blue-500 hover:opacity-90 text-white"
              disabled={isLocking}
            >
              {isLocking ? "Locking..." : "Lock Voucher"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel Voucher Dialog */}
      <AlertDialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <AlertDialogContent className={dialogSurface}>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-amber-300">
              <XCircle className="h-5 w-5" />
              Cancel Voucher
            </AlertDialogTitle>
            <AlertDialogDescription className="text-white/50">
              Are you sure you want to cancel voucher{" "}
              <strong className="text-white">{selectedVoucher?.voucherNumber}</strong>? This will mark the voucher as
              cancelled and it cannot be posted.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="cancel-reason" className="font-semibold text-white/70">
                Reason for Cancellation <span className="text-amber-400">*</span>
              </Label>
              <Textarea
                id="cancel-reason"
                placeholder="Enter the reason for cancelling this voucher..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={4}
                className={darkField}
                required
              />
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel
              className="border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
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
              className="bg-amber-500 hover:bg-amber-600 text-white"
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

// ============================================
// Pagination controls — rows-per-page + prev/next
// ============================================

function PaginationControls({
  page,
  totalPages,
  limit,
  onLimitChange,
  onPrev,
  onNext,
  rangeStart,
  rangeEnd,
  totalItems,
}: {
  page: number;
  totalPages: number;
  limit: number;
  onLimitChange: (value: string) => void;
  onPrev: () => void;
  onNext: () => void;
  rangeStart: number;
  rangeEnd: number;
  totalItems: number;
}) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
      <div className="flex items-center gap-2 text-xs text-white/40">
        <span className="whitespace-nowrap">Rows per page</span>
        <Select value={String(limit)} onValueChange={onLimitChange}>
          <SelectTrigger className="h-8 w-[68px] border-white/10 bg-white/5 text-white text-xs focus-visible:ring-cyan-400/50 focus-visible:border-cyan-400/40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-white/10 text-white">
            {PAGE_SIZE_OPTIONS.map((size) => (
              <SelectItem key={size} value={String(size)}>
                {size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="whitespace-nowrap">
          {totalItems === 0 ? "0 results" : `${rangeStart}–${rangeEnd} of ${totalItems}`}
        </span>
      </div>

      <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
        <span className="text-xs text-white/40 whitespace-nowrap">
          Page {page} of {totalPages}
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onPrev}
            disabled={page === 1}
            className="border-white/10 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white disabled:opacity-30"
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onNext}
            disabled={page === totalPages}
            className="border-white/10 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white disabled:opacity-30"
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// Empty state
// ============================================

function EmptyState({
  searchTerm,
  statusFilter,
  voucherTypeFilter,
}: {
  searchTerm: string;
  statusFilter: string;
  voucherTypeFilter: string;
}) {
  return (
    <div className="text-center py-16 px-4">
      <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-3">
        <Receipt size={20} className="text-white/25" />
      </div>
      <div className="text-white/60 text-sm font-semibold mb-1">No vouchers found</div>
      <p className="text-xs text-white/30">
        {searchTerm || statusFilter !== "all" || voucherTypeFilter !== "all"
          ? "Try adjusting your filters"
          : "Create your first voucher to get started"}
      </p>
    </div>
  );
}

// ============================================
// Voucher Details Dialog
// ============================================

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
      <DialogContent className={`max-w-5xl max-h-[90vh] overflow-y-auto ${dialogSurface}`}>
        <DialogHeader>
          <DialogTitle className="text-xl sm:text-2xl font-bold text-white">Voucher Details</DialogTitle>
          <DialogDescription className="text-white/40">
            Complete information for voucher {voucher.voucherNumber}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Voucher Info */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-cyan-400/5 rounded-xl border border-cyan-400/15">
            <div className="space-y-1">
              <Label className="text-xs text-white/35 font-semibold">Voucher Number</Label>
              <div className="font-mono font-bold text-cyan-300">{voucher.voucherNumber}</div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-white/35 font-semibold">Date</Label>
              <div className="font-medium text-white">{formatDateDisplay(voucher.voucherDate)}</div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-white/35 font-semibold">Type</Label>
              <div>
                <Badge className={`${VOUCHER_TYPE_STYLES[voucher.voucherType] || "border-white/15 bg-white/5 text-white/50"} border font-medium`}>
                  {voucher.voucherType}
                </Badge>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-white/35 font-semibold">Status</Label>
              <div>
                <Badge className={`${STATUS_STYLES[voucher.status] || "border-white/15 bg-white/5 text-white/50"} font-medium`}>
                  {STATUS_LABELS[voucher.status] || voucher.status}
                </Badge>
              </div>
            </div>
          </div>

          {/* Narration */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-white/70">Narration</Label>
            <div className="p-4 bg-white/5 rounded-xl border border-white/10">
              <p className="text-sm text-white/80">{voucher.narration}</p>
            </div>
          </div>

          {/* Voucher Entries — desktop table */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold text-white/70">Ledger Entries</Label>
            <div className="hidden sm:block overflow-hidden rounded-xl border border-white/10">
              <Table>
                <TableHeader>
                  <TableRow className="bg-white/5 hover:bg-white/5 border-b border-white/10">
                    <TableHead className="font-bold text-white/40">Code</TableHead>
                    <TableHead className="font-bold text-white/40">Account</TableHead>
                    <TableHead className="text-right font-bold text-white/40">Debit (৳)</TableHead>
                    <TableHead className="text-right font-bold text-white/40">Credit (৳)</TableHead>
                    <TableHead className="font-bold text-white/40">Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(voucher.ledgerEntries || []).map((entry: any, index: number) => (
                    <TableRow key={entry.id} className={`${index % 2 === 0 ? "bg-transparent" : "bg-white/[0.02]"} border-b border-white/5`}>
                      <TableCell className="font-mono text-sm font-semibold text-cyan-300">{entry.account?.code || "N/A"}</TableCell>
                      <TableCell className="font-medium text-white/80">{entry.account?.name || "N/A"}</TableCell>
                      <TableCell className="text-right font-bold text-emerald-400">
                        {parseFloat(entry.debitAmount) > 0
                          ? parseFloat(entry.debitAmount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right font-bold text-rose-400">
                        {parseFloat(entry.creditAmount) > 0
                          ? parseFloat(entry.creditAmount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                          : "—"}
                      </TableCell>
                      <TableCell className="text-sm text-white/50">{entry.description || "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <tfoot className="bg-cyan-400/5 border-t border-cyan-400/15">
                  <tr>
                    <td colSpan={2} className="px-4 py-4 text-right font-bold text-white">
                      Totals:
                    </td>
                    <td className="px-4 py-4 text-right font-bold text-emerald-400 text-lg">
                      ৳ {parseFloat(voucher.totalDebit).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-4 text-right font-bold text-rose-400 text-lg">
                      ৳ {parseFloat(voucher.totalCredit).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </Table>
            </div>

            {/* Voucher Entries — mobile cards */}
            <div className="sm:hidden space-y-2">
              {(voucher.ledgerEntries || []).map((entry: any) => (
                <div key={entry.id} className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono text-xs font-semibold text-cyan-300">{entry.account?.code || "N/A"}</span>
                    <span className="text-xs text-white/40">{entry.description || "—"}</span>
                  </div>
                  <p className="text-sm font-medium text-white/80 mb-2">{entry.account?.name || "N/A"}</p>
                  <div className="flex items-center gap-4 text-xs">
                    <span className="text-emerald-400 font-bold">
                      Dr {parseFloat(entry.debitAmount) > 0 ? parseFloat(entry.debitAmount).toLocaleString("en-US", { minimumFractionDigits: 2 }) : "—"}
                    </span>
                    <span className="text-rose-400 font-bold">
                      Cr {parseFloat(entry.creditAmount) > 0 ? parseFloat(entry.creditAmount).toLocaleString("en-US", { minimumFractionDigits: 2 }) : "—"}
                    </span>
                  </div>
                </div>
              ))}
              <div className="rounded-xl bg-cyan-400/5 border border-cyan-400/15 p-3 flex items-center justify-between text-sm">
                <span className="font-bold text-white">Totals</span>
                <span className="font-bold text-emerald-400">
                  ৳ {parseFloat(voucher.totalDebit).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </span>
                <span className="font-bold text-rose-400">
                  ৳ {parseFloat(voucher.totalCredit).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {/* Additional Info */}
          {voucher.internalNotes && (
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-white/70">Internal Notes</Label>
              <div className="p-4 bg-amber-400/5 rounded-xl border border-amber-400/15">
                <p className="text-sm text-white/70">{voucher.internalNotes}</p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="border-t border-white/10 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white">
            Close
          </Button>
          <Button className="bg-gradient-to-r from-cyan-400 to-blue-500 hover:opacity-90 text-white border-0 shadow-lg shadow-cyan-500/30">
            <FileText className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}