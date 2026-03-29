"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Store,
  Plus,
  Search,
  Users,
  RefreshCw,
  CheckCircle2,
  Clock,
  Ban,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import type { Vendor } from "@/features/vendorManageApi";
import type { VendorRow } from "@/types/courier-store";

const STATUS_BADGE: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
  ACTIVE: {
    label: "Active",
    cls: "bg-green-50 text-green-700 border-green-200",
    icon: <CheckCircle2 className="w-3 h-3" />,
  },
  PENDING: {
    label: "Pending",
    cls: "bg-amber-50 text-amber-700 border-amber-200",
    icon: <Clock className="w-3 h-3" />,
  },
  SUSPENDED: {
    label: "Suspended",
    cls: "bg-red-50 text-red-700 border-red-200",
    icon: <Ban className="w-3 h-3" />,
  },
  DEACTIVATED: {
    label: "Deactivated",
    cls: "bg-slate-100 text-slate-500 border-slate-200",
    icon: <XCircle className="w-3 h-3" />,
  },
};

interface Props {
  vendors: Vendor[];
  isLoading: boolean;
  onCreateStore: (vendor: VendorRow) => void;
}

export function VendorListTable({ vendors, isLoading, onCreateStore }: Props) {
  const [search, setSearch] = useState("");

  const filtered = vendors.filter(
    (v) =>
      v.storeName.toLowerCase().includes(search.toLowerCase()) ||
      v.user?.email?.toLowerCase().includes(search.toLowerCase()) ||
      v.user?.phone?.includes(search)
  );

  return (
    <Card className="shadow-sm border-slate-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-4">
          <div>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Users className="w-4 h-4 text-teal-600" />
              Vendors
              <Badge
                variant="secondary"
                className="bg-slate-100 text-slate-600 text-xs font-medium"
              >
                {vendors.length}
              </Badge>
            </CardTitle>
            <CardDescription className="text-xs mt-0.5">
              Click "Create Store" on any vendor to register a pickup location
            </CardDescription>
          </div>
          {/* Search */}
          <div className="relative w-52 flex-shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <Input
              className="pl-9 h-8 text-sm"
              placeholder="Search vendors…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {isLoading ? (
          <div className="flex items-center justify-center py-12 text-slate-400 gap-2 text-sm">
            <RefreshCw className="w-4 h-4 animate-spin" />
            Loading vendors…
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-2">
            <Users className="w-8 h-8 opacity-30" />
            <p className="text-sm">
              {search ? `No vendors matching "${search}"` : "No vendors found."}
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/80 hover:bg-slate-50">
                <TableHead className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                  Vendor
                </TableHead>
                <TableHead className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                  Contact
                </TableHead>
                <TableHead className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                  Status
                </TableHead>
                <TableHead className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                  Orders
                </TableHead>
                <TableHead className="text-right text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                  Action
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((vendor) => {
                const statusInfo =
                  STATUS_BADGE[vendor.status] || STATUS_BADGE["PENDING"];
                return (
                  <TableRow
                    key={vendor.id}
                    className="hover:bg-slate-50/60 transition-colors group"
                  >
                    {/* Vendor name + avatar */}
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-400 to-teal-600 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                          {vendor.storeName?.[0]?.toUpperCase() || "V"}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-800 truncate">
                            {vendor.storeName}
                          </p>
                          <p className="text-xs text-slate-400 truncate">
                            #{vendor.id.slice(-8)}
                          </p>
                        </div>
                      </div>
                    </TableCell>

                    {/* Contact */}
                    <TableCell>
                      <div className="text-xs text-slate-600 space-y-0.5">
                        {vendor.user?.email && (
                          <p className="truncate max-w-[160px]">{vendor.user.email}</p>
                        )}
                        {vendor.user?.phone && (
                          <p className="text-slate-400">{vendor.user.phone}</p>
                        )}
                      </div>
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-xs gap-1 py-0.5 ${statusInfo.cls}`}
                      >
                        {statusInfo.icon}
                        {statusInfo.label}
                      </Badge>
                    </TableCell>

                    {/* Orders count */}
                    <TableCell className="text-sm text-slate-600 font-medium">
                      {vendor._count?.orders ?? 0}
                    </TableCell>

                    {/* Action */}
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-3 text-xs gap-1.5 border-teal-200 text-teal-700 hover:bg-teal-50 hover:border-teal-400 group-hover:border-teal-300 transition-colors"
                        onClick={() =>
                          onCreateStore({
                            id: vendor.id,
                            storeName: vendor.storeName,
                            email: vendor.user?.email,
                            phone: vendor.user?.phone,
                            status: vendor.status,
                          })
                        }
                      >
                        <Plus className="w-3 h-3" />
                        Create Store
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}