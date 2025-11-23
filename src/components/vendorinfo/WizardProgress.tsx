// components/vendor/WizardProgress.tsx
import React from 'react';
import { Check, Store, MapPin, Building2, FileCheck, CreditCard } from 'lucide-react';
import { WizardStep } from './OnboardingWizard';

interface WizardProgressProps {
  progress: number;
  currentStep: WizardStep;
  getStepStatus: (stepKey: WizardStep) => 'completed' | 'current' | 'pending';
}

const steps: { 
  key: WizardStep; 
  title: string; 
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  {
    key: 'store-info',
    title: 'Store Information',
    description: 'Basic store details',
    icon: Store
  },
  {
    key: 'address',
    title: 'Pickup Address',
    description: 'Collection location',
    icon: MapPin
  },
  {
    key: 'account-type',
    title: 'Account Type',
    description: 'Business setup',
    icon: Building2
  },
  {
    key: 'documents',
    title: 'Documents',
    description: 'Verification files',
    icon: FileCheck
  },
  {
    key: 'bank-info',
    title: 'Bank Information',
    description: 'Payment details',
    icon: CreditCard
  }
];

const WizardProgress: React.FC<WizardProgressProps> = ({ 
  progress, 
  currentStep, 
  getStepStatus 
}) => {
  return (
    <div className="mb-8 sticky top-0 z-40 bg-white/95 backdrop-blur-md supports-[backdrop-filter]:bg-white/80 border-b border-teal-100/50 shadow-sm transition-all duration-300">
      <div className="max-w-6xl mx-auto px-4 py-4">
        {/* Compact Header for Sticky Mode */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-2 h-8 bg-gradient-to-b from-teal-500 to-teal-600 rounded-full"></div>
            <div>
              <h1 className="text-lg font-bold text-gray-800">
                Complete Your Vendor Profile
              </h1>
              <p className="text-xs text-gray-500 hidden sm:block">
                Finish setup to start selling - {Math.round(progress)}% complete
              </p>
            </div>
          </div>
          
          {/* Progress Indicator - Compact */}
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <span className="text-sm font-semibold text-teal-600">
                {Math.round(progress)}%
              </span>
              <div className="text-xs text-gray-500">Complete</div>
            </div>
            <div className="w-20 bg-gray-100 rounded-full h-2 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-teal-500 to-teal-600 rounded-full transition-all duration-500 ease-out relative"
                style={{ width: `${progress}%` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 animate-shimmer"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Step Indicators - Compact */}
        <div className="relative">
          {/* Connection Lines */}
          <div className="absolute top-4 left-0 right-0 h-[2px] bg-gray-200" style={{ 
            marginLeft: '5%', 
            marginRight: '5%' 
          }}></div>
          
          <div className="flex justify-between relative">
            {steps.map((step, index) => {
              const status = getStepStatus(step.key);
              const StepIcon = step.icon;
              
              return (
                <div 
                  key={step.key} 
                  className="flex flex-col items-center flex-1 relative z-10"
                >
                  {/* Step Circle - Compact */}
                  <div className={`
                    relative flex items-center justify-center w-10 h-10 rounded-lg
                    transition-all duration-300 group cursor-pointer
                    ${status === 'completed' 
                      ? 'bg-gradient-to-br from-green-500 to-green-600 shadow-sm shadow-green-500/20 border border-green-400' 
                      : status === 'current'
                      ? 'bg-gradient-to-br from-teal-500 to-teal-600 shadow-md shadow-teal-500/30 border border-teal-400'
                      : 'bg-white border border-gray-200'
                    }
                    mb-2
                  `}>
                    {/* Icon or Check */}
                    {status === 'completed' ? (
                      <Check className="w-4 h-4 text-white" />
                    ) : (
                      <StepIcon className={`w-4 h-4 ${
                        status === 'current' ? 'text-white' : 'text-gray-400'
                      }`} />
                    )}
                    
                    {/* Step Number Badge */}
                    <div className={`
                      absolute -top-1 -right-1 w-4 h-4 rounded-sm flex items-center justify-center
                      text-[8px] font-bold shadow-xs
                      ${status === 'completed'
                        ? 'bg-white text-green-600 border border-green-300'
                        : status === 'current'
                        ? 'bg-white text-teal-600 border border-teal-300'
                        : 'bg-gray-50 text-gray-400 border border-gray-200'
                      }
                    `}>
                      {index + 1}
                    </div>
                    
                    {/* Tooltip on Hover */}
                    <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 hidden group-hover:block z-50">
                      <div className="bg-gray-900 text-white text-xs rounded-lg py-1.5 px-3 whitespace-nowrap shadow-lg">
                        <div className="font-semibold">{step.title}</div>
                        <div className="text-gray-300">{step.description}</div>
                      </div>
                      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1 w-2 h-2 bg-gray-900 rotate-45"></div>
                    </div>
                  </div>
                  
                  {/* Step Info - Compact */}
                  <div className="text-center max-w-[80px]">
                    <div className={`
                      text-[10px] font-semibold transition-colors duration-300 truncate
                      ${status === 'completed' ? 'text-green-700' :
                        status === 'current' ? 'text-teal-700' : 'text-gray-400'
                      }
                    `}>
                      {step.title}
                    </div>
                    
                    {/* Status Indicator Dot */}
                    <div className="mt-1 flex justify-center">
                      {status === 'completed' && (
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-sm"></div>
                      )}
                      {status === 'current' && (
                        <div className="w-1.5 h-1.5 rounded-full bg-teal-500 shadow-sm animate-pulse"></div>
                      )}
                      {status === 'pending' && (
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-300 shadow-sm"></div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Current Step Info Bar */}
        <div className="mt-3 pt-3 border-t border-gray-100">
          {steps.map((step) => {
            const status = getStepStatus(step.key);
            if (status === 'current') {
              return (
                <div key={step.key} className="flex items-center justify-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse"></div>
                  <span className="text-xs font-medium text-teal-700">
                    Currently on: <span className="font-semibold">{step.title}</span> - {step.description}
                  </span>
                </div>
              );
            }
            return null;
          })}
        </div>
      </div>
      
      <style jsx>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  );
};

export default WizardProgress;