import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit, Trash2, Type, Hash, ToggleLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  useGetSpecificationsQuery,
  useCreateSpecificationMutation,
  useUpdateSpecificationMutation,
  useDeleteSpecificationMutation,
} from "@/features/apiSlice";
import { Specification } from "../../types/type";

interface SpecificationsTabProps {
  selectedChildId: string;
}

const SpecificationsTab: React.FC<SpecificationsTabProps> = ({ selectedChildId }) => {
  const [newSpecification, setNewSpecification] = useState({ 
    name: "", 
    type: "TEXT", 
    unit: "", 
    filterable: true, 
    required: false 
  });
  const [editingSpecification, setEditingSpecification] = useState<Specification | null>(null);

  const { 
    data: specifications = [], 
    isLoading: specificationsLoading, 
    refetch: refetchSpecifications 
  } = useGetSpecificationsQuery(selectedChildId);
  
  const [createSpecification] = useCreateSpecificationMutation();
  const [updateSpecification] = useUpdateSpecificationMutation();
  const [deleteSpecification] = useDeleteSpecificationMutation();

  const currentSpecifications = specifications.filter(s => s.categoryId === selectedChildId);

  // Specification handlers
  const handleCreateSpecification = async () => {
    if (!newSpecification.name || !selectedChildId) {
      toast.error("Please provide specification name and select a category");
      return;
    }

    try {
      const promise = createSpecification({
        ...newSpecification,
        categoryId: selectedChildId
      }).unwrap();
      
      toast.promise(promise, {
        loading: `Creating specification "${newSpecification.name}"...`,
        success: (specification) => {
          setNewSpecification({ name: "", type: "TEXT", unit: "", filterable: true, required: false });
          refetchSpecifications();
          return `Specification "${specification.name}" created successfully`;
        },
        error: (error) => {
          return error.data?.message || "Failed to create specification";
        }
      });
    } catch (error) {
      toast.error("Failed to create specification");
    }
  };

  const handleUpdateSpecification = async () => {
    if (!editingSpecification || !editingSpecification.name) {
      toast.error("Please provide specification name");
      return;
    }

    try {
      const promise = updateSpecification({
        id: editingSpecification.id,
        ...editingSpecification
      }).unwrap();
      
      toast.promise(promise, {
        loading: `Updating specification "${editingSpecification.name}"...`,
        success: (specification) => {
          setEditingSpecification(null);
          refetchSpecifications();
          return `Specification "${specification.name}" updated successfully`;
        },
        error: (error) => {
          return error.data?.message || "Failed to update specification";
        }
      });
    } catch (error) {
      toast.error("Failed to update specification");
    }
  };

  const handleDeleteSpecification = async (id: string, name: string) => {
    try {
      const promise = deleteSpecification(id).unwrap();
      
      toast.promise(promise, {
        loading: `Deleting specification "${name}"...`,
        success: () => {
          setEditingSpecification(null);
          refetchSpecifications();
          return "Specification deleted successfully";
        },
        error: (error) => {
          return error.data?.message || "Failed to delete specification";
        }
      });
    } catch (error) {
      toast.error("Failed to delete specification");
    }
  };

  if (specificationsLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
      </div>
    );
  }

  return (
    <>
      {/* Existing Specifications */}
      {currentSpecifications.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-medium text-gray-900">Existing Specifications</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentSpecifications.map(spec => (
              <div key={spec.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50 relative">
                {editingSpecification?.id === spec.id ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-gray-700">Specification Name</Label>
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          className="h-7 px-2 bg-teal-600 hover:bg-teal-700"
                          onClick={handleUpdateSpecification}
                        >
                          Save
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 px-2"
                          onClick={() => setEditingSpecification(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                    <Input
                      value={editingSpecification.name}
                      onChange={(e) => setEditingSpecification({...editingSpecification, name: e.target.value})}
                      className="bg-white border-gray-300"
                    />
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-gray-700">Type</Label>
                        <Select 
                          value={editingSpecification.type} 
                          onValueChange={(value) => setEditingSpecification({...editingSpecification, type: value})}
                        >
                          <SelectTrigger className="bg-white border-gray-300">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="TEXT">Text</SelectItem>
                            <SelectItem value="NUMBER">Number</SelectItem>
                            <SelectItem value="BOOLEAN">Boolean</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-gray-700">Unit (optional)</Label>
                        <Input
                          placeholder="e.g., inches, GHz"
                          value={editingSpecification.unit || ''}
                          onChange={(e) => setEditingSpecification({...editingSpecification, unit: e.target.value})}
                          className="bg-white border-gray-300"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 pt-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`spec-filterable-${spec.id}`}
                          checked={editingSpecification.filterable}
                          onChange={(e) => setEditingSpecification({...editingSpecification, filterable: e.target.checked})}
                          className="rounded text-teal-600 focus:ring-teal-500"
                        />
                        <Label htmlFor={`spec-filterable-${spec.id}`} className="text-sm">Filterable</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`spec-required-${spec.id}`}
                          checked={editingSpecification.required}
                          onChange={(e) => setEditingSpecification({...editingSpecification, required: e.target.checked})}
                          className="rounded text-teal-600 focus:ring-teal-500"
                        />
                        <Label htmlFor={`spec-required-${spec.id}`} className="text-sm">Required</Label>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900">{spec.name}</div>
                        <div className="text-sm text-gray-500 capitalize flex items-center gap-1">
                          {spec.type === 'TEXT' && <Type className="h-3 w-3" />}
                          {spec.type === 'NUMBER' && <Hash className="h-3 w-3" />}
                          {spec.type === 'BOOLEAN' && <ToggleLeft className="h-3 w-3" />}
                          {spec.type?.toLowerCase()}
                          {spec.unit && ` • ${spec.unit}`}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-blue-500 hover:text-blue-700 hover:bg-blue-100"
                          onClick={() => setEditingSpecification(spec)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-100"
                          onClick={() => handleDeleteSpecification(spec.id, spec.name)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 mt-3">
                      <div className="flex items-center gap-1">
                        <div className={`h-2 w-2 rounded-full ${spec.filterable ? 'bg-teal-500' : 'bg-gray-300'}`}></div>
                        <span className="text-xs text-gray-600">{spec.filterable ? 'Filterable' : 'Not filterable'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className={`h-2 w-2 rounded-full ${spec.required ? 'bg-teal-500' : 'bg-gray-300'}`}></div>
                        <span className="text-xs text-gray-600">{spec.required ? 'Required' : 'Optional'}</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add New Specification */}
      <div className="space-y-4 pt-4 border-t border-gray-200">
        <h3 className="font-medium text-gray-900">Add New Specification</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="spec-name" className="text-gray-700">Specification Name *</Label>
            <Input
              id="spec-name"
              placeholder="e.g., Screen Size, Battery Capacity"
              value={newSpecification.name}
              onChange={(e) => setNewSpecification({...newSpecification, name: e.target.value})}
              className="bg-white border-gray-300 focus:ring-teal-500"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="spec-type" className="text-gray-700">Type *</Label>
            <Select 
              value={newSpecification.type} 
              onValueChange={(value) => setNewSpecification({...newSpecification, type: value})}
            >
              <SelectTrigger className="bg-white border-gray-300 focus:ring-teal-500">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TEXT">Text</SelectItem>
                <SelectItem value="NUMBER">Number</SelectItem>
                <SelectItem value="BOOLEAN">Boolean (Yes/No)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="spec-unit" className="text-gray-700">Unit (optional)</Label>
            <Input
              id="spec-unit"
              placeholder="e.g., inches, mAh, GHz"
              value={newSpecification.unit}
              onChange={(e) => setNewSpecification({...newSpecification, unit: e.target.value})}
              className="bg-white border-gray-300 focus:ring-teal-500"
            />
          </div>
          <div className="flex items-end gap-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="spec-filterable"
                checked={newSpecification.filterable}
                onChange={(e) => setNewSpecification({...newSpecification, filterable: e.target.checked})}
                className="rounded text-teal-600 focus:ring-teal-500"
              />
              <Label htmlFor="spec-filterable" className="text-gray-700">Use in filters</Label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="spec-required"
                checked={newSpecification.required}
                onChange={(e) => setNewSpecification({...newSpecification, required: e.target.checked})}
                className="rounded text-teal-600 focus:ring-teal-500"
              />
              <Label htmlFor="spec-required" className="text-gray-700">Required</Label>
            </div>
          </div>
        </div>
        
        <Button 
          className="bg-teal-600 hover:bg-teal-700"
          onClick={handleCreateSpecification}
          disabled={!newSpecification.name || !selectedChildId}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Specification
        </Button>
      </div>
    </>
  );
};

export default SpecificationsTab;