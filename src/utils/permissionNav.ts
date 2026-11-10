// src/utils/permissionNav.ts
import type { NavPermissionKey } from "../hooks/usePermissions";

export type Icon = React.ComponentType<React.SVGProps<SVGSVGElement>>;

export type PermissionAwareMenuItem = {
  title: string;
  href: string;
  icon: Icon;
  color?: string;
  badge?: string;
  /** Omit for items every logged-in staff member should see (e.g. "Dashboard").
   *  Set to one of the 7 permission keys to gate it for EMPLOYEE role, or to
   *  "OWNER_ONLY" for sections no employee checkbox should ever unlock.
   *  ADMIN/VENDOR (owners) always see everything regardless of this field. */
  permissionKey?: NavPermissionKey;
  /** Open in a separate browser tab (e.g. the full-screen POS). The new tab
   *  reuses the same signed-in session (same-origin persisted auth state). */
  openInNewTab?: boolean;
  subItems?: PermissionAwareMenuItem[];
};

export type PermissionAwareSection = {
  title?: string;
  items: PermissionAwareMenuItem[];
};

/**
 * Filters sidebar sections down to what the current user is allowed to see.
 * - An item with no `permissionKey` is always visible.
 * - An item with a `permissionKey` is visible only if `can(key)` is true.
 * - A parent with `subItems` is kept only if at least one child survives
 *   the filter (or the parent itself has no subItems and passes its own check).
 * - A section with zero surviving items is dropped entirely.
 *
 * This is UX-only filtering — see usePermissions.ts for why the real
 * security boundary is the backend, not this function.
 */
export function filterSectionsByPermission(
  sections: PermissionAwareSection[],
  can: (key: NavPermissionKey) => boolean
): PermissionAwareSection[] {
  const filterItem = (item: PermissionAwareMenuItem): PermissionAwareMenuItem | null => {
    if (item.subItems && item.subItems.length > 0) {
      const survivingChildren = item.subItems
        .map(filterItem)
        .filter((x): x is PermissionAwareMenuItem => x !== null);
      if (survivingChildren.length === 0) return null;
      return { ...item, subItems: survivingChildren };
    }
    if (!item.permissionKey) return item;
    return can(item.permissionKey) ? item : null;
  };

  return sections
    .map((section) => ({
      ...section,
      items: section.items.map(filterItem).filter((x): x is PermissionAwareMenuItem => x !== null),
    }))
    .filter((section) => section.items.length > 0);
}
