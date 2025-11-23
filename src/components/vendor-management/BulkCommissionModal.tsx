// components/vendor-management/BulkCommissionManager.tsx
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { 
  useGetVendorsQuery, 
  useBulkUpdateCommissionsMutation 
} from '@/features/vendorManageApi';
import CategoryTreeSelector from './CategoryTreeSelector';
import { Search, Filter, Settings, CheckCircle2, X } from 'lucide-react';

const bulkCommissionSchema = z.object({
  categoryId: z.string().min(1, 'Category is required'),
  rate: z.number().min(0).max(100, 'Rate must be 0-100'),
});

interface Vendor {
  id: string;
  storeName: string;
  status: string;
  currentCommissionRate?: number;
  user?: { email?: string };
  commissions?: Array<{
    categoryId: string;
    rate: number;
    category?: { name: string };
  }>;
}

export default function BulkCommissionManager() {
  const [selectedVendors, setSelectedVendors] = useState<string[]>([]);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const { data: vendorsData, isLoading, refetch } = useGetVendorsQuery({
    search: searchTerm,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    page: 1,
    limit: 100,
  });

  const [bulkUpdateCommissions, { isLoading: isUpdating }] = useBulkUpdateCommissionsMutation();

  const form = useForm<z.infer<typeof bulkCommissionSchema>>({
    resolver: zodResolver(bulkCommissionSchema),
    defaultValues: { categoryId: '', rate: 0 },
  });

  const vendors = vendorsData?.data || [];
  const selectedVendorsData = vendors.filter(vendor => selectedVendors.includes(vendor.id));

  const handleCategorySelect = (id: string, path: string, isLeaf: boolean) => {
    if (isLeaf) {
      const name = path.split(' > ').pop() || path;
      setSelectedCategory({ id, name });
      form.setValue('categoryId', id);
      setCategoryDialogOpen(false);
    } else {
      toast.error('Select leaf category only');
    }
  };

  const handleRemoveCategory = () => {
    setSelectedCategory(null);
    form.setValue('categoryId', '');
  };

  const handleVendorSelect = (vendorId: string) => {
    setSelectedVendors(prev => 
      prev.includes(vendorId) 
        ? prev.filter(id => id !== vendorId)
        : [...prev, vendorId]
    );
  };

  const handleSelectAll = () => {
    setSelectedVendors(selectedVendors.length === vendors.length ? [] : vendors.map(v => v.id));
  };

  const getCurrentCommission = (vendor: Vendor) => {
    if (!selectedCategory || !vendor.commissions) return null;
    const commission = vendor.commissions.find(comm => comm.categoryId === selectedCategory.id);
    return commission ? `${commission.rate}%` : null;
  };

  const onSubmit = async (values: z.infer<typeof bulkCommissionSchema>) => {
    if (selectedVendors.length === 0) {
      toast.error('Select at least one vendor');
      return;
    }

    try {
      await bulkUpdateCommissions({
        vendorIds: selectedVendors,
        rate: values.rate,
        categoryId: values.categoryId,
      }).unwrap();

      toast.success(`Commission set for ${selectedVendors.length} vendors`);
      setBulkModalOpen(false);
      form.reset();
      setSelectedCategory(null);
      setSelectedVendors([]);
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to update commissions');
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <CardTitle className="text-lg">Bulk Commission</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              {selectedVendors.length > 0 && (
                <Badge variant="secondary">
                  {selectedVendors.length} selected
                </Badge>
              )}
              <Button 
                onClick={() => setBulkModalOpen(true)}
                disabled={selectedVendors.length === 0}
                size="sm"
                className="flex items-center gap-1"
              >
                <Settings className="h-3 w-3" />
                Bulk Update
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search vendors..."
                className="pl-8 h-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[140px] h-9">
                <Filter className="h-3.5 w-3.5 mr-1" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="SUSPENDED">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10 px-2">
                    <Checkbox
                      checked={selectedVendors.length === vendors.length && vendors.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead className="px-2">Store</TableHead>
                  <TableHead className="px-2">Status</TableHead>
                  <TableHead className="px-2">Commission</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell className="px-2"><div className="h-4 w-4 bg-gray-200 rounded animate-pulse" /></TableCell>
                      <TableCell className="px-2"><div className="h-4 w-24 bg-gray-200 rounded animate-pulse" /></TableCell>
                      <TableCell className="px-2"><div className="h-5 w-16 bg-gray-200 rounded animate-pulse" /></TableCell>
                      <TableCell className="px-2"><div className="h-4 w-12 bg-gray-200 rounded animate-pulse" /></TableCell>
                    </TableRow>
                  ))
                ) : vendors.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center h-20 text-sm">
                      No vendors found
                    </TableCell>
                  </TableRow>
                ) : (
                  vendors.map((vendor) => (
                    <TableRow key={vendor.id} className={selectedVendors.includes(vendor.id) ? 'bg-muted/30' : ''}>
                      <TableCell className="px-2">
                        <Checkbox
                          checked={selectedVendors.includes(vendor.id)}
                          onCheckedChange={() => handleVendorSelect(vendor.id)}
                        />
                      </TableCell>
                      <TableCell className="px-2 font-medium text-sm">
                        {vendor.storeName}
                      </TableCell>
                      <TableCell className="px-2">
                        <Badge variant={vendor.status === 'ACTIVE' ? 'default' : vendor.status === 'PENDING' ? 'secondary' : 'destructive'} className="text-xs">
                          {vendor.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-2 text-sm">
                        {vendor.currentCommissionRate ? `${vendor.currentCommissionRate}%` : 'N/A'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Simplified Bulk Commission Modal */}
      <Dialog open={bulkModalOpen} onOpenChange={setBulkModalOpen}>
        <DialogContent className="max-w-3xl w-[95vw] h-[80vh] flex flex-col p-0">
          <DialogHeader className="px-6 py-4 border-b">
            <DialogTitle>Bulk Update ({selectedVendors.length} vendors)</DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-hidden px-6 pb-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="h-full flex flex-col">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
                  {/* Settings Column */}
                  <div className="space-y-4 flex flex-col min-h-0">
                    <div>
                      <FormLabel className="text-sm font-medium">Category *</FormLabel>
                      {selectedCategory ? (
                        <div className="flex items-center justify-between p-2 border rounded bg-teal-50 border-teal-200">
                          <span className="text-sm font-medium text-teal-800 truncate">
                            {selectedCategory.name}
                          </span>
                          <Button type="button" variant="ghost" size="sm" onClick={handleRemoveCategory} className="h-6 w-6 p-0">
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full h-9"
                          onClick={() => setCategoryDialogOpen(true)}
                        >
                          Select Category
                        </Button>
                      )}
                      <FormMessage />
                    </div>

                    <FormField
                      control={form.control}
                      name="rate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Commission Rate (%) *</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              step="0.01"
                              placeholder="0-100"
                              className="h-9"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Preview Column */}
                  <div className="flex flex-col min-h-0">
                    <FormLabel className="text-sm font-medium mb-2">Preview</FormLabel>
                    <div className="border rounded-lg flex-1 overflow-hidden">
                      <div className="overflow-y-auto h-full p-2 space-y-1">
                        {selectedVendorsData.map((vendor) => (
                          <div key={vendor.id} className="flex items-center justify-between p-2 text-sm border-b last:border-b-0">
                            <span className="truncate flex-1">{vendor.storeName}</span>
                            <div className="flex items-center gap-2 text-xs">
                              <span className="text-muted-foreground">
                                {getCurrentCommission(vendor) || 'Not set'}
                              </span>
                              {form.watch('rate') > 0 && selectedCategory && (
                                <span className="font-medium">→ {form.watch('rate')}%</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-4 mt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setBulkModalOpen(false)}
                    disabled={isUpdating}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={!selectedCategory || !form.watch('rate') || isUpdating}
                    className="flex-1"
                  >
                    {isUpdating ? (
                      <>
                        <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent mr-1" />
                        Applying...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Apply
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </DialogContent>
      </Dialog>

      {/* Category Dialog */}
      <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
        <DialogContent className="max-w-2xl w-[90vw] h-[70vh] p-0">
          <DialogHeader className="px-6 py-4 border-b">
            <DialogTitle>Select Category</DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto flex-1 px-6 pb-6">
            <CategoryTreeSelector onSelect={handleCategorySelect} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}