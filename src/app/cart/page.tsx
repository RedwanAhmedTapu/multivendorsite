"use client";

// app/cart/page.tsx
//
// Cart route. Data and actions only — the layout is components/cart/CartView.tsx.
// Every handler below is the cart's existing behaviour (cartWishApi:
// updateCartItem, removeFromCart, toggleItemSelection, toggleAllItems,
// addToWishlist), unchanged. Added: a signed-out state using the existing
// LoginModal (the cart API needs a session), and Retry refetches instead of
// reloading the whole page.
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { toast } from "sonner";
import type { RootState } from "@/store/store";
import {
  useGetCartQuery,
  useUpdateCartItemMutation,
  useRemoveFromCartMutation,
  useToggleItemSelectionMutation,
  useToggleAllItemsMutation,
  useAddToWishlistMutation,
} from "@/features/cartWishApi";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { LoginModal } from "@/components/loginmodal/loginModal";
import { CartView, type CartStatus } from "@/components/cart/CartView";
import type { CartLine } from "@/lib/cart/display";

export default function CartPage() {
  const router = useRouter();
  const { user, accessToken } = useSelector((state: RootState) => state.auth);
  const isAuthenticated = !!user && !!accessToken;

  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());
  const [wishlistingIds, setWishlistingIds] = useState<Set<string>>(new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);

  const { data: cartData, isLoading, isFetching, isError, error, refetch } = useGetCartQuery(undefined, { skip: !isAuthenticated });
  const [updateCartItem] = useUpdateCartItemMutation();
  const [removeFromCart] = useRemoveFromCartMutation();
  const [toggleItemSelection] = useToggleItemSelectionMutation();
  const [toggleAllItems] = useToggleAllItemsMutation();
  const [addToWishlist] = useAddToWishlistMutation();

  const allItems = (cartData?.data.items || []) as CartLine[];
  const selectedItems = allItems.filter((i) => i.isSelected);
  const allSelected = allItems.length > 0 && allItems.every((i) => i.isSelected);
  const subtotal = cartData?.data.selectedSubtotal ?? 0;

  const errText = (e: any, fallback: string) => e?.data?.message || fallback;
  const errStatus = (error as { status?: unknown } | undefined)?.status;

  let status: CartStatus;
  if (!isAuthenticated || (isError && !cartData && (errStatus === 401 || errStatus === 403))) status = "signedOut";
  else if (isLoading || (isFetching && !cartData)) status = "loading";
  else if (isError && !cartData) status = "error";
  else status = "ready";

  const withId = (setter: React.Dispatch<React.SetStateAction<Set<string>>>, id: string, on: boolean) =>
    setter((p) => {
      const n = new Set(p);
      if (on) n.add(id);
      else n.delete(id);
      return n;
    });

  const handleQty = async (itemId: string, qty: number) => {
    if (qty < 1) return;
    withId(setUpdatingIds, itemId, true);
    try {
      await updateCartItem({ itemId, data: { quantity: qty } }).unwrap();
    } catch (e: any) {
      toast.error(errText(e, "Could not update the quantity. Please try again."));
    } finally {
      withId(setUpdatingIds, itemId, false);
    }
  };

  const handleRemove = async (itemId: string) => {
    withId(setRemovingIds, itemId, true);
    try {
      await removeFromCart(itemId).unwrap();
      toast.success("Item removed from cart");
    } catch (e: any) {
      toast.error(errText(e, "Could not remove the item. Please try again."));
    } finally {
      withId(setRemovingIds, itemId, false);
    }
  };

  const handleBulkRemove = async () => {
    setBulkDeleteOpen(false);
    if (selectedItems.length === 0) return;
    setBulkDeleting(true);
    let ok = 0;
    let failed = 0;
    for (const item of selectedItems) {
      try {
        await removeFromCart(item.id).unwrap();
        ok += 1;
      } catch {
        failed += 1;
      }
    }
    setBulkDeleting(false);
    if (ok > 0) toast.success(`${ok} item${ok !== 1 ? "s" : ""} removed`);
    if (failed > 0) toast.error(`${failed} item${failed !== 1 ? "s" : ""} could not be removed`);
  };

  const handleToggle = async (itemId: string) => {
    try {
      await toggleItemSelection(itemId).unwrap();
    } catch (e: any) {
      toast.error(errText(e, "Could not update selection. Please try again."));
    }
  };

  const handleVendorToggle = async (items: CartLine[]) => {
    const selectRest = items.some((i) => !i.isSelected);
    for (const item of items) {
      if (selectRest ? !item.isSelected : item.isSelected) {
        await toggleItemSelection(item.id)
          .unwrap()
          .catch((e: any) => toast.error(errText(e, "Could not update selection. Please try again.")));
      }
    }
  };

  const handleToggleAll = async () => {
    try {
      await toggleAllItems({ isSelected: !allSelected }).unwrap();
    } catch (e: any) {
      toast.error(errText(e, "Could not update selection. Please try again."));
    }
  };

  const handleSaveForLater = async (item: CartLine) => {
    withId(setWishlistingIds, item.id, true);
    try {
      await addToWishlist({ productId: item.productId, variantId: item.variantId }).unwrap();
      toast.success("Saved to wishlist");
    } catch (e: any) {
      toast.error(errText(e, "Could not save to wishlist. Please try again."));
    } finally {
      withId(setWishlistingIds, item.id, false);
    }
  };

  const handleProceedToCheckout = () => {
    if (selectedItems.length === 0) return;
    router.push("/checkout");
  };

  return (
    <>
      <CartView
        status={status}
        items={allItems}
        subtotal={subtotal}
        errorMessage={isError ? errText(error, "") || null : null}
        updatingIds={updatingIds}
        removingIds={removingIds}
        wishlistingIds={wishlistingIds}
        bulkDeleting={bulkDeleting}
        onQty={handleQty}
        onRemove={handleRemove}
        onSaveForLater={handleSaveForLater}
        onToggle={handleToggle}
        onToggleVendor={handleVendorToggle}
        onToggleAll={handleToggleAll}
        onRemoveSelected={() => setBulkDeleteOpen(true)}
        onCheckout={handleProceedToCheckout}
        onRetry={() => void refetch()}
        onSignIn={() => setLoginOpen(true)}
      />

      <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove selected items?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove {selectedItems.length} item{selectedItems.length !== 1 ? "s" : ""} from your cart. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep items</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkRemove} className="bg-red-600 text-white hover:bg-red-700">
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {loginOpen && (
        <LoginModal
          isOpen
          onClose={() => setLoginOpen(false)}
          onLoginSuccess={() => {
            toast.success("Login successful!");
            setLoginOpen(false); // the cart query starts once the session is in the store
          }}
          message="Sign in to see your cart"
        />
      )}
    </>
  );
}
