// src/components/hrm/hrm-utils.ts
//
// Defensive unwrapping for HRM API list responses. The HRM hooks have no
// transformResponse, so `query.data` is the raw `{ success, data }` envelope
// (or possibly a bare array / `{ items }` page). toArray returns the list
// for every observed shape and [] otherwise — so a shape mismatch can never
// crash a render with "x.map is not a function".

export function toArray(v: any): any[] {
  if (Array.isArray(v)) return v;
  if (Array.isArray(v?.items)) return v.items;
  if (Array.isArray(v?.data)) return v.data;
  return [];
}
