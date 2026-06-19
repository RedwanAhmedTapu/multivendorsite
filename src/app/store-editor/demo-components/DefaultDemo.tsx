// demo-components/DefaultDemo.tsx
import { ModuleItem } from "../page";
import { Sparkles, Eye, ShoppingBag } from "lucide-react";

interface DefaultDemoProps {
  module: ModuleItem;
}

export const DefaultDemo = ({ module }: DefaultDemoProps) => {
  return (
    <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white text-center">
        <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
          <Sparkles size={24} className="text-white" />
        </div>
        <h3 className="text-xl font-bold mb-2">{module.name}</h3>
        <p className="text-blue-100 opacity-90">Interactive Preview</p>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="text-center mb-6">
          <img 
            src={module.icon} 
            alt={module.name} 
            className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 p-4"
          />
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <Eye size={14} />
              <span>Live Preview</span>
            </div>
            <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <ShoppingBag size={14} />
              <span>Store Module</span>
            </div>
          </div>
        </div>

        {/* Demo Box */}
        <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl p-6 border-2 border-dashed border-gray-300">
          <div className="text-center">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-purple-500 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Sparkles size={20} className="text-white" />
            </div>
            <h4 className="font-semibold text-gray-800 mb-2">Module Preview</h4>
            <p className="text-sm text-gray-600 mb-4">
              This is a live demo representation of how the <strong>{module.name}</strong> module would appear in your store.
            </p>
            
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <p className="text-xs text-gray-500 text-center">
                The actual module will display your products, banners, or content based on your configuration.
              </p>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-2 gap-3 mt-6">
          {[
            { label: "Responsive", value: "Yes" },
            { label: "Customizable", value: "Yes" },
            { label: "Mobile Ready", value: "Yes" },
            { label: "Easy Setup", value: "Yes" }
          ].map((feature, index) => (
            <div key={index} className="bg-white rounded-lg p-3 text-center border border-gray-100">
              <div className="text-xs text-gray-600 mb-1">{feature.label}</div>
              <div className="text-sm font-semibold text-green-500">{feature.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};