// components/vendor-management/VendorPromotionalOffer.tsx
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
  useGetVendorOffersQuery,
  useCreateOfferMutation,
  useToggleOfferStatusMutation,
} from "@/features/vendorManageApi";
import { toast } from "sonner";
import { format } from "date-fns";
import { Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function VendorPromotionalOffer() {
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [filters, setFilters] = useState({
    search: '',
    status: undefined as string | undefined,
  });

  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [validFrom, setValidFrom] = useState("");
  const [validTo, setValidTo] = useState("");

  // Vendor list query
  const { data: vendors, isLoading: isLoadingVendors, error: vendorsError, refetch: refetchVendors } = useGetVendorsQuery({
    page,
    limit,
    ...filters,
  });

  // Vendor offers query
  const { data: offersRes, isLoading: isLoadingOffers, refetch: refetchOffers } = useGetVendorOffersQuery(selectedVendorId!, {
    skip: !selectedVendorId,
  });
  const offers= offersRes;

  const [createOffer] = useCreateOfferMutation();
  const [toggleOfferStatus] = useToggleOfferStatusMutation();

  const handleSearch = (value: string) => {
    setFilters({ ...filters, search: value });
    setPage(1);
  };

  const handleCreateOffer = async () => {
  if (!title.trim()) {
    toast.error("Title is required");
    return;
  }
  if (!selectedVendorId) {
    toast.error("Please select a vendor first");
    return;
  }

  try {
    // Convert date inputs to ISO format if provided
    const formattedValidFrom = validFrom ? new Date(validFrom).toISOString() : new Date().toISOString();
    const formattedValidTo = validTo ? new Date(validTo).toISOString() : undefined;

    await createOffer({
      vendorId: selectedVendorId,
      data: {
        title,
        details,
        validFrom: formattedValidFrom,
        validTo: formattedValidTo,
      },
    }).unwrap();

    toast.success("Offer created successfully");
    setTitle("");
    setDetails("");
    setValidFrom("");
    setValidTo("");
    refetchOffers();
  } catch {
    toast.error("Failed to create offer");
  }
};


  const handleToggleStatus = async (offerId: string, isActive: boolean) => {
    try {
      await toggleOfferStatus({ offerId, isActive: !isActive }).unwrap();
      toast.success(`Offer ${isActive ? "deactivated" : "activated"}`);
      refetchOffers();
    } catch {
      toast.error("Failed to update offer status");
    }
  };

  const handleBackToList = () => {
    setSelectedVendorId(null);
    setTitle("");
    setDetails("");
    setValidFrom("");
    setValidTo("");
  };

  if (selectedVendorId) {
    const selectedVendor = vendors?.data?.find(v => v.id === selectedVendorId);
    
    return (
      <div className="space-y-6">
        <Button variant="outline" onClick={handleBackToList} className="mb-4">
          ← Back to Vendors
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Promotional Offers for {selectedVendor?.storeName}</CardTitle>
            <CardDescription>
              Create and manage promotional offers for this vendor
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Create Offer Form */}
            <div className="space-y-4 border p-4 rounded-md">
              <h3 className="font-semibold text-lg">Create New Offer</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Input
                    placeholder="Offer Title *"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full"
                  />
                  <Textarea
                    placeholder="Offer Details"
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    className="min-h-[100px]"
                  />
                </div>
                <div className="space-y-2">
                  <div>
                    <label className="text-sm font-medium">Valid From</label>
                    <Input
                      type="date"
                      value={validFrom}
                      onChange={(e) => setValidFrom(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Valid To (Optional)</label>
                    <Input
                      type="date"
                      value={validTo}
                      onChange={(e) => setValidTo(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <Button onClick={handleCreateOffer} className="w-full mt-4">
                    Create Offer
                  </Button>
                </div>
              </div>
            </div>

            {/* Offers List */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Existing Offers</h3>
              {isLoadingOffers ? (
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : offers && offers.length > 0 ? (
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Details</TableHead>
                        <TableHead>Valid Period</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {offers.map((offer) => (
                        <TableRow key={offer.id}>
                          <TableCell className="font-medium">{offer.title}</TableCell>
                          <TableCell className="max-w-xs truncate">
                            {offer.details || "-"}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div>From: {format(new Date(offer.validFrom), "PP")}</div>
                              <div>
                                To:{" "}
                                {offer.validTo
                                  ? format(new Date(offer.validTo), "PP")
                                  : "No end date"}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={offer.isActive ? "default" : "secondary"}
                              className={offer.isActive ? "bg-green-600" : "bg-gray-500"}
                            >
                              {offer.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleToggleStatus(offer.id, offer.isActive)}
                            >
                              {offer.isActive ? "Deactivate" : "Activate"}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 border rounded-md">
                  <p className="text-muted-foreground">No offers found for this vendor.</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Create your first promotional offer above.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Vendor Promotional Offers</CardTitle>
        <CardDescription>
          Select a vendor to create and manage promotional offers
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
                <TableHead>Offers</TableHead>
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
                          vendor.status === 'ACTIVE'
                            ? 'default'
                            : vendor.status === 'PENDING'
                            ? 'secondary'
                            : 'destructive'
                        }
                      >
                        {vendor.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{vendor._count?.products || 0}</TableCell>
                    <TableCell>{vendor._count?.offers || 0}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        onClick={() => setSelectedVendorId(vendor.id)}
                      >
                        Manage Offers
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {vendors?.pagination && vendors.pagination.pages > 1 && (
          <div className="flex justify-center mt-6">
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <span className="flex items-center px-4">
                Page {page} of {vendors.pagination.pages}
              </span>
              <Button
                variant="outline"
                onClick={() => setPage(Math.min(vendors.pagination.pages, page + 1))}
                disabled={page === vendors.pagination.pages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}