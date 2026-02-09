import React from "react";
import { X, FileSpreadsheet, FileText, Download, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

interface ExportModalProps {
  selectedCount: number;
  totalCount: number;
  onClose: () => void;
  onExport: (format: "excel" | "csv") => void;
}

const ExportModal: React.FC<ExportModalProps> = ({
  selectedCount,
  totalCount,
  onClose,
  onExport,
}) => {
  const exportOptions = [
    {
      id: "excel",
      title: "Excel (.xlsx)",
      description: "Export with formatting, formulas, and multiple sheets. Best for analysis and reporting.",
      icon: FileSpreadsheet,
      features: [
        "Product details with variants",
        "Formatted pricing and discounts",
        "Stock levels and status",
        "Content quality scores",
        "Multiple worksheet tabs",
        "Preserved formatting"
      ],
      color: "emerald",
      recommended: true
    },
    {
      id: "csv",
      title: "CSV (.csv)",
      description: "Simple text format compatible with all spreadsheet applications and databases.",
      icon: FileText,
      features: [
        "Universal compatibility",
        "Easy import to databases",
        "Lightweight file size",
        "Plain text format",
        "Fast processing",
        "UTF-8 encoding"
      ],
      color: "blue",
      recommended: false
    }
  ];

  const getColorClasses = (color: string) => {
    switch (color) {
      case "emerald":
        return {
          bg: "bg-emerald-50",
          hoverBg: "hover:bg-emerald-100",
          border: "border-emerald-200",
          hoverBorder: "hover:border-emerald-400",
          text: "text-emerald-700",
          iconBg: "bg-emerald-100",
          iconHover: "group-hover:bg-emerald-200",
          iconColor: "text-emerald-600"
        };
      case "blue":
        return {
          bg: "bg-blue-50",
          hoverBg: "hover:bg-blue-100",
          border: "border-blue-200",
          hoverBorder: "hover:border-blue-400",
          text: "text-blue-700",
          iconBg: "bg-blue-100",
          iconHover: "group-hover:bg-blue-200",
          iconColor: "text-blue-600"
        };
      default:
        return {
          bg: "bg-teal-50",
          hoverBg: "hover:bg-teal-100",
          border: "border-teal-200",
          hoverBorder: "hover:border-teal-400",
          text: "text-teal-700",
          iconBg: "bg-teal-100",
          iconHover: "group-hover:bg-teal-200",
          iconColor: "text-teal-600"
        };
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileDown className="w-5 h-5" />
            Export Products
          </DialogTitle>
          <DialogDescription>
            Choose your preferred export format
          </DialogDescription>
        </DialogHeader>

        {/* Export Summary */}
        <div className="bg-teal-50 rounded-lg p-4 border border-teal-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-teal-900">
                {selectedCount > 0 ? (
                  <>
                    Exporting <span className="font-bold">{selectedCount}</span>{" "}
                    selected product{selectedCount > 1 ? "s" : ""}
                  </>
                ) : (
                  <>
                    Exporting <span className="font-bold">{totalCount}</span>{" "}
                    filtered product{totalCount > 1 ? "s" : ""}
                  </>
                )}
              </p>
              <p className="text-xs text-teal-600 mt-1">
                {selectedCount > 0 
                  ? "Only selected products will be exported"
                  : "All products matching your filters will be exported"
                }
              </p>
            </div>
            <Badge variant="outline" className="bg-white text-teal-700 border-teal-200">
              <Download className="w-3 h-3 mr-1" />
              Export Ready
            </Badge>
          </div>
        </div>

        {/* Export Options */}
        <div className="space-y-4">
          {exportOptions.map((option) => {
            const colors = getColorClasses(option.color);
            const Icon = option.icon;

            return (
              <Card
                key={option.id}
                className={`cursor-pointer transition-all duration-200 hover:scale-[1.02] ${colors.border} ${colors.hoverBorder} overflow-hidden`}
                onClick={() => onExport(option.id as "excel" | "csv")}
              >
                <CardContent className="p-0">
                  <div className={`p-4 ${colors.bg} border-b ${colors.border}`}>
                    <div className="flex items-start gap-4">
                      <div className={`relative flex-shrink-0`}>
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colors.iconBg} group-hover:${colors.iconHover}`}>
                          <Icon className={`w-6 h-6 ${colors.iconColor}`} />
                        </div>
                        {option.recommended && (
                          <div className="absolute -top-1 -right-1">
                            <Badge className="bg-emerald-500 text-white text-xs px-1 py-0">
                              Best
                            </Badge>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <h3 className="font-semibold text-gray-900">
                            {option.title}
                          </h3>
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${colors.text} ${colors.border}`}
                          >
                            .{option.id}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {option.description}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {option.features.map((feature, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 text-sm"
                        >
                          <div className={`w-1.5 h-1.5 rounded-full ${colors.iconColor}`}></div>
                          <span className="text-gray-700">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* File Size Info */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            Estimated file size: {selectedCount > 0 ? selectedCount : totalCount} products ≈{" "}
            <span className="font-medium text-teal-600">
              {Math.round((selectedCount > 0 ? selectedCount : totalCount) * 2)}KB
            </span>
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Download will start automatically after format selection
          </p>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 border-teal-200 text-teal-700 hover:bg-teal-50"
          >
            Cancel
          </Button>
          <Button
            variant="outline"
            onClick={() => onExport("excel")}
            className="flex-1 border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
          >
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Excel
          </Button>
          <Button
            onClick={() => onExport("csv")}
            className="flex-1 bg-teal-600 hover:bg-teal-700"
          >
            <FileText className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ExportModal;