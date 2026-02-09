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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Calendar, Lock, LockOpen, AlertCircle, X, Save, CheckCircle, XCircle } from "lucide-react";
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
        <Badge className="bg-gray-200 text-gray-700 hover:bg-gray-300">
          <Lock className="h-3 w-3 mr-1" />
          Closed
        </Badge>
      );
    }
    
    if (period.isActive) {
      return (
        <Badge className="bg-teal-100 text-teal-800 hover:bg-teal-200">
          <LockOpen className="h-3 w-3 mr-1" />
          Open
        </Badge>
      );
    }
    
    return (
      <Badge variant="secondary">
        Inactive
      </Badge>
    );
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
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Accounting Periods</h1>
          <p className="text-gray-600 mt-1">
            Manage fiscal periods for financial reporting and closing
          </p>
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
          className="bg-teal-600 hover:bg-teal-700"
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
        <Card className="border-teal-200 bg-teal-50/30">
          <CardHeader className="bg-teal-50 border-b border-teal-200">
            <CardTitle className="text-teal-900">Create New Accounting Period</CardTitle>
            <CardDescription className="text-teal-700">
              Define a new fiscal period for accounting operations. All fields marked with * are required.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleCreatePeriod}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="space-y-2">
                  <Label htmlFor="periodName" className="text-gray-700 font-medium">
                    Period Name <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id="periodName"
                    value={formData.periodName}
                    onChange={(e) => handleChange("periodName", e.target.value)}
                    onBlur={() => handleBlur("periodName")}
                    placeholder="e.g., January 2024 or Q1 2024"
                    className={cn(
                      "border-gray-300 focus:border-teal-500 focus:ring-teal-500",
                      touched.has("periodName") && formErrors.periodName && "border-rose-500 focus:border-rose-500 focus:ring-rose-500"
                    )}
                  />
                  {touched.has("periodName") && formErrors.periodName && (
                    <div className="flex items-center gap-1 text-rose-600 text-sm">
                      <AlertCircle className="h-3 w-3" />
                      <span>Period name is required</span>
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="periodType" className="text-gray-700 font-medium">
                    Period Type <span className="text-rose-500">*</span>
                  </Label>
                  <Select
                    value={formData.periodType}
                    onValueChange={(value) => handleChange("periodType", value)}
                  >
                    <SelectTrigger 
                      className={cn(
                        "border-gray-300 focus:border-teal-500 focus:ring-teal-500",
                        touched.has("periodType") && formErrors.periodType && "border-rose-500"
                      )}
                      onBlur={() => handleBlur("periodType")}
                    >
                      <SelectValue placeholder="Select period type" />
                    </SelectTrigger>
                    <SelectContent>
                      {periodTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {touched.has("periodType") && formErrors.periodType && (
                    <div className="flex items-center gap-1 text-rose-600 text-sm">
                      <AlertCircle className="h-3 w-3" />
                      <span>Period type is required</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="space-y-2">
                  <Label htmlFor="startDate" className="text-gray-700 font-medium">
                    Start Date <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => handleChange("startDate", e.target.value)}
                    onBlur={() => handleBlur("startDate")}
                    className={cn(
                      "border-gray-300 focus:border-teal-500 focus:ring-teal-500",
                      touched.has("startDate") && formErrors.startDate && "border-rose-500 focus:border-rose-500 focus:ring-rose-500"
                    )}
                  />
                  {touched.has("startDate") && formErrors.startDate && (
                    <div className="flex items-center gap-1 text-rose-600 text-sm">
                      <AlertCircle className="h-3 w-3" />
                      <span>Start date is required</span>
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="endDate" className="text-gray-700 font-medium">
                    End Date <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => handleChange("endDate", e.target.value)}
                    onBlur={() => handleBlur("endDate")}
                    className={cn(
                      "border-gray-300 focus:border-teal-500 focus:ring-teal-500",
                      touched.has("endDate") && formErrors.endDate && "border-rose-500 focus:border-rose-500 focus:ring-rose-500"
                    )}
                  />
                  {touched.has("endDate") && formErrors.endDate && (
                    <div className="flex items-center gap-1 text-rose-600 text-sm">
                      <AlertCircle className="h-3 w-3" />
                      <span>End date is required and must be after start date</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex justify-end gap-2 pt-4 border-t border-teal-200">
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
                  className="border-gray-300"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isCreating}
                  className="bg-teal-600 hover:bg-teal-700"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isCreating ? "Creating..." : "Create Period"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
      
      {/* Periods Table */}
      <Card className="border-gray-200">
        <CardHeader className="bg-teal-50 border-b border-teal-200">
          <CardTitle className="text-teal-900">All Accounting Periods</CardTitle>
          <CardDescription className="text-teal-700">
            {periods.length} periods found
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 hover:bg-gray-50">
                  <TableHead className="font-semibold text-gray-900">Period Name</TableHead>
                  <TableHead className="font-semibold text-gray-900 w-[140px]">Type</TableHead>
                  <TableHead className="font-semibold text-gray-900 w-[150px]">Start Date</TableHead>
                  <TableHead className="font-semibold text-gray-900 w-[150px]">End Date</TableHead>
                  <TableHead className="font-semibold text-gray-900 w-[100px]">Duration</TableHead>
                  <TableHead className="font-semibold text-gray-900 w-[120px]">Status</TableHead>
                  <TableHead className="font-semibold text-gray-900 w-[150px]">Closed Date</TableHead>
                  <TableHead className="text-right font-semibold text-gray-900 w-[100px]">Actions</TableHead>
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
                        "hover:bg-teal-50/50 transition-colors",
                        index % 2 === 0 ? "bg-white" : "bg-gray-50"
                      )}
                    >
                      <TableCell>
                        <div className="font-medium text-gray-900">{period.periodName}</div>
                        <div className="text-sm text-gray-500">ID: {period.id.slice(0, 8)}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-medium">
                          {period.periodType}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-gray-700">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          {formatDate(period.startDate)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-gray-700">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          {formatDate(period.endDate)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600">
                          {durationDays} days
                        </span>
                      </TableCell>
                      <TableCell>
                        {getPeriodStatusBadge(period)}
                      </TableCell>
                      <TableCell>
                        {period.closedAt ? (
                          <div>
                            <div className="text-sm text-gray-700">
                              {formatDate(period.closedAt)}
                            </div>
                            {period.closedBy && (
                              <div className="text-xs text-gray-500">
                                by {period.closedBy}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
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
                            className="border-orange-300 text-orange-700 hover:bg-orange-50"
                          >
                            <Lock className="h-4 w-4 mr-1" />
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
          
          {periods.length === 0 && (
            <div className="text-center py-16 bg-gray-50">
              <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <div className="text-gray-500 text-lg">
                No accounting periods found. Create your first period to get started.
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Close Period Confirmation Dialog */}
      <AlertDialog open={isCloseDialogOpen} onOpenChange={setIsCloseDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              Close Accounting Period?
            </AlertDialogTitle>
            <AlertDialogDescription>
              <div className="space-y-3 mt-2">
                <p>
                  You are about to close the period <strong>{selectedPeriod?.periodName}</strong>.
                </p>
                <div className="bg-orange-50 border border-orange-200 rounded-md p-3">
                  <p className="text-sm text-orange-800 font-medium">
                    ⚠️ Warning: This action cannot be undone
                  </p>
                  <ul className="text-sm text-orange-700 mt-2 space-y-1 list-disc list-inside">
                    <li>No new transactions can be posted to this period</li>
                    <li>Existing transactions will be locked</li>
                    <li>Financial reports will be finalized</li>
                  </ul>
                </div>
                <p className="text-sm">
                  Are you sure you want to proceed with closing this accounting period?
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedPeriod(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClosePeriod}
              disabled={isClosing}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {isClosing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
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
  );
}