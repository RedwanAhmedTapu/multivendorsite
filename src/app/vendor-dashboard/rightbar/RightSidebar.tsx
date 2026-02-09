"use client";

import React, {
  useState,
  createContext,
  useContext,
  useCallback,
  useMemo,
} from "react";
import { ChevronDown, ChevronUp, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

/* -------------------- Types -------------------- */
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
  if (!ctx) {
    throw new Error("useRightSidebar must be used within RightSidebarProvider");
  }
  return ctx;
};

/* -------------------- Provider -------------------- */
export const RightSidebarProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);

  const [wizardSteps, setWizardSteps] = useState<WizardStep[]>([
    { id: "basic-info", title: "Basic Information", completed: false, required: true },
    { id: "media", title: "Media Upload", completed: false, required: true },
    { id: "attributes", title: "Attributes & Specifications", completed: false, required: true },
    { id: "variants", title: "Product Variants", completed: false, required: true },
    { id: "description", title: "Description & Details", completed: false, required: false },
    { id: "shipping-warranty", title: "Shipping & Warranty", completed: false, required: true },
    { id: "review", title: "Review & Submit", completed: false, required: true },
  ]);

  const updateStepCompletion = useCallback((stepId: string, completed: boolean) => {
    setWizardSteps((prev) =>
      prev.map((s) => (s.id === stepId ? { ...s, completed } : s))
    );
  }, []);

  const updateAllSteps = useCallback(
    (steps: Partial<Record<string, boolean>>) => {
      setWizardSteps((prev) =>
        prev.map((s) => ({
          ...s,
          completed: steps[s.id] ?? s.completed,
        }))
      );
    },
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

/* -------------------- Sidebar -------------------- */
export const RightSidebar: React.FC<{ wizardComponent: React.ReactNode }> = ({
  wizardComponent,
}) => {
  const { isOpen, setIsOpen, wizardSteps } = useRightSidebar();

  const completionPercentage = useMemo(() => {
    const completed = wizardSteps.filter((s) => s.completed).length;
    return Math.round((completed / wizardSteps.length) * 100);
  }, [wizardSteps]);

  return (
    <>
      {/* ================= MOBILE ================= */}
      <div className="lg:hidden w-full">
        <div className="bg-white border rounded-lg shadow-sm">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="w-full p-4 flex items-center justify-between hover:bg-gray-50"
          >
            <div className="flex-1">
              <div className="flex justify-between mb-2">
                <h3 className="font-semibold">Creation Wizard</h3>
                <span className="text-sm font-semibold text-blue-600">
                  {completionPercentage}%
                </span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full">
                <div
                  className="h-full bg-blue-600 transition-all"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
            </div>
            {isOpen ? (
              <ChevronUp className="w-5 h-5 text-gray-500" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-500" />
            )}
          </button>

          {isOpen && (
            <>
              <div className="border-t p-4 max-h-96 overflow-y-auto">
                {wizardComponent}
              </div>
              <div className="p-4 border-t bg-gray-50 text-xs text-gray-500">
                <p className="flex items-center gap-2">
                  <CheckCircle2 className="w-3 h-3 text-green-600" />
                  {wizardSteps.filter((s) => s.completed).length} of{" "}
                  {wizardSteps.length} steps completed
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ================= DESKTOP (FIXED STICKY) ================= */}
      <div className="hidden lg:block">
        <aside className=" bg-white border rounded-lg shadow-sm flex flex-col">
          {/* Header */}
          <div className="p-4 border-b">
            <div className="flex justify-between mb-3">
              <h3 className="font-semibold text-lg">Creation Wizard</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(!isOpen)}
              >
                {isOpen ? <ChevronUp /> : <ChevronDown />}
              </Button>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Progress</span>
                <span className="font-semibold text-blue-600">
                  {completionPercentage}%
                </span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full">
                <div
                  className="h-full bg-blue-600 transition-all"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
            </div>
          </div>

          {/* Content (NO SCROLL AREA) */}
          {isOpen && <div className="p-4">{wizardComponent}</div>}

          {/* Footer */}
          {isOpen && (
            <div className="p-4 border-t bg-gray-50 text-xs text-gray-500">
              <p className="flex items-center gap-2">
                <CheckCircle2 className="w-3 h-3 text-green-600" />
                {wizardSteps.filter((s) => s.completed).length} of{" "}
                {wizardSteps.length} steps completed
              </p>
            </div>
          )}
        </aside>
      </div>
    </>
  );
};
