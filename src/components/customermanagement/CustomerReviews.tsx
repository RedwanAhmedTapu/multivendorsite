"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import {
  useGetCustomersQuery,
  useGetCustomerReviewsQuery,
  useModerateReviewMutation,
  Customer,
} from "@/features/customerManageApi";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

// ------------------------------
// Review type
// ------------------------------
export interface Review {
  id: string;
  product?: { name?: string };
  user?: { name?: string };
  customerName?: string;
  authorName?: string;
  comment?: string;
  body?: string;
  rating?: number;
  stars?: number;
  createdAt?: string;
}

// ------------------------------
// Component
// ------------------------------
export default function CustomerReviewManagement() {
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);

  const { data, isLoading, error, refetch } = useGetCustomersQuery({
    page: 1,
    limit: 10,
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  const customers: Customer[] = data?.data ?? [];

  const {
    data: reviewsRaw,
    isLoading: reviewsLoading,
    refetch: refetchReviews,
  } = useGetCustomerReviewsQuery(selectedCustomer?.id ?? "", {
    skip: !selectedCustomer?.id,
  });

  const reviewsList: Review[] = reviewsRaw ?? [];

  const [moderateReview, { isLoading: isModerating }] = useModerateReviewMutation();

  // Fetch reviews when dialog opens
  useEffect(() => {
    if (reviewDialogOpen && selectedCustomer?.id && refetchReviews) {
      refetchReviews().catch(() => {});
    }
  }, [reviewDialogOpen, selectedCustomer?.id, refetchReviews]);

  const handleOpenReviews = (customer: Customer) => {
    setSelectedCustomer(customer);
    setReviewDialogOpen(true);
  };

  const handleModeration = async (reviewId: string, action: "approve" | "reject" | "flag") => {
    try {
      await moderateReview({ reviewId, data: { action } }).unwrap();
      toast.success(`Review ${action}d successfully.`);
      if (refetchReviews) await refetchReviews();
    } catch (err) {
      console.error(err);
      toast.error("Failed to moderate review");
    }
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h3 className="text-lg font-medium">Failed to load customers</h3>
          <p className="text-sm text-muted-foreground">
            Please try again or check your connection.
          </p>
          <div className="mt-4">
            <Button onClick={() => refetch()}>Retry</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Customers Table */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Customer Reviews</CardTitle>
            <CardDescription>
              Manage customer feedback — approve, reject, or flag suspicious reviews.
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-6">
                      Loading customers...
                    </TableCell>
                  </TableRow>
                ) : customers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-6">
                      No customers found
                    </TableCell>
                  </TableRow>
                ) : (
                  customers.map((customer) => {
                    const status = customer.isActive ? "ACTIVE" : "SUSPENDED";
                    return (
                      <TableRow key={customer.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={customer.avatar ?? undefined} />
                              <AvatarFallback>
                                {(customer.name ?? "CU").substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{customer.name ?? "Unknown"}</div>
                              <div className="text-sm text-muted-foreground">
                                {customer.email ?? customer.phone ?? ""}
                              </div>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>
                          <Badge variant={status === "ACTIVE" ? "default" : "destructive"}>
                            {status}
                          </Badge>
                        </TableCell>

                        <TableCell>
                          {customer.createdAt ? format(new Date(customer.createdAt), "PP") : "-"}
                        </TableCell>

                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenReviews(customer)}
                          >
                            View Reviews
                          </Button>
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

      {/* Reviews Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Reviews for {selectedCustomer?.name ?? "Customer"}</DialogTitle>
            <DialogDescription>
              Moderate reviews and flag inappropriate content.
            </DialogDescription>
          </DialogHeader>

          {reviewsLoading ? (
            <div className="py-6 text-center">
              <Loader2 className="inline-block mr-2 animate-spin" />
              Loading reviews...
            </div>
          ) : reviewsList.length === 0 ? (
            <div className="py-6 text-center text-muted-foreground">
              No reviews found for this customer.
            </div>
          ) : (
            <div className="space-y-4 max-h-[60vh] overflow-y-auto py-2">
              {reviewsList.map((review) => {
                const reviewerName =
                  review.user?.name ?? review.customerName ?? review.authorName ?? "Anonymous";
                const rating = review.rating ?? review.stars ?? "-";

                return (
                  <Card key={review.id} className="border">
                    <CardHeader className="flex items-start justify-between">
                      <div>
                        <div className="font-medium">{review.product?.name ?? "Product"}</div>
                        <div className="text-sm text-muted-foreground">{reviewerName}</div>
                      </div>
                      <div className="text-sm font-medium">⭐ {rating}</div>
                    </CardHeader>

                    <CardContent>
                      <p className="mb-3">{review.comment ?? review.body ?? "-"}</p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleModeration(review.id, "approve")}
                          disabled={isModerating}
                        >
                          {isModerating ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : null}
                          Approve
                        </Button>

                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleModeration(review.id, "reject")}
                          disabled={isModerating}
                        >
                          Reject
                        </Button>

                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleModeration(review.id, "flag")}
                          disabled={isModerating}
                        >
                          Flag Fake
                        </Button>
                      </div>
                      <div className="mt-2 text-xs text-muted-foreground">
                        {review.createdAt ? format(new Date(review.createdAt), "PPp") : ""}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
