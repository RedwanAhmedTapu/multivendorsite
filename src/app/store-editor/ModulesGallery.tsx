import { ModuleItem, ActiveModule } from "./page";

interface ModulesGalleryProps {
  selectedSidebarModule: ModuleItem | null;
  moduleCategories: any[];
  activeModules: ActiveModule[];
  onModuleSelect: (module: ActiveModule) => void; // Changed to ActiveModule
  onModuleDelete: (moduleId: string) => void;
}

export const ModulesGallery = ({
  selectedSidebarModule,
  moduleCategories,
  activeModules,
  onModuleSelect,
  onModuleDelete,
}: ModulesGalleryProps) => {
  
  // Get modules that are currently in the preview area
  const getAddedModules = () => {
    return moduleCategories.map(category => ({
      ...category,
      items: category.items.filter((module: ModuleItem) => 
        activeModules.some(activeModule => activeModule.type === module.id)
      )
    })).filter(category => category.items.length > 0);
  };

  const addedCategories = getAddedModules();

  const handleModuleClick = (module: ModuleItem) => {
    // Find the active module that matches this module type
    const activeModule = activeModules.find(activeModule => activeModule.type === module.id);
    if (activeModule) {
      onModuleSelect(activeModule); // Select the active module in preview
    }
  };

  const handleModuleDelete = (module: ModuleItem) => {
    // Find the active module with this type and delete it
    const activeModuleToDelete = activeModules.find(activeModule => activeModule.type === module.id);
    if (activeModuleToDelete) {
      onModuleDelete(activeModuleToDelete.id);
    }
  };

  return (
    <div className="w-96 bg-white border-l border-gray-200 h-screen overflow-y-auto">
      <div className="p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Added Modules</h2>

        {/* Added Modules List */}
        {addedCategories.length > 0 ? (
          <div className="space-y-8">
            {addedCategories.map((category) => (
              <div key={category.name} className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900 border-b pb-2">
                  {category.name}
                </h4>
                
                <div className="space-y-2">
                  {category.items.map((module: ModuleItem) => (
                    <div
                      key={module.id}
                      className="p-3 rounded-lg cursor-pointer transition-all hover:bg-gray-50 flex items-center justify-between border border-transparent"
                      onClick={() => handleModuleClick(module)}
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={module.icon}
                          alt={module.name}
                          className="w-6 h-6"
                        />
                        <div>
                          <h5 className="font-normal text-gray-700 text-sm">
                            {module.name}
                          </h5>
                          <p className="text-xs text-gray-500">
                            {module.count}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button 
                          className="text-red-400 hover:text-red-600 p-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleModuleDelete(module);
                          }}
                          title="Remove from Preview"
                        >
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path 
                              d="M4 4L12 12M4 12L12 4" 
                              stroke="currentColor" 
                              strokeWidth="2" 
                              strokeLinecap="round"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Modules Added</h3>
            <p className="text-gray-500 text-sm">
              Add modules from the left sidebar to see them here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};