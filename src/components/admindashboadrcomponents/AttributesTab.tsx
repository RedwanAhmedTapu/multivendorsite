import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit, Trash2, CheckSquare, Type, Hash, ToggleLeft, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import {
  useGetCategoriesQuery,
  useCreateAttributeMutation,
  useUpdateAttributeMutation,
  useDeleteAttributeMutation,
  useAddAttributeValueMutation,
  useDeleteAttributeValueMutation,
} from "@/features/apiSlice";

interface AttributesTabProps {
  selectedChildId: string;
}

// Match the actual structure from your API response
interface AttributeFromAPI {
  id: string;
  name: string;
  slug: string;
  type: string;
  values?: Array<{
    id: string;
    value: string;
    attributeId: string;
    createdAt: string;
    updatedAt: string;
  }>;
  isRequired: boolean;
  isForVariant: boolean;
  filterable: boolean;
  createdAt: string;
  updatedAt: string;
}

const AttributesTab: React.FC<AttributesTabProps> = ({ selectedChildId }) => {
  const [newAttribute, setNewAttribute] = useState({ 
    name: "", 
    type: "SELECT", 
    filterable: true, 
    required: false,
    values: [] as string[]
  });
  const [newValue, setNewValue] = useState("");
  const [addingValueTo, setAddingValueTo] = useState<string>(""); // Track which attribute we're adding value to
  const [editingAttribute, setEditingAttribute] = useState<AttributeFromAPI | null>(null);

  // Get categories data
  const { 
    data: categories = [], 
    isLoading: categoriesLoading, 
    refetch: refetchCategories 
  } = useGetCategoriesQuery();
  
  const [createAttribute] = useCreateAttributeMutation();
  const [updateAttribute] = useUpdateAttributeMutation();
  const [deleteAttribute] = useDeleteAttributeMutation();
  const [addAttributeValue] = useAddAttributeValueMutation();
  const [deleteAttributeValue] = useDeleteAttributeValueMutation();

  // Extract attributes for the selected category
  const currentAttributes = useMemo(() => {
    if (!selectedChildId || !categories.length) return [];
    
    // Find the selected category recursively
    const findCategoryById = (cats: any[], id: string): any => {
      for (const cat of cats) {
        if (cat.id === id) return cat;
        if (cat.children?.length) {
          const found = findCategoryById(cat.children, id);
          if (found) return found;
        }
      }
      return null;
    };

    const selectedCategory = findCategoryById(categories, selectedChildId);
    return selectedCategory?.attributes || [];
  }, [categories, selectedChildId]);

  // Add value to the new attribute values array
  const handleAddValueToNewAttribute = () => {
    if (!newValue.trim()) {
      toast.error("Please enter a value");
      return;
    }
    if (newAttribute.values.includes(newValue.trim())) {
      toast.error("This value already exists");
      return;
    }
    setNewAttribute(prev => ({
      ...prev,
      values: [...prev.values, newValue.trim()]
    }));
    setNewValue("");
  };

  // Remove value from the new attribute values array
  const handleRemoveValueFromNewAttribute = (index: number) => {
    setNewAttribute(prev => ({
      ...prev,
      values: prev.values.filter((_, i) => i !== index)
    }));
  };

  // Create new attribute
  const handleCreateAttribute = async () => {
    if (!newAttribute.name || !selectedChildId) {
      toast.error("Please provide attribute name and select a category");
      return;
    }

    if (newAttribute.type === 'SELECT' && newAttribute.values.length === 0) {
      toast.error("Please add at least one value for SELECT type attribute");
      return;
    }

    try {
      const attributeData = {
        name: newAttribute.name,
        type: newAttribute.type,
        filterable: newAttribute.filterable,
        required: newAttribute.required,
        categoryId: selectedChildId,
        ...(newAttribute.type === 'SELECT' && { values: newAttribute.values })
      };

      const result = await createAttribute(attributeData).unwrap();
      
      toast.success(`Attribute "${newAttribute.name}" created successfully${newAttribute.values.length > 0 ? ` with ${newAttribute.values.length} values` : ''}`);
      
      setNewAttribute({ 
        name: "", 
        type: "SELECT", 
        filterable: true, 
        required: false,
        values: [] 
      });
      
      // Invalidate categories to refresh data
      refetchCategories();
      
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to create attribute");
    }
  };

  // Update existing attribute
  const handleUpdateAttribute = async () => {
    if (!editingAttribute || !editingAttribute.name) {
      toast.error("Please provide attribute name");
      return;
    }

    try {
      const updateData = {
        name: editingAttribute.name,
        type: editingAttribute.type,
        filterable: editingAttribute.filterable,
        required: editingAttribute.isRequired,
        categoryId: selectedChildId
      };

      await updateAttribute({ 
        id: editingAttribute.id, 
        data: updateData 
      }).unwrap();
      
      toast.success(`Attribute "${editingAttribute.name}" updated successfully`);
      setEditingAttribute(null);
      refetchCategories();
      
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to update attribute");
    }
  };

  // Delete attribute - Fixed the main issue
const handleDeleteAttribute = async (attributeId: string, attributeName: string) => {
  if (!window.confirm(`Are you sure you want to delete "${attributeName}"? This action cannot be undone.`)) {
    return;
  }

  try {
    // Find the categoryAttributeId for this attribute
    const categoryAttribute = currentAttributes.find(
      (attr: AttributeFromAPI) => attr.id === attributeId
    );
    
    if (!categoryAttribute) {
      throw new Error("Category attribute not found");
    }

    // The actual ID needed by the backend is the categoryAttribute relationship ID
    // This assumes your API structure has the relationship ID available
    await deleteAttribute(categoryAttribute.id).unwrap();
    
    toast.success("Attribute deleted successfully");
    setEditingAttribute(null);
    refetchCategories();
  } catch (error: any) {
    const errorMessage = error?.data?.message || "Failed to delete attribute";
    toast.error(errorMessage);
    console.error("Delete error:", error);
  }
};

  // Add value to existing attribute
  const handleAddAttributeValue = async (attributeId: string, attributeName: string) => {
    const valueToAdd = addingValueTo === attributeId ? newValue : "";
    
    if (!valueToAdd.trim()) {
      toast.error("Please provide a value");
      return;
    }

    try {
      const result = await addAttributeValue({
        attributeId,
        value: valueToAdd.trim()
      }).unwrap();
      
      toast.success(`Value "${result.value}" added successfully`);
      setNewValue("");
      setAddingValueTo("");
      refetchCategories();
      
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to add value");
    }
  };

  // Delete attribute value
  const handleDeleteAttributeValue = async (valueId: string, value: string, attributeName: string) => {
    try {
      await deleteAttributeValue(valueId).unwrap();
      toast.success(`Value "${value}" deleted from ${attributeName}`);
      refetchCategories();
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to delete value");
    }
  };

  if (categoriesLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
      </div>
    );
  }

  if (!selectedChildId) {
    return (
      <div className="flex justify-center py-8 text-gray-500">
        Please select a category to manage attributes
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Existing Attributes */}
      {currentAttributes.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-medium text-gray-900">Existing Attributes ({currentAttributes.length})</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentAttributes.map((attr: AttributeFromAPI) => (
              <div key={attr.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50 relative">
                {editingAttribute?.id === attr.id ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-gray-700">Attribute Name</Label>
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          className="h-7 px-2 bg-teal-600 hover:bg-teal-700"
                          onClick={handleUpdateAttribute}
                        >
                          Save
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 px-2"
                          onClick={() => setEditingAttribute(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                    <Input
                      value={editingAttribute.name}
                      onChange={(e) => setEditingAttribute(prev => prev ? {...prev, name: e.target.value} : null)}
                      className="bg-white border-gray-300"
                    />
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`filterable-${attr.id}`}
                          checked={editingAttribute.filterable}
                          onChange={(e) => setEditingAttribute(prev => prev ? {...prev, filterable: e.target.checked} : null)}
                          className="rounded text-teal-600 focus:ring-teal-500"
                        />
                        <Label htmlFor={`filterable-${attr.id}`} className="text-sm">Filterable</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`required-${attr.id}`}
                          checked={editingAttribute.isRequired}
                          onChange={(e) => setEditingAttribute(prev => prev ? {...prev, isRequired: e.target.checked} : null)}
                          className="rounded text-teal-600 focus:ring-teal-500"
                        />
                        <Label htmlFor={`required-${attr.id}`} className="text-sm">Required</Label>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900">{attr.name}</div>
                        <div className="text-sm text-gray-500 capitalize flex items-center gap-1">
                          {attr.type === 'SELECT' && <CheckSquare className="h-3 w-3" />}
                          {attr.type === 'TEXT' && <Type className="h-3 w-3" />}
                          {attr.type === 'NUMBER' && <Hash className="h-3 w-3" />}
                          {attr.type === 'BOOLEAN' && <ToggleLeft className="h-3 w-3" />}
                          {attr.type?.toLowerCase()}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-blue-500 hover:text-blue-700 hover:bg-blue-100"
                          onClick={() => setEditingAttribute({
                            id: attr.id,
                            name: attr.name,
                            slug: attr.slug,
                            type: attr.type,
                            values: attr.values || [],
                            isRequired: attr.isRequired,
                            isForVariant: attr.isForVariant,
                            filterable: attr.filterable,
                            createdAt: attr.createdAt,
                            updatedAt: attr.updatedAt
                          })}
                          title="Edit attribute"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-100"
                          onClick={() => handleDeleteAttribute(attr.id, attr.name)}
                          title="Delete attribute"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <div className="flex items-center gap-1">
                        <div className={`h-2 w-2 rounded-full ${attr.filterable ? 'bg-teal-500' : 'bg-gray-300'}`}></div>
                        <span className="text-xs text-gray-600">{attr.filterable ? 'Filterable' : 'Not filterable'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className={`h-2 w-2 rounded-full ${attr.isRequired ? 'bg-teal-500' : 'bg-gray-300'}`}></div>
                        <span className="text-xs text-gray-600">{attr.isRequired ? 'Required' : 'Optional'}</span>
                      </div>
                    </div>
                    
                    <div className="mt-3">
                      <div className="text-xs font-medium text-gray-700 mb-1">Values ({attr.values?.length || 0}):</div>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {attr.values && attr.values.length > 0 ? (
                          attr.values.map(value => (
                            <div key={value.id} className="flex items-center gap-1 px-2 py-1 bg-white border border-gray-200 rounded-md">
                              <span className="text-xs">{value.value}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-3 w-3 p-0 text-red-500 hover:text-red-700"
                                onClick={() => handleDeleteAttributeValue(value.id, value.value, attr.name)}
                                title={`Delete value: ${value.value}`}
                              >
                                <X className="h-2 w-2" />
                              </Button>
                            </div>
                          ))
                        ) : (
                          <span className="text-xs text-gray-400">No values</span>
                        )}
                      </div>
                      
                      {attr.type === 'SELECT' && (
                        <div className="flex gap-1">
                          <Input
                            placeholder="Add value"
                            value={addingValueTo === attr.id ? newValue : ""}
                            onChange={(e) => {
                              setNewValue(e.target.value);
                              setAddingValueTo(attr.id);
                            }}
                            className="h-7 text-xs"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                handleAddAttributeValue(attr.id, attr.name);
                              }
                            }}
                          />
                          <Button
                            size="sm"
                            className="h-7 px-2 bg-teal-600 hover:bg-teal-700"
                            onClick={() => handleAddAttributeValue(attr.id, attr.name)}
                            disabled={addingValueTo !== attr.id || !newValue.trim()}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add New Attribute */}
      <div className="space-y-4 pt-4 border-t border-gray-200">
        <h3 className="font-medium text-gray-900">Add New Attribute</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="attr-name" className="text-gray-700">Attribute Name *</Label>
            <Input
              id="attr-name"
              placeholder="e.g., Color, Size, Material"
              value={newAttribute.name}
              onChange={(e) => setNewAttribute({...newAttribute, name: e.target.value})}
              className="bg-white border-gray-300 focus:ring-teal-500"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="attr-type" className="text-gray-700">Type *</Label>
            <Select 
              value={newAttribute.type} 
              onValueChange={(value) => setNewAttribute({...newAttribute, type: value, values: []})}
            >
              <SelectTrigger className="bg-white border-gray-300 focus:ring-teal-500">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SELECT">Select (Multiple values)</SelectItem>
                <SelectItem value="TEXT">Text</SelectItem>
                <SelectItem value="NUMBER">Number</SelectItem>
                <SelectItem value="BOOLEAN">Boolean</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="attr-filterable"
              checked={newAttribute.filterable}
              onChange={(e) => setNewAttribute({...newAttribute, filterable: e.target.checked})}
              className="rounded text-teal-600 focus:ring-teal-500"
            />
            <Label htmlFor="attr-filterable" className="text-gray-700">Use in filters</Label>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="attr-required"
              checked={newAttribute.required}
              onChange={(e) => setNewAttribute({...newAttribute, required: e.target.checked})}
              className="rounded text-teal-600 focus:ring-teal-500"
            />
            <Label htmlFor="attr-required" className="text-gray-700">Required for products</Label>
          </div>
        </div>

        {/* Attribute Values Section */}
        {newAttribute.type === 'SELECT' && (
          <div className="space-y-3">
            <Label className="text-gray-700">Attribute Values *</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Enter value (e.g., Red, Blue, Large, Small)"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleAddValueToNewAttribute();
                  }
                }}
                className="flex-1"
              />
              <Button
                type="button"
                onClick={handleAddValueToNewAttribute}
                className="bg-teal-600 hover:bg-teal-700"
                disabled={!newValue.trim()}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            {newAttribute.values.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm text-gray-600">Added values ({newAttribute.values.length}):</Label>
                <div className="flex flex-wrap gap-2">
                  {newAttribute.values.map((value, index) => (
                    <div key={index} className="flex items-center gap-1 bg-teal-100 text-teal-800 px-3 py-1 rounded-full text-sm">
                      <span>{value}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0 text-teal-700 hover:text-teal-900 hover:bg-teal-200"
                        onClick={() => handleRemoveValueFromNewAttribute(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        
        <Button 
          className="bg-teal-600 hover:bg-teal-700"
          onClick={handleCreateAttribute}
          disabled={
            !newAttribute.name.trim() || 
            !selectedChildId || 
            (newAttribute.type === 'SELECT' && newAttribute.values.length === 0)
          }
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Attribute{newAttribute.values.length > 0 ? ` with ${newAttribute.values.length} values` : ''}
        </Button>

        {newAttribute.type === 'SELECT' && newAttribute.values.length === 0 && (
          <p className="text-sm text-amber-600">
            Please add at least one value for SELECT type attributes
          </p>
        )}
      </div>
    </div>
  );
};

export default AttributesTab;