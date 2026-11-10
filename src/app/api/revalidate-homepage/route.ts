// app/api/revalidate-homepage/route.ts
//
// POST { scope: "config" | "layout" | "card" | "all" } with the admin's
// `Authorization: Bearer <token>`. Expires only the requested config cache
// tags (homepage config, active layout, global product card), so a publish or
// layout switch shows up on the next request instead of
// after the 5-minute / 1-hour safety-net revalidation. Everything else stays
// cached.
import { revalidateTag } from "next/cache";
import { tagsForScope, verifyAdminToken } from "@/lib/homepage-config/revalidate";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  const scope = body && typeof body === "object" ? (body as { scope?: unknown }).scope : undefined;
  const tags = tagsForScope(scope);
  if (!tags) {
    return Response.json({ success: false, error: 'scope must be "config", "layout", "card" or "all"' }, { status: 400 });
  }

  const admin = await verifyAdminToken(request.headers.get("authorization"), API_URL, fetch);
  if (!admin.ok) {
    return Response.json({ success: false, error: admin.error }, { status: admin.status });
  }

  // Next 16: a profile is required. { expire: 0 } expires the tag immediately
  // (the next request refetches), unlike "max" which serves stale first.
  for (const tag of tags) revalidateTag(tag, { expire: 0 });
  return Response.json({ success: true, revalidated: tags });
}
