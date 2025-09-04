// SpecificationsTab.tsx
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Edit,
  Trash2,
  Type as TypeIcon,
  Hash,
  ToggleLeft,
  List,
  Loader2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  useGetSpecificationsQuery,
  useCreateSpecificationMutation,
  useUpdateSpecificationMutation,
  useDeleteSpecificationMutation,
  useCreateSpecificationOptionMutation,
  useDeleteSpecificationOptionMutation,
} from "@/features/apiSlice";
import {
  Specification,
  SpecificationOption,
  CreateSpecificationData,
  SpecificationType,
  CategorySpecification,
} from "../../types/type";

interface SpecificationsTabProps {
  selectedChildId: string;
}

const SpecificationsTab: React.FC<SpecificationsTabProps> = ({
  selectedChildId,
}) => {
  const [newSpecification, setNewSpecification] = useState<
    CreateSpecificationData & { options: string[] }
  >({
    name: "",
    type: SpecificationType.TEXT,
    unit: "",
    filterable: true,
    required: false,
    categoryId: selectedChildId,
    options: [],
  });

  const [optionInput, setOptionInput] = useState("");
  const [editingSpecification, setEditingSpecification] =
    useState<Specification | null>(null);

  const {
    data: categorySpecifications = [],
    isLoading: specificationsLoading,
    refetch: refetchSpecifications,
  } = useGetSpecificationsQuery(selectedChildId);

  const [createSpecification] = useCreateSpecificationMutation();
  const [updateSpecification] = useUpdateSpecificationMutation();
  const [deleteSpecification] = useDeleteSpecificationMutation();
  const [createOption] = useCreateSpecificationOptionMutation();
  const [deleteOption] = useDeleteSpecificationOptionMutation();

  // unwrap nested specifications for easier UI handling
  const currentSpecifications: Specification[] = categorySpecifications
    .filter(
      (cs: CategorySpecification) => cs.categoryId === selectedChildId
    )
    .map((cs: CategorySpecification) => cs.specification);

  // ---------------- Handlers ----------------
  const handleAddOption = () => {
    if (!optionInput.trim()) return;
    setNewSpecification((prev) => ({
      ...prev,
      options: [...prev.options, optionInput.trim()],
    }));
    setOptionInput("");
  };

  const handleRemoveOption = (value: string) => {
    setNewSpecification((prev) => ({
      ...prev,
      options: prev.options.filter((opt) => opt !== value),
    }));
  };

  const handleCreateSpecification = async () => {
    if (!newSpecification.name || !selectedChildId) {
      toast.error("Please provide specification name and select a category");
      return;
    }

    try {
      const promise = createSpecification({
        ...newSpecification,
        categoryId: selectedChildId,
      }).unwrap();

     toast.promise(promise, {
  loading: `Creating specification "${newSpecification.name}"...`,
  success: async (categorySpec: CategorySpecification) => {
    const specification = categorySpec.specification; // unwrap Specification

    if (
      newSpecification.type === SpecificationType.SELECT &&
      newSpecification.options.length > 0
    ) {
      for (const opt of newSpecification.options) {
        await createOption({
          specificationId: specification.id,
          value: opt,
        });
      }
    }

    setNewSpecification({
      name: "",
      type: SpecificationType.TEXT,
      unit: "",
      filterable: true,
      required: false,
      categoryId: selectedChildId,
      options: [],
    });
    refetchSpecifications();
    return `Specification "${specification.name}" created successfully`;
  },
  error: (error: any) =>
    error.data?.message || "Failed to create specification",
});

    } catch {
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
        data: editingSpecification,
      }).unwrap();

    toast.promise(promise, {
  loading: `Updating specification "${editingSpecification.name}"...`,
  success: (categorySpec: CategorySpecification & { specification: Specification }) => {
    setEditingSpecification(null);
    refetchSpecifications();
    return `Specification "${categorySpec.specification.name}" updated successfully`;
  },
  error: (error: any) =>
    error.data?.message || "Failed to update specification",
});

    } catch {
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
        error: (error: any) =>
          error.data?.message || "Failed to delete specification",
      });
    } catch {
      toast.error("Failed to delete specification");
    }
  };

  const handleAddOptionToSpec = async (specId: string, value: string) => {
    if (!value.trim()) return;
    try {
      await createOption({ specificationId: specId, value }).unwrap();
      refetchSpecifications();
      toast.success("Option added");
      setOptionInput("");
    } catch {
      toast.error("Failed to add option");
    }
  };

  const handleDeleteOptionFromSpec = async (optionId: string) => {
    try {
      await deleteOption(optionId).unwrap();
      refetchSpecifications();
      toast.success("Option deleted");
    } catch {
      toast.error("Failed to delete option");
    }
  };

  if (specificationsLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
      </div>
    );
  }

  // ---------------- UI ----------------
  return (
    <>
      {/* Existing Specifications */}
      {currentSpecifications.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-medium text-gray-900">Existing Specifications</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentSpecifications.map((spec) => (
              <div
                key={spec.id}
                className="border border-gray-200 rounded-lg p-4 bg-gray-50 relative"
              >
                {/* Editing Mode */}
                {editingSpecification?.id === spec.id ? (
                  <div className="space-y-3">
                    {/* name + save/cancel */}
                    <div className="flex items-center justify-between">
                      <Label className="text-gray-700">
                        Specification Name
                      </Label>
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
                      onChange={(e) =>
                        setEditingSpecification({
                          ...editingSpecification,
                          name: e.target.value,
                        })
                      }
                      className="bg-white border-gray-300"
                    />
                    {/* type + unit */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-gray-700">Type</Label>
                        <Select
                          value={editingSpecification.type}
                          onValueChange={(value) =>
                            setEditingSpecification({
                              ...editingSpecification,
                              type: value as SpecificationType,
                            })
                          }
                        >
                          <SelectTrigger className="bg-white border-gray-300">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={SpecificationType.TEXT}>
                              Text
                            </SelectItem>
                            <SelectItem value={SpecificationType.NUMBER}>
                              Number
                            </SelectItem>
                            <SelectItem value={SpecificationType.BOOLEAN}>
                              Boolean
                            </SelectItem>
                            <SelectItem value={SpecificationType.SELECT}>
                              Select
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-gray-700">Unit</Label>
                        <Input
                          placeholder="e.g., inches, GHz"
                          value={editingSpecification.unit || ""}
                          onChange={(e) =>
                            setEditingSpecification({
                              ...editingSpecification,
                              unit: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900">
                          {spec.name}
                        </div>
                        <div className="text-sm text-gray-500 capitalize flex items-center gap-1">
                          {spec.type === SpecificationType.TEXT && (
                            <TypeIcon className="h-3 w-3" />
                          )}
                          {spec.type === SpecificationType.NUMBER && (
                            <Hash className="h-3 w-3" />
                          )}
                          {spec.type === SpecificationType.BOOLEAN && (
                            <ToggleLeft className="h-3 w-3" />
                          )}
                          {spec.type === SpecificationType.SELECT && (
                            <List className="h-3 w-3" />
                          )}
                          {spec.type.toLowerCase()}
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
                          onClick={() =>
                            handleDeleteSpecification(spec.id, spec.name)
                          }
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    {/* Options */}
                    {spec.type === SpecificationType.SELECT && (
                      <div className="mt-3">
                        <h4 className="text-sm font-medium text-gray-700 mb-1">
                          Options
                        </h4>
                        <div className="space-y-1">
                          {spec.options?.map((opt: SpecificationOption) => (
                            <div
                              key={opt.id}
                              className="flex items-center justify-between bg-white border px-2 py-1 rounded"
                            >
                              <span>{opt.value}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 text-red-500"
                                onClick={() =>
                                  handleDeleteOptionFromSpec(opt.id)
                                }
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <Input
                            placeholder="New option"
                            value={optionInput}
                            onChange={(e) => setOptionInput(e.target.value)}
                          />
                          <Button
                            size="sm"
                            className="bg-teal-600 hover:bg-teal-700"
                            onClick={() =>
                              handleAddOptionToSpec(spec.id, optionInput)
                            }
                            disabled={!optionInput.trim()}
                          >
                            Add
                          </Button>
                        </div>
                      </div>
                    )}
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
            <Label>Specification Name *</Label>
            <Input
              placeholder="e.g., Screen Size"
              value={newSpecification.name}
              onChange={(e) =>
                setNewSpecification({
                  ...newSpecification,
                  name: e.target.value,
                })
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Type *</Label>
            <Select
              value={newSpecification.type}
              onValueChange={(value) =>
                setNewSpecification({
                  ...newSpecification,
                  type: value as SpecificationType,
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={SpecificationType.TEXT}>Text</SelectItem>
                <SelectItem value={SpecificationType.NUMBER}>Number</SelectItem>
                <SelectItem value={SpecificationType.BOOLEAN}>
                  Boolean
                </SelectItem>
                <SelectItem value={SpecificationType.SELECT}>Select</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Options */}
        {newSpecification.type === SpecificationType.SELECT && (
          <div className="space-y-2">
            <Label>Options (multiple)</Label>
            <div className="flex items-center gap-2">
              <Input
                placeholder="Add option"
                value={optionInput}
                onChange={(e) => setOptionInput(e.target.value)}
              />
              <Button
                size="sm"
                onClick={handleAddOption}
                disabled={!optionInput.trim()}
              >
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {newSpecification.options.map((opt, idx) => (
                <div
                  key={idx}
                  className="flex items-center bg-gray-200 rounded px-2 py-1 text-sm"
                >
                  {opt}
                  <button
                    className="ml-1 text-red-600"
                    onClick={() => handleRemoveOption(opt)}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

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
