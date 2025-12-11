"use client";

import React, { useState, createContext, useContext, useCallback, useMemo, useEffect } from "react";
import { X, ChevronRight, CheckCircle2, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

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

const RightSidebarContext = createContext<RightSidebarContextType | undefined>(undefined);

export const useRightSidebar = () => {
  const context = useContext(RightSidebarContext);
  if (!context) {
    throw new Error("useRightSidebar must be used within RightSidebarProvider");
  }
  return context;
};

interface RightSidebarProviderProps {
  children: React.ReactNode;
}

export const RightSidebarProvider: React.FC<RightSidebarProviderProps> = ({
  children,
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const [wizardSteps, setWizardSteps] = useState<WizardStep[]>([
    { id: "basic-info", title: "Basic Information", completed: false, required: true },
    { id: "media", title: "Media Upload", completed: false, required: true },
    { id: "attributes", title: "Attributes & Specifications", completed: false, required: true },
    { id: "variants", title: "Product Variants", completed: false, required: true },
    { id: "description", title: "Description & Details", completed: false, required: false },
    { id: "shipping-warranty", title: "Shipping & Warranty", completed: false, required: true },
    { id: "review", title: "Review & Submit", completed: false, required: true },
  ]);
  const [currentStep, setCurrentStep] = useState(0);

  const updateStepCompletion = useCallback((stepId: string, completed: boolean) => {
    setWizardSteps(prev => 
      prev.map(step => 
        step.id === stepId ? { ...step, completed } : step
      )
    );
  }, []);

  const updateAllSteps = useCallback((steps: Partial<Record<string, boolean>>) => {
    setWizardSteps(prev => 
      prev.map(step => ({
        ...step,
        completed: steps[step.id] !== undefined ? steps[step.id]! : step.completed
      }))
    );
  }, []);

  const contextValue = useMemo(() => ({
    isOpen,
    setIsOpen,
    wizardSteps,
    currentStep,
    setCurrentStep,
    updateStepCompletion,
    updateAllSteps,
  }), [isOpen, wizardSteps, currentStep, updateStepCompletion, updateAllSteps]);

  return (
    <RightSidebarContext.Provider value={contextValue}>
      {children}
    </RightSidebarContext.Provider>
  );
};

interface RightSidebarProps {
  wizardComponent: React.ReactNode;
}

export const RightSidebar: React.FC<RightSidebarProps> = ({
  wizardComponent,
}) => {
  const { isOpen, setIsOpen, wizardSteps } = useRightSidebar();

  // Calculate completion percentage
  const completionPercentage = useMemo(() => {
    const completed = wizardSteps.filter(step => step.completed).length;
    return Math.round((completed / wizardSteps.length) * 100);
  }, [wizardSteps]);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed right-0 top-1/2 -translate-y-1/2 z-40 bg-blue-600 text-white p-3 rounded-l-lg shadow-lg hover:bg-blue-700 transition-all"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    );
  }

  return (
    <div className="fixed right-0 top-0 h-full w-96 bg-white border-l shadow-xl z-50 flex flex-col transition-all duration-300">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-lg">Creation Wizard</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(false)}
            className="h-8 w-8 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Progress</span>
            <span className="font-semibold text-blue-600">{completionPercentage}%</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-600 transition-all duration-500 ease-out"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1 p-4">
        {wizardComponent}
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t bg-gray-50">
        <div className="text-xs text-gray-500 space-y-1">
          <p className="flex items-center gap-2">
            <CheckCircle2 className="w-3 h-3 text-green-600" />
            {wizardSteps.filter(s => s.completed).length} of {wizardSteps.length} steps completed
          </p>
          <p className="text-gray-400">Fill all required fields to proceed</p>
        </div>
      </div>
    </div>
  );
};