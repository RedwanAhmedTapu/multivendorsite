// app/(admin-dashboard)/@rightbar/page.tsx
"use client";

// import { ImageUploader } from "@/components/ImageUploader";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarSeparator,
  SidebarProvider,
} from "@/components/ui/sidebar";
// import { FiltersContainer } from "@/features/filters/FilterContainer";
import { Info, HelpCircle, Filter } from "lucide-react";

export default function Rightbar() {
  return (
    <SidebarProvider>
      <Sidebar side="right" className="relative bg-background   w-full h-screen border-l">
        {/* <SidebarHeader className="p-4 bg-background">
          <h2 className="text-lg font-semibold">Quick Access</h2>
        </SidebarHeader> */}

        <SidebarContent
          className="flex-1 bg-background overflow-y-auto  [-ms-overflow-style:none]  
                     [scrollbar-width:none]    
                     [&::-webkit-scrollbar]:hidden"
        >
          <div className="space-y-4 p-4">
            {/* Notifications Section */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Filter className="h-4 w-4" />
                <span className="text-2xl">Filters</span>
              </div>
             {/* <FiltersContainer/> */}
            </div>

            <SidebarSeparator />

            {/* Information Panel */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Info className="h-4 w-4" />
                <span className="text-2xl">Tools</span>
              </div>
              <div className="text-sm text-gray-400">
               {/* <ImageUploader/> */}
              </div>
            </div>
          </div>
        </SidebarContent>

        <SidebarSeparator />

        <SidebarFooter className="p-4 bg-background">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <HelpCircle className="h-4 w-4" />
            <span>Help & Support</span>
          </div>
        </SidebarFooter>
      </Sidebar>
    </SidebarProvider>
  );
}
