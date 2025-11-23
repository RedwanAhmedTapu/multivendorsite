import { ChevronLeft, Save, Settings, Trash2, ChevronRight } from "lucide-react";
import { ActiveModule, ModuleItem } from "./page";

interface ConfigurationFormProps {
  formData: any;
  onInputChange: (field: string, value: any) => void;
  selectedModule: ActiveModule | null;
  onClose: () => void;
  selectedSidebarModule: ModuleItem | null;
  onDeleteModule?: (moduleId: string) => void;
}

export const ConfigurationForm = ({
  formData,
  onInputChange,
  selectedModule,
  onClose,
  selectedSidebarModule,
  onDeleteModule,
}: ConfigurationFormProps) => {
  // If no module is selected from preview, show the sidebar selected module
  const displayModule = selectedModule || selectedSidebarModule;

  if (!displayModule) {
    return (
      <div className="w-96 bg-white border-l border-gray-200">
        <div className="h-screen overflow-y-auto flex items-center justify-center">
          <div className="text-center text-gray-500">
            <p>Select a module to configure</p>
          </div>
        </div>
      </div>
    );
  }

  const handleDelete = () => {
    if (selectedModule && onDeleteModule) {
      onDeleteModule(selectedModule.id);
    }
  };

  const handleSave = () => {
    if (selectedModule) {
      // Save logic here
      console.log("Saving configuration for:", selectedModule.name, formData);
      // You can add API call or state update logic here
    }
  };

  const renderFormByModuleType = () => {
    // Determine module type based on whether it's from preview or sidebar
    const moduleType = selectedModule ? selectedModule.type : displayModule.id;

    switch (moduleType) {
      case "graphicCarousel":
        return (
          <>
            {/* Title Configuration */}
            <div className="mb-6">
              <div className="mb-3">
                <h5 className="text-sm font-semibold">Title</h5>
              </div>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="title"
                    checked={formData.title === "Display"}
                    onChange={() => onInputChange("title", "Display")}
                    className="hidden"
                  />
                  <div
                    className={`w-4 h-4 border rounded-full flex items-center justify-center ${
                      formData.title === "Display"
                        ? "border-blue-500"
                        : "border-gray-300"
                    }`}
                  >
                    {formData.title === "Display" && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    )}
                  </div>
                  <span className="text-sm">Display</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="title"
                    checked={formData.title === "Hidden"}
                    onChange={() => onInputChange("title", "Hidden")}
                    className="hidden"
                  />
                  <div
                    className={`w-4 h-4 border rounded-full flex items-center justify-center ${
                      formData.title === "Hidden"
                        ? "border-blue-500"
                        : "border-gray-300"
                    }`}
                  >
                    {formData.title === "Hidden" && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    )}
                  </div>
                  <span className="text-sm">Hidden</span>
                </label>
              </div>
            </div>

            {/* Full-width Configuration */}
            <div className="mb-6 pb-6 border-b border-gray-200">
              <div className="mb-3">
                <h5 className="text-sm font-semibold">
                  Full-width <span className="text-red-500">*</span>
                </h5>
              </div>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="fullWidth"
                    checked={formData.fullWidth === "1200px"}
                    onChange={() => onInputChange("fullWidth", "1200px")}
                    className="hidden"
                  />
                  <div
                    className={`w-4 h-4 border rounded-full flex items-center justify-center ${
                      formData.fullWidth === "1200px"
                        ? "border-blue-500"
                        : "border-gray-300"
                    }`}
                  >
                    {formData.fullWidth === "1200px" && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    )}
                  </div>
                  <span className="text-sm">1200px</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="fullWidth"
                    checked={formData.fullWidth === "1920px"}
                    onChange={() => onInputChange("fullWidth", "1920px")}
                    className="hidden"
                  />
                  <div
                    className={`w-4 h-4 border rounded-full flex items-center justify-center ${
                      formData.fullWidth === "1920px"
                        ? "border-blue-500"
                        : "border-gray-300"
                    }`}
                  >
                    {formData.fullWidth === "1920px" && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    )}
                  </div>
                  <span className="text-sm">Full-width 1920px</span>
                </label>
              </div>
            </div>

            {/* Image Settings */}
            <div className="mb-6 pb-6 border-b border-gray-200">
              <div className="mb-3">
                <h5 className="text-sm font-semibold">
                  Image Settings <span className="text-red-500">*</span>
                </h5>
              </div>
              <div className="space-y-3">
                <button className="w-full py-2 border border-gray-300 rounded text-sm hover:bg-gray-50 transition-colors">
                  Upload Images
                </button>
                <div className="text-xs text-gray-500">
                  Supported formats: JPG, PNG, GIF. Max file size: 5MB
                </div>
              </div>
            </div>

            {/* Carousel Speed */}
            <div className="mb-6 pb-6 border-b border-gray-200">
              <div className="mb-3">
                <h5 className="text-sm font-semibold">Carousel Speed</h5>
              </div>
              <div className="flex gap-4">
                {["3 seconds", "5 seconds", "10 seconds", "15 seconds"].map((speed) => (
                  <label key={speed} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="carouselSpeed"
                      checked={formData.carouselSpeed === speed}
                      onChange={() => onInputChange("carouselSpeed", speed)}
                      className="hidden"
                    />
                    <div
                      className={`w-4 h-4 border rounded-full flex items-center justify-center ${
                        formData.carouselSpeed === speed
                          ? "border-blue-500"
                          : "border-gray-300"
                      }`}
                    >
                      {formData.carouselSpeed === speed && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      )}
                    </div>
                    <span className="text-sm">{speed}</span>
                  </label>
                ))}
              </div>
            </div>
          </>
        );

      case "countdownProduct":
        return (
          <div className="space-y-6">
            <div className="mb-6">
              <h5 className="text-sm font-semibold mb-3">Countdown Settings</h5>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    End Time
                  </label>
                  <input
                    type="datetime-local"
                    className="w-full p-2 border border-gray-300 rounded text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Background Color
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      className="w-10 h-10 border border-gray-300 rounded cursor-pointer"
                    />
                    <span className="text-sm text-gray-600">Click to choose color</span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Text Color
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      className="w-10 h-10 border border-gray-300 rounded cursor-pointer"
                    />
                    <span className="text-sm text-gray-600">Click to choose color</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case "graphicThreeImages":
        return (
          <div className="space-y-6">
            <div className="mb-6">
              <h5 className="text-sm font-semibold mb-3">Banner Layout</h5>
              <div className="grid grid-cols-2 gap-3">
                {["Layout 1", "Layout 2", "Layout 3", "Layout 4"].map((layout) => (
                  <button
                    key={layout}
                    className="p-3 border border-gray-300 rounded text-sm hover:border-blue-500 hover:bg-blue-50 transition-colors"
                  >
                    {layout}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="mb-6">
              <h5 className="text-sm font-semibold mb-3">Image Upload</h5>
              <div className="space-y-3">
                <button className="w-full py-2 border border-gray-300 rounded text-sm hover:bg-gray-50 transition-colors">
                  Upload Main Banner
                </button>
                <button className="w-full py-2 border border-gray-300 rounded text-sm hover:bg-gray-50 transition-colors">
                  Upload Side Banners
                </button>
              </div>
            </div>
          </div>
        );

      case "categoryBar":
        return (
          <div className="space-y-6">
            <div className="mb-6">
              <h5 className="text-sm font-semibold mb-3">Store Header Settings</h5>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Store Name
                  </label>
                  <input
                    type="text"
                    placeholder="Enter store name"
                    className="w-full p-2 border border-gray-300 rounded text-sm"
                    defaultValue="Ecom"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Store Description
                  </label>
                  <textarea
                    placeholder="Enter store description"
                    className="w-full p-2 border border-gray-300 rounded text-sm resize-none"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Avatar URL
                  </label>
                  <input
                    type="url"
                    placeholder="Enter avatar URL"
                    className="w-full p-2 border border-gray-300 rounded text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Cover Image URL
                  </label>
                  <input
                    type="url"
                    placeholder="Enter cover image URL"
                    className="w-full p-2 border border-gray-300 rounded text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center text-gray-500 py-8">
            <div className="mb-4">
              <img 
                src={displayModule.icon} 
                alt={displayModule.name}
                className="w-12 h-12 mx-auto mb-2"
              />
              <p className="text-lg font-medium">{displayModule.name}</p>
            </div>
            <p className="text-sm text-gray-600">
              Configuration options for this module will be available soon.
            </p>
          </div>
        );
    }
  };

  return (
    <div className="w-96 bg-white border-l border-gray-200 relative">
      <button
        onClick={onClose}
        className="absolute -left-6 top-1/2 transform -translate-y-1/2 bg-blue-500 text-white p-1 rounded-l shadow-lg hover:bg-blue-600 transition-colors z-10"
        title="Close configuration"
      >
        <ChevronRight size={16} />
      </button>
      
      <div className="h-screen overflow-y-auto">
        {/* Header */}
        <div className="form-title p-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ChevronLeft 
              size={16} 
              className="text-gray-600 cursor-pointer hover:text-gray-800" 
              onClick={onClose}
            />
            <div>
              <span className="text-lg font-semibold block">{displayModule.name}</span>
              {!selectedModule && selectedSidebarModule && (
                <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">
                  From Sidebar
                </span>
              )}
            </div>
          </div>
          {selectedModule && onDeleteModule && (
            <button
              onClick={handleDelete}
              className="p-1 hover:bg-red-50 rounded transition-colors"
              title="Delete module"
            >
              <Trash2 size={16} className="text-red-500" />
            </button>
          )}
        </div>

        {/* Module Info */}
        <div className="form-moduleid p-3 px-4 text-xs text-gray-500 border-b border-gray-200 bg-gray-50">
          {selectedModule ? (
            <>Module ID: {selectedModule.id.split('_')[1] || 'N/A'}</>
          ) : (
            <>Module Type: {selectedSidebarModule?.id || 'N/A'}</>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Sidebar Module Info */}
          {!selectedModule && selectedSidebarModule && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-3">
                <img 
                  src={selectedSidebarModule.icon} 
                  alt={selectedSidebarModule.name}
                  className="w-10 h-10"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-800">
                    {selectedSidebarModule.name}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    Drag this module to the preview area to add it and enable configuration.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Module-specific Form */}
          {renderFormByModuleType()}

          {/* Common Settings */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h5 className="text-sm font-semibold mb-4">Common Settings</h5>
            <div className="space-y-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.displayBottomMargin}
                  onChange={(e) =>
                    onInputChange("displayBottomMargin", e.target.checked)
                  }
                  className="hidden"
                />
                <div
                  className={`w-5 h-5 border rounded flex items-center justify-center transition-colors ${
                    formData.displayBottomMargin
                      ? "border-blue-500 bg-blue-500"
                      : "border-gray-300 bg-white"
                  }`}
                >
                  {formData.displayBottomMargin && (
                    <Settings size={12} className="text-white" />
                  )}
                </div>
                <span className="text-sm">Hide bottom margin</span>
              </label>
              
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isVisible}
                  onChange={(e) =>
                    onInputChange("isVisible", e.target.checked)
                  }
                  className="hidden"
                />
                <div
                  className={`w-5 h-5 border rounded flex items-center justify-center transition-colors ${
                    formData.isVisible
                      ? "border-blue-500 bg-blue-500"
                      : "border-gray-300 bg-white"
                  }`}
                >
                  {formData.isVisible && (
                    <div className="w-2 h-2 bg-white rounded-sm"></div>
                  )}
                </div>
                <span className="text-sm">Make module visible</span>
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="form-footer p-4 border-t border-gray-200 sticky bottom-0 bg-white">
          <button 
            onClick={handleSave}
            className={`w-full py-3 rounded text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
              selectedModule 
                ? "bg-blue-500 text-white hover:bg-blue-600" 
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
            disabled={!selectedModule}
          >
            <Save size={16} />
            <span>{selectedModule ? "Save Changes" : "Add to Preview First"}</span>
          </button>
          
          {!selectedModule && (
            <p className="text-xs text-gray-500 text-center mt-2">
              Add this module to the preview to configure its settings
            </p>
          )}
        </div>
      </div>
    </div>
  );
};