import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings, Tag, FileText } from "lucide-react";
import AttributesTab from "../../components/admindashboadrcomponents/AttributesTab";
import SpecificationsTab from "../../components/admindashboadrcomponents/SpecificationsTab";
import { Category } from "../../types/type";

interface PropertiesManagerProps {
  selectedChildId: string;
  selectedChildCategory: Category;
  activeTab: "attributes" | "specifications";
  onTabChange: (tab: "attributes" | "specifications") => void;
}

const PropertiesManager: React.FC<PropertiesManagerProps> = ({
  selectedChildId,
  selectedChildCategory,
  activeTab,
  onTabChange
}) => {
  return (
    <Card className="bg-white border-gray-200 shadow-sm">
      <CardHeader className="bg-gray-50 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <CardTitle className="text-gray-900 flex items-center gap-2">
            <Settings className="h-5 w-5 text-teal-500" />
            Manage Properties for {selectedChildCategory.name}
          </CardTitle>
          <div className="flex border border-gray-200 rounded-md overflow-hidden">
            <Button
              variant={activeTab === "attributes" ? "default" : "ghost"}
              className={`h-8 px-3 text-xs rounded-none ${activeTab === "attributes" ? "bg-teal-600 hover:bg-teal-700" : "bg-white"}`}
              onClick={() => onTabChange("attributes")}
            >
              <Tag className="h-3 w-3 mr-1" />
              Attributes
            </Button>
            <Button
              variant={activeTab === "specifications" ? "default" : "ghost"}
              className={`h-8 px-3 text-xs rounded-none ${activeTab === "specifications" ? "bg-teal-600 hover:bg-teal-700" : "bg-white"}`}
              onClick={() => onTabChange("specifications")}
            >
              <FileText className="h-3 w-3 mr-1" />
              Specifications
            </Button>
          </div>
        </div>
        <CardDescription className="text-gray-500">
          Add {activeTab === "attributes" ? "attributes" : "specifications"} to the selected category
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {activeTab === "attributes" ? (
          <AttributesTab selectedChildId={selectedChildId} />
        ) : (
          <SpecificationsTab selectedChildId={selectedChildId} />
        )}
      </CardContent>
    </Card>
  );
};

export default PropertiesManager;