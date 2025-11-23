// components/vendor-management/VendorPayoutCommissionManager.tsx
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { CalendarIcon, ArrowLeft } from 'lucide-react';
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
import { toast } from 'sonner';
import {
  useGetVendorByIdQuery,
  useSetCommissionRateMutation,
  useGetCommissionHistoryQuery,
  useCreatePayoutMutation,
  useGetVendorPayoutsQuery,
  useGetPayoutSummaryQuery,
} from '@/features/vendorManageApi';
import { cn } from '@/lib/utils';

// ========================
// Form Schemas
// ========================
const commissionFormSchema = z.object({
  rate: z.number().min(0).max(100, {
    message: 'Commission rate must be between 0 and 100.',
  }),
  categoryId: z.string().min(1, {
    message: 'Category is required.',
  }),
  note: z.string().optional(),
  effectiveFrom: z.date().refine((date) => date instanceof Date && !isNaN(date.getTime()), {
    message: "Effective from date is required.",
  }),
  effectiveTo: z.date().optional(),
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

// Type definitions for API responses
interface Vendor {
  id: string;
  storeName: string;
  status: string;
  avatar?: string;
  currentCommissionRate?: number;
}

interface CommissionHistory {
  id: string;
  rate: number;
  effectiveFrom: string;
  effectiveTo?: string;
  note?: string;
}

interface Payout {
  id: string;
  amount: number;
  method: string;
  status: string;
  paidAt?: string;
  createdAt: string;
  note?: string;
}

interface PayoutSummary {
  totalPending: number;
  totalPaid: number;
  currentBalance: number;
  lastPayoutDate?: string;
}

export default function VendorPayoutCommissionManager({
  vendorId,
  onBackToList,
}: VendorPayoutCommissionManagerProps) {
  const [activeTab, setActiveTab] = useState('commission');

  // Queries
  const { data: vendorResp, isLoading, error, refetch } = useGetVendorByIdQuery(vendorId);
  const { data: commissionHistoryResp } = useGetCommissionHistoryQuery(vendorId);
  const { data: payoutsResp } = useGetVendorPayoutsQuery(vendorId);
  const { data: payoutSummaryResp } = useGetPayoutSummaryQuery(vendorId);

  // unwrap responses with type assertions
  const vendor = vendorResp as Vendor | undefined;
  const commissionHistory = (commissionHistoryResp as CommissionHistory[]) || [];
  const payouts = (payoutsResp as Payout[]) || [];
  const payoutSummary = payoutSummaryResp as PayoutSummary | undefined;

  // Mutations
  const [setCommissionRate] = useSetCommissionRateMutation();
  const [createPayout] = useCreatePayoutMutation();

  // Forms
  const commissionForm = useForm<z.infer<typeof commissionFormSchema>>({
    resolver: zodResolver(commissionFormSchema),
    defaultValues: {
      rate: 0,
      categoryId: '',
      note: '',
      effectiveFrom: new Date(),
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

  // Pre-fill commission rate
  useEffect(() => {
    if (vendor?.currentCommissionRate) {
      commissionForm.setValue('rate', vendor.currentCommissionRate);
    }
    // Set a default category ID if needed
    commissionForm.setValue('categoryId', 'default-category');
  }, [vendor, commissionForm]);

  // Handlers
  const onCommissionUpdate = async (values: z.infer<typeof commissionFormSchema>) => {
    try {
      await setCommissionRate({
        vendorId,
        data: {
          rate: values.rate,
          categoryId: values.categoryId,
          note: values.note,
          effectiveFrom: values.effectiveFrom.toISOString(),
          effectiveTo: values.effectiveTo ? values.effectiveTo.toISOString() : undefined,
        },
      }).unwrap();

      toast.success('Commission rate has been updated successfully.');
      commissionForm.reset({
        rate: values.rate,
        categoryId: values.categoryId,
        note: '',
        effectiveFrom: new Date(),
        effectiveTo: undefined,
      });
      refetch();
    } catch {
      toast.error('Failed to update commission rate.');
    }
  };

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

      toast.success('Payout has been created successfully.');
      payoutForm.reset({
        amount: 0,
        method: '',
        period: '',
        note: '',
        effectiveDate: new Date(),
      });
      refetch();
    } catch {
      toast.error('Failed to create payout.');
    }
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
            <h3 className="text-lg font-medium">Failed to load vendor data</h3>
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
              <AvatarImage src={vendor.avatar} />
              <AvatarFallback>
                {vendor.storeName?.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-3xl font-bold">{vendor.storeName}</h1>
              <Badge
                variant={
                  vendor.status === 'ACTIVE'
                    ? 'default'
                    : 'secondary'
                }
              >
                {vendor.status}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="commission">Commission</TabsTrigger>
          <TabsTrigger value="payouts">Payouts</TabsTrigger>
        </TabsList>

        {/* Commission Tab */}
        <TabsContent value="commission" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Set Commission */}
            <Card>
              <CardHeader>
                <CardTitle>Set Commission Rate</CardTitle>
                <CardDescription>
                  {vendor.currentCommissionRate !== undefined
                    ? `Current rate: ${vendor.currentCommissionRate}%`
                    : 'No commission rate set'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...commissionForm}>
                  <form onSubmit={commissionForm.handleSubmit(onCommissionUpdate)} className="space-y-4">
                    {/* Rate */}
                    <FormField
                      control={commissionForm.control}
                      name="rate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Commission Rate (%)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              step="0.1"
                              placeholder="Enter commission rate"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Category ID - Hidden or visible based on your needs */}
                    <FormField
                      control={commissionForm.control}
                      name="categoryId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="default-category">Default Category</SelectItem>
                              <SelectItem value="electronics">Electronics</SelectItem>
                              <SelectItem value="fashion">Fashion</SelectItem>
                              <SelectItem value="home">Home & Garden</SelectItem>
                              <SelectItem value="beauty">Beauty</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Effective From */}
                    <FormField
                      control={commissionForm.control}
                      name="effectiveFrom"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Effective From *</FormLabel>
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

                    {/* Effective To */}
                    <FormField
                      control={commissionForm.control}
                      name="effectiveTo"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Effective To (Optional)</FormLabel>
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
                      control={commissionForm.control}
                      name="note"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Note (Optional)</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Add a note about this commission rate change"
                              className="resize-none"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button type="submit">Update Commission Rate</Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

            {/* Commission History */}
            <Card>
              <CardHeader>
                <CardTitle>Commission History</CardTitle>
                <CardDescription>Previous commission rates for this vendor</CardDescription>
              </CardHeader>
              <CardContent>
                {commissionHistory && commissionHistory.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Rate</TableHead>
                        <TableHead>Effective From</TableHead>
                        <TableHead>Effective To</TableHead>
                        <TableHead>Note</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {commissionHistory.slice(0, 5).map((commission) => (
                        <TableRow key={commission.id}>
                          <TableCell className="font-medium">{commission.rate}%</TableCell>
                          <TableCell>{format(new Date(commission.effectiveFrom), 'PP')}</TableCell>
                          <TableCell>
                            {commission.effectiveTo ? format(new Date(commission.effectiveTo), 'PP') : 'Ongoing'}
                          </TableCell>
                          <TableCell className="max-w-xs truncate">{commission.note || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-sm text-muted-foreground">No commission history available.</p>
                )}
              </CardContent>
            </Card>
          </div>
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
                          <FormLabel>Amount ($)</FormLabel>
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
                          <FormLabel>Payment Method</FormLabel>
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
                          <FormLabel>Period</FormLabel>
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
                            <Textarea placeholder="Add a note about this payout" className="resize-none" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button type="submit">Schedule Payout</Button>
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
                      <div>
                        <p className="text-sm font-medium">Pending Payouts</p>
                        <p className="text-2xl font-bold">${payoutSummary.totalPending?.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Paid Payouts</p>
                        <p className="text-2xl font-bold">${payoutSummary.totalPaid?.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Current Balance</p>
                        <p className="text-2xl font-bold">${payoutSummary.currentBalance?.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Last Payout</p>
                        <p className="text-sm">
                          {payoutSummary.lastPayoutDate ? format(new Date(payoutSummary.lastPayoutDate), 'PP') : 'Never'}
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
                          <TableHead>Status</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Note</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {payouts.slice(0, 5).map((payout) => (
                          <TableRow key={payout.id}>
                            <TableCell className="font-medium">${payout.amount.toFixed(2)}</TableCell>
                            <TableCell className="capitalize">{payout.method}</TableCell>
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
                            <TableCell>
                              {payout.paidAt
                                ? format(new Date(payout.paidAt), 'PP')
                                : format(new Date(payout.createdAt), 'PP')}
                            </TableCell>
                            <TableCell className="max-w-xs truncate">{payout.note || '-'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-sm text-muted-foreground">No payout history available.</p>
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