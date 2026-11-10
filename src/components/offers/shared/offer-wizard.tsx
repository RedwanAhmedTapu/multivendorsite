// components/offers/shared/offer-wizard.tsx
//
// Chrome for the offer create/edit wizards (admin create, admin edit, vendor
// create): compact header, one stepper and a sticky footer. The wizards keep
// their own fields and submit logic; this only frames them consistently.

"use client";

import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { AlertCircle, ArrowLeft, ArrowRight, Check, Info, Loader2, Percent, Shield, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { OFFER_WIZARD_STEPS, type OfferWizardStep } from "@/lib/offers/offer-view";
import { offerCard, offerPrimaryButton, offerSecondaryButton } from "./offer-ui";

export const WIZARD_STEP_META: Record<OfferWizardStep, { label: string; hint: string; icon: LucideIcon }> = {
  basic: { label: "Basic info", hint: "Title, type & banner", icon: Info },
  discount: { label: "Discount", hint: "Value & conditions", icon: Percent },
  rules: { label: "Rules & limits", hint: "Dates & usage", icon: Shield },
  advanced: { label: "Advanced", hint: "Targeting & review", icon: Users },
};

/** Card surface for wizard sections (applied to the wizards' shadcn Cards). */
export const wizardCard = "gap-0 rounded-2xl border-[#E5EAF2] py-0 shadow-[0_1px_2px_rgba(13,27,46,0.04)] [&>[data-slot=card-header]]:border-b [&>[data-slot=card-header]]:border-[#EEF2F7] [&>[data-slot=card-header]]:px-4 [&>[data-slot=card-header]]:py-3 [&>[data-slot=card-content]]:px-4 [&>[data-slot=card-content]]:py-4";
export const wizardCardTitle = "text-sm font-semibold text-[#0D1B2E]";

export function OfferWizardHeader({
  title,
  subtitle,
  onBack,
  badge,
  meta,
}: {
  title: string;
  subtitle?: string;
  onBack: () => void;
  badge?: React.ReactNode;
  meta?: React.ReactNode;
}) {
  return (
    <header className={cn(offerCard, "relative overflow-hidden px-4 py-3.5 sm:px-5")}>
      <div aria-hidden className="pointer-events-none absolute -right-20 -top-24 h-52 w-52 rounded-full bg-gradient-to-br from-indigo-200/50 via-violet-200/40 to-cyan-200/30 blur-3xl" />
      <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <Button type="button" variant="outline" size="icon" className={cn("h-9 w-9 shrink-0 rounded-xl", offerSecondaryButton)} onClick={onBack} aria-label="Back to offers">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold tracking-tight text-[#0D1B2E] sm:text-xl">{title}</h1>
            {subtitle && <p className="truncate text-xs text-[#7A90AB] sm:text-sm">{subtitle}</p>}
          </div>
        </div>
        {badge && <div className="shrink-0">{badge}</div>}
      </div>
      {meta && <div className="relative mt-3 flex flex-wrap items-center gap-2">{meta}</div>}
    </header>
  );
}

export function OfferWizardStepper({
  active,
  onSelect,
  complete,
}: {
  active: OfferWizardStep;
  onSelect: (s: OfferWizardStep) => void;
  /** Whether each step currently validates. */
  complete: Record<OfferWizardStep, boolean>;
}) {
  const activeIndex = OFFER_WIZARD_STEPS.indexOf(active);
  return (
    <nav aria-label="Offer steps" className={cn(offerCard, "p-1.5")}>
      <ol className="grid grid-cols-4 gap-1">
        {OFFER_WIZARD_STEPS.map((step, i) => {
          const meta = WIZARD_STEP_META[step];
          const isActive = step === active;
          const done = i < activeIndex && complete[step];
          // Forward jumps only when every step before the target is valid.
          const reachable = i <= activeIndex || OFFER_WIZARD_STEPS.slice(0, i).every((s) => complete[s]);
          return (
            <li key={step}>
              <button
                type="button"
                onClick={() => reachable && onSelect(step)}
                disabled={!reachable}
                aria-current={isActive ? "step" : undefined}
                className={cn(
                  "flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 sm:px-3",
                  isActive ? "bg-gradient-to-r from-indigo-50 to-violet-50 ring-1 ring-indigo-100" : "hover:bg-[#F5F8FD]",
                  !reachable && "cursor-not-allowed opacity-50 hover:bg-transparent",
                )}
              >
                <span
                  className={cn(
                    "grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-semibold",
                    isActive ? "bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-sm" : done ? "bg-emerald-500 text-white" : "bg-[#EEF3FB] text-[#7A90AB]",
                  )}
                >
                  {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
                </span>
                <span className="hidden min-w-0 sm:block">
                  <span className={cn("block truncate text-sm font-semibold", isActive ? "text-indigo-700" : "text-[#0D1B2E]")}>{meta.label}</span>
                  <span className="block truncate text-[11px] text-[#7A90AB]">{meta.hint}</span>
                </span>
                <span className="sr-only sm:hidden">{meta.label}</span>
              </button>
            </li>
          );
        })}
      </ol>
      <p className="px-2 pb-0.5 pt-1.5 text-xs font-medium text-indigo-700 sm:hidden">
        Step {activeIndex + 1} of {OFFER_WIZARD_STEPS.length}: {WIZARD_STEP_META[active].label}
      </p>
    </nav>
  );
}

export function OfferWizardFooter({
  active,
  onBack,
  onNext,
  onCancel,
  submitting,
  submitLabel,
  submittingLabel,
  issues,
}: {
  active: OfferWizardStep;
  onBack: () => void;
  onNext: () => void;
  onCancel: () => void;
  submitting: boolean;
  submitLabel: string;
  submittingLabel: string;
  /** Problems on the current step, shown after the user tried to continue. */
  issues: string[];
}) {
  const i = OFFER_WIZARD_STEPS.indexOf(active);
  const last = i === OFFER_WIZARD_STEPS.length - 1;
  return (
    <div className="sticky bottom-0 z-20 -mx-1 mt-2 px-1 pb-2 pt-1">
      <div className="rounded-2xl border border-[#E5EAF2] bg-white/90 px-3 py-2.5 shadow-[0_-4px_24px_rgba(13,27,46,0.08)] backdrop-blur supports-[backdrop-filter]:bg-white/75 sm:px-4">
        {issues.length > 0 && (
          <div role="alert" className="mb-2 flex items-start gap-2 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700 ring-1 ring-rose-100">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <ul className="space-y-0.5">{issues.map((m) => <li key={m}>{m}</li>)}</ul>
          </div>
        )}
        <div className="flex items-center justify-between gap-2">
          <Button type="button" variant="ghost" className="h-9 text-[#3D5068]" onClick={onCancel} disabled={submitting}>
            Cancel
          </Button>
          <div className="flex items-center gap-2">
            <span className="hidden text-xs text-[#7A90AB] sm:inline">Step {i + 1} of {OFFER_WIZARD_STEPS.length}</span>
            {i > 0 && (
              <Button type="button" variant="outline" className={cn("h-9", offerSecondaryButton)} onClick={onBack} disabled={submitting}>
                <ArrowLeft className="mr-1 h-4 w-4" /> Back
              </Button>
            )}
            {last ? (
              <Button type="submit" className={cn("h-9 min-w-[8.5rem]", offerPrimaryButton)} disabled={submitting} aria-busy={submitting}>
                {submitting ? <><Loader2 className="mr-1.5 h-4 w-4 animate-spin" />{submittingLabel}</> : <><Check className="mr-1.5 h-4 w-4" />{submitLabel}</>}
              </Button>
            ) : (
              <Button type="button" className={cn("h-9", offerPrimaryButton)} onClick={onNext}>
                Continue <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Wizard navigation state + guards shared by the three wizards: per-step
 * validation, forward jumps only through valid steps, and a ref-based lock so
 * a double click / double Enter can never submit twice.
 */
export function useOfferWizard(validate: (step: OfferWizardStep) => string[]) {
  const [active, setActive] = React.useState<OfferWizardStep>("basic");
  const [shownIssues, setShownIssues] = React.useState<string[]>([]);
  const submitLock = React.useRef(false);

  const complete = Object.fromEntries(OFFER_WIZARD_STEPS.map((s) => [s, validate(s).length === 0])) as Record<OfferWizardStep, boolean>;
  const index = OFFER_WIZARD_STEPS.indexOf(active);

  const go = (s: OfferWizardStep) => {
    setShownIssues([]);
    setActive(s);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const next = () => {
    const issues = validate(active);
    if (issues.length) { setShownIssues(issues); return false; }
    if (index < OFFER_WIZARD_STEPS.length - 1) go(OFFER_WIZARD_STEPS[index + 1]);
    return true;
  };
  const back = () => { if (index > 0) go(OFFER_WIZARD_STEPS[index - 1]); };

  /** Validate every step; on failure jump to the first broken one. */
  const validateAll = (): boolean => {
    for (const s of OFFER_WIZARD_STEPS) {
      const issues = validate(s);
      if (issues.length) { setActive(s); setShownIssues(issues); return false; }
    }
    setShownIssues([]);
    return true;
  };

  // Hide stale issues once the user fixes them.
  const currentIssues = shownIssues.length ? validate(active) : [];

  return {
    active,
    setActive: go,
    next,
    back,
    complete,
    isLast: index === OFFER_WIZARD_STEPS.length - 1,
    issues: currentIssues,
    validateAll,
    submitLock,
  };
}
