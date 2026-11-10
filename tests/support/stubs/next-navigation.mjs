// TEST-ONLY stand-in for next/navigation (no app router in node --test).
// router.push calls are recorded on globalThis.__routerPushes for assertions.
const pushes = (globalThis.__routerPushes ??= []);
const router = {
  push: (href) => pushes.push(href),
  replace: (href) => pushes.push(href),
  back() {},
  forward() {},
  refresh() {},
  prefetch() {},
};
export const useRouter = () => router;
export const usePathname = () => "/";
// Tests may set globalThis.__searchParams (e.g. "tran_id=T1"); default: empty, as before.
export const useSearchParams = () => new URLSearchParams(globalThis.__searchParams ?? "");
export const redirect = () => {
  throw new Error("redirect() is not available in tests");
};
