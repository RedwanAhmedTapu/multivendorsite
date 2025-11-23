// components/vendor-management/VendorPayoutCommissionManager.tsx
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { CalendarIcon, ArrowLeft, Plus, X, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  useGetVendorByIdQuery,
  useSetCommissionRateMutation,
  useGetCommissionHistoryQuery,
  useCreatePayoutMutation,
  useGetVendorPayoutsQuery,
  useGetPayoutSummaryQuery,
} from '@/features/vendorManageApi';
import CategoryTreeSelector from './CategoryTreeSelector';
import { cn } from '@/lib/utils';

// ========================
// Types
// ========================
interface Commission {
  id: string;
  categoryId: string;
  rate: number;
  category?: {
    id: string;
    name: string;
    slug: string;
  };
  effectiveFrom?: string;
  effectiveTo?: string;
  note?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface VendorData {
  id: string;
  storeName: string;
  avatar: string | null;
  status: string;
  accountType: string;
  verificationStatus: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    email: string | null;
    phone: string;
    isActive: boolean;
    isVerified: boolean;
  };
  personalInfo: {
    idNumber: string;
    idName: string;
    companyName: string | null;
    businessRegNo: string | null;
    taxIdNumber: string | null;
  } | null;
  commissions: Commission[];
  _count: {
    products: number;
    orders: number;
    payouts: number;
  };
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

interface Payout {
  id: string;
  amount: number;
  method: string;
  period: string;
  status: string;
  note?: string;
  paidAt?: string;
  createdAt: string;
}

interface PayoutSummary {
  totalPending: number;
  totalPaid: number;
  currentBalance: number;
  lastPayoutDate?: string;
}

// ========================
// Form Schemas
// ========================
const commissionFormSchema = z.object({
  categoryId: z.string().min(1, {
    message: 'Category is required.',
  }),
  rate: z.number().min(0).max(100, {
    message: 'Commission rate must be between 0 and 100.',
  }),
});

const payoutFormSchema = z.object({
  amount: z.number().min(0.01, {
    message: 'Amount must be at least $0.01.',
  }),
  method: z.string().min(1, {
    message: 'Payment method is required.',
  }),
  period: z.string().min(1, {
    message: 'Period is required.',
  }),
  note: z.string().optional(),
  effectiveDate: z.date(), 
});

interface VendorPayoutCommissionManagerProps {
  vendorId: string;
  onBackToList: () => void;
}

// Helper function to handle inconsistent API response formats
const getResponseData = <T,>(response: any): T | undefined => {
  if (!response) return undefined;
  
  // Check if it's a wrapped response {success, data}
  if (response && typeof response === 'object' && 'data' in response && 'success' in response) {
    return response.data as T;
  }
  
  // Otherwise, it's the direct data
  return response as T;
};

export default function VendorPayoutCommissionManager({
  vendorId,
  onBackToList,
}: VendorPayoutCommissionManagerProps) {
  const [activeTab, setActiveTab] = useState('commission');
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [editingCommission, setEditingCommission] = useState<Commission | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<{
    id: string;
    path: string;
    name: string;
    isLeaf: boolean;
  } | null>(null);

  // Queries
  const { data: vendorResponse, isLoading, error, refetch } = useGetVendorByIdQuery(vendorId);
  const { data: commissionHistoryResp } = useGetCommissionHistoryQuery(vendorId);
  const { data: payoutsResp } = useGetVendorPayoutsQuery(vendorId);
  const { data: payoutSummaryResp } = useGetPayoutSummaryQuery(vendorId);

  // Handle inconsistent API response formats using the helper function
  const vendor = getResponseData<VendorData>(vendorResponse);
  const commissionHistory = getResponseData<Commission[]>(commissionHistoryResp) || [];
  const payouts = getResponseData<Payout[]>(payoutsResp) || [];
  const payoutSummary = getResponseData<PayoutSummary>(payoutSummaryResp);

  // Debug: Log the actual responses to see the structure
  useEffect(() => {
    console.log('Vendor Response:', vendorResponse);
    console.log('Vendor Data:', vendor);
    console.log('Commission History Response:', commissionHistoryResp);
    console.log('Commission History Data:', commissionHistory);
    console.log('Payouts Response:', payoutsResp);
    console.log('Payouts Data:', payouts);
    console.log('Payout Summary Response:', payoutSummaryResp);
    console.log('Payout Summary Data:', payoutSummary);
  }, [vendorResponse, commissionHistoryResp, payoutsResp, payoutSummaryResp]);

  // Mutations
  const [setCommissionRate, { isLoading: isSettingCommission }] = useSetCommissionRateMutation();
  const [createPayout, { isLoading: isCreatingPayout }] = useCreatePayoutMutation();

  // Forms
  const commissionForm = useForm<z.infer<typeof commissionFormSchema>>({
    resolver: zodResolver(commissionFormSchema),
    defaultValues: {
      categoryId: '',
      rate: 0,
    },
  });

  const payoutForm = useForm<z.infer<typeof payoutFormSchema>>({
    resolver: zodResolver(payoutFormSchema),
    defaultValues: {
      amount: 0,
      method: '',
      period: '',
      note: '',
      effectiveDate: new Date(),
    },
  });

  // Handle category selection
  const handleCategorySelect = (
    id: string, 
    path: string, 
    isLeaf: boolean, 
    attributes: any[], 
    specifications: any[]
  ) => {
    if (isLeaf) {
      const name = path.split(' > ').pop() || path;
      setSelectedCategory({ id, path, name, isLeaf });
      commissionForm.setValue('categoryId', id);
      setCategoryDialogOpen(false);
      toast.success(`Category selected: ${name}`);
    } else {
      toast.error('Please select a leaf category (no subcategories)');
    }
  };

  const handleRemoveCategory = () => {
    setSelectedCategory(null);
    commissionForm.setValue('categoryId', '');
  };

  // Edit commission
  const handleEditCommission = (commission: Commission) => {
    setEditingCommission(commission);
    setSelectedCategory({
      id: commission.categoryId,
      path: commission.category?.name || 'Unknown Category',
      name: commission.category?.name || 'Unknown',
      isLeaf: true,
    });
    commissionForm.reset({
      categoryId: commission.categoryId,
      rate: commission.rate,
    });
  };

  // Cancel edit
  const handleCancelEdit = () => {
    setEditingCommission(null);
    setSelectedCategory(null);
    commissionForm.reset({
      categoryId: '',
      rate: 0,
    });
  };

  // Submit commission
  const onCommissionSubmit = async (values: z.infer<typeof commissionFormSchema>) => {
    try {
      const payload: any = {
        categoryId: values.categoryId,
        rate: values.rate,
      };

      await setCommissionRate({
        vendorId,
        data: payload,
      }).unwrap();

      toast.success(
        editingCommission 
          ? 'Commission rate updated successfully.' 
          : 'Commission rate set successfully.'
      );
      
      handleCancelEdit();
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to save commission rate.');
    }
  };

  // Submit payout
  const onPayoutCreate = async (values: z.infer<typeof payoutFormSchema>) => {
    try {
      await createPayout({
        vendorId,
        data: {
          amount: values.amount,
          method: values.method,
          period: values.period,
          note: values.note,
          paidAt: values.effectiveDate.toISOString(),
        },
      }).unwrap();

      toast.success('Payout created successfully.');
      payoutForm.reset({
        amount: 0,
        method: '',
        period: '',
        note: '',
        effectiveDate: new Date(),
      });
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to create payout.');
    }
  };

  // Calculate total commission rate
  const getTotalCommissionRate = () => {
    if (!vendor?.commissions || vendor.commissions.length === 0) return 0;
    const total = vendor.commissions.reduce((sum, comm) => sum + comm.rate, 0);
    return total;
  };

  // Get average commission rate
  const getAverageCommissionRate = () => {
    if (!vendor?.commissions || vendor.commissions.length === 0) return 0;
    return getTotalCommissionRate() / vendor.commissions.length;
  };

  // ========================
  // Render
  // ========================
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Button variant="outline" onClick={onBackToList} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to List
        </Button>
        <Skeleton className="h-12 w-1/3" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !vendor) {
    return (
      <div className="space-y-4">
        <Button variant="outline" onClick={onBackToList}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to List
        </Button>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h3 className="text-lg font-medium text-red-600">Failed to load vendor data</h3>
            <p className="text-sm text-gray-500 mt-2">
              {(error as any)?.data?.message || 'An error occurred'}
            </p>
            <Button className="mt-4" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBackToList}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to List
        </Button>
        <div className="flex-1">
          <div className="flex items-center space-x-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={vendor.avatar || undefined} />
              <AvatarFallback>
                {vendor.storeName?.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-3xl font-bold">{vendor.storeName}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge
                  variant={
                    vendor.status === 'ACTIVE'
                      ? 'default'
                      : vendor.status === 'SUSPENDED'
                      ? 'destructive'
                      : 'secondary'
                  }
                >
                  {vendor.status}
                </Badge>
                <Badge variant="outline">
                  {vendor.verificationStatus}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Vendor Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{vendor._count.products}</div>
            <p className="text-xs text-muted-foreground">Total Products</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{vendor._count.orders}</div>
            <p className="text-xs text-muted-foreground">Total Orders</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{vendor.commissions.length}</div>
            <p className="text-xs text-muted-foreground">Commission Categories</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{getAverageCommissionRate().toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Avg Commission Rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="commission">Commission Management</TabsTrigger>
          <TabsTrigger value="payouts">Payouts</TabsTrigger>
        </TabsList>

        {/* Commission Tab */}
        <TabsContent value="commission" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Set/Edit Commission Form */}
            <Card>
              <CardHeader>
                <CardTitle>
                  {editingCommission ? 'Edit Commission Rate' : 'Set Commission Rate'}
                </CardTitle>
                <CardDescription>
                  {editingCommission 
                    ? 'Update the commission rate for the selected category'
                    : 'Set category-specific commission rates for this vendor'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...commissionForm}>
                  <form onSubmit={commissionForm.handleSubmit(onCommissionSubmit)} className="space-y-4">
                    {/* Category Selection */}
                    <FormField
                      control={commissionForm.control}
                      name="categoryId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category *</FormLabel>
                          <div className="space-y-2">
                            {selectedCategory ? (
                              <div className="flex items-center justify-between p-3 border rounded-md bg-teal-50 border-teal-200">
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-teal-800">
                                    {selectedCategory.name}
                                  </p>
                                  <p className="text-xs text-teal-600 mt-1">
                                    {selectedCategory.path}
                                  </p>
                                </div>
                                {!editingCommission && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleRemoveCategory}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            ) : (
                              <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
                                <DialogTrigger asChild>
                                  <Button type="button" variant="outline" className="w-full">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Select Category
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-3xl max-h-[80vh]">
                                  <DialogHeader>
                                    <DialogTitle>Select Category</DialogTitle>
                                    <DialogDescription>
                                      Choose a leaf category (final level without subcategories)
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="overflow-y-auto max-h-[60vh] p-4">
                                    <CategoryTreeSelector onSelect={handleCategorySelect} />
                                  </div>
                                </DialogContent>
                              </Dialog>
                            )}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Rate */}
                    <FormField
                      control={commissionForm.control}
                      name="rate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Commission Rate (%) *</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              step="0.01"
                              placeholder="Enter commission rate (0-100)"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                          <p className="text-xs text-muted-foreground">
                            Set the percentage of sales this vendor will pay as commission for this category
                          </p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex gap-2">
                      <Button 
                        type="submit" 
                        disabled={!selectedCategory || isSettingCommission}
                      >
                        {isSettingCommission ? 'Saving...' : (editingCommission ? 'Update Commission' : 'Set Commission')}
                      </Button>
                      {editingCommission && (
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={handleCancelEdit}
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>

            {/* Current Commissions */}
            <Card>
              <CardHeader>
                <CardTitle>Current Commission Rates</CardTitle>
                <CardDescription>
                  Active commission rates for this vendor by category
                </CardDescription>
              </CardHeader>
              <CardContent>
                {vendor.commissions && vendor.commissions.length > 0 ? (
                  <div className="space-y-3">
                    {vendor.commissions.map((commission) => (
                      <div
                        key={commission.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-sm">
                            {commission.category?.name || 'Unknown Category'}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-xs">
                              {commission.rate}% Commission
                            </Badge>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditCommission(commission)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p className="text-sm">No commission rates set for this vendor.</p>
                    <p className="text-xs mt-1">Set commission rates by category using the form.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Commission History */}
          {commissionHistory && commissionHistory.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Commission History</CardTitle>
                <CardDescription>
                  Historical commission rate changes for this vendor
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category</TableHead>
                      <TableHead>Rate</TableHead>
                      <TableHead>Updated</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {commissionHistory.slice(0, 20).map((commission) => (
                      <TableRow key={commission.id}>
                        <TableCell className="font-medium">
                          {commission.category?.name || 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{commission.rate}%</Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {commission.updatedAt 
                            ? format(new Date(commission.updatedAt), 'PP') 
                            : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Payouts Tab */}
        <TabsContent value="payouts" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Create Payout */}
            <Card>
              <CardHeader>
                <CardTitle>Create Payout</CardTitle>
                <CardDescription>Schedule a new payout for this vendor</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...payoutForm}>
                  <form onSubmit={payoutForm.handleSubmit(onPayoutCreate)} className="space-y-4">
                    {/* Amount */}
                    <FormField
                      control={payoutForm.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Amount ($) *</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="Enter payout amount"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Method */}
                    <FormField
                      control={payoutForm.control}
                      name="method"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Payment Method *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select payment method" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                              <SelectItem value="paypal">PayPal</SelectItem>
                              <SelectItem value="stripe">Stripe</SelectItem>
                              <SelectItem value="check">Check</SelectItem>
                              <SelectItem value="cash">Cash</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Period */}
                    <FormField
                      control={payoutForm.control}
                      name="period"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Period *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select period" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="weekly">Weekly</SelectItem>
                              <SelectItem value="bi-weekly">Bi-Weekly</SelectItem>
                              <SelectItem value="monthly">Monthly</SelectItem>
                              <SelectItem value="quarterly">Quarterly</SelectItem>
                              <SelectItem value="custom">Custom</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Date */}
                    <FormField
                      control={payoutForm.control}
                      name="effectiveDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Payout Date *</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    'pl-3 text-left font-normal',
                                    !field.value && 'text-muted-foreground'
                                  )}
                                >
                                  {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) => date < new Date('1900-01-01')}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Note */}
                    <FormField
                      control={payoutForm.control}
                      name="note"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Note (Optional)</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Add a note about this payout" 
                              className="resize-none" 
                              rows={3}
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button type="submit" disabled={isCreatingPayout}>
                      {isCreatingPayout ? 'Creating...' : 'Schedule Payout'}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

            {/* Payout Summary + History */}
            <div className="space-y-6">
              {payoutSummary && (
                <Card>
                  <CardHeader>
                    <CardTitle>Payout Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                        <p className="text-sm font-medium text-yellow-800">Pending Payouts</p>
                        <p className="text-2xl font-bold text-yellow-900 mt-1">
                          ${payoutSummary.totalPending?.toFixed(2) || '0.00'}
                        </p>
                      </div>
                      <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                        <p className="text-sm font-medium text-green-800">Paid Payouts</p>
                        <p className="text-2xl font-bold text-green-900 mt-1">
                          ${payoutSummary.totalPaid?.toFixed(2) || '0.00'}
                        </p>
                      </div>
                      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-sm font-medium text-blue-800">Current Balance</p>
                        <p className="text-2xl font-bold text-blue-900 mt-1">
                          ${payoutSummary.currentBalance?.toFixed(2) || '0.00'}
                        </p>
                      </div>
                      <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                        <p className="text-sm font-medium text-purple-800">Last Payout</p>
                        <p className="text-sm font-semibold text-purple-900 mt-1">
                          {payoutSummary.lastPayoutDate 
                            ? format(new Date(payoutSummary.lastPayoutDate), 'PP') 
                            : 'Never'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle>Recent Payouts</CardTitle>
                  <CardDescription>Latest payout transactions for this vendor</CardDescription>
                </CardHeader>
                <CardContent>
                  {payouts && payouts.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Amount</TableHead>
                          <TableHead>Method</TableHead>
                          <TableHead>Period</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {payouts.slice(0, 10).map((payout) => (
                          <TableRow key={payout.id}>
                            <TableCell className="font-medium">
                              ${payout.amount.toFixed(2)}
                            </TableCell>
                            <TableCell className="capitalize">
                              {payout.method.replace('_', ' ')}
                            </TableCell>
                            <TableCell className="capitalize">
                              {payout.period}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  payout.status === 'PAID'
                                    ? 'default'
                                    : payout.status === 'PENDING'
                                    ? 'secondary'
                                    : 'destructive'
                                }
                              >
                                {payout.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm">
                              {payout.paidAt
                                ? format(new Date(payout.paidAt), 'PP')
                                : format(new Date(payout.createdAt), 'PP')}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <p className="text-sm">No payout history available.</p>
                      <p className="text-xs mt-1">Create payouts using the form.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}