"use client";

import React, { useEffect, useRef } from "react";
import {
  Check,
  Store,
  MapPin,
  Building2,
  FileCheck,
  CreditCard,
} from "lucide-react";

export type WizardStep =
  | "store-info"
  | "address"
  | "account-type"
  | "documents"
  | "bank-info";

interface WizardProgressProps {
  progress: number;
  currentStep: WizardStep;
  getStepStatus: (stepKey: WizardStep) => "completed" | "current" | "pending";
  onStepClick?: (step: WizardStep) => void;
}

const steps: {
  key: WizardStep;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
}[] = [
  { key: "store-info",   title: "Store Info",    description: "Basic store details",  icon: Store      },
  { key: "address",      title: "Address",       description: "Collection location",  icon: MapPin     },
  { key: "account-type", title: "Account Type",  description: "Business setup",       icon: Building2  },
  { key: "documents",    title: "Documents",     description: "Verification files",   icon: FileCheck  },
  { key: "bank-info",    title: "Bank Info",     description: "Payment details",      icon: CreditCard },
];

export default function WizardProgress({
  progress,
  currentStep,
  getStepStatus,
  onStepClick,
}: WizardProgressProps) {
  const progressBarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (progressBarRef.current) {
      progressBarRef.current.style.width = `${Math.max(progress, 2)}%`;
    }
  }, [progress]);

  const currentStepData  = steps.find((s) => s.key === currentStep);
  const completedCount   = steps.filter((s) => getStepStatus(s.key) === "completed").length;
  const currentStepIndex = steps.findIndex((s) => s.key === currentStep);

  const handleStepClick = (step: WizardStep, status: string) => {
    if (onStepClick && (status === "completed" || status === "current")) {
      onStepClick(step);
    }
  };

  return (
    <>
      {/* ── Keyframe animations (injected once) ── */}
      <style>{`
        @keyframes wiz-pulse-ring {
          0%   { transform: scale(1);    opacity: 0.7; }
          100% { transform: scale(1.65); opacity: 0;   }
        }
        @keyframes wiz-shimmer {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(200%);  }
        }
        @keyframes wiz-bounce-in {
          0%   { transform: scale(0.4); opacity: 0; }
          65%  { transform: scale(1.2);             }
          100% { transform: scale(1);   opacity: 1; }
        }
        @keyframes wiz-slide-up {
          0%   { transform: translateY(10px); opacity: 0; }
          100% { transform: translateY(0);    opacity: 1; }
        }

        .wiz-step-enter            { animation: wiz-slide-up 0.4s ease both; }
        .wiz-step-enter:nth-child(1) { animation-delay: 0.05s; }
        .wiz-step-enter:nth-child(2) { animation-delay: 0.12s; }
        .wiz-step-enter:nth-child(3) { animation-delay: 0.19s; }
        .wiz-step-enter:nth-child(4) { animation-delay: 0.26s; }
        .wiz-step-enter:nth-child(5) { animation-delay: 0.33s; }

        .wiz-check-anim { animation: wiz-bounce-in 0.35s cubic-bezier(0.36,0.07,0.19,0.97) both; }
        .wiz-pulse-ring { animation: wiz-pulse-ring 1.7s ease-out infinite; }

        .wiz-shimmer::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.5) 50%, transparent 100%);
          animation: wiz-shimmer 2.2s infinite;
        }

        .wiz-btn { transition: transform 0.18s ease, box-shadow 0.2s ease; }
        .wiz-btn:hover:not(:disabled) { transform: translateY(-3px) scale(1.08); }
        .wiz-btn:active:not(:disabled) { transform: scale(0.93); }

        .wiz-step-wrap .wiz-tooltip   { display: none; }
        .wiz-step-wrap:hover .wiz-tooltip { display: block; }

        .wiz-info-bar { animation: wiz-slide-up 0.3s ease; }
      `}</style>

      <div className="mb-8">
        {/* ── Outer card ── */}
        <div className="rounded-2xl overflow-hidden border border-[#e0e0f0] bg-white shadow-[0_2px_16px_rgba(79,70,229,0.09)]">

          {/* ── Indigo gradient header ── */}
          <div
            className="relative overflow-hidden px-6 py-5"
            style={{ background: "linear-gradient(135deg,#1e1b4b 0%,#3730a3 45%,#4f46e5 100%)" }}
          >
            {/* Decorative blobs */}
            <div className="pointer-events-none absolute -top-7 -right-4 h-32 w-32 rounded-full bg-white/5" />
            <div className="pointer-events-none absolute -bottom-11 right-14 h-20 w-20 rounded-full bg-white/[0.04]" />

            {/* Top row */}
            <div className="relative z-10 flex items-start justify-between">
              <div>
                <p className="mb-0.5 text-[10px] font-medium uppercase tracking-[0.1em] text-white/55">
                  Vendor Onboarding
                </p>
                <h2 className="text-[17px] font-medium leading-tight text-white">
                  Complete Your Profile
                </h2>
                <p className="mt-0.5 text-xs text-white/60">
                  {currentStepData?.title} — {currentStepData?.description}
                </p>
              </div>
              <div className="text-right">
                <span className="text-[30px] font-medium leading-none text-white">
                  {Math.round(progress)}%
                </span>
                <p className="mt-0.5 text-[10px] text-white/50">complete</p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="relative z-10 mt-4">
              <div className="relative h-[7px] overflow-hidden rounded-full bg-white/15">
                <div
                  ref={progressBarRef}
                  className="wiz-shimmer relative h-full overflow-hidden rounded-full"
                  style={{
                    background: "linear-gradient(90deg,#a5b4fc,#818cf8)",
                    transition: "width 0.65s cubic-bezier(0.4,0,0.2,1)",
                    width: `${Math.max(progress, 2)}%`,
                  }}
                />
              </div>
              <div className="mt-1.5 flex justify-between">
                <span className="text-[10px] text-white/40">
                  Step {currentStepIndex + 1} of {steps.length}
                </span>
                <span className="text-[10px] font-medium text-[#a5b4fc]">
                  {completedCount} completed
                </span>
              </div>
            </div>
          </div>

          {/* ── Steps row ── */}
          <div className="bg-[#f5f5ff] px-5 pb-3 pt-5">
            <div className="relative flex items-start justify-between">

              {/* Connector lines between steps */}
              {steps.map((_, i) => {
                if (i === steps.length - 1) return null;
                const filled = getStepStatus(steps[i].key) === "completed";
                const leftPct  = (100 / steps.length) * i + 50 / steps.length;
                const widthPct = 100 / steps.length;
                return (
                  <div
                    key={`conn-${i}`}
                    className="absolute top-[22px] z-0 h-0.5 rounded-full"
                    style={{
                      background: filled
                        ? "linear-gradient(90deg,#4f46e5,#7c3aed)"
                        : "#e0e0f0",
                      transition: "background 0.5s",
                      left:  `calc(${leftPct}% + 5px)`,
                      width: `calc(${widthPct}% - 10px)`,
                    }}
                  />
                );
              })}

              {/* Individual step items */}
              {steps.map((step, i) => {
                const status     = getStepStatus(step.key);
                const StepIcon   = step.icon;
                const isClickable = status === "completed" || status === "current";

                const btnBg =
                  status === "completed"
                    ? "linear-gradient(135deg,#7c3aed,#6d28d9)"
                    : status === "current"
                    ? "linear-gradient(135deg,#4f46e5,#4338ca)"
                    : "#fff";

                const btnShadow =
                  status === "completed"
                    ? "0 4px 14px rgba(109,40,217,0.35)"
                    : status === "current"
                    ? "0 4px 14px rgba(79,70,229,0.4)"
                    : "0 1px 4px rgba(0,0,0,0.07)";

                const labelColor =
                  status === "completed" ? "#6d28d9"
                  : status === "current"  ? "#4338ca"
                  : "#b0b0cc";

                const badgeBg =
                  status === "completed" ? "#ede9fe"
                  : status === "current"  ? "#e0e7ff"
                  : "#f0f0fa";

                const badgeColor =
                  status === "completed" ? "#5b21b6"
                  : status === "current"  ? "#3730a3"
                  : "#a0a0c0";

                const dotBg =
                  status === "completed" ? "#7c3aed"
                  : status === "current"  ? "#4f46e5"
                  : "#e0e0f0";

                return (
                  <div
                    key={step.key}
                    className="wiz-step-enter wiz-step-wrap relative z-10 flex flex-1 flex-col items-center"
                    style={{ cursor: isClickable ? "pointer" : "default" }}
                    onClick={() => handleStepClick(step.key, status)}
                  >
                    {/* Hover tooltip */}
                    <div
                      className="wiz-tooltip pointer-events-none absolute z-50 rounded-lg"
                      style={{
                        bottom: "calc(100% + 10px)",
                        left: "50%",
                        transform: "translateX(-50%)",
                        background: "#1e1b4b",
                        padding: "7px 11px",
                        whiteSpace: "nowrap",
                        boxShadow: "0 4px 14px rgba(79,70,229,0.25)",
                      }}
                    >
                      <p className="text-[11px] font-medium text-white">
                        {step.title}
                      </p>
                      <p className="text-[10px] text-[#a5b4fc]/85">
                        {step.description}
                      </p>
                      {isClickable && (
                        <p className="mt-0.5 text-[9px] text-[#a5b4fc]">
                          Click to navigate
                        </p>
                      )}
                      {/* Tooltip caret */}
                      <span
                        className="absolute left-1/2 top-full -translate-x-1/2"
                        style={{
                          width: 0, height: 0,
                          borderLeft:  "5px solid transparent",
                          borderRight: "5px solid transparent",
                          borderTop:   "5px solid #1e1b4b",
                        }}
                      />
                    </div>

                    {/* Icon button + badge */}
                    <div className="relative mb-2">
                      {/* Animated pulse ring — current step only */}
                      {status === "current" && (
                        <div
                          className="wiz-pulse-ring pointer-events-none absolute rounded-full border-2 border-[#4f46e5]"
                          style={{ inset: -7 }}
                        />
                      )}

                      {/* Main icon button */}
                      <button
                        type="button"
                        disabled={!isClickable}
                        className="wiz-btn relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-full outline-none"
                        style={{
                          background: btnBg,
                          border: status === "pending" ? "2px solid #e0e0f0" : "2px solid transparent",
                          boxShadow: btnShadow,
                          cursor: isClickable ? "pointer" : "default",
                        }}
                      >
                        {status === "completed" ? (
                          <Check
                            className="wiz-check-anim text-white"
                            style={{ width: 20, height: 20, strokeWidth: 2.5 }}
                          />
                        ) : (
                          <StepIcon
                            style={{ width: 18, height: 18 }}
                            className={status === "current" ? "text-white" : "text-[#c4c4e0]"}
                          />
                        )}
                      </button>

                      {/* Step number badge */}
                      <div
                        className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded border-[1.5px] border-white"
                        style={{
                          fontSize: 9,
                          fontWeight: 500,
                          background: badgeBg,
                          color: badgeColor,
                        }}
                      >
                        {i + 1}
                      </div>
                    </div>

                    {/* Step label */}
                    <p
                      className="max-w-[72px] text-center text-[11px] transition-colors duration-300"
                      style={{ fontWeight: status !== "pending" ? 500 : 400, color: labelColor }}
                    >
                      {step.title}
                    </p>

                    {/* Status dot */}
                    <div
                      className="mt-1.5 h-1.5 w-1.5 rounded-full transition-colors duration-300"
                      style={{
                        background: dotBg,
                        boxShadow: status === "current" ? "0 0 0 3px rgba(79,70,229,0.2)" : undefined,
                      }}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Current step info bar ── */}
          <div className="wiz-info-bar mx-5 mb-[18px] flex items-center gap-2.5 rounded-[10px] border border-[#c7d2fe] bg-[#eef2ff] px-3.5 py-2.5">
            <div className="h-2 w-2 flex-shrink-0 rounded-full bg-[#4f46e5] shadow-[0_0_0_3px_rgba(79,70,229,0.2)]" />
            <p className="text-xs text-[#3730a3]">
              Currently on:{" "}
              <strong className="font-medium">{currentStepData?.title}</strong>
              {" "}— {currentStepData?.description}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}