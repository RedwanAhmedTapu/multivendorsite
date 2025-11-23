// components/admin/offers/offers-header.tsx
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";

interface OffersHeaderProps {
  pendingApprovals?: number;
}

export function OffersHeader({ pendingApprovals = 0 }: OffersHeaderProps) {
  const router = useRouter();

  const handleCreateOffer = () => {
    router.push("/admin-dashboard/offer-manage/add-offer");
  };

  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Offers Management</h1>
        <p className="text-muted-foreground">
          Create and manage promotional offers, vouchers, and flash sales
        </p>
      </div>
      <div className="flex items-center gap-2">
        {pendingApprovals > 0 && (
          <Badge variant="destructive" className="mr-2">
            <AlertCircle className="w-3 h-3 mr-1" />
            {pendingApprovals} pending approval
          </Badge>
        )}
        <Button onClick={handleCreateOffer}>
          <Plus className="w-4 h-4 mr-2" />
          Create Offer
        </Button>
      </div>
    </div>
  );
}