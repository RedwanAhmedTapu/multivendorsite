"use client";
import React, { useState, useRef, useEffect } from "react";
import { StoreModulesSidebar } from "./StoreModulesSidebar";
import { ModuleDemoModal } from "./ModuleDemoModal";
import { PreviewArea } from "./PreviewArea";
import { ConfigurationForm } from "./ConfigurationForm";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { ModulesGallery } from "./ModulesGallery";
import { TopBar } from "./TopBar";

// Types
export interface ModuleItem {
  id: string;
  name: string;
  icon: string;
  count: number;
  disabled?: boolean;
  hot?: boolean;
}

export interface ModuleCategory {
  name: string;
  items: ModuleItem[];
}

export interface ActiveModule {
  id: string;
  name: string;
  icon: string;
  type: string;
}

// Main Component
const StoreLayoutEditor = () => {
  const [activeModule, setActiveModule] = useState("graphicCarousel_26212860");
  const [showStoreModules, setShowStoreModules] = useState(true);
  const [syncEnabled, setSyncEnabled] = useState(false);
  const [selectedModule, setSelectedModule] = useState<ModuleItem | null>(null);
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(280);
  const [showRightPanel, setShowRightPanel] = useState(true);
  const [showConfigForm, setShowConfigForm] = useState(false);
  const [selectedActiveModule, setSelectedActiveModule] = useState<ActiveModule | null>(null);
  const [currentView, setCurrentView] = useState<'mobile' | 'desktop'>('mobile');

  const sidebarRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    title: "Hidden",
    fullWidth: "1200px",
    carouselSpeed: "5 seconds",
    displayBottomMargin: false,
  });

  const [activeModules, setActiveModules] = useState<ActiveModule[]>([
    {
      id: "categoryBar_25723109",
      name: "Category bar",
      icon: "//id-live.slatic.net/original/7075aee0e853ad8e1042f3a3cfcccdaa.png",
      type: "categoryBar",
    },
    {
      id: "graphicThreeImages_26179633",
      name: "Three banners",
      icon: "https://img.alicdn.com/imgextra/i3/O1CN01jm3FKE1rlMuQPP8cj_!!6000000005671-2-tps-72-73.png",
      type: "graphicThreeImages",
    },
    {
      id: "countdownProduct_26176877",
      name: "Countdown Products",
      icon: "https://img.alicdn.com/imgextra/i1/O1CN01rPIhBB29LrwPfWVjR_!!6000000008052-2-tps-72-72.png",
      type: "countdownProduct",
    },
    {
      id: "graphicCarousel_26212860",
      name: "Banner Carousel",
      icon: "https://img.alicdn.com/imgextra/i1/O1CN01jXJ1ln1XYHH3YYADF_!!6000000002935-2-tps-72-73.png",
      type: "graphicCarousel",
    },
  ]);

  const moduleCategories: ModuleCategory[] = [
    {
      name: "Advanced Modules (1)",
      items: [
        {
          id: "countdownProduct",
          name: "Countdown Products",
          icon: "https://img.alicdn.com/imgextra/i1/O1CN01rPIhBB29LrwPfWVjR_!!6000000008052-2-tps-72-72.png",
          count: 1,
          disabled: false,
        },
      ],
    },
    {
      name: "Category (2)",
      items: [
        {
          id: "brandList",
          name: "Category List",
          icon: "https://img.alicdn.com/imgextra/i2/O1CN01uaqewq1m3KkZnwwrP_!!6000000004898-2-tps-72-73.png",
          count: 1,
          hot: false,
        },
        {
          id: "categoryAuto",
          name: "Smart Category Navigation",
          icon: "https://img.alicdn.com/imgextra/i4/O1CN01TEAeTy1x10VqTecnr_!!6000000006382-2-tps-72-72.png",
          count: 1,
          disabled: false,
        },
      ],
    },
    {
      name: "Banner (8)",
      items: [
        {
          id: "graphicThreeImages",
          name: "Three banners",
          icon: "https://img.alicdn.com/imgextra/i3/O1CN01jm3FKE1rlMuQPP8cj_!!6000000005671-2-tps-72-73.png",
          count: 1,
        },
        {
          id: "graphicOneImage",
          name: "Single Banner",
          icon: "https://img.alicdn.com/imgextra/i3/O1CN01FHanhX1YBfKqdYp5p_!!6000000003021-2-tps-72-73.png",
          count: 1,
          hot: true,
        },
        {
          id: "graphicCarousel",
          name: "Banner Carousel",
          icon: "https://img.alicdn.com/imgextra/i1/O1CN01jXJ1ln1XYHH3YYADF_!!6000000002935-2-tps-72-73.png",
          count: 1,
        },
        {
          id: "graphicMultiImages",
          name: "Multiple banners",
          icon: "https://img.alicdn.com/imgextra/i3/O1CN01YYCWdk1SfXTXmMY3y_!!6000000002274-2-tps-72-73.png",
          count: 1,
        },
        {
          id: "fourBannersA",
          name: "Four Banners A",
          icon: "https://img.alicdn.com/imgextra/i4/O1CN01fkakT21Bxzy4D28Dj_!!6000000000013-2-tps-72-73.png",
          count: 1,
        },
        {
          id: "fiveBannersA",
          name: "Five banners A",
          icon: "https://img.alicdn.com/imgextra/i3/O1CN01dcCTVz1sjpBvUpvLH_!!6000000005803-2-tps-72-73.png",
          count: 0,
        },
      ],
    },
    {
      name: "Product (7)",
      items: [
        {
          id: "carouselProductRecommend",
          name: "Products Carousel",
          icon: "https://img.alicdn.com/imgextra/i2/O1CN01dWvm7F1lwvCeEJVm3_!!6000000004884-2-tps-72-72.png",
          count: 1,
          hot: false,
          disabled: false,
        },
        {
          id: "productRecommendation",
          name: "Product Recommendation",
          icon: "https://img.alicdn.com/imgextra/i1/O1CN01yA59ze1UDGFbMnQpX_!!6000000002483-2-tps-72-72.png",
          count: 1,
          hot: false,
          disabled: false,
        },
        {
          id: "sliderRecommend",
          name: "Slider Product Recommendation",
          icon: "https://img.alicdn.com/imgextra/i1/O1CN01nkrYf41RTnhzHvTyE_!!6000000002113-2-tps-72-72.png",
          count: 1,
          hot: false,
          disabled: false,
        },
        {
          id: "productPromotion",
          name: "Product Highlights",
          icon: "https://img.alicdn.com/imgextra/i2/O1CN01wQxPMu1OSTiWYg7wy_!!6000000001704-2-tps-72-72.png",
          count: 1,
          hot: false,
          disabled: false,
        },
        {
          id: "threeColumnProducts",
          name: "Three Columns Products List",
          icon: "https://img.alicdn.com/imgextra/i2/O1CN01zVzTM01yHKF13lWhZ_!!6000000006553-2-tps-72-72.png",
          count: 1,
          hot: false,
          disabled: false,
        },
      ],
    },
    {
      name: "Promotion (1)",
      items: [
        {
          id: "voucher",
          name: "Voucher",
          icon: "https://img.alicdn.com/imgextra/i4/O1CN01uP1UbS1Jx67M1QR0L_!!6000000001094-2-tps-72-72.png",
          count: 1,
          hot: false,
          disabled: false,
        },
      ],
    },
  ];

  // Measure sidebar width on mount and when sidebar visibility changes
  useEffect(() => {
    const updateSidebarWidth = () => {
      if (sidebarRef.current) {
        const width = sidebarRef.current.offsetWidth;
        setSidebarWidth(width);
      }
    };

    updateSidebarWidth();
    const timeoutId = setTimeout(updateSidebarWidth, 100);
    window.addEventListener("resize", updateSidebarWidth);

    return () => {
      window.removeEventListener("resize", updateSidebarWidth);
      clearTimeout(timeoutId);
    };
  }, [showStoreModules]);

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSidebarModuleClick = (module: ModuleItem) => {
    setSelectedModule(module);
    setIsDemoModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsDemoModalOpen(false);
    setSelectedModule(null);
  };

  const handleModuleDrop = (moduleId: string, position: number) => {
    let newModule: ModuleItem | undefined;

    for (const category of moduleCategories) {
      newModule = category.items.find((item) => item.id === moduleId);
      if (newModule) break;
    }

    if (newModule && !newModule.disabled) {
      const activeModule: ActiveModule = {
        id: `${newModule.id}_${Date.now()}`,
        name: newModule.name,
        icon: newModule.icon,
        type: newModule.id,
      };

      setActiveModules((prev) => {
        const newModules = [...prev];
        newModules.splice(position, 0, activeModule);
        return newModules;
      });
    }
  };

  const handleActiveModuleSelect = (module: ActiveModule) => {
    setSelectedActiveModule(module);
    setShowConfigForm(true);
  };

  const handleConfigFormClose = () => {
    setShowConfigForm(false);
    setSelectedActiveModule(null);
  };

  // New functions for component operations
  const handleMoveUp = (moduleId: string) => {
    setActiveModules((prev) => {
      const index = prev.findIndex((module) => module.id === moduleId);
      if (index <= 0) return prev;

      const newModules = [...prev];
      [newModules[index - 1], newModules[index]] = [
        newModules[index],
        newModules[index - 1],
      ];
      return newModules;
    });
  };

  const handleMoveDown = (moduleId: string) => {
    setActiveModules((prev) => {
      const index = prev.findIndex((module) => module.id === moduleId);
      if (index === -1 || index === prev.length - 1) return prev;

      const newModules = [...prev];
      [newModules[index], newModules[index + 1]] = [
        newModules[index + 1],
        newModules[index],
      ];
      return newModules;
    });
  };

  const handleCopy = (moduleId: string) => {
    const moduleToCopy = activeModules.find((module) => module.id === moduleId);
    if (!moduleToCopy) return;

    const copiedModule: ActiveModule = {
      ...moduleToCopy,
      id: `${moduleToCopy.type}_${Date.now()}`,
    };

    const index = activeModules.findIndex((module) => module.id === moduleId);
    setActiveModules((prev) => {
      const newModules = [...prev];
      newModules.splice(index + 1, 0, copiedModule);
      return newModules;
    });
  };

  const handleDelete = (moduleId: string) => {
    const moduleToDelete = activeModules.find(
      (module) => module.id === moduleId
    );
    if (
      moduleToDelete?.type === "categoryBar" &&
      activeModules[0]?.type === "categoryBar"
    ) {
      const index = activeModules.findIndex((module) => module.id === moduleId);
      if (index === 0) {
        alert(
          "Store Header cannot be deleted as it's required in the first position."
        );
        return;
      }
    }

    setActiveModules((prev) => prev.filter((module) => module.id !== moduleId));

    if (selectedActiveModule?.id === moduleId) {
      setSelectedActiveModule(null);
      setShowConfigForm(false);
    }
  };

  const handleGalleryModuleSelect = (activeModule: ActiveModule) => {
    setSelectedActiveModule(activeModule);
    setShowConfigForm(true);
  };

  const toggleRightPanel = () => {
    setShowRightPanel(!showRightPanel);
  };

  const togglePanelView = () => {
    if (selectedActiveModule) {
      setShowConfigForm(!showConfigForm);
    } else {
      setShowRightPanel(!showRightPanel);
    }
  };

  // Add these functions for TopBar
  const handleViewChange = (view: 'mobile' | 'desktop') => {
    setCurrentView(view);
  };

  const handlePublish = () => {
    alert(`Publishing ${currentView} view...`);
    console.log('Publishing store layout...');
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans flex flex-col">
      {/* TopBar - Fixed at the top */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <TopBar 
          currentView={currentView}
          onViewChange={handleViewChange}
          onPublish={handlePublish}
        />
      </div>

      {/* Main content area - Starts below TopBar */}
      <div className="flex flex-1 pt-16"> {/* pt-16 to account for TopBar height */}
        {/* Sidebar */}
        <div ref={sidebarRef} className="h-[calc(100vh-64px)] sticky top-16">
          <StoreModulesSidebar
            showStoreModules={showStoreModules}
            setShowStoreModules={setShowStoreModules}
            moduleCategories={moduleCategories}
            onModuleClick={handleSidebarModuleClick}
            selectedModuleId={selectedModule?.id || null}
          />
        </div>

        {/* Preview and Right Panel Area */}
        <div className="flex-1 flex min-h-[calc(100vh-64px)]">
          {/* Preview Area */}
          <div className="flex-1">
            <PreviewArea
              activeModules={activeModules}
              onModuleDrop={handleModuleDrop}
              selectedModuleId={selectedActiveModule?.id || null}
              onModuleSelect={handleActiveModuleSelect}
              onMoveUp={handleMoveUp}
              onMoveDown={handleMoveDown}
              onCopy={handleCopy}
              onDelete={handleDelete}
              currentView={currentView}
            />
          </div>

          {/* Right Panel Toggle Button - Always visible */}
          {!showRightPanel && (
            <button
              onClick={toggleRightPanel}
              className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-teal-500 text-white p-2 rounded-l-lg shadow-lg hover:bg-teal-600 transition-colors z-10"
            >
              <ChevronLeft size={20} />
            </button>
          )}

          {/* Right Panel Content */}
          {showRightPanel && (
            <div className="w-96 bg-white border-l border-gray-200 h-[calc(100vh-64px)] overflow-y-auto sticky top-16">
              {/* Toggle Button inside the panel */}
              <button
                onClick={togglePanelView}
                className="absolute -left-6 top-1/2 transform -translate-y-1/2 bg-teal-500 text-white p-1 rounded-l shadow-lg hover:bg-teal-600 transition-colors z-10"
                title={showConfigForm ? "Show Modules" : "Show Configuration"}
              >
                {showConfigForm ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
              </button>

              {/* Show ConfigurationForm when module is selected AND showConfigForm is true */}
              {selectedActiveModule && showConfigForm ? (
                <ConfigurationForm
                  formData={formData}
                  onInputChange={handleInputChange}
                  selectedModule={selectedActiveModule}
                  onClose={handleConfigFormClose}
                  selectedSidebarModule={selectedModule}
                  onDeleteModule={handleDelete}
                />
              ) : (
                /* Show ModulesGallery when no module selected OR showConfigForm is false */
                <ModulesGallery
                  selectedSidebarModule={selectedModule}
                  moduleCategories={moduleCategories}
                  activeModules={activeModules}
                  onModuleSelect={handleGalleryModuleSelect}
                  onModuleDelete={handleDelete}
                />
              )}
            </div>
          )}
        </div>

        <ModuleDemoModal
          isOpen={isDemoModalOpen}
          onClose={handleCloseModal}
          module={selectedModule}
          sidebarWidth={sidebarWidth}
        />
      </div>
    </div>
  );
};

export default StoreLayoutEditor;