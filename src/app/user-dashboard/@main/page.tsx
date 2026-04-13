"use client";

import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { useGetProfileQuery } from "@/features/customerProfileApi";
import { useGetMyOrdersQuery } from "@/features/userorderApi";
import { useGetCartCountQuery, useGetWishlistCountQuery } from "@/features/cartWishApi";
import Link from "next/link";
import {
  Package, Clock, Heart, Wallet, ShoppingBag,
  ArrowRight, Star, MessageSquare,
} from "lucide-react";
import { RecentOrdersTable } from "../_components/RecentOrdersTable";

export default function MainDashboardPage() {
  const { user } = useSelector((state: RootState) => state.auth);
  const isAuthenticated = !!user;

  const { data: profileData } = useGetProfileQuery(undefined, { skip: !isAuthenticated });
  const { data: ordersData } = useGetMyOrdersQuery({ page: 1, limit: 5 }, { skip: !isAuthenticated });
  const { data: cartCountData } = useGetCartCountQuery(undefined, { skip: !isAuthenticated });
  const { data: wishlistCountData } = useGetWishlistCountQuery(undefined, { skip: !isAuthenticated });

  const profile = profileData?.data;
  const firstName = user?.name?.split(" ")[0] || "there";
  const walletBalance = profile?.customerProfile?.wallet ?? 0;
  const loyaltyPoints = profile?.customerProfile?.loyaltyPoints ?? 0;

  const totalOrders = ordersData?.pagination?.total ?? 0;
  const pendingOrders = ordersData?.data?.filter((o) => o.status === "PENDING" || o.status === "PROCESSING")?.length ?? 0;
  const wishlistCount = wishlistCountData?.data?.count ?? 0;
  const cartCount = cartCountData?.data?.totalItems ?? 0;

  const stats = [
    {
      label: "Total orders",
      value: totalOrders,
      icon: Package,
      iconBg: "bg-[#0052cc]/10",
      iconColor: "text-[#0052cc]",
      sub: `${pendingOrders} pending`,
      subColor: "text-amber-600",
      href: "/user-dashboard/orders",
    },
    {
      label: "Pending",
      value: pendingOrders,
      icon: Clock,
      iconBg: "bg-amber-50",
      iconColor: "text-amber-600",
      sub: "Action required",
      subColor: "text-slate-400",
      href: "/user-dashboard/orders/pending",
    },
    {
      label: "Wishlist",
      value: wishlistCount,
      icon: Heart,
      iconBg: "bg-red-50",
      iconColor: "text-red-500",
      sub: "Saved items",
      subColor: "text-slate-400",
      href: "/user-dashboard/wishlist",
    },
    {
      label: "Wallet",
      value: `৳ ${walletBalance.toLocaleString("en-BD", { minimumFractionDigits: 2 })}`,
      icon: Wallet,
      iconBg: "bg-green-50",
      iconColor: "text-green-600",
      sub: `${loyaltyPoints.toLocaleString()} points`,
      subColor: "text-[#0052cc]",
      href: "/user-dashboard/wallet",
    },
  ];

  const quickActions = [
    { label: "Track order", desc: "Check your order status", icon: Package, href: "/user-dashboard/orders", bg: "bg-[#0052cc]/10", color: "text-[#0052cc]" },
    { label: "My wishlist", desc: "View saved products", icon: Heart, href: "/user-dashboard/wishlist", bg: "bg-red-50", color: "text-red-500" },
    { label: "My cart", desc: `${cartCount} item${cartCount !== 1 ? "s" : ""} waiting`, icon: ShoppingBag, href: "/cart", bg: "bg-amber-50", color: "text-amber-600" },
    { label: "Write a review", desc: "Share your experience", icon: Star, href: "/user-dashboard/reviews/write", bg: "bg-purple-50", color: "text-purple-600" },
    { label: "Wallet & rewards", desc: `৳ ${walletBalance.toFixed(0)} available`, icon: Wallet, href: "/user-dashboard/wallet", bg: "bg-green-50", color: "text-green-600" },
    { label: "Get support", desc: "Contact customer service", icon: MessageSquare, href: "/user-dashboard/support/chat", bg: "bg-slate-100", color: "text-slate-600" },
  ];

  return (
    <div className="space-y-5">

      {/* Welcome */}
      <div className="bg-white border border-slate-200 rounded-2xl px-6 py-5">
        <h1 className="text-xl font-semibold text-slate-800">
          Welcome back, {firstName} 👋
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Here&apos;s what&apos;s happening with your account today.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="bg-white border border-slate-200 rounded-2xl px-4 py-4 hover:border-[#0052cc]/30 transition-colors group"
          >
            <div className="flex items-start justify-between mb-3">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">{s.label}</p>
              <div className={`w-8 h-8 rounded-xl ${s.iconBg} flex items-center justify-center`}>
                <s.icon className={`w-4 h-4 ${s.iconColor}`} />
              </div>
            </div>
            <p className="text-2xl font-semibold text-slate-800">{s.value}</p>
            <p className={`text-xs mt-1 ${s.subColor}`}>{s.sub}</p>
          </Link>
        ))}
      </div>

      {/* Recent Orders Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-800">Recent orders</h2>
          <Link
            href="/user-dashboard/orders"
            className="flex items-center gap-1 text-xs text-[#0052cc] font-medium hover:underline"
          >
            View all <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <RecentOrdersTable orders={ordersData?.data ?? []} loading={!ordersData} />
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-sm font-semibold text-slate-700 mb-3">Quick actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {quickActions.map((a) => (
            <Link
              key={a.label}
              href={a.href}
              className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-3 hover:border-[#0052cc]/30 transition-colors group"
            >
              <div className={`w-10 h-10 rounded-xl ${a.bg} flex items-center justify-center flex-shrink-0`}>
                <a.icon className={`w-5 h-5 ${a.color}`} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">{a.label}</p>
                <p className="text-xs text-slate-400 truncate">{a.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

    </div>
  );
}