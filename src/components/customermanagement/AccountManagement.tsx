'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import {
  Download,
  Search,
  MoreHorizontal,
  UserX,
  UserCheck,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  useGetCustomersQuery,
  useToggleCustomerBlockMutation,
  useExportCustomersMutation,
  useDeleteCustomerMutation,
} from '@/features/customerManageApi';

// Validation schema for suspension
const blockCustomerSchema = z.object({
  reason: z.string().min(1, 'Reason is required'),
  notes: z.string().optional(),
});

interface CustomerFilter {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export default function AccountManagement() {
  const [filters, setFilters] = useState<CustomerFilter>({
    status: '',
    search: '',
    page: 1,
    limit: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);

  const { data, isLoading, error, refetch } = useGetCustomersQuery(filters);
  const [toggleCustomerBlock] = useToggleCustomerBlockMutation();
  const [deleteCustomer] = useDeleteCustomerMutation();
  const [exportCustomers] = useExportCustomersMutation();

  const blockForm = useForm<z.infer<typeof blockCustomerSchema>>({
    resolver: zodResolver(blockCustomerSchema),
    defaultValues: { reason: '', notes: '' },
  });

  // Handle search & filters
  const handleSearch = (value: string) =>
    setFilters({ ...filters, search: value, page: 1 });

  const handleStatusFilter = (value: string) =>
    setFilters({
      ...filters,
      status: value === 'ALL' ? '' : value,
      page: 1,
    });

  // Suspend (block)
  const handleBlockCustomer = async (
    values: z.infer<typeof blockCustomerSchema>
  ) => {
    try {
      await toggleCustomerBlock({
        id: selectedCustomer.id,
        block: false, // false = block (inactive)
        reason: values.reason,
      }).unwrap();

      toast.success(`Customer ${selectedCustomer.name} suspended`);
      setBlockDialogOpen(false);
      blockForm.reset();
      refetch();
    } catch {
      toast.error('Failed to suspend customer');
    }
  };

  // Activate (unblock)
  const handleUnblockCustomer = async (customerId: string, name: string) => {
    try {
      await toggleCustomerBlock({
        id: customerId,
        block: true, // true = active (unblock)
      }).unwrap();

      toast.success(`Customer ${name} activated`);
      refetch();
    } catch {
      toast.error('Failed to activate customer');
    }
  };

  // Delete
  const handleDeleteCustomer = async (customerId: string, name: string) => {
    try {
      await deleteCustomer(customerId).unwrap();
      toast.success(`Customer ${name} deleted`);
      refetch();
    } catch {
      toast.error('Failed to delete customer');
    }
  };

  // Export
  const handleExportCustomers = async () => {
    try {
      const result = await exportCustomers({
        fields: [
          'id',
          'name',
          'email',
          'phone',
          'isActive',
          'createdAt',
          'profile.walletBalance',
          'profile.loyaltyPoints',
        ],
        filters,
      }).unwrap();

      toast.success('Customer list exported');
      const blob = new Blob([result], {
        type:
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `customers-${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error('Export failed');
    }
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h3 className="text-lg font-medium">Failed to load customers</h3>
          <Button onClick={() => refetch()}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle>Account Management</CardTitle>
            <CardDescription>
              Manage customer accounts and export data
            </CardDescription>
          </div>
          <Button onClick={handleExportCustomers}>
            <Download className="h-4 w-4 mr-2" />
            Export Excel
          </Button>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search customers..."
                className="pl-8"
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
            <Select onValueChange={handleStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="SUSPENDED">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Wallet</TableHead>
                  <TableHead>Loyalty</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <Skeleton className="h-10" />
                    </TableCell>
                  </TableRow>
                ) : data?.data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center h-24">
                      No customers found.
                    </TableCell>
                  </TableRow>
                ) : (
                  data?.data.map((customer: any) => {
                    const status = customer.isActive ? 'ACTIVE' : 'SUSPENDED';
                    return (
                      <TableRow key={customer.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={customer.avatar} />
                              <AvatarFallback>
                                {customer.name?.substring(0, 2).toUpperCase() ||
                                  'CU'}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div>{customer.name || 'Unknown'}</div>
                              <div className="text-sm text-muted-foreground">
                                {customer.email || customer.phone}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              status === 'ACTIVE' ? 'default' : 'destructive'
                            }
                          >
                            {status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          $
                          {customer.profile?.walletBalance?.toFixed(2) ||
                            '0.00'}
                        </TableCell>
                        <TableCell>
                          {customer.profile?.loyaltyPoints || 0} pts
                        </TableCell>
                        <TableCell>
                          {format(new Date(customer.createdAt), 'PP')}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              {status === 'ACTIVE' ? (
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedCustomer(customer);
                                    setBlockDialogOpen(true);
                                  }}
                                >
                                  <UserX className="h-4 w-4 mr-2" /> Suspend
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleUnblockCustomer(
                                      customer.id,
                                      customer.name
                                    )
                                  }
                                >
                                  <UserCheck className="h-4 w-4 mr-2" /> Activate
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() =>
                                  handleDeleteCustomer(
                                    customer.id,
                                    customer.name
                                  )
                                }
                              >
                                <Trash2 className="h-4 w-4 mr-2" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Block Dialog */}
      <Dialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suspend Account</DialogTitle>
            <DialogDescription>
              Suspending {selectedCustomer?.name || 'this customer'} will block
              access.
            </DialogDescription>
          </DialogHeader>
          <Form {...blockForm}>
            <form
              onSubmit={blockForm.handleSubmit(handleBlockCustomer)}
              className="space-y-4"
            >
              <FormField
                control={blockForm.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reason *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Reason for suspension"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={blockForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Optional notes" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setBlockDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="destructive">
                  Suspend
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
