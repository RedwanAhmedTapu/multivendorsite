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
    // BG matches the shared admin color language: soft indigo-tinted canvas
    // instead of the old plain slate gradient.
    <div className="min-h-screen bg-[#F5F7FB]">
      {/* Compact container: tighter padding + gap-4 (was py-8 / space-y-8)
          so the page reads dense on desktop and doesn't force excess
          scrolling on mobile. */}
      <div className="container mx-auto px-3 py-4 sm:px-6 sm:py-6 max-w-6xl space-y-4 sm:space-y-5">

        {/* ── Page Header ──
            Card-wrapped (matches the product-form section-card language:
            white bg, #E5EAF2 border, rounded-2xl, soft shadow) instead of
            floating directly on the page background. Fully stacks on
            mobile: title block, then environment + admin badge below. */}
        <div className="bg-white rounded-2xl border border-[#E5EAF2] shadow-sm p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2 sm:p-2.5 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-sm shrink-0">
                <Store className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-[#0D1B2E] truncate">
                  Courier Pickup Stores
                </h1>
                <p className="text-xs sm:text-sm text-[#7A90AB] truncate">
                  Register and manage vendor pickup locations
                </p>
              </div>
            </div>

            {/* Environment selector + Admin badge: wraps under the title on
                narrow screens instead of overflowing. */}
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap sm:flex-shrink-0">
              <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-amber-50 border border-amber-200">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span className="text-xs text-amber-700 font-medium hidden xs:inline">Environment:</span>
                <Select
                  value={environment}
                  onValueChange={(v: Environment) => setEnvironment(v)}
                >
                  <SelectTrigger className="h-6 border-0 bg-transparent shadow-none p-0 w-24 sm:w-28 text-xs font-semibold text-amber-800 focus:ring-0">
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
                className="border-indigo-200 text-indigo-700 bg-indigo-50 font-medium"
              >
                <PackageCheck className="w-3.5 h-3.5 mr-1.5" />
                Admin
              </Badge>
            </div>
          </div>
        </div>

        {/* ── All Existing Stores Overview ──
            Wrapped so it inherits the same card language even though the
            child component renders its own internals. */}
        <div className="bg-white rounded-2xl border border-[#E5EAF2] shadow-sm overflow-hidden">
          <VendorStoresTable
            pathaoProvider={pathaoProvider}
            redxProvider={redxProvider}
            environment={environment}
          />
        </div>

        {/* ── Vendor List with Create Store actions ── */}
        <div className="bg-white rounded-2xl border border-[#E5EAF2] shadow-sm overflow-hidden">
          <VendorListTable
            vendors={vendors}
            isLoading={vendorsLoading}
            onCreateStore={openDrawer}
          />
        </div>

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