// src/app/accounting/periods/page.tsx
"use client";

import React, { useState } from "react";
import { 
  useGetAccountingPeriodsQuery, 
  useCreateAccountingPeriodMutation, 
  useCloseAccountingPeriodMutation 
} from "@/features/accountingApi";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Calendar, Lock, LockOpen, AlertCircle, X, Save, CalendarDays } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface PeriodFormData {
  periodName: string;
  periodType: string;
  startDate: string;
  endDate: string;
  entityType: string;
}

interface FormErrors {
  periodName?: boolean;
  periodType?: boolean;
  startDate?: boolean;
  endDate?: boolean;
}

// ============================================
// STYLE TOKENS — matches accounts/vouchers dark cyan/blue glass theme
// ============================================

const glassCard = "rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md";
const darkField =
  "border-white/10 bg-white/5 text-white placeholder:text-white/30 focus-visible:ring-cyan-400/50 focus-visible:border-cyan-400/40";
const errorField = "border-rose-400/50 bg-rose-400/5 text-white focus-visible:ring-rose-400/50";
const dialogSurface = "bg-slate-900 border border-white/10 text-white";

export default function AccountingPeriodsPage() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isCloseDialogOpen, setIsCloseDialogOpen] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<any>(null);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Set<string>>(new Set());
  
  // Form state
  const [formData, setFormData] = useState<PeriodFormData>({
    periodName: "",
    periodType: "",
    startDate: "",
    endDate: "",
    entityType: "ADMIN",
  });
  
  // Get current entity from user context
  const currentUser = { role: "ADMIN" }; // Replace with actual user context
  const entityType = currentUser.role === "VENDOR" ? "VENDOR" : "ADMIN";
  const entityId = currentUser.role === "VENDOR" ? "vendor-id" : undefined;
  
  // Fetch periods
  const { data: periodsResponse, isLoading, refetch } = useGetAccountingPeriodsQuery(
    { entityType, entityId },
    { skip: !entityType }
  );
  
  // Mutations
  const [createPeriod, { isLoading: isCreating }] = useCreateAccountingPeriodMutation();
  const [closePeriod, { isLoading: isClosing }] = useCloseAccountingPeriodMutation();
  
  const periods = periodsResponse?.data || [];
  
  // Period type options
  const periodTypes = [
    { value: "MONTHLY", label: "Monthly" },
    { value: "QUARTERLY", label: "Quarterly" },
    { value: "YEARLY", label: "Yearly" },
    { value: "CUSTOM", label: "Custom" },
  ];
  
  // Validate form
  const validateForm = () => {
    const errors: FormErrors = {};
    
    if (!formData.periodName.trim()) errors.periodName = true;
    if (!formData.periodType) errors.periodType = true;
    if (!formData.startDate) errors.startDate = true;
    if (!formData.endDate) errors.endDate = true;
    
    // Validate date range
    if (formData.startDate && formData.endDate) {
      if (new Date(formData.startDate) >= new Date(formData.endDate)) {
        errors.endDate = true;
        toast.error("End date must be after start date");
      }
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // Handle field blur
  const handleBlur = (field: string) => {
    setTouched(prev => new Set(prev).add(field));
    
    const errors = { ...formErrors };
    if (field === 'periodName' && !formData.periodName.trim()) errors.periodName = true;
    else if (field === 'periodName') delete errors.periodName;
    
    if (field === 'periodType' && !formData.periodType) errors.periodType = true;
    else if (field === 'periodType') delete errors.periodType;
    
    if (field === 'startDate' && !formData.startDate) errors.startDate = true;
    else if (field === 'startDate') delete errors.startDate;
    
    if (field === 'endDate' && !formData.endDate) errors.endDate = true;
    else if (field === 'endDate') delete errors.endDate;
    
    setFormErrors(errors);
  };
  
  // Handle create period
  const handleCreatePeriod = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setTouched(new Set(['periodName', 'periodType', 'startDate', 'endDate']));
    
    if (!validateForm()) {
      toast.error("Please fill in all required fields");
      return;
    }
    
    try {
      await createPeriod({
        periodName: formData.periodName.trim(),
        periodType: formData.periodType,
        startDate: formData.startDate,
        endDate: formData.endDate,
        entityType,
        entityId,
      }).unwrap();
      
      toast.success("Accounting period created successfully");
      
      // Reset form
      setFormData({
        periodName: "",
        periodType: "",
        startDate: "",
        endDate: "",
        entityType: "ADMIN",
      });
      setFormErrors({});
      setTouched(new Set());
      setShowCreateForm(false);
      refetch();
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to create period");
    }
  };
  
  const handleChange = (field: keyof PeriodFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (touched.has(field)) {
      const errors = { ...formErrors };
      delete errors[field as keyof FormErrors];
      setFormErrors(errors);
    }
  };
  
  // Handle close period
  const handleClosePeriod = async () => {
    if (!selectedPeriod) return;
    
    try {
      await closePeriod(selectedPeriod.id).unwrap();
      
      toast.success("Accounting period closed successfully");
      setIsCloseDialogOpen(false);
      setSelectedPeriod(null);
      refetch();
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to close period");
    }
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM dd, yyyy");
    } catch {
      return dateString;
    }
  };
  
  // Get period status badge
  const getPeriodStatusBadge = (period: any) => {
    if (period.isClosed) {
      return (
        <Badge className="bg-white/5 text-white/40 border border-white/15 rounded-full font-semibold">
          <Lock className="h-3 w-3 mr-1" />
          Closed
        </Badge>
      );
    }
    
    if (period.isActive) {
      return (
        <Badge className="bg-emerald-400/10 text-emerald-300 border border-emerald-400/25 rounded-full font-semibold">
          <LockOpen className="h-3 w-3 mr-1" />
          Open
        </Badge>
      );
    }
    
    return (
      <Badge variant="outline" className="border-white/15 bg-white/5 text-white/50 rounded-full font-medium">
        Inactive
      </Badge>
    );
  };
  
  if (isLoading) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-slate-950">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-cyan-950" />
        <div className="relative flex flex-col items-center justify-center h-screen gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-white/10 border-t-cyan-400" />
          <span className="text-sm text-white/35 font-medium">Loading accounting periods...</span>
        </div>
      </div>
    );
  }
  
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950">
      {/* Background — matches accounts, vouchers & dashboard */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-cyan-950" />
      <div className="absolute -top-24 -left-16 w-72 h-72 rounded-full bg-cyan-500/20 blur-[100px]" />
      <div className="absolute top-1/3 -right-24 w-80 h-80 rounded-full bg-blue-600/15 blur-[110px]" />
      <div className="absolute bottom-0 left-1/3 w-64 h-64 rounded-full bg-cyan-400/10 blur-[90px]" />

      <div className="relative max-w-screen-xl mx-auto p-4 sm:p-6 space-y-5">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/30 shrink-0">
              <CalendarDays size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">
                Accounting Periods
              </h1>
              <p className="text-xs sm:text-sm text-white/35 mt-0.5">
                Manage fiscal periods for financial reporting and closing
              </p>
            </div>
          </div>
          
          <Button 
            onClick={() => {
              setShowCreateForm(!showCreateForm);
              if (showCreateForm) {
                setFormData({
                  periodName: "",
                  periodType: "",
                  startDate: "",
                  endDate: "",
                  entityType: "ADMIN",
                });
                setFormErrors({});
                setTouched(new Set());
              }
            }}
            className={
              showCreateForm
                ? "w-full md:w-auto border border-white/10 bg-white/5 text-white/70 hover:bg-white/10 rounded-lg"
                : "w-full md:w-auto bg-gradient-to-r from-cyan-400 to-blue-500 hover:opacity-90 text-white border-0 shadow-lg shadow-cyan-500/30 rounded-lg"
            }
          >
            {showCreateForm ? (
              <>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                New Period
              </>
            )}
          </Button>
        </div>
        
        {/* Inline Create Form */}
        {showCreateForm && (
          <Card className={`${glassCard} overflow-hidden`}>
            <CardHeader className="border-b border-white/10">
              <CardTitle className="text-white">Create New Accounting Period</CardTitle>
              <CardDescription className="text-white/35">
                Define a new fiscal period for accounting operations. All fields marked with * are required.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleCreatePeriod}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="space-y-2">
                    <Label htmlFor="periodName" className="text-white/50 font-semibold text-xs uppercase tracking-wider">
                      Period Name <span className="text-rose-400">*</span>
                    </Label>
                    <Input
                      id="periodName"
                      value={formData.periodName}
                      onChange={(e) => handleChange("periodName", e.target.value)}
                      onBlur={() => handleBlur("periodName")}
                      placeholder="e.g., January 2024 or Q1 2024"
                      className={cn(
                        "rounded-lg",
                        touched.has("periodName") && formErrors.periodName ? errorField : darkField
                      )}
                    />
                    {touched.has("periodName") && formErrors.periodName && (
                      <div className="flex items-center gap-1 text-rose-400 text-xs mt-1">
                        <AlertCircle className="h-3 w-3" />
                        <span>Period name is required</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="periodType" className="text-white/50 font-semibold text-xs uppercase tracking-wider">
                      Period Type <span className="text-rose-400">*</span>
                    </Label>
                    <Select
                      value={formData.periodType}
                      onValueChange={(value) => handleChange("periodType", value)}
                    >
                      <SelectTrigger 
                        className={cn(
                          "rounded-lg",
                          touched.has("periodType") && formErrors.periodType ? errorField : darkField
                        )}
                        onBlur={() => handleBlur("periodType")}
                      >
                        <SelectValue placeholder="Select period type" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-white/10 text-white">
                        {periodTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {touched.has("periodType") && formErrors.periodType && (
                      <div className="flex items-center gap-1 text-rose-400 text-xs mt-1">
                        <AlertCircle className="h-3 w-3" />
                        <span>Period type is required</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="space-y-2">
                    <Label htmlFor="startDate" className="text-white/50 font-semibold text-xs uppercase tracking-wider">
                      Start Date <span className="text-rose-400">*</span>
                    </Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => handleChange("startDate", e.target.value)}
                      onBlur={() => handleBlur("startDate")}
                      className={cn(
                        "rounded-lg [color-scheme:dark]",
                        touched.has("startDate") && formErrors.startDate ? errorField : darkField
                      )}
                    />
                    {touched.has("startDate") && formErrors.startDate && (
                      <div className="flex items-center gap-1 text-rose-400 text-xs mt-1">
                        <AlertCircle className="h-3 w-3" />
                        <span>Start date is required</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="endDate" className="text-white/50 font-semibold text-xs uppercase tracking-wider">
                      End Date <span className="text-rose-400">*</span>
                    </Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => handleChange("endDate", e.target.value)}
                      onBlur={() => handleBlur("endDate")}
                      className={cn(
                        "rounded-lg [color-scheme:dark]",
                        touched.has("endDate") && formErrors.endDate ? errorField : darkField
                      )}
                    />
                    {touched.has("endDate") && formErrors.endDate && (
                      <div className="flex items-center gap-1 text-rose-400 text-xs mt-1">
                        <AlertCircle className="h-3 w-3" />
                        <span>End date is required and must be after start date</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowCreateForm(false);
                      setFormData({
                        periodName: "",
                        periodType: "",
                        startDate: "",
                        endDate: "",
                        entityType: "ADMIN",
                      });
                      setFormErrors({});
                      setTouched(new Set());
                    }}
                    className="border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white rounded-lg"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isCreating}
                    className="bg-gradient-to-r from-cyan-400 to-blue-500 hover:opacity-90 text-white border-0 shadow-lg shadow-cyan-500/30 rounded-lg"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {isCreating ? "Creating..." : "Create Period"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
        
        {/* Periods Table — desktop */}
        <Card className={`${glassCard} hidden md:block overflow-hidden`}>
          <CardHeader className="border-b border-white/10">
            <CardTitle className="text-white">All Accounting Periods</CardTitle>
            <CardDescription className="text-white/35">
              {periods.length} {periods.length === 1 ? "period" : "periods"} found
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-white/10 hover:bg-transparent">
                    <TableHead className="text-xs font-bold text-white/40">Period Name</TableHead>
                    <TableHead className="text-xs font-bold text-white/40 w-[140px]">Type</TableHead>
                    <TableHead className="text-xs font-bold text-white/40 w-[150px]">Start Date</TableHead>
                    <TableHead className="text-xs font-bold text-white/40 w-[150px]">End Date</TableHead>
                    <TableHead className="text-xs font-bold text-white/40 w-[100px]">Duration</TableHead>
                    <TableHead className="text-xs font-bold text-white/40 w-[120px]">Status</TableHead>
                    <TableHead className="text-xs font-bold text-white/40 w-[150px]">Closed Date</TableHead>
                    <TableHead className="text-right text-xs font-bold text-white/40 w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {periods.map((period, index) => {
                    const start = new Date(period.startDate);
                    const end = new Date(period.endDate);
                    const durationDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
                    
                    return (
                      <TableRow 
                        key={period.id}
                        className={cn(
                          "border-b border-white/5 hover:bg-cyan-400/5 transition-colors",
                          index % 2 === 0 ? "bg-transparent" : "bg-white/[0.02]"
                        )}
                      >
                        <TableCell>
                          <div className="text-sm font-medium text-white/80">{period.periodName}</div>
                          <div className="text-xs text-white/30 font-mono mt-0.5">ID: {period.id.slice(0, 8)}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="border-white/15 bg-white/5 text-white/50 rounded-full font-medium">
                            {period.periodType}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-xs text-white/50">
                            <Calendar className="h-3.5 w-3.5 text-white/25" />
                            {formatDate(period.startDate)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-xs text-white/50">
                            <Calendar className="h-3.5 w-3.5 text-white/25" />
                            {formatDate(period.endDate)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs text-white/40">
                            {durationDays} days
                          </span>
                        </TableCell>
                        <TableCell>
                          {getPeriodStatusBadge(period)}
                        </TableCell>
                        <TableCell>
                          {period.closedAt ? (
                            <div>
                              <div className="text-xs text-white/50">
                                {formatDate(period.closedAt)}
                              </div>
                              {period.closedBy && (
                                <div className="text-xs text-white/25">
                                  by {period.closedBy}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-white/20">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {!period.isClosed && period.isActive && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedPeriod(period);
                                setIsCloseDialogOpen(true);
                              }}
                              className="border-amber-400/25 bg-amber-400/5 text-amber-300 hover:bg-amber-400/10 rounded-lg"
                            >
                              <Lock className="h-3.5 w-3.5 mr-1" />
                              Close
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            
            {periods.length === 0 && <EmptyState />}
          </CardContent>
        </Card>

        {/* Periods — mobile card list */}
        <div className="md:hidden space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-sm font-bold text-white/70">All Accounting Periods</span>
            <span className="text-xs text-white/35">
              {periods.length} {periods.length === 1 ? "period" : "periods"}
            </span>
          </div>

          {periods.length === 0 ? (
            <Card className={glassCard}>
              <CardContent className="p-0">
                <EmptyState />
              </CardContent>
            </Card>
          ) : (
            periods.map((period) => {
              const start = new Date(period.startDate);
              const end = new Date(period.endDate);
              const durationDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

              return (
                <Card key={period.id} className={glassCard}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3 mb-2.5">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white/85">{period.periodName}</p>
                        <p className="text-xs text-white/30 font-mono mt-0.5">ID: {period.id.slice(0, 8)}</p>
                      </div>
                      {getPeriodStatusBadge(period)}
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap mb-3">
                      <Badge variant="outline" className="border-white/15 bg-white/5 text-white/50 rounded-full font-medium">
                        {period.periodType}
                      </Badge>
                      <span className="text-xs text-white/40">{durationDays} days</span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-white/40 mb-2">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-white/25" />
                        {formatDate(period.startDate)}
                      </span>
                      <span className="text-white/20">→</span>
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-white/25" />
                        {formatDate(period.endDate)}
                      </span>
                    </div>

                    {period.closedAt && (
                      <div className="text-xs text-white/30 mb-2">
                        Closed {formatDate(period.closedAt)}
                        {period.closedBy && <span> by {period.closedBy}</span>}
                      </div>
                    )}

                    {!period.isClosed && period.isActive && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedPeriod(period);
                          setIsCloseDialogOpen(true);
                        }}
                        className="w-full mt-1 border-amber-400/25 bg-amber-400/5 text-amber-300 hover:bg-amber-400/10 rounded-lg"
                      >
                        <Lock className="h-3.5 w-3.5 mr-1" />
                        Close Period
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
        
        {/* Close Period Confirmation Dialog */}
        <AlertDialog open={isCloseDialogOpen} onOpenChange={setIsCloseDialogOpen}>
          <AlertDialogContent className={dialogSurface}>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-amber-300">
                <AlertCircle className="h-5 w-5" />
                Close Accounting Period?
              </AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className="space-y-3 mt-2 text-white/50">
                  <p>
                    You are about to close the period{" "}
                    <strong className="text-white">{selectedPeriod?.periodName}</strong>.
                  </p>
                  <div className="bg-amber-400/5 border border-amber-400/25 rounded-xl p-3">
                    <p className="text-sm text-amber-300 font-semibold">
                      ⚠️ Warning: This action cannot be undone
                    </p>
                    <ul className="text-xs text-amber-300/70 mt-2 space-y-1 list-disc list-inside">
                      <li>No new transactions can be posted to this period</li>
                      <li>Existing transactions will be locked</li>
                      <li>Financial reports will be finalized</li>
                    </ul>
                  </div>
                  <p className="text-sm text-white/50">
                    Are you sure you want to proceed with closing this accounting period?
                  </p>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel
                onClick={() => setSelectedPeriod(null)}
                className="border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleClosePeriod}
                disabled={isClosing}
                className="bg-amber-500 hover:bg-amber-600 text-white"
              >
                {isClosing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white mr-2" />
                    Closing...
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4 mr-2" />
                    Close Period
                  </>
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

// ============================================
// Empty state
// ============================================

function EmptyState() {
  return (
    <div className="text-center py-16 px-4">
      <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-3">
        <Calendar size={20} className="text-white/25" />
      </div>
      <div className="text-white/60 text-sm font-semibold mb-1">No accounting periods found</div>
      <p className="text-xs text-white/30">Create your first period to get started.</p>
    </div>
  );
}