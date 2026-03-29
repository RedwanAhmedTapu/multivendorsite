"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Store, RefreshCw, MapPin, Hash } from "lucide-react";
import {
  usePathaoGetStoresQuery,
  useRedxGetPickupStoresQuery,
  type CourierProvider,
  type Environment,
} from "@/features/courierApi";

import type { ExistingStore } from "@/types/courier-store";

interface Props {
  pathaoProvider?: CourierProvider;
  redxProvider?: CourierProvider;
  environment: Environment;
  isLoading?: boolean;
}

export function VendorStoresTable({
  pathaoProvider,
  redxProvider,
  environment,
  isLoading,
}: Props) {
  const {
    data: pathaoData,
    isLoading: pathaoLoading,
    refetch: refetchPathao,
  } = usePathaoGetStoresQuery(
    { courierProviderId: pathaoProvider?.id ?? "", environment },
    { skip: !pathaoProvider },
  );
  const {
    data: redxData,
    isLoading: redxLoading,
    refetch: refetchRedx,
  } = useRedxGetPickupStoresQuery(
    { courierProviderId: redxProvider?.id ?? "", environment },
    { skip: !redxProvider },
  );

  const pathaoStores: ExistingStore[] = (
    pathaoData?.data?.data?.data || []
  ).map((s) => ({
    id: s.store_id,
    name: s.store_name,
    address: s.store_address,
    courier: "Pathao",
  }));
  const redxStores: ExistingStore[] = (redxData?.data?.stores || []).map(
    (s) => ({
      id: s.id,
      name: s.name,
      address: s.address,
      courier: "RedX",
    }),
  );

  const allStores = [...pathaoStores, ...redxStores];
  const storesLoading = pathaoLoading || redxLoading || isLoading;

  const handleRefresh = () => {
    if (pathaoProvider) refetchPathao();
    if (redxProvider) refetchRedx();
  };

  if (!pathaoProvider && !redxProvider) return null;

  return (
    <Card className="shadow-sm border-slate-200">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Store className="w-4 h-4 text-teal-600" />
            All Registered Pickup Stores
            {allStores.length > 0 && (
              <Badge
                variant="secondary"
                className="bg-teal-100 text-teal-700 border-teal-200 text-xs font-medium"
              >
                {allStores.length}
              </Badge>
            )}
          </CardTitle>
          <CardDescription className="text-xs mt-0.5">
            Stores across all configured courier providers · {environment}{" "}
            environment
          </CardDescription>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          disabled={storesLoading}
          className="h-8 w-8 p-0 text-slate-400 hover:text-slate-700"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 ${storesLoading ? "animate-spin" : ""}`}
          />
        </Button>
      </CardHeader>

      <CardContent className="p-0">
        {storesLoading ? (
          <div className="flex items-center justify-center py-10 text-slate-400 text-sm gap-2">
            <RefreshCw className="w-4 h-4 animate-spin" />
            Loading stores…
          </div>
        ) : allStores.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-slate-400 gap-2">
            <Store className="w-8 h-8 opacity-30" />
            <p className="text-sm">No pickup stores registered yet.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/80 hover:bg-slate-50">
                <TableHead className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                  Store Name
                </TableHead>
                <TableHead className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> Address
                  </span>
                </TableHead>
                <TableHead className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                  Courier
                </TableHead>
                <TableHead className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                  <span className="flex items-center gap-1">
                    <Hash className="w-3 h-3" /> ID
                  </span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allStores.map((store, i) => (
                <TableRow
                  key={`${store.courier}-${store.id}-${i}`}
                  className="hover:bg-slate-50/60 transition-colors"
                >
                  <TableCell className="font-medium text-sm text-slate-800">
                    {store.name}
                  </TableCell>
                  <TableCell className="text-sm text-slate-500 max-w-[200px] truncate">
                    {store.address || (
                      <span className="text-slate-300 italic">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        store.courier === "Pathao"
                          ? "bg-teal-50 text-teal-700 border-teal-200 text-xs"
                          : "bg-red-50 text-red-700 border-red-200 text-xs"
                      }
                    >
                      {store.courier}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-slate-400">
                    #{store.id}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
