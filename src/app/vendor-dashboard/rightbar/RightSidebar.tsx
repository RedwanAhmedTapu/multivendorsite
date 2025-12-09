"use client";

import React, { useState, createContext, useContext, useCallback, useMemo } from "react";
import { X, ChevronRight, BookOpen, Settings, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export type WizardStep = {
  id: string;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  completed: boolean;
  required: boolean;
};

export type RightSidebarMode = "wizard" | "instructions" | "settings";

interface RightSidebarContextType {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  mode: RightSidebarMode;
  setMode: (mode: RightSidebarMode) => void;
  wizardSteps: WizardStep[];
  currentStep: number;
  setCurrentStep: (step: number) => void;
  updateStepCompletion: (stepId: string, completed: boolean) => void;
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
  const [mode, setMode] = useState<RightSidebarMode>("wizard");
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
        step.id === stepId && step.completed !== completed 
          ? { ...step, completed } 
          : step
      )
    );
  }, []);

  const contextValue = useMemo(() => ({
    isOpen,
    setIsOpen,
    mode,
    setMode,
    wizardSteps,
    currentStep,
    setCurrentStep,
    updateStepCompletion,
  }), [isOpen, mode, wizardSteps, currentStep, updateStepCompletion]);

  return (
    <RightSidebarContext.Provider value={contextValue}>
      {children}
    </RightSidebarContext.Provider>
  );
};

interface RightSidebarProps {
  wizardComponent?: React.ReactNode;
  instructionsComponent?: React.ReactNode;
  settingsComponent?: React.ReactNode;
}

export const RightSidebar: React.FC<RightSidebarProps> = ({
  wizardComponent,
  instructionsComponent,
  settingsComponent,
}) => {
  const { isOpen, setIsOpen, mode } = useRightSidebar();

  const renderContent = () => {
    switch (mode) {
      case "wizard":
        return wizardComponent;
      case "instructions":
        return instructionsComponent;
      case "settings":
        return settingsComponent;
      default:
        return wizardComponent;
    }
  };

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
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-3">
          <ModeSelector />
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(false)}
          className="h-8 w-8 p-0"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1 p-4">
        {renderContent()}
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t bg-gray-50">
        <div className="text-xs text-gray-500">
          <p>💡 Complete all steps for successful product creation</p>
        </div>
      </div>
    </div>
  );
};

const ModeSelector: React.FC = () => {
  const { mode, setMode } = useRightSidebar();
  
  const modes = [
    { id: "wizard", label: "Wizard", icon: <Zap className="w-4 h-4" /> },
    { id: "instructions", label: "Guide", icon: <BookOpen className="w-4 h-4" /> },
    { id: "settings", label: "Settings", icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
      {modes.map((m) => (
        <button
          key={m.id}
          onClick={() => setMode(m.id as RightSidebarMode)}
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
            mode === m.id
              ? "bg-white shadow-sm text-blue-600"
              : "text-gray-600 hover:text-gray-900"
          )}
        >
          {m.icon}
          {m.label}
        </button>
      ))}
    </div>
  );
};