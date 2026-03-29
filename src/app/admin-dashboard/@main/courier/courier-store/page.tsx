"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Store, PackageCheck, AlertCircle, Plus } from "lucide-react";
import { useGetVendorsQuery } from "@/features/vendorManageApi";
import { useGetCourierProvidersQuery, type Environment } from "@/features/courierApi";

import { VendorListTable } from "@/components/courier/courierstorecreation/VendorListTable";
import { VendorStoresTable } from "@/components/courier/courierstorecreation/VendorStoresTable";
import { CreateStoreDrawer } from "@/components/courier/courierstorecreation/CreateStoreDrawer";
import type { VendorRow } from "@/types/courier-store";

export default function VendorCourierStoresPage() {
  const [environment, setEnvironment] = useState<Environment>("SANDBOX");
  const [drawerState, setDrawerState] = useState<{
    open: boolean;
    vendor: VendorRow | null;
  }>({ open: false, vendor: null });

  // Vendors
  const { data: vendorsData, isLoading: vendorsLoading, refetch: refetchVendors } = useGetVendorsQuery({
    status: "ACTIVE",
    limit: 50,
  });
  const vendors = vendorsData?.data || [];

  // Providers (for stores table overview)
  const { data: providersData, refetch: refetchProviders } = useGetCourierProvidersQuery({
    isActive: true,
  });
  const providers = providersData?.data || [];
  const pathaoProvider = providers.find((p) => p.name === "Pathao");
  const redxProvider = providers.find((p) => p.name === "RedX");

  const openDrawer = (vendor: VendorRow) => {
    setDrawerState({ open: true, vendor });
  };

  const closeDrawer = () => {
    setDrawerState({ open: false, vendor: null });
  };

  const handleSuccess = () => {
    refetchProviders();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50/40">
      <div className="container mx-auto px-4 sm:px-6 py-8 max-w-6xl space-y-8">

        {/* ── Page Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2.5 rounded-xl bg-teal-600 text-white shadow-md shadow-teal-200">
                <Store className="w-5 h-5" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Courier Pickup Stores
              </h1>
            </div>
            <p className="text-sm text-slate-500 ml-14">
              Register and manage vendor pickup locations across courier providers
            </p>
          </div>

          {/* Environment selector */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
              <span className="text-xs text-amber-700 font-medium">Environment:</span>
              <Select
                value={environment}
                onValueChange={(v: Environment) => setEnvironment(v)}
              >
                <SelectTrigger className="h-6 border-0 bg-transparent shadow-none p-0 w-28 text-xs font-semibold text-amber-800 focus:ring-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PRODUCTION">
                    <span className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                      Production
                    </span>
                  </SelectItem>
                  <SelectItem value="SANDBOX">
                    <span className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block" />
                      Sandbox
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Badge
              variant="outline"
              className="border-teal-200 text-teal-700 bg-teal-50 font-medium hidden sm:flex"
            >
              <PackageCheck className="w-3.5 h-3.5 mr-1.5" />
              Admin
            </Badge>
          </div>
        </div>

        {/* ── All Existing Stores Overview ── */}
        <VendorStoresTable
          pathaoProvider={pathaoProvider}
          redxProvider={redxProvider}
          environment={environment}
        />

        {/* ── Vendor List with Create Store actions ── */}
        <VendorListTable
          vendors={vendors}
          isLoading={vendorsLoading}
          onCreateStore={openDrawer}
        />

        {/* ── Create Store Drawer ── */}
        <CreateStoreDrawer
          open={drawerState.open}
          vendor={drawerState.vendor}
          environment={environment}
          onClose={closeDrawer}
          onSuccess={handleSuccess}
        />
      </div>
    </div>
  );
}