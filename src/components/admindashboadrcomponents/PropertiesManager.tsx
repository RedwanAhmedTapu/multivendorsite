

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, Tag } from "lucide-react";
import AttributesTab from "../../components/admindashboadrcomponents/AttributesTab";
import { Category } from "../../types/type";

interface PropertiesManagerProps {
  selectedChildId: string;
  selectedChildCategory: Category;
}

const PropertiesManager: React.FC<PropertiesManagerProps> = ({
  selectedChildId,
  selectedChildCategory,
}) => {
  return (
    <Card className="bg-white border-gray-200 shadow-sm">
      <CardHeader className="bg-gray-50 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <CardTitle className="text-gray-900 flex items-center gap-2">
            <Settings className="h-5 w-5 text-teal-500" />
            Manage Attributes for <span className="text-teal-900">{selectedChildCategory.name}</span>
          </CardTitle>
      
        </div>
     
      </CardHeader>
      <CardContent className="p-6">
        <AttributesTab selectedChildId={selectedChildId} />
      </CardContent>
    </Card>
  );
};

export default PropertiesManager;