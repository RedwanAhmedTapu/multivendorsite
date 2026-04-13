// app/user-dashboard/wishlist/page.tsx
"use client";

import { useState } from "react";
import { useGetWishlistQuery, useRemoveFromWishlistMutation, useMoveToCartMutation, useUpdateWishlistItemMutation } from "@/features/cartWishApi";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import Link from "next/link";
import Image from "next/image";
import { Heart, ShoppingBag, Trash2, Star, AlertCircle, MoveRight, Bell, BellOff, X } from "lucide-react";
import { toast } from "sonner";

function SkeletonCard() {
  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden animate-pulse">
      <div className="aspect-square bg-slate-100" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-slate-100 rounded w-3/4" />
        <div className="h-3 bg-slate-100 rounded w-1/2" />
        <div className="h-5 bg-slate-100 rounded w-1/3" />
        <div className="flex gap-2">
          <div className="h-9 bg-slate-100 rounded-lg flex-1" />
          <div className="h-9 bg-slate-100 rounded-lg w-9" />
        </div>
      </div>
    </div>
  );
}

function EmptyWishlist() {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl py-20 flex flex-col items-center gap-4">
      <div className="w-20 h-20 rounded-full bg-[#0052cc]/10 flex items-center justify-center">
        <Heart className="w-10 h-10 text-[#0052cc]" />
      </div>
      <div className="text-center">
        <h3 className="text-lg font-semibold text-slate-800 mb-1">Your wishlist is empty</h3>
        <p className="text-sm text-slate-400">Save your favorite items here</p>
      </div>
      <Link
        href="/products"
        className="mt-2 px-6 py-2.5 bg-gradient-to-r from-[#0052cc] to-[#2684ff] text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-all shadow-[0_4px_14px_rgba(0,82,204,0.28)]"
      >
        Browse Products
      </Link>
    </div>
  );
}

interface WishlistItemProps {
  item: any;
  onRemove: (id: string) => void;
  onMoveToCart: (id: string) => void;
  onUpdatePriority: (id: string, priority: number) => void;
  onToggleNotification: (id: string, notifyOnDiscount: boolean, notifyOnRestock: boolean) => void;
}

function WishlistItemCard({ item, onRemove, onMoveToCart, onUpdatePriority, onToggleNotification }: WishlistItemProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showPriorityMenu, setShowPriorityMenu] = useState(false);
  
  const product = item.products;
  const variant = item.product_variants;
  const price = variant?.price || 0;
  const hasVariant = !!variant;
  
  const priorityLabels: Record<number, { label: string; color: string }> = {
    1: { label: "Low", color: "bg-blue-100 text-blue-700" },
    2: { label: "Medium", color: "bg-amber-100 text-amber-700" },
    3: { label: "High", color: "bg-red-100 text-red-700" },
  };
  
  const priorityInfo = priorityLabels[item.priority] || priorityLabels[2];
  
  const notifyAny = item.notifyOnDiscount || item.notifyOnRestock;

  return (
    <div 
      className="group bg-white border border-slate-200 rounded-xl overflow-hidden hover:shadow-lg hover:border-[#0052cc]/20 transition-all duration-300"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Product Image */}
      <Link href={`/products/${product.slug}`} className="block relative aspect-square bg-slate-50">
        {product.thumbnailUrl ? (
          <Image
            src={product.thumbnailUrl}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ShoppingBag className="w-12 h-12 text-slate-300" />
          </div>
        )}
        
        {/* Priority Badge */}
        <div className="absolute top-3 left-3">
          <button
            onClick={() => setShowPriorityMenu(!showPriorityMenu)}
            className={`px-2 py-1 rounded-lg text-[11px] font-semibold ${priorityInfo.color} backdrop-blur-sm transition-all`}
          >
            {priorityInfo.label} Priority
          </button>
          
          {/* Priority Dropdown */}
          {showPriorityMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowPriorityMenu(false)} />
              <div className="absolute top-8 left-0 z-20 mt-1 w-32 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden">
                {[1, 2, 3].map((p) => (
                  <button
                    key={p}
                    onClick={() => {
                      onUpdatePriority(item.id, p);
                      setShowPriorityMenu(false);
                    }}
                    className={`w-full px-3 py-2 text-xs text-left hover:bg-slate-50 transition-colors ${
                      item.priority === p ? "text-[#0052cc] font-semibold" : "text-slate-600"
                    }`}
                  >
                    {priorityLabels[p].label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
        
        {/* Remove Button */}
        <button
          onClick={() => onRemove(item.id)}
          className={`absolute top-3 right-3 w-8 h-8 rounded-lg bg-white/90 backdrop-blur-sm flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all ${
            isHovered ? "opacity-100" : "opacity-0 md:opacity-0"
          }`}
        >
          <Trash2 size={16} />
        </button>
      </Link>
      
      {/* Product Info */}
      <div className="p-4 space-y-3">
        {/* Product Name */}
        <Link href={`/products/${product.slug}`}>
          <h3 className="font-semibold text-slate-800 text-sm line-clamp-2 hover:text-[#0052cc] transition-colors">
            {product.name}
          </h3>
        </Link>
        
        {/* Variant Info */}
        {hasVariant && variant.attributeValues && Object.keys(variant.attributeValues).length > 0 && (
          <div className="flex flex-wrap gap-1">
            {Object.entries(variant.attributeValues).map(([key, value]) => (
              <span key={key} className="text-xs text-slate-400">
                {value}
              </span>
            ))}
          </div>
        )}
        
        {/* Price */}
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-bold text-[#0052cc]">
            ৳ {price.toLocaleString("en-BD", { minimumFractionDigits: 2 })}
          </span>
          {variant?.compareAtPrice && variant.compareAtPrice > price && (
            <>
              <span className="text-sm text-slate-400 line-through">
                ৳ {variant.compareAtPrice.toLocaleString("en-BD", { minimumFractionDigits: 2 })}
              </span>
              <span className="text-xs font-semibold text-green-600 bg-green-50 px-1.5 py-0.5 rounded">
                {Math.round(((variant.compareAtPrice - price) / variant.compareAtPrice) * 100)}% off
              </span>
            </>
          )}
        </div>
        
        {/* Stock Status */}
        {hasVariant && variant.stock <= 0 && (
          <div className="flex items-center gap-1.5 text-xs text-red-500 bg-red-50 px-2 py-1 rounded-lg">
            <AlertCircle size={12} />
            Out of Stock
          </div>
        )}
        
        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <button
            onClick={() => onMoveToCart(item.id)}
            disabled={hasVariant && variant.stock <= 0}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-[#0052cc]/10 text-[#0052cc] text-sm font-semibold rounded-lg hover:bg-[#0052cc] hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <MoveRight size={16} />
            Move to Cart
          </button>
          
          <button
            onClick={() => onToggleNotification(item.id, !item.notifyOnDiscount, !item.notifyOnRestock)}
            className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
              notifyAny
                ? "bg-[#0052cc] text-white"
                : "bg-slate-100 text-slate-400 hover:bg-[#0052cc]/10 hover:text-[#0052cc]"
            }`}
            title={notifyAny ? "Notifications on" : "Notifications off"}
          >
            {notifyAny ? <Bell size={18} /> : <BellOff size={18} />}
          </button>
        </div>
        
        {/* Notification Settings */}
        {notifyAny && (
          <div className="flex gap-3 pt-1 text-[11px] text-slate-500">
            {item.notifyOnDiscount && (
              <span className="flex items-center gap-1">
                <Star size={10} /> Price drop
              </span>
            )}
            {item.notifyOnRestock && (
              <span className="flex items-center gap-1">
                <AlertCircle size={10} /> Back in stock
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function WishlistPage() {
  const { user } = useSelector((state: RootState) => state.auth);
  const { data, isLoading, refetch } = useGetWishlistQuery(undefined, { skip: !user });
  const [removeFromWishlist] = useRemoveFromWishlistMutation();
  const [moveToCart] = useMoveToCartMutation();
  const [updateWishlistItem] = useUpdateWishlistItemMutation();
  
  const wishlist = data?.data;
  const items = wishlist?.items || [];
  const totalItems = wishlist?.totalItems || 0;

  const handleRemove = async (itemId: string) => {
    try {
      await removeFromWishlist(itemId).unwrap();
      toast.success("Removed from wishlist");
      refetch();
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to remove item");
    }
  };

  const handleMoveToCart = async (itemId: string) => {
    try {
      await moveToCart({ itemId }).unwrap();
      toast.success("Moved to cart successfully");
      refetch();
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to move to cart");
    }
  };

  const handleUpdatePriority = async (itemId: string, priority: number) => {
    try {
      await updateWishlistItem({ itemId, data: { priority } }).unwrap();
      toast.success("Priority updated");
      refetch();
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to update priority");
    }
  };

  const handleToggleNotification = async (itemId: string, notifyOnDiscount: boolean, notifyOnRestock: boolean) => {
    try {
      await updateWishlistItem({ itemId, data: { notifyOnDiscount, notifyOnRestock } }).unwrap();
      toast.success(notifyOnDiscount || notifyOnRestock ? "Notifications enabled" : "Notifications disabled");
      refetch();
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to update notification settings");
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#f5f7f8] py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white border border-slate-200 rounded-2xl py-20 flex flex-col items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-[#0052cc]/10 flex items-center justify-center">
              <Heart className="w-10 h-10 text-[#0052cc]" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-slate-800 mb-1">Please login to view wishlist</h3>
              <p className="text-sm text-slate-400">Sign in to access your saved items</p>
            </div>
            <Link
              href="/login"
              className="mt-2 px-6 py-2.5 bg-gradient-to-r from-[#0052cc] to-[#2684ff] text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-all"
            >
              Login Now
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f7f8] py-8 px-4">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">My Wishlist</h1>
              <p className="text-sm text-slate-400 mt-1">
                {totalItems} {totalItems === 1 ? "item" : "items"} saved for later
              </p>
            </div>
            
            {totalItems > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <span className="px-3 py-1.5 rounded-full bg-[#0052cc]/10 text-[#0052cc] font-medium">
                  <Heart size={14} className="inline mr-1" />
                  {totalItems} Items
                </span>
              </div>
            )}
          </div>
        </div>
        
        {/* Content */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {[...Array(8)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : items.length === 0 ? (
          <EmptyWishlist />
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {items.map((item) => (
                <WishlistItemCard
                  key={item.id}
                  item={item}
                  onRemove={handleRemove}
                  onMoveToCart={handleMoveToCart}
                  onUpdatePriority={handleUpdatePriority}
                  onToggleNotification={handleToggleNotification}
                />
              ))}
            </div>
            
            {/* Footer Note */}
            <div className="mt-8 text-center">
              <p className="text-xs text-slate-400">
                Items in your wishlist are saved until you move them to cart or remove them
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}