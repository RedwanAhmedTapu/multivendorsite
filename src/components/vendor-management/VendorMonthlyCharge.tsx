// components/vendor-management/VendorMonthlyCharge.tsx
"use client";

import { useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  useGetVendorsQuery,
  useSetMonthlyChargeMutation,
  useBulkSetMonthlyChargesMutation,
  useGetVendorChargesQuery,
} from "@/features/vendorManageApi";
import { toast } from "sonner";
import { format } from "date-fns";
import { Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function VendorMonthlyCharge() {
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [filters, setFilters] = useState({
    search: "",
    status: undefined as string | undefined,
  });

  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [effectiveFrom, setEffectiveFrom] = useState("");
  const [effectiveTo, setEffectiveTo] = useState("");

  // Vendor list query
  const { data: vendors, isLoading: isLoadingVendors } = useGetVendorsQuery({
    page,
    limit,
    ...filters,
  });

  // Vendor charges query
  const { data: chargesRes, isLoading: isLoadingCharges, refetch: refetchCharges } =
    useGetVendorChargesQuery(selectedVendorId!, {
      skip: !selectedVendorId,
    });
  const charges = chargesRes?.data || [];

  const [setMonthlyCharge] = useSetMonthlyChargeMutation();
  const [bulkSetMonthlyCharges] = useBulkSetMonthlyChargesMutation();

  const handleSearch = (value: string) => {
    setFilters({ ...filters, search: value });
    setPage(1);
  };

  const handleCreateCharge = async () => {
    if (!amount.trim() || isNaN(Number(amount))) {
      toast.error("Amount is required and must be a number");
      return;
    }
    if (!selectedVendorId) {
      toast.error("Please select a vendor first");
      return;
    }

    try {
      const formattedFrom = effectiveFrom
        ? new Date(effectiveFrom).toISOString()
        : new Date().toISOString();
      const formattedTo = effectiveTo ? new Date(effectiveTo).toISOString() : undefined;

      await setMonthlyCharge({
        vendorId: selectedVendorId,
        data: {
          amount: Number(amount),
          description,
          effectiveFrom: formattedFrom,
          effectiveTo: formattedTo,
        },
      }).unwrap();

      toast.success("Monthly charge set successfully");
      setAmount("");
      setDescription("");
      setEffectiveFrom("");
      setEffectiveTo("");
      refetchCharges();
    } catch {
      toast.error("Failed to set monthly charge");
    }
  };

  const handleBulkCharges = async () => {
    if (!amount.trim() || isNaN(Number(amount))) {
      toast.error("Amount is required and must be a number");
      return;
    }
    try {
      const vendorIds = vendors?.data.map((v) => v.id) || [];
      await bulkSetMonthlyCharges({
        vendorIds,
        amount: Number(amount),
        description,
        effectiveFrom: effectiveFrom ? new Date(effectiveFrom).toISOString() : undefined,
      }).unwrap();

      toast.success("Bulk monthly charges applied to all vendors");
      setAmount("");
      setDescription("");
      setEffectiveFrom("");
      setEffectiveTo("");
    } catch {
      toast.error("Failed to set bulk charges");
    }
  };

  const handleBackToList = () => {
    setSelectedVendorId(null);
    setAmount("");
    setDescription("");
    setEffectiveFrom("");
    setEffectiveTo("");
  };

  if (selectedVendorId) {
    const selectedVendor = vendors?.data?.find((v) => v.id === selectedVendorId);

    return (
      <div className="space-y-6">
        <Button variant="outline" onClick={handleBackToList} className="mb-4">
          ← Back to Vendors
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Monthly Charges for {selectedVendor?.storeName}</CardTitle>
            <CardDescription>
              Create and manage monthly charges for this vendor
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Create Charge Form */}
            <div className="space-y-4 border p-4 rounded-md">
              <h3 className="font-semibold text-lg">Set Monthly Charge</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Input
                    placeholder="Amount *"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                  <Textarea
                    placeholder="Description (optional)"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <div>
                    <label className="text-sm font-medium">Effective From</label>
                    <Input
                      type="date"
                      value={effectiveFrom}
                      onChange={(e) => setEffectiveFrom(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Effective To (Optional)</label>
                    <Input
                      type="date"
                      value={effectiveTo}
                      onChange={(e) => setEffectiveTo(e.target.value)}
                    />
                  </div>
                  <Button onClick={handleCreateCharge} className="w-full mt-4">
                    Set Charge
                  </Button>
                </div>
              </div>
            </div>

            {/* Charges List */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Existing Charges</h3>
              {isLoadingCharges ? (
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : charges && charges.length > 0 ? (
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Amount</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Effective Period</TableHead>
                        <TableHead>Created At</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {charges.map((charge) => (
                        <TableRow key={charge.id}>
                          <TableCell>${charge.amount}</TableCell>
                          <TableCell>{charge.description || "-"}</TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div>From: {format(new Date(charge.effectiveFrom), "PP")}</div>
                              <div>
                                To:{" "}
                                {charge.effectiveTo
                                  ? format(new Date(charge.effectiveTo), "PP")
                                  : "No end date"}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{format(new Date(charge.createdAt), "PP")}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 border rounded-md">
                  <p className="text-muted-foreground">No charges found for this vendor.</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Create your first monthly charge above.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Vendor List
  return (
    <Card>
      <CardHeader>
        <CardTitle>Vendor Monthly Charges</CardTitle>
        <CardDescription>
          Select a vendor to create and manage monthly charges
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search vendors..."
              className="pl-8"
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Store</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Products</TableHead>
                <TableHead>Charges</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingVendors ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell className="text-right">
                      <Skeleton className="h-8 w-24 ml-auto" />
                    </TableCell>
                  </TableRow>
                ))
              ) : vendors?.data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-24">
                    No vendors found.
                  </TableCell>
                </TableRow>
              ) : (
                vendors?.data.map((vendor) => (
                  <TableRow key={vendor.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        {vendor.avatar && (
                          <img
                            src={vendor.avatar}
                            alt={vendor.storeName}
                            className="h-8 w-8 rounded-full"
                          />
                        )}
                        <div>{vendor.storeName}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          vendor.status === "APPROVED" || vendor.status === "ACTIVE"
                            ? "default"
                            : vendor.status === "PENDING"
                            ? "secondary"
                            : "destructive"
                        }
                      >
                        {vendor.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{vendor._count?.products || 0}</TableCell>
                    <TableCell>{vendor._count?.monthlyCharges || 0}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" onClick={() => setSelectedVendorId(vendor.id)}>
                        Manage Charges
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
