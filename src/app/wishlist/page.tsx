"use client";

// app/wishlist/page.tsx
//
// Wishlist route. Data + actions only — the layout lives in
// components/wishlist/WishlistView.tsx and every product is the shared
// SharedProductCard (global Product Card Design applies).
//   - data: the existing cartWishApi getWishlist query (skipped while signed out);
//   - remove: the existing removeFromWishlist mutation (its LIST / COUNT tags
//     refresh this list and the header count);
//   - clear all: the existing clearWishlist mutation, after a confirmation;
//   - Add to Cart: the shared card's own flow (adds the saved variant; it
//     never removes the wishlist item);
//   - signed out / expired session: the existing LoginModal; the list loads
//     as soon as the shopper is signed in.
import { useState } from "react";
import { useSelector } from "react-redux";
import { toast } from "sonner";
import type { RootState } from "@/store/store";
import {
  useClearWishlistMutation,
  useGetWishlistQuery,
  useRemoveFromWishlistMutation,
  type WishlistItem,
} from "@/features/cartWishApi";
import { LoginModal } from "@/components/loginmodal/loginModal";
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
import { WishlistView, type WishlistStatus } from "@/components/wishlist/WishlistView";
import { removeWishlistItem, type WishlistNotify } from "@/lib/wishlist/card";

const notify: WishlistNotify = (tone, message) => (tone === "success" ? toast.success(message) : toast.error(message));

function errorInfo(error: unknown): { authExpired: boolean; message: string | null } {
  const e = (error && typeof error === "object" ? error : {}) as { status?: unknown; data?: { message?: unknown; error?: unknown } };
  if (e.status === 401 || e.status === 403) return { authExpired: true, message: null };
  if (typeof e.status !== "number") return { authExpired: false, message: "We couldn’t reach the server." };
  const m = typeof e.data?.message === "string" ? e.data.message : typeof e.data?.error === "string" ? e.data.error : null;
  return { authExpired: false, message: m };
}

export default function WishlistPage() {
  const { user, accessToken } = useSelector((state: RootState) => state.auth);
  const isAuthenticated = !!user && !!accessToken;

  const { data, error, isError, isLoading, isFetching, refetch } = useGetWishlistQuery(undefined, {
    skip: !isAuthenticated,
    refetchOnMountOrArgChange: true,
  });
  const [removeFromWishlist] = useRemoveFromWishlistMutation();
  const [clearWishlist, { isLoading: clearing }] = useClearWishlistMutation();

  const [removingIds, setRemovingIds] = useState<ReadonlySet<string>>(new Set());
  const [loginOpen, setLoginOpen] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  const items: WishlistItem[] = data?.data?.items ?? [];
  const info = isError ? errorInfo(error) : null;

  let status: WishlistStatus;
  if (!isAuthenticated || (info?.authExpired && !data)) status = "signedOut";
  else if (isLoading || (isFetching && !data)) status = "loading";
  else if (isError && !data) status = "error";
  else status = "ready";

  const handleRemove = async (item: WishlistItem) => {
    if (removingIds.has(item.id)) return;
    setRemovingIds((s) => new Set(s).add(item.id));
    await removeWishlistItem(item.id, item.products?.name ?? "", {
      remove: (id) => removeFromWishlist(id).unwrap(),
      notify,
    });
    setRemovingIds((s) => {
      const next = new Set(s);
      next.delete(item.id);
      return next;
    });
  };

  const handleClearAll = async () => {
    try {
      await clearWishlist().unwrap();
      toast.success("Your wishlist is now empty");
    } catch (e) {
      toast.error(errorInfo(e).message ?? "Could not clear your wishlist. Please try again.");
    } finally {
      setConfirmClear(false);
    }
  };

  return (
    <>
      <WishlistView
        status={status}
        items={items}
        errorMessage={info?.message}
        removingIds={removingIds}
        clearing={clearing}
        onRemove={handleRemove}
        onRetry={() => void refetch()}
        onSignIn={() => setLoginOpen(true)}
        onClearAll={() => setConfirmClear(true)}
      />

      {loginOpen && (
        <LoginModal
          isOpen
          onClose={() => setLoginOpen(false)}
          onLoginSuccess={() => {
            toast.success("Login successful!");
            setLoginOpen(false); // the wishlist query starts once the session is in the store
          }}
          message="Sign in to see your wishlist"
        />
      )}

      <AlertDialog open={confirmClear} onOpenChange={(open) => !clearing && setConfirmClear(open)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear your wishlist?</AlertDialogTitle>
            <AlertDialogDescription>
              All {items.length} saved {items.length === 1 ? "item" : "items"} will be removed. This can’t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={clearing}>Keep items</AlertDialogCancel>
            <AlertDialogAction
              disabled={clearing}
              className="bg-red-600 hover:bg-red-700"
              onClick={(e) => {
                e.preventDefault(); // stay open until the request settles
                void handleClearAll();
              }}
            >
              {clearing ? "Clearing…" : "Clear wishlist"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
