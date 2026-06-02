"use client";

import React, {
  useState,
  createContext,
  useContext,
  useCallback,
  useMemo,
} from "react";
import { ChevronDown, ChevronUp, Sparkles, Trophy } from "lucide-react";

/* ─── Types ──────────────────────────────────────────────────────────────── */
export type WizardStep = {
  id: string;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  completed: boolean;
  required: boolean;
};

interface RightSidebarContextType {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  wizardSteps: WizardStep[];
  currentStep: number;
  setCurrentStep: (step: number) => void;
  updateStepCompletion: (stepId: string, completed: boolean) => void;
  updateAllSteps: (steps: Partial<Record<string, boolean>>) => void;
}

const RightSidebarContext =
  createContext<RightSidebarContextType | undefined>(undefined);

export const useRightSidebar = () => {
  const ctx = useContext(RightSidebarContext);
  if (!ctx)
    throw new Error("useRightSidebar must be used within RightSidebarProvider");
  return ctx;
};

/* ─── Provider ───────────────────────────────────────────────────────────── */
export const RightSidebarProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [wizardSteps, setWizardSteps] = useState<WizardStep[]>([
    { id: "basic-info",        title: "Basic Information",     completed: false, required: true  },
    { id: "media",             title: "Media Upload",          completed: false, required: true  },
    { id: "attributes",        title: "Attributes & Specs",    completed: false, required: true  },
    { id: "variants",          title: "Product Variants",      completed: false, required: true  },
    { id: "description",       title: "Description & Details", completed: false, required: false },
    { id: "shipping-warranty", title: "Shipping & Warranty",   completed: false, required: true  },
    { id: "review",            title: "Review & Submit",       completed: false, required: true  },
  ]);

  const updateStepCompletion = useCallback(
    (stepId: string, completed: boolean) =>
      setWizardSteps((p) =>
        p.map((s) => (s.id === stepId ? { ...s, completed } : s))
      ),
    []
  );

  const updateAllSteps = useCallback(
    (steps: Partial<Record<string, boolean>>) =>
      setWizardSteps((p) =>
        p.map((s) => ({ ...s, completed: steps[s.id] ?? s.completed }))
      ),
    []
  );

  const value = useMemo(
    () => ({
      isOpen,
      setIsOpen,
      wizardSteps,
      currentStep,
      setCurrentStep,
      updateStepCompletion,
      updateAllSteps,
    }),
    [isOpen, wizardSteps, currentStep, updateStepCompletion, updateAllSteps]
  );

  return (
    <RightSidebarContext.Provider value={value}>
      {children}
    </RightSidebarContext.Provider>
  );
};

/* ─── Sidebar ────────────────────────────────────────────────────────────── */
export const RightSidebar: React.FC<{ wizardComponent: React.ReactNode }> = ({
  wizardComponent,
}) => {
  const { isOpen, setIsOpen, wizardSteps } = useRightSidebar();

  const completedCount = wizardSteps.filter((s) => s.completed).length;
  const totalCount     = wizardSteps.length;
  const pct            = Math.round((completedCount / totalCount) * 100);
  const isAllDone      = pct === 100;

  /* arc math for SVG circle */
  const R    = 22;
  const C    = 2 * Math.PI * R;
  const dash = (C * pct) / 100;

  return (
    <>
      {/* ══════════════ MOBILE ══════════════ */}
      <div className="lg:hidden w-full">
        <div
          style={{
            background: "#FFFFFF",
            border: "0.5px solid #BFDBFE",
            borderRadius: 16,
            overflow: "hidden",
            boxShadow: "0 2px 12px rgba(37,99,235,0.08)",
          }}
        >
          {/* Mobile header */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            style={{
              width: "100%",
              padding: "14px 16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "none",
              border: "none",
              cursor: "pointer",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  background: "#DBEAFE",
                  border: "0.5px solid #93C5FD",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Sparkles size={16} color="#1D4ED8" />
              </div>
              <div style={{ textAlign: "left" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>
                  Creation Wizard
                </div>
                <div style={{ fontSize: 10.5, color: "#64748B" }}>
                  {completedCount}/{totalCount} steps done
                </div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 800,
                  color: isAllDone ? "#10B981" : "#2563EB",
                }}
              >
                {pct}%
              </span>
              {isOpen
                ? <ChevronUp size={16} color="#64748B" />
                : <ChevronDown size={16} color="#64748B" />}
            </div>
          </button>

          {/* Mobile progress bar */}
          <div style={{ padding: "0 16px 4px" }}>
            <div
              style={{
                height: 4,
                background: "#DBEAFE",
                borderRadius: 2,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${pct}%`,
                  background: isAllDone
                    ? "linear-gradient(90deg,#10B981,#059669)"
                    : "linear-gradient(90deg,#2563EB,#3B82F6)",
                  borderRadius: 2,
                  transition: "width 0.6s cubic-bezier(.4,0,.2,1)",
                }}
              />
            </div>
          </div>

          {isOpen && (
            <div
              style={{
                borderTop: "0.5px solid #E2E8F0",
                padding: "12px 16px 16px",
                maxHeight: 400,
                overflowY: "auto",
              }}
            >
              {wizardComponent}
            </div>
          )}
        </div>
      </div>

      {/* ══════════════ DESKTOP ══════════════ */}
      <div
        className="hidden lg:flex"
        style={{ flexDirection: "column", gap: 0 }}
      >
        <div
          style={{
            background: "#FFFFFF",
            border: "0.5px solid #BFDBFE",
            borderRadius: 18,
            overflow: "hidden",
            boxShadow: "0 4px 20px rgba(37,99,235,0.07), 0 1px 3px rgba(37,99,235,0.06)",
          }}
        >
          {/* ── Header ── */}
          <div
            style={{
              padding: "18px 16px 14px",
              borderBottom: "0.5px solid #E2E8F0",
              background: "#EFF6FF",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Subtle tint blob */}
            <div
              style={{
                position: "absolute",
                top: -30,
                right: -20,
                width: 100,
                height: 100,
                borderRadius: "50%",
                background: isAllDone
                  ? "radial-gradient(circle,rgba(16,185,129,0.12) 0%,transparent 70%)"
                  : "radial-gradient(circle,rgba(37,99,235,0.10) 0%,transparent 70%)",
                pointerEvents: "none",
                transition: "background 0.6s",
              }}
            />

            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
              }}
            >
              {/* Icon + title */}
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 12,
                    background: isAllDone ? "#D1FAE5" : "#DBEAFE",
                    border: `0.5px solid ${isAllDone ? "#6EE7B7" : "#93C5FD"}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    transition: "all 0.4s",
                  }}
                >
                  {isAllDone
                    ? <Trophy size={18} color="#059669" />
                    : <Sparkles size={18} color="#1D4ED8" />}
                </div>
                <div>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: "#0F172A",
                      letterSpacing: "-0.3px",
                    }}
                  >
                    {isAllDone ? "Ready to Submit!" : "Creation Wizard"}
                  </div>
                  <div style={{ fontSize: 10.5, color: "#64748B", marginTop: 1 }}>
                    {isAllDone
                      ? "All steps complete ✦"
                      : `${totalCount - completedCount} step${totalCount - completedCount !== 1 ? "s" : ""} remaining`}
                  </div>
                </div>
              </div>

              {/* Circular progress */}
              <div style={{ position: "relative", width: 52, height: 52, flexShrink: 0 }}>
                <svg width="52" height="52" style={{ transform: "rotate(-90deg)" }}>
                  {/* Track */}
                  <circle
                    cx="26" cy="26" r={R}
                    fill="none"
                    stroke="#DBEAFE"
                    strokeWidth="3.5"
                  />
                  {/* Progress */}
                  <circle
                    cx="26" cy="26" r={R}
                    fill="none"
                    stroke={isAllDone ? "#10B981" : "url(#prog-grad)"}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeDasharray={`${dash} ${C}`}
                    style={{ transition: "stroke-dasharray 0.6s cubic-bezier(.4,0,.2,1)" }}
                  />
                  <defs>
                    <linearGradient id="prog-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#1D4ED8" />
                      <stop offset="100%" stopColor="#3B82F6" />
                    </linearGradient>
                  </defs>
                </svg>
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 11,
                    fontWeight: 800,
                    color: isAllDone ? "#059669" : "#1D4ED8",
                    transition: "color 0.4s",
                  }}
                >
                  {pct}%
                </div>
              </div>
            </div>

            {/* Linear progress bar */}
            <div style={{ marginTop: 14 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 6,
                }}
              >
                <span
                  style={{
                    fontSize: 10,
                    color: "#64748B",
                    fontWeight: 600,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                  }}
                >
                  Progress
                </span>
                <span style={{ fontSize: 10, color: "#64748B" }}>
                  {completedCount}/{totalCount} steps
                </span>
              </div>
              <div
                style={{
                  height: 5,
                  background: "#DBEAFE",
                  borderRadius: 3,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${pct}%`,
                    background: isAllDone
                      ? "linear-gradient(90deg,#10B981,#059669)"
                      : "linear-gradient(90deg,#1D4ED8,#3B82F6,#60A5FA)",
                    borderRadius: 3,
                    transition: "width 0.6s cubic-bezier(.4,0,.2,1)",
                    boxShadow: isAllDone
                      ? "0 0 6px rgba(16,185,129,0.35)"
                      : "0 0 6px rgba(37,99,235,0.3)",
                  }}
                />
              </div>
            </div>
          </div>

          {/* ── Steps list ── */}
          {isOpen && (
            <div
              style={{
                padding: "12px 14px",
                maxHeight: "calc(100vh - 260px)",
                overflowY: "auto",
                scrollbarWidth: "thin",
                scrollbarColor: "#BFDBFE transparent",
                background: "#FFFFFF",
              }}
            >
              {wizardComponent}
            </div>
          )}

          {/* ── Footer ── */}
          <div
            style={{
              padding: "10px 16px",
              borderTop: "0.5px solid #E2E8F0",
              background: "#F8FAFC",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 10.5,
                color: "#64748B",
              }}
            >
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: isAllDone ? "#10B981" : "#2563EB",
                  boxShadow: isAllDone
                    ? "0 0 5px rgba(16,185,129,0.5)"
                    : "0 0 5px rgba(37,99,235,0.45)",
                  animation: "pulse-dot 2s ease-in-out infinite",
                }}
              />
              {isAllDone
                ? "All steps completed"
                : `${completedCount} of ${totalCount} completed`}
            </div>
            <button
              onClick={() => setIsOpen(!isOpen)}
              style={{
                background: "#FFFFFF",
                border: "0.5px solid #CBD5E1",
                borderRadius: 7,
                padding: "3px 8px",
                cursor: "pointer",
                color: "#64748B",
                fontSize: 10.5,
                display: "flex",
                alignItems: "center",
                gap: 3,
                fontFamily: "inherit",
                transition: "background 0.15s",
              }}
            >
              {isOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              {isOpen ? "Collapse" : "Expand"}
            </button>
          </div>
        </div>

        <style>{`
          @keyframes pulse-dot {
            0%, 100% { opacity: 1; transform: scale(1); }
            50%       { opacity: 0.5; transform: scale(0.8); }
          }
        `}</style>
      </div>
    </>
  );
};