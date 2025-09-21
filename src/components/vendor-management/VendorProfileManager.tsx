// components/vendor-management/VendorProfileManager.tsx
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { CalendarIcon, ArrowLeft } from "lucide-react";

// Shadcn/ui components
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

// API hooks
import {
  useGetVendorByIdQuery,
  useUpdateVendorProfileMutation,
  useSetCommissionRateMutation,
  useGetCommissionHistoryQuery,
  useCreatePayoutMutation,
  useGetVendorPayoutsQuery,
  useGetPayoutSummaryQuery,
  useUpdateVendorStatusMutation,
} from "@/features/vendorManageApi";
import { toast } from "sonner";

// Form schemas
const profileFormSchema = z.object({
  storeName: z.string().min(2, {
    message: "Store name must be at least 2 characters.",
  }),
  avatar: z.string().url().optional().or(z.literal("")),
});

const commissionFormSchema = z.object({
  rate: z.number(),
  note: z.string().optional(),
  effectiveFrom: z.string().datetime().optional(),
  effectiveTo: z.string().datetime().optional(),
});

const payoutFormSchema = z.object({
  amount: z.number().min(0, {
    message: "Amount must be positive.",
  }),
  method: z.string().min(1, {
    message: "Payment method is required.",
  }),
  period: z.string().min(1, {
    message: "Period is required.",
  }),
  note: z.string().optional(),
});

interface VendorProfileManagerProps {
  vendorId: string;
  onBackToList: () => void;
}

export default function VendorProfileManager({
  vendorId,
  onBackToList,
}: VendorProfileManagerProps) {
  const [activeTab, setActiveTab] = useState("profile");

  // API queries
  const {
    data: vendor,
    isLoading,
    error,
    refetch,
  } = useGetVendorByIdQuery(vendorId);
  const { data: commissionHistory } = useGetCommissionHistoryQuery(vendorId);
  const { data: payouts } = useGetVendorPayoutsQuery(vendorId);
  const { data: payoutSummary } = useGetPayoutSummaryQuery(vendorId);

  // API mutations
  const [updateVendorProfile] = useUpdateVendorProfileMutation();
  const [setCommissionRate] = useSetCommissionRateMutation();
  const [createPayout] = useCreatePayoutMutation();
  const [updateVendorStatus] = useUpdateVendorStatusMutation();

  // Profile form
  const profileForm = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      storeName: "",
      avatar: "",
    },
  });

  // Commission form
  const commissionForm = useForm<z.infer<typeof commissionFormSchema>>({
    resolver: zodResolver(commissionFormSchema),
    defaultValues: {
      rate: 0,
      note: "",
    },
  });

  // Payout form
  const payoutForm = useForm<z.infer<typeof payoutFormSchema>>({
    resolver: zodResolver(payoutFormSchema),
    defaultValues: {
      amount: 0,
      method: "",
      period: "",
      note: "",
    },
  });

  // Set form values when vendor data is loaded
  useEffect(() => {
    if (vendor) {
      profileForm.reset({
        storeName: vendor.storeName,
        avatar: vendor.avatar || "",
      });

      if (vendor.currentCommissionRate) {
        commissionForm.setValue("rate", vendor.currentCommissionRate);
      }
    }
  }, [vendor, profileForm, commissionForm]);

  // Handle profile update
  const onProfileUpdate = async (values: z.infer<typeof profileFormSchema>) => {
    try {
      await updateVendorProfile({
        id: vendorId,
        data: values,
      }).unwrap();

      toast.success("Vendor profile has been updated successfully.");
      refetch();
    } catch (error) {
      toast.error("Failed to update vendor profile.");
    }
  };

  // Handle commission rate update
  const onCommissionUpdate = async (
    values: z.infer<typeof commissionFormSchema>
  ) => {
    try {
      await setCommissionRate({
        vendorId,
        data: values,
      }).unwrap();

      toast.success("Commission rate has been updated successfully.");
      commissionForm.reset();
      refetch();
    } catch (error) {
      toast.error("Failed to update commission rate.");
    }
  };

  // Handle payout creation
  const onPayoutCreate = async (values: z.infer<typeof payoutFormSchema>) => {
    try {
      await createPayout({
        vendorId,
        data: values,
      }).unwrap();

      toast.success("Payout has been created successfully.");
      payoutForm.reset();
    } catch (error) {
      toast.error("Failed to create payout.");
    }
  };

  // Handle status change
  const handleStatusChange = async (newStatus: string) => {
    try {
      await updateVendorStatus({ id: vendorId, status: newStatus }).unwrap();
      toast.success(`Vendor status updated to ${newStatus.toLowerCase()}`);
      refetch();
    } catch (error) {
      toast.error("Failed to update vendor status");
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Button variant="outline" onClick={onBackToList} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Vendors
        </Button>
        <Skeleton className="h-12 w-1/3" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  // Error state
  if (error || !vendor) {
    return (
      <div className="space-y-4">
        <Button variant="outline" onClick={onBackToList}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Vendors
        </Button>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h3 className="text-lg font-medium">Failed to load vendor data</h3>
            <p className="text-muted-foreground">
              Please try again later or check if the vendor ID is correct.
            </p>
            <Button className="mt-4" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Status badge color mapping
  const statusVariant = {
    PENDING: "secondary",
    ACTIVE: "default",
    SUSPENDED: "destructive",
    DEACTIVATED: "outline",
  } as const;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBackToList}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Vendors
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
              <div className="flex items-center space-x-2 mt-1">
                <Badge variant={statusVariant[vendor.status]}>
                  {vendor.status}
                </Badge>
                {vendor.user && (
                  <span className="text-sm text-muted-foreground">
                    {vendor.user.email || vendor.user.phone}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Joined</p>
          <p className="font-medium">
            {vendor?.createdAt
              ? format(new Date(vendor.createdAt), "PP")
              : "N/A"}
          </p>
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="commission">Commission</TabsTrigger>
          <TabsTrigger value="payouts">Payouts</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="actions">Actions</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update vendor profile details and store information.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...profileForm}>
                <form
                  onSubmit={profileForm.handleSubmit(onProfileUpdate)}
                  className="space-y-4"
                >
                  <FormField
                    control={profileForm.control}
                    name="storeName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Store Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter store name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={profileForm.control}
                    name="avatar"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Avatar URL</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="https://example.com/avatar.jpg"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          URL to the vendor&apos;s store avatar image.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit">Update Profile</Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          {vendor.user && (
            <Card>
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
                <CardDescription>
                  User account details associated with this vendor.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium">User ID</p>
                    <p className="text-sm text-muted-foreground">
                      {vendor.user.id}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Email</p>
                    <p className="text-sm text-muted-foreground">
                      {vendor.user.email || "Not provided"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Phone</p>
                    <p className="text-sm text-muted-foreground">
                      {vendor.user.phone || "Not provided"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Status</p>
                    <div className="flex items-center">
                      <Badge
                        variant={
                          vendor.user.isActive ? "default" : "destructive"
                        }
                      >
                        {vendor.user.isActive ? "Active" : "Inactive"}
                      </Badge>
                      <Badge
                        variant={vendor.user.isVerified ? "default" : "outline"}
                        className="ml-2"
                      >
                        {vendor.user.isVerified ? "Verified" : "Unverified"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Commission Tab */}
        <TabsContent value="commission" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Current Commission Rate</CardTitle>
                <CardDescription>
                  {vendor.currentCommissionRate !== undefined
                    ? `Current rate: ${vendor.currentCommissionRate}%`
                    : "No commission rate set"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...commissionForm}>
                  <form
                    onSubmit={commissionForm.handleSubmit(onCommissionUpdate)}
                    className="space-y-4"
                  >
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
                              onChange={(e) =>
                                field.onChange(parseFloat(e.target.value))
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={commissionForm.control}
                      name="note"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Note (Optional)</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Add a note about this commission rate change"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={commissionForm.control}
                        name="effectiveFrom"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Effective From</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant="outline"
                                    className="pl-3 text-left font-normal"
                                  >
                                    {field.value ? (
                                      format(field.value, "PPP")
                                    ) : (
                                      <span>Pick a date</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent
                                className="w-auto p-0"
                                align="start"
                              >
                                <Calendar
                                  mode="single"
                                  selected={
                                    field.value
                                      ? new Date(field.value)
                                      : undefined
                                  } // <-- convert here
                                  onSelect={(date) =>
                                    field.onChange(date?.toISOString())
                                  } // <-- store as string in form
                                  disabled={(date) =>
                                    date < new Date() ||
                                    date < new Date("1900-01-01")
                                  }
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
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
                                    className="pl-3 text-left font-normal"
                                  >
                                    {field.value ? (
                                      format(field.value, "PPP")
                                    ) : (
                                      <span>Pick a date</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent
                                className="w-auto p-0"
                                align="start"
                              >
                                <Calendar
                                  mode="single"
                                  selected={
                                    field.value
                                      ? new Date(field.value)
                                      : undefined
                                  } // convert string to Date
                                  onSelect={(date) =>
                                    field.onChange(date?.toISOString())
                                  } // convert Date back to string
                                  disabled={(date) =>
                                    date < new Date() ||
                                    date < new Date("1900-01-01")
                                  }
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <Button type="submit">Update Commission Rate</Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Commission History</CardTitle>
                <CardDescription>
                  Previous commission rates for this vendor.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {commissionHistory && commissionHistory.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Rate</TableHead>
                        <TableHead>Effective From</TableHead>
                        <TableHead>Effective To</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {commissionHistory.slice(0, 5).map((commission) => (
                        <TableRow key={commission.id}>
                          <TableCell className="font-medium">
                            {commission.rate}%
                          </TableCell>
                          <TableCell>
                            {format(new Date(commission.effectiveFrom), "PP")}
                          </TableCell>
                          <TableCell>
                            {commission.effectiveTo
                              ? format(new Date(commission.effectiveTo), "PP")
                              : "Ongoing"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No commission history available.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Payouts Tab */}
        <TabsContent value="payouts" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Create Payout</CardTitle>
                <CardDescription>
                  Schedule a new payout for this vendor.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...payoutForm}>
                  <form
                    onSubmit={payoutForm.handleSubmit(onPayoutCreate)}
                    className="space-y-4"
                  >
                    <FormField
                      control={payoutForm.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Amount</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="Enter payout amount"
                              {...field}
                              onChange={(e) =>
                                field.onChange(parseFloat(e.target.value))
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={payoutForm.control}
                      name="method"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Payment Method</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select payment method" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="bank_transfer">
                                Bank Transfer
                              </SelectItem>
                              <SelectItem value="paypal">PayPal</SelectItem>
                              <SelectItem value="stripe">Stripe</SelectItem>
                              <SelectItem value="check">Check</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={payoutForm.control}
                      name="period"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Period</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select period" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="weekly">Weekly</SelectItem>
                              <SelectItem value="bi-weekly">
                                Bi-Weekly
                              </SelectItem>
                              <SelectItem value="monthly">Monthly</SelectItem>
                              <SelectItem value="quarterly">
                                Quarterly
                              </SelectItem>
                              <SelectItem value="custom">Custom</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={payoutForm.control}
                      name="note"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Note (Optional)</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Add a note about this payout"
                              {...field}
                            />
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
                        <p className="text-2xl font-bold">
                          ${payoutSummary?.totalPending?.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Paid Payouts</p>
                        <p className="text-2xl font-bold">
                          ${payoutSummary?.totalPaid?.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Current Balance</p>
                        <p className="text-2xl font-bold">
                          ${payoutSummary?.currentBalance?.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Last Payout</p>
                        <p className="text-sm">
                          {payoutSummary?.lastPayoutDate
                            ? format(
                                new Date(payoutSummary.lastPayoutDate),
                                "PP"
                              )
                            : "Never"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle>Recent Payouts</CardTitle>
                  <CardDescription>
                    Latest payout transactions for this vendor.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {payouts && payouts.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Amount</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {payouts.slice(0, 5).map((payout) => (
                          <TableRow key={payout.id}>
                            <TableCell className="font-medium">
                              ${payout?.amount.toFixed(2)}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  payout.status === "PAID"
                                    ? "default"
                                    : payout.status === "PENDING"
                                    ? "secondary"
                                    : "destructive"
                                }
                              >
                                {payout?.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {format(new Date(payout.createdAt), "PP")}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No payout history available.
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          {vendor.performance && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Sales
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ${vendor?.performance.totalSales?.toFixed(2)}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Orders
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {vendor.performance.totalOrders}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    Fulfillment Rate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {vendor.performance.fulfillmentRatePct.toFixed(1)}%
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    Average Rating
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {vendor.performance.avgRating.toFixed(1)}/5
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {vendor._count && (
            <Card>
              <CardHeader>
                <CardTitle>Inventory Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold">
                      {vendor._count.products}
                    </p>
                    <p className="text-sm text-muted-foreground">Products</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{vendor._count.orders}</p>
                    <p className="text-sm text-muted-foreground">Orders</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{vendor._count.flags}</p>
                    <p className="text-sm text-muted-foreground">Flags</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Actions Tab */}
        <TabsContent value="actions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Vendor Actions</CardTitle>
              <CardDescription>
                Manage vendor status and perform administrative actions.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {vendor.status !== "ACTIVE" && (
                  <Button
                    onClick={() => handleStatusChange("ACTIVE")}
                    variant="outline"
                  >
                    Approve Vendor
                  </Button>
                )}
                {vendor.status !== "SUSPENDED" && (
                  <Button
                    onClick={() => handleStatusChange("SUSPENDED")}
                    variant="outline"
                    className="border-yellow-500 text-yellow-600 hover:bg-yellow-50"
                  >
                    Suspend Vendor
                  </Button>
                )}
                {vendor.status !== "DEACTIVATED" && (
                  <Button
                    onClick={() => handleStatusChange("DEACTIVATED")}
                    variant="outline"
                    className="border-red-500 text-red-600 hover:bg-red-50"
                  >
                    Deactivate Vendor
                  </Button>
                )}
                {vendor.status !== "ACTIVE" && (
                  <Button
                    onClick={() => handleStatusChange("ACTIVE")}
                    variant="outline"
                    className="border-green-500 text-green-600 hover:bg-green-50"
                  >
                    Activate Vendor
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
