"use client";

// components/reviews/integration-panel.tsx
//
// Shown wherever a screen is complete but its backend route is not. It states
// exactly what is missing instead of rendering fake rows or a false success.
// Delete the panel from a screen once its routes exist.

import { Code2, PlugZap } from "lucide-react";

interface EndpointSpec {
  method: string;
  path: string;
  body?: string;
  returns?: string;
}

interface IntegrationPanelProps {
  title?: string;
  description?: string;
  endpoints: readonly EndpointSpec[];
  variant?: "storefront" | "dashboard";
}

export function IntegrationPanel({
  title = "Backend contract required",
  description = "This screen is fully built and wired, but the routes below do not exist yet — so it makes no requests and reports no results.",
  endpoints,
  variant = "dashboard",
}: IntegrationPanelProps) {
  const dashboard = variant === "dashboard";
  return (
    <div
      className={`rounded-2xl border p-4 ${
        dashboard ? "border-amber-200 bg-amber-50/70" : "border-amber-200 bg-amber-50/70"
      }`}
    >
      <div className="flex items-start gap-2.5">
        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
          <PlugZap size={14} />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-amber-900">{title}</p>
          <p className="mt-0.5 text-[11px] leading-relaxed text-amber-800/80">{description}</p>

          <ul className="mt-2.5 space-y-1.5">
            {endpoints.map((endpoint) => (
              <li
                key={`${endpoint.method} ${endpoint.path}`}
                className="rounded-lg bg-white/80 px-2.5 py-1.5 ring-1 ring-amber-100"
              >
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="rounded bg-slate-900 px-1.5 py-0.5 text-[9px] font-bold tracking-wide text-white">
                    {endpoint.method}
                  </span>
                  <code className="break-all font-mono text-[10.5px] text-slate-700">
                    {endpoint.path}
                  </code>
                </div>
                {endpoint.body && (
                  <p className="mt-1 font-mono text-[10px] text-slate-500">body: {endpoint.body}</p>
                )}
                {endpoint.returns && (
                  <p className="mt-0.5 flex items-start gap-1 text-[10px] text-slate-500">
                    <Code2 size={9} className="mt-0.5 shrink-0" /> {endpoint.returns}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
