"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import {
  useGetCustomersQuery,
  useGetWalletTransactionsQuery,
  useAdjustWalletMutation,
  useGetLoyaltyTransactionsQuery,
  useAdjustLoyaltyMutation,
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
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function CustomerWalletLoyalty() {
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [walletDialogOpen, setWalletDialogOpen] = useState(false);
  const [loyaltyDialogOpen, setLoyaltyDialogOpen] = useState(false);

  // fetch customers
  const { data, isLoading, error, refetch } = useGetCustomersQuery({
    page: 1,
    limit: 10,
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  // Wallet + Loyalty queries (skip until dialog opens)
  const {
    data: walletTx,
    isLoading: walletLoading,
    refetch: refetchWallet,
  } = useGetWalletTransactionsQuery(selectedCustomer?.id ?? "", {
    skip: !selectedCustomer?.id || !walletDialogOpen,
  });
  const {
    data: loyaltyTx,
    isLoading: loyaltyLoading,
    refetch: refetchLoyalty,
  } = useGetLoyaltyTransactionsQuery(selectedCustomer?.id ?? "", {
    skip: !selectedCustomer?.id || !loyaltyDialogOpen,
  });

  // Mutations
  const [adjustWallet, { isLoading: adjustingWallet }] =
    useAdjustWalletMutation();
  const [adjustLoyalty, { isLoading: adjustingLoyalty }] =
    useAdjustLoyaltyMutation();

  // Form state
  const [walletAmount, setWalletAmount] = useState("");
  const [loyaltyPoints, setLoyaltyPoints] = useState("");

  // Refetch wallet when dialog opens
  useEffect(() => {
    if (selectedCustomer?.id && walletDialogOpen && typeof refetchWallet === "function") {
      refetchWallet();
    }
  }, [selectedCustomer?.id, walletDialogOpen, refetchWallet]);

  // Refetch loyalty when dialog opens
  useEffect(() => {
    if (selectedCustomer?.id && loyaltyDialogOpen && typeof refetchLoyalty === "function") {
      refetchLoyalty();
    }
  }, [selectedCustomer?.id, loyaltyDialogOpen, refetchLoyalty]);

  const handleAdjustWallet = async () => {
    if (!walletAmount) return;
    try {
      await adjustWallet({
        userId: selectedCustomer.id,
        data: { amount: parseFloat(walletAmount) },
      }).unwrap();
      toast.success("Wallet adjusted successfully.");
      setWalletAmount("");
      refetchWallet();
    } catch (err) {
      console.error(err);
      toast.error("Failed to adjust wallet");
    }
  };

  const handleAdjustLoyalty = async () => {
    if (!loyaltyPoints) return;
    try {
      await adjustLoyalty({
        userId: selectedCustomer.id,
        data: { points: parseInt(loyaltyPoints) },
      }).unwrap();
      toast.success("Loyalty points adjusted successfully.");
      setLoyaltyPoints("");
      refetchLoyalty();
    } catch (err) {
      console.error(err);
      toast.error("Failed to adjust loyalty points");
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
        <CardHeader>
          <CardTitle>Wallet & Loyalty Points</CardTitle>
          <CardDescription>
            Monitor customer balances and loyalty points, adjust if needed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Wallet Balance</TableHead>
                  <TableHead>Loyalty Points</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : (
                  data?.data?.map((customer: any) => (
                    <TableRow key={customer.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={customer.avatar ?? undefined} />
                            <AvatarFallback>
                              {(customer.name ?? "CU")
                                .substring(0, 2)
                                .toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div>{customer.name ?? "Unknown"}</div>
                            <div className="text-sm text-muted-foreground">
                              {customer.email ?? customer.phone}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge>{customer.customerProfile?.wallet ?? 0} ৳</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {customer.customerProfile?.loyaltyPoints ?? 0} pts
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedCustomer(customer);
                            setWalletDialogOpen(true);
                          }}
                        >
                          Wallet
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedCustomer(customer);
                            setLoyaltyDialogOpen(true);
                          }}
                        >
                          Loyalty
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

      {/* Wallet Dialog */}
      <Dialog open={walletDialogOpen} onOpenChange={setWalletDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Wallet for {selectedCustomer?.name ?? "Customer"}
            </DialogTitle>
            <DialogDescription>Manage wallet balance and history.</DialogDescription>
          </DialogHeader>
          {walletLoading ? (
            <p>Loading wallet...</p>
          ) : (
            <>
              <div className="flex gap-2 items-center mb-4">
                <Input
                  placeholder="Enter amount (+/-)"
                  value={walletAmount}
                  onChange={(e) => setWalletAmount(e.target.value)}
                />
                <Button onClick={handleAdjustWallet} disabled={adjustingWallet}>
                  {adjustingWallet ? (
                    <Loader2 className="animate-spin w-4 h-4" />
                  ) : (
                    "Adjust"
                  )}
                </Button>
              </div>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {walletTx?.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No transactions found.
                  </p>
                ) : (
                  walletTx?.map((tx: any) => (
                    <div key={tx.id} className="border p-2 rounded">
                      <div className="flex justify-between">
                        <span>{tx.type}</span>
                        <span>{tx.amount} ৳</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {tx.createdAt
                          ? format(new Date(tx.createdAt), "PPp")
                          : ""}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Loyalty Dialog */}
      <Dialog open={loyaltyDialogOpen} onOpenChange={setLoyaltyDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Loyalty Points for {selectedCustomer?.name ?? "Customer"}
            </DialogTitle>
            <DialogDescription>
              Manage loyalty points and history.
            </DialogDescription>
          </DialogHeader>
          {loyaltyLoading ? (
            <p>Loading loyalty points...</p>
          ) : (
            <>
              <div className="flex gap-2 items-center mb-4">
                <Input
                  placeholder="Enter points (+/-)"
                  value={loyaltyPoints}
                  onChange={(e) => setLoyaltyPoints(e.target.value)}
                />
                <Button onClick={handleAdjustLoyalty} disabled={adjustingLoyalty}>
                  {adjustingLoyalty ? (
                    <Loader2 className="animate-spin w-4 h-4" />
                  ) : (
                    "Adjust"
                  )}
                </Button>
              </div>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {loyaltyTx?.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No transactions found.
                  </p>
                ) : (
                  loyaltyTx?.map((tx: any) => (
                    <div key={tx.id} className="border p-2 rounded">
                      <div className="flex justify-between">
                        <span>{tx.type}</span>
                        <span>{tx.points} pts</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {tx.createdAt
                          ? format(new Date(tx.createdAt), "PPp")
                          : ""}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
