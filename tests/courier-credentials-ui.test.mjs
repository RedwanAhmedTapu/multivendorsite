// tests/courier-credentials-ui.test.mjs
//
// Courier Credentials admin UI — the Manage view must follow the refetched
// providers list, so a credential that was just added is visible immediately.
//
// Regression note (root cause of "an added Pathao credential does not appear"):
// the page held the whole provider OBJECT in state
// (`useState<CourierProvider | null>(null)`). The create/update/delete mutations
// do invalidate the providers list and the page does refetch — but a stored
// object is a snapshot, so the Manage tab kept rendering the credential list
// from the moment the provider was clicked. The page now keeps only the id and
// derives the object from the live query data on every render.
//
// The source-level guard at the end asserts the page wiring — the selected
// provider is derived from the CURRENT query data and only its id is state. It
// fails while that page change is missing, so run it after applying the edit.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { register } from "node:module";

register("./support/tsx-loader.mjs", import.meta.url);

const { resolveSelectedProvider, credentialsForEnvironment } = await import(
  "../src/lib/courier/selected-provider.ts"
);

const credential = (over = {}) => ({
  id: "cred-1",
  environment: "PRODUCTION",
  isActive: true,
  createdAt: "2026-10-15T00:00:00.000Z",
  ...over,
});
const provider = (over = {}) => ({
  id: "prov-1",
  name: "Pathao",
  displayName: "Pathao",
  isActive: true,
  courier_credentials: [],
  ...over,
});

test("a credential added by the refetch is visible through the derivation (stale-snapshot regression)", () => {
  const before = [provider({ courier_credentials: [] })];
  assert.deepEqual(
    credentialsForEnvironment(resolveSelectedProvider(before, "prov-1"), "PRODUCTION"),
    [],
    "no credentials before the create",
  );

  // What the create's tag invalidation produces: a NEW array holding a NEW
  // provider object with the new credential.
  const after = [provider({ courier_credentials: [credential({ id: "cred-new" })] })];
  assert.deepEqual(
    credentialsForEnvironment(resolveSelectedProvider(after, "prov-1"), "PRODUCTION").map((c) => c.id),
    ["cred-new"],
    "the new credential is visible without a page reload",
  );

  // The previous behaviour — a snapshot captured before the create — still
  // answers with the pre-create object, which is exactly the reported symptom.
  assert.deepEqual(
    credentialsForEnvironment(resolveSelectedProvider(before, "prov-1"), "PRODUCTION").map((c) => c.id),
    [],
    "a pre-create snapshot cannot see the new credential",
  );
});

test("Production and Sandbox stay separate, and an unknown or missing id resolves to null", () => {
  const list = [
    provider({
      courier_credentials: [
        credential({ id: "prod" }),
        credential({ id: "sand", environment: "SANDBOX" }),
      ],
    }),
  ];
  const p = resolveSelectedProvider(list, "prov-1");
  assert.deepEqual(credentialsForEnvironment(p, "PRODUCTION").map((c) => c.id), ["prod"]);
  assert.deepEqual(credentialsForEnvironment(p, "SANDBOX").map((c) => c.id), ["sand"]);
  assert.equal(resolveSelectedProvider(list, "missing"), null);
  assert.equal(resolveSelectedProvider(list, null), null);
  assert.equal(resolveSelectedProvider(undefined, "prov-1"), null);
  assert.equal(credentialsForEnvironment(null, "PRODUCTION").length, 0);
});

test("the credentials page derives the selected provider from current query data and stores only its id", () => {
  const src = readFileSync(
    new URL("../src/app/admin-dashboard/@main/courier/credentials/page.tsx", import.meta.url),
    "utf8",
  );
  // Imported and derived — never a stored object snapshot.
  assert.match(
    src,
    /import \{ resolveSelectedProvider \} from "@\/lib\/courier\/selected-provider"/,
    "the page imports the derivation helper",
  );
  assert.match(
    src,
    /const selectedProvider = resolveSelectedProvider\(providers, selectedProviderId\)/,
    "the selected provider is derived from the current providers array",
  );
  // Only the id is state, and the click handlers store the id through the adapter.
  assert.match(
    src,
    /const \[selectedProviderId, setSelectedProviderId\] = useState<string \| null>\(null\)/,
    "only the provider id is stored in state",
  );
  assert.doesNotMatch(
    src,
    /const \[selectedProvider, setSelectedProvider\]/,
    "no provider object snapshot is stored in state",
  );
  assert.match(
    src,
    /const setSelectedProvider = \(p: CourierProvider \| null\)/,
    "the existing call sites keep their object/null shape via the id adapter",
  );
});
