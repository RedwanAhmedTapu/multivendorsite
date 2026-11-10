// src/lib/courier/selected-provider.ts
//
// Which provider the admin's "Manage" view shows — resolved from the LIVE
// query data on every render instead of being stored.
//
// Why this exists (root cause of the "new credential does not appear" report):
// the credentials page kept the whole provider object in state:
//
//     const [selectedProvider, setSelectedProvider] = useState<CourierProvider | null>(null);
//
// A stored object is a snapshot. When a credential is created, the RTK Query
// mutations correctly invalidate the providers list and the page refetches it —
// but the Manage tab keeps rendering the object captured when the admin clicked
// the provider, i.e. the credential list as it was *before* the create. The new
// Pathao credential was therefore persisted and present in the refetched
// response, yet invisible until the page was reloaded or another provider was
// selected.
//
// Keeping only the id in state and resolving the object from the current
// providers array makes the Manage view follow every refetch, so create,
// update, delete and activate/deactivate are visible immediately.
import type { CourierProvider } from "@/features/courierApi";

/** The live provider with this id, or null when it is absent from the list. */
export function resolveSelectedProvider(
  providers: readonly CourierProvider[] | null | undefined,
  providerId: string | null | undefined,
): CourierProvider | null {
  if (!providerId) return null;
  return providers?.find((p) => p.id === providerId) ?? null;
}

/** Credentials of one provider for one environment (the Manage tab's two tabs). */
export function credentialsForEnvironment(
  provider: CourierProvider | null | undefined,
  environment: "PRODUCTION" | "SANDBOX",
) {
  return (provider?.courier_credentials ?? []).filter((c) => c.environment === environment);
}
