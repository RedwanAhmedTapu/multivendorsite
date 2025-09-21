import React, { useState, useEffect, useMemo } from "react";
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
  Link,
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
import { useGetAllSpecificationsQuery } from "@/features/attrSpecSlice";
import {
  Specification,
  SpecificationOption,
  CreateSpecificationData,
  CategorySpecification,
  SpecificationType,
} from "../../types/type";

// Constants for specification types since SpecificationType is a type alias, not enum
const SPECIFICATION_TYPES = {
  TEXT: "TEXT" as const,
  NUMBER: "NUMBER" as const,
  BOOLEAN: "BOOLEAN" as const,
  SELECT: "SELECT" as const,
} as const;

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
    type: SPECIFICATION_TYPES.TEXT,
    unit: "",
    filterable: true,
    isRequired: false,
    categoryId: selectedChildId,
    options: [],
  });

  const [selectedExistingSpecification, setSelectedExistingSpecification] =
    useState("");
  const [existingSpecificationOptions, setExistingSpecificationOptions] =
    useState<string[]>([]);
  const [optionInput, setOptionInput] = useState("");
  const [editingSpecification, setEditingSpecification] =
    useState<Specification | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(true); // Toggle between creating new or using existing

  const {
    data: categorySpecifications = [],
    isLoading: specificationsLoading,
    refetch: refetchSpecifications,
  } = useGetSpecificationsQuery(selectedChildId);
  const {
    data: allSpecifications = [],
    isLoading: allSpecLoading,
    refetch: refetchAllSpecifications,
  } = useGetAllSpecificationsQuery();

  const [createSpecification] = useCreateSpecificationMutation();
  const [updateSpecification] = useUpdateSpecificationMutation();
  const [deleteSpecification] = useDeleteSpecificationMutation();
  const [createOption] = useCreateSpecificationOptionMutation();
  const [deleteOption] = useDeleteSpecificationOptionMutation();

  // unwrap nested specifications for easier UI handling
  const currentSpecifications: Specification[] = categorySpecifications
    .filter((cs: CategorySpecification) => cs.categoryId === selectedChildId)
    .map((cs: CategorySpecification) => cs.specification)
    .filter((spec): spec is Specification => spec !== undefined); // Type guard to filter out undefined

  // Get specifications that are not already assigned to this category
  const availableSpecifications = useMemo(() => {
    const currentSpecIds = currentSpecifications.map(
      (spec: Specification) => spec.id
    );
    return allSpecifications.filter(
      (spec) => !currentSpecIds.includes(spec.id)
    );
  }, [allSpecifications, currentSpecifications]);

  // Update the categoryId when selectedChildId changes
  useEffect(() => {
    setNewSpecification((prev) => ({
      ...prev,
      categoryId: selectedChildId,
    }));
  }, [selectedChildId]);

  // Handle selection of existing specification
  const handleExistingSpecificationSelect = (specId: string) => {
    setSelectedExistingSpecification(specId);
    const selectedSpec = allSpecifications.find((spec) => spec.id === specId);
    if (selectedSpec) {
      setExistingSpecificationOptions([]);
      setNewSpecification({
        name: selectedSpec.name ?? "",
       type: selectedSpec.type ? (selectedSpec.type as SpecificationType) : SPECIFICATION_TYPES.TEXT,

        unit: selectedSpec.unit || "",
        filterable: true,
        isRequired: false,
        categoryId: selectedChildId,
        options: [],
      });
    }
  };

  // ---------------- Handlers ----------------
  const handleAddOption = () => {
    if (!optionInput.trim()) return;

    if (isCreatingNew) {
      setNewSpecification((prev) => ({
        ...prev,
        options: [...prev.options, optionInput.trim()],
      }));
    } else {
      setExistingSpecificationOptions((prev) => [...prev, optionInput.trim()]);
    }
    setOptionInput("");
  };

  const handleRemoveOption = (value: string) => {
    if (isCreatingNew) {
      setNewSpecification((prev) => ({
        ...prev,
        options: prev.options.filter((opt) => opt !== value),
      }));
    } else {
      setExistingSpecificationOptions((prev) =>
        prev.filter((opt) => opt !== value)
      );
    }
  };

  const handleCreateOrLinkSpecification = async () => {
    if (!selectedChildId) {
      toast.error("Please select a category");
      return;
    }

    if (isCreatingNew) {
      // Create new specification
      if (!newSpecification.name) {
        toast.error("Please provide specification name");
        return;
      }

      try {
        // Create the specification first
        const categorySpec = await createSpecification({
          ...newSpecification,
          categoryId: selectedChildId,
          filterable: newSpecification.filterable ?? false,
          isRequired: newSpecification.isRequired ?? false,
        }).unwrap();

        // Handle the response properly
        const specification = categorySpec.specification;
        if (!specification) {
          toast.error(
            "Failed to create specification - no specification returned"
          );
          return;
        }

        toast.success(
          `Specification "${specification.name}" created successfully`
        );

        // Add options if it's a SELECT type
        if (
          newSpecification.type === SPECIFICATION_TYPES.SELECT &&
          newSpecification.options.length > 0
        ) {
          try {
            const optionPromises = newSpecification.options.map((opt) =>
              createOption({
                specificationId: specification.id,
                value: opt,
              }).unwrap()
            );

            await Promise.all(optionPromises);
            toast.success("Options added successfully");
          } catch (optionError) {
            console.error("Failed to add some options:", optionError);
            toast.warning(
              "Specification created but some options failed to add"
            );
          }
        }

        // Reset form
        setNewSpecification({
          name: "",
          type: SPECIFICATION_TYPES.TEXT,
          unit: "",
          filterable: true,
          isRequired: false,
          categoryId: selectedChildId,
          options: [],
        });

        refetchSpecifications();
      } catch (error: any) {
        console.error("Failed to create specification:", error);
        toast.error(error?.data?.message || "Failed to create specification");
      }
    } else {
      // Link existing specification to category
      if (!selectedExistingSpecification) {
        toast.error("Please select an existing specification");
        return;
      }

      const selectedSpec = allSpecifications.find(
        (spec) => spec.id === selectedExistingSpecification
      );
      if (!selectedSpec) {
        toast.error("Selected specification not found");
        return;
      }

      try {
        // Prepare the data in the same format as creating a new specification
        const specificationData = {
          name: selectedSpec.name ?? "",
          type: selectedSpec.type ?? "TEXT",
          unit: selectedSpec.unit || "",
          filterable: !!newSpecification.filterable, // force boolean
          isRequired: !!newSpecification.isRequired, // force boolean
          categoryId: selectedChildId,
          ...(selectedSpec.type === SPECIFICATION_TYPES.SELECT &&
            existingSpecificationOptions.length > 0 && {
              options: existingSpecificationOptions,
            }),
        };

        await createSpecification(specificationData).unwrap();

        let successMessage = `Specification "${selectedSpec.name}" linked to category successfully`;
        if (existingSpecificationOptions.length > 0) {
          successMessage += ` with ${existingSpecificationOptions.length} additional options`;
        }

        toast.success(successMessage);

        // Reset form
        setSelectedExistingSpecification("");
        setExistingSpecificationOptions([]);
        setNewSpecification({
          name: "",
          type: SPECIFICATION_TYPES.TEXT,
          unit: "",
          filterable: true,
          isRequired: false,
          categoryId: selectedChildId,
          options: [],
        });

        refetchSpecifications();
      } catch (error: any) {
        console.error("Failed to link specification:", error);
        toast.error(error?.data?.message || "Failed to link specification");
      }
    }
  };

  const handleUpdateSpecification = async () => {
    if (!editingSpecification || !editingSpecification.name) {
      toast.error("Please provide specification name");
      return;
    }

    try {
      const updatedCategorySpec = await updateSpecification({
        id: editingSpecification.id,
        data: editingSpecification,
      }).unwrap();

      const updatedSpec = updatedCategorySpec.specification;
      if (!updatedSpec) {
        toast.error(
          "Failed to update specification - no specification returned"
        );
        return;
      }

      toast.success(`Specification "${updatedSpec.name}" updated successfully`);
      setEditingSpecification(null);
      refetchSpecifications();
    } catch (error: any) {
      console.error("Failed to update specification:", error);
      toast.error(error?.data?.message || "Failed to update specification");
    }
  };

  const handleDeleteSpecification = async (id: string, name: string) => {
    try {
      await deleteSpecification(id).unwrap();
      toast.success(`Specification "${name}" deleted successfully`);
      setEditingSpecification(null);
      refetchSpecifications();
    } catch (error: any) {
      console.error("Failed to delete specification:", error);
      toast.error(error?.data?.message || "Failed to delete specification");
    }
  };

  const handleAddOptionToSpec = async (specId: string, value: string) => {
    if (!value.trim()) return;

    try {
      await createOption({
        specificationId: specId,
        value: value.trim(),
      }).unwrap();
      refetchSpecifications();
      toast.success("Option added successfully");
      setOptionInput("");
    } catch (error: any) {
      console.error("Failed to add option:", error);
      toast.error(error?.data?.message || "Failed to add option");
    }
  };

  const handleDeleteOptionFromSpec = async (optionId: string) => {
    try {
      await deleteOption(optionId).unwrap();
      refetchSpecifications();
      toast.success("Option deleted successfully");
    } catch (error: any) {
      console.error("Failed to delete option:", error);
      toast.error(error?.data?.message || "Failed to delete option");
    }
  };

  // Toggle between creating new and using existing
  const handleToggleMode = (mode: boolean) => {
    setIsCreatingNew(mode);
    setSelectedExistingSpecification("");
    setExistingSpecificationOptions([]);
    setNewSpecification({
      name: "",
      type: SPECIFICATION_TYPES.TEXT,
      unit: "",
      filterable: true,
      isRequired: false,
      categoryId: selectedChildId,
      options: [],
    });
    setOptionInput("");
  };

  if (specificationsLoading || allSpecLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
      </div>
    );
  }

  if (!selectedChildId) {
    return (
      <div className="flex justify-center py-8 text-gray-500">
        Please select a category to manage specifications
      </div>
    );
  }

  // ---------------- UI ----------------
  return (
    <div className="space-y-6">
      {/* Existing Specifications */}
      {currentSpecifications.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-medium text-gray-900">
            Existing Specifications ({currentSpecifications.length})
          </h3>
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
                            <SelectItem value={SPECIFICATION_TYPES.TEXT}>
                              Text
                            </SelectItem>
                            <SelectItem value={SPECIFICATION_TYPES.NUMBER}>
                              Number
                            </SelectItem>
                            <SelectItem value={SPECIFICATION_TYPES.BOOLEAN}>
                              Boolean
                            </SelectItem>
                            <SelectItem value={SPECIFICATION_TYPES.SELECT}>
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
                          className="bg-white border-gray-300"
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
                          {spec.type === SPECIFICATION_TYPES.TEXT && (
                            <TypeIcon className="h-3 w-3" />
                          )}
                          {spec.type === SPECIFICATION_TYPES.NUMBER && (
                            <Hash className="h-3 w-3" />
                          )}
                          {spec.type === SPECIFICATION_TYPES.BOOLEAN && (
                            <ToggleLeft className="h-3 w-3" />
                          )}
                          {spec.type === SPECIFICATION_TYPES.SELECT && (
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

                    {/* Options for SELECT type */}
                    {spec.type === SPECIFICATION_TYPES.SELECT &&
                      spec.options && (
                        <div className="mt-3">
                          <h4 className="text-sm font-medium text-gray-700 mb-1">
                            Options ({spec.options.length})
                          </h4>
                          <div className="space-y-1">
                            {spec.options.map((opt: SpecificationOption) => (
                              <div
                                key={opt.id}
                                className="flex items-center justify-between bg-white border px-2 py-1 rounded"
                              >
                                <span className="text-sm">{opt.value}</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
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
                              className="bg-white"
                              onKeyPress={(e) => {
                                if (e.key === "Enter") {
                                  handleAddOptionToSpec(spec.id, optionInput);
                                }
                              }}
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

      {/* Add New/Link Existing Specification */}
      <div className="space-y-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-gray-900">Add Specification</h3>
          <div className="flex bg-gray-100 rounded-lg p-1">
            <Button
              variant={isCreatingNew ? "default" : "ghost"}
              size="sm"
              className={`h-8 px-3 text-xs ${
                isCreatingNew
                  ? "bg-teal-600 hover:bg-teal-700 text-white"
                  : "text-gray-600"
              }`}
              onClick={() => handleToggleMode(true)}
            >
              Create New
            </Button>
            <Button
              variant={!isCreatingNew ? "default" : "ghost"}
              size="sm"
              className={`h-8 px-3 text-xs ${
                !isCreatingNew
                  ? "bg-teal-600 hover:bg-teal-700 text-white"
                  : "text-gray-600"
              }`}
              onClick={() => handleToggleMode(false)}
              disabled={availableSpecifications.length === 0}
            >
              <Link className="h-3 w-3 mr-1" />
              Use Existing
            </Button>
          </div>
        </div>

        {!isCreatingNew && availableSpecifications.length === 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-sm text-amber-700">
              All available specifications are already assigned to this
              category. Create a new specification instead.
            </p>
          </div>
        )}

        {isCreatingNew ? (
          // Create New Specification Form
          <div className="space-y-4">
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
                    <SelectItem value={SPECIFICATION_TYPES.TEXT}>
                      Text
                    </SelectItem>
                    <SelectItem value={SPECIFICATION_TYPES.NUMBER}>
                      Number
                    </SelectItem>
                    <SelectItem value={SPECIFICATION_TYPES.BOOLEAN}>
                      Boolean
                    </SelectItem>
                    <SelectItem value={SPECIFICATION_TYPES.SELECT}>
                      Select
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Unit field */}
            <div className="space-y-2">
              <Label>Unit (optional)</Label>
              <Input
                placeholder="e.g., inches, GB, MHz"
                value={newSpecification.unit || ""}
                onChange={(e) =>
                  setNewSpecification({
                    ...newSpecification,
                    unit: e.target.value,
                  })
                }
              />
            </div>

            {/* Additional options */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="filterable"
                  checked={newSpecification.filterable}
                  onChange={(e) =>
                    setNewSpecification({
                      ...newSpecification,
                      filterable: e.target.checked,
                    })
                  }
                  className="rounded border-gray-300"
                />
                <Label htmlFor="filterable" className="text-sm">
                  Filterable
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="required"
                  checked={newSpecification.isRequired}
                  onChange={(e) =>
                    setNewSpecification({
                      ...newSpecification,
                      isRequired: e.target.checked,
                    })
                  }
                  className="rounded border-gray-300"
                />
                <Label htmlFor="required" className="text-sm">
                  Required
                </Label>
              </div>
            </div>

            {/* Options for SELECT type */}
            {newSpecification.type === SPECIFICATION_TYPES.SELECT && (
              <div className="space-y-2">
                <Label>Options (for Select type)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Add option"
                    value={optionInput}
                    onChange={(e) => setOptionInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        handleAddOption();
                      }
                    }}
                  />
                  <Button
                    size="sm"
                    onClick={handleAddOption}
                    disabled={!optionInput.trim()}
                    className="bg-teal-600 hover:bg-teal-700"
                  >
                    Add
                  </Button>
                </div>
                {newSpecification.options.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {newSpecification.options.map((opt, idx) => (
                      <div
                        key={idx}
                        className="flex items-center bg-teal-100 text-teal-800 rounded-full px-3 py-1 text-sm"
                      >
                        {opt}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0 text-teal-700 hover:text-teal-900 hover:bg-teal-200 ml-1"
                          onClick={() => handleRemoveOption(opt)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          // Use Existing Specification Form
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Select Existing Specification *</Label>
              <Select
                value={selectedExistingSpecification}
                onValueChange={handleExistingSpecificationSelect}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a specification to link" />
                </SelectTrigger>
                <SelectContent>
                  {availableSpecifications.map((spec) => (
                    <SelectItem key={spec.id} value={spec.id}>
                      <div className="flex items-center gap-2">
                        {spec.type === SPECIFICATION_TYPES.TEXT && (
                          <TypeIcon className="h-3 w-3" />
                        )}
                        {spec.type === SPECIFICATION_TYPES.NUMBER && (
                          <Hash className="h-3 w-3" />
                        )}
                        {spec.type === SPECIFICATION_TYPES.BOOLEAN && (
                          <ToggleLeft className="h-3 w-3" />
                        )}
                        {spec.type === SPECIFICATION_TYPES.SELECT && (
                          <List className="h-3 w-3" />
                        )}
                        <span>{spec.name}</span>
                        <span className="text-xs text-gray-500">
                          ({spec?.type?.toLowerCase()})
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedExistingSpecification && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="existing-filterable"
                      checked={newSpecification.filterable}
                      onChange={(e) =>
                        setNewSpecification({
                          ...newSpecification,
                          filterable: e.target.checked,
                        })
                      }
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor="existing-filterable" className="text-sm">
                      Filterable
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="existing-required"
                      checked={newSpecification.isRequired}
                      onChange={(e) =>
                        setNewSpecification({
                          ...newSpecification,
                          isRequired: e.target.checked,
                        })
                      }
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor="existing-required" className="text-sm">
                      Required
                    </Label>
                  </div>
                </div>

                {/* Show existing options and allow adding new ones for SELECT type */}
                {newSpecification.type === SPECIFICATION_TYPES.SELECT && (
                  <div className="space-y-3">
                    <Label>Additional Options (Optional)</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add additional options for this specification"
                        value={optionInput}
                        onChange={(e) => setOptionInput(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === "Enter") {
                            handleAddOption();
                          }
                        }}
                        className="flex-1"
                      />
                      <Button
                        size="sm"
                        onClick={handleAddOption}
                        disabled={!optionInput.trim()}
                        className="bg-teal-600 hover:bg-teal-700"
                      >
                        Add
                      </Button>
                    </div>

                    {existingSpecificationOptions.length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-sm text-gray-600">
                          Additional options to add (
                          {existingSpecificationOptions.length}):
                        </Label>
                        <div className="flex flex-wrap gap-2">
                          {existingSpecificationOptions.map((option, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-1 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                            >
                              <span>{option}</span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-4 w-4 p-0 text-blue-700 hover:text-blue-900 hover:bg-blue-200"
                                onClick={() => handleRemoveOption(option)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Show existing options from the selected specification */}
                    {(() => {
                      const selectedSpec = allSpecifications.find(
                        (spec) => spec.id === selectedExistingSpecification
                      );
                      return (
                        selectedSpec?.options &&
                        selectedSpec.options.length > 0 && (
                          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                            <Label className="text-sm font-medium text-gray-700">
                              Existing options in "{selectedSpec.name}" (
                              {selectedSpec.options.length}):
                            </Label>
                            <div className="flex flex-wrap gap-1 mt-2">
                              {selectedSpec.options.map((option) => (
                                <span
                                  key={option.id}
                                  className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs"
                                >
                                  {option.value}
                                </span>
                              ))}
                            </div>
                          </div>
                        )
                      );
                    })()}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        <Button
          className="bg-teal-600 hover:bg-teal-700"
          onClick={handleCreateOrLinkSpecification}
          disabled={
            !selectedChildId ||
            (isCreatingNew && !newSpecification.name) ||
            (!isCreatingNew && !selectedExistingSpecification)
          }
        >
          {isCreatingNew ? (
            <>
              <Plus className="h-4 w-4 mr-2" />
              Create Specification
              {newSpecification.options.length > 0
                ? ` with ${newSpecification.options.length} options`
                : ""}
            </>
          ) : (
            <>
              <Link className="h-4 w-4 mr-2" />
              Link Specification
              {existingSpecificationOptions.length > 0
                ? ` with ${existingSpecificationOptions.length} additional options`
                : ""}
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default SpecificationsTab;
