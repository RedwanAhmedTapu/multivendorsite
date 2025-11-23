"use client";

import React, { useState, useMemo } from "react";
import {
  useGetProvidersQuery,
  useCreateProviderMutation,
  useUpdateProviderMutation,
  useDeleteProviderMutation,
  useActivateProviderMutation,
  useDeactivateProviderMutation,
  ShippingProvider,
} from "../../features/shippingProviderApi";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Trash2,
  Edit,
  CheckCircle,
  XCircle,
  Plus,
  Search,
  X,
  Save,
  Globe,
  Truck,
  Package,
  Activity,
  Power,
} from "lucide-react";
import { toast } from "sonner";

interface FormState {
  name: string;
  baseUrl: string;
  config: string;
  isActive: boolean;
}

interface FilterState {
  search: string;
  status: string;
}

export default function ShippingProviderManager() {
  const { data: providers, isLoading, refetch } = useGetProvidersQuery();
  const [createProvider] = useCreateProviderMutation();
  const [updateProvider] = useUpdateProviderMutation();
  const [deleteProvider] = useDeleteProviderMutation();
  const [activateProvider] = useActivateProviderMutation();
  const [deactivateProvider] = useDeactivateProviderMutation();

  const [activeTab, setActiveTab] = useState("browse");
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    status: "all",
  });

  // Form state
  const [form, setForm] = useState<FormState>({
    name: "",
    baseUrl: "",
    config: "{}",
    isActive: false,
  });

  // Filter providers based on filter state
  const filteredProviders = useMemo(() => {
    if (!providers) return [];
    
    return providers.filter(provider => {
      // Search filter
      if (filters.search && 
          !provider.name.toLowerCase().includes(filters.search.toLowerCase()) &&
          !provider.baseUrl.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }
      
      // Status filter
      if (filters.status !== "all") {
        if (filters.status === "active" && !provider.isActive) return false;
        if (filters.status === "inactive" && provider.isActive) return false;
      }
      
      return true;
    });
  }, [providers, filters]);

  const handleSave = async () => {
    try {
      let parsedConfig = {};
      try {
        parsedConfig = form.config ? JSON.parse(form.config) : {};
      } catch (error) {
        toast.error("Invalid JSON configuration");
        return;
      }

      if (editingId) {
        await updateProvider({ 
          id: editingId, 
          data: {
            name: form.name,
            baseUrl: form.baseUrl,
            config: parsedConfig,
          }
        }).unwrap();
        toast.success("Shipping provider updated successfully");
      } else {
        await createProvider({
          name: form.name,
          baseUrl: form.baseUrl,
          config: parsedConfig,
        }).unwrap();
        toast.success("Shipping provider created successfully");
      }
      resetForm();
      refetch();
      setActiveTab("browse");
    } catch (error: any) {
      console.error("Failed to save shipping provider:", error);
      toast.error(error.data?.message || "Failed to save shipping provider");
    }
  };

  const handleEdit = (provider: ShippingProvider) => {
    setEditingId(provider.id);
    setForm({
      name: provider.name,
      baseUrl: provider.baseUrl,
      config: JSON.stringify(provider.config || {}, null, 2),
      isActive: provider.isActive,
    });
    setActiveTab("edit");
  };

  const handleDelete = async (id: string) => {
    if (
      confirm(
        "Are you sure you want to delete this shipping provider? This action cannot be undone."
      )
    ) {
      try {
        await deleteProvider(id).unwrap();
        toast.success("Shipping provider deleted successfully");
        refetch();
      } catch (error: any) {
        console.error("Failed to delete shipping provider:", error);
        toast.error(error.data?.message || "Failed to delete shipping provider");
      }
    }
  };

  const handleToggleStatus = async (provider: ShippingProvider) => {
    try {
      if (provider.isActive) {
        await deactivateProvider(provider.id).unwrap();
        toast.success("Shipping provider deactivated successfully");
      } else {
        await activateProvider(provider.id).unwrap();
        toast.success("Shipping provider activated successfully");
      }
      refetch();
    } catch (error: any) {
      console.error("Failed to toggle provider status:", error);
      toast.error(error.data?.message || "Failed to toggle provider status");
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setForm({
      name: "",
      baseUrl: "",
      config: "{}",
      isActive: false,
    });
  };

  const handleCancel = () => {
    resetForm();
    setActiveTab("browse");
  };

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      status: "all",
    });
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Shipping Provider Manager</h1>
          <p className="text-muted-foreground">
            Create and manage shipping providers and their API configurations
          </p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setActiveTab("create");
          }}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> New Provider
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="browse">Browse Providers</TabsTrigger>
          <TabsTrigger value="create">Create New</TabsTrigger>
          <TabsTrigger value="edit" disabled={!editingId}>
            Edit Provider
          </TabsTrigger>
        </TabsList>

        {/* -------- Browse Tab -------- */}
        <TabsContent value="browse" className="space-y-4 mt-6">
          {/* Filter Section */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">Filters</CardTitle>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={clearFilters}
                  className="flex items-center gap-1"
                >
                  <XCircle className="w-4 h-4" /> Clear
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="search">Search</Label>
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Search providers..."
                      value={filters.search}
                      onChange={(e) => handleFilterChange("search", e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="filter-status">Status</Label>
                  <Select
                    value={filters.status}
                    onValueChange={(value) => handleFilterChange("status", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Results Count */}
          {!isLoading && providers && (
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                Showing {filteredProviders.length} of {providers.length} providers
              </p>
            </div>
          )}

          {/* Providers Grid */}
          {isLoading ? (
            <div className="flex justify-center py-10">
              <p>Loading providers...</p>
            </div>
          ) : filteredProviders && filteredProviders.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProviders.map((provider: ShippingProvider) => (
                <Card
                  key={provider.id}
                  className="overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Truck className="w-5 h-5" /> {provider.name}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="flex items-center gap-1">
                            <Globe className="w-3 h-3" /> {provider.baseUrl}
                          </Badge>
                        </CardDescription>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge 
                          className={provider.isActive 
                            ? "bg-green-100 text-green-800 hover:bg-green-100" 
                            : "bg-gray-100 text-gray-800 hover:bg-gray-100"
                          }
                        >
                          {provider.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-3">
                    <div className="text-sm text-muted-foreground">
                      <div className="flex items-center gap-2 mb-2">
                        <Package className="w-4 h-4" />
                        <span>Configuration: {Object.keys(provider.config || {}).length} keys</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4" />
                        <span>Last updated: {new Date(provider.updatedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between bg-muted/50 py-3">
                    <div className="text-xs text-muted-foreground">
                      Created: {new Date(provider.createdAt).toLocaleDateString()}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(provider)}
                        className="h-8 px-2"
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant={provider.isActive ? "outline" : "default"}
                        onClick={() => handleToggleStatus(provider)}
                        className="h-8 px-2"
                        title={provider.isActive ? "Deactivate Provider" : "Activate Provider"}
                      >
                        <Power className={`w-3 h-3 ${provider.isActive ? 'text-gray-600' : 'text-white'}`} />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(provider.id)}
                        className="h-8 px-2"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="text-center py-10">
              <CardContent>
                <Truck className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  {providers && providers.length > 0 ? "No matching providers" : "No shipping providers yet"}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {providers && providers.length > 0 
                    ? "Try adjusting your filters to find what you're looking for."
                    : "Get started by creating your first shipping provider."}
                </p>
                <Button onClick={() => {
                  if (providers && providers.length > 0) {
                    clearFilters();
                  } else {
                    setActiveTab("create");
                  }
                }}>
                  {providers && providers.length > 0 ? "Clear Filters" : "Create New Provider"}
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* -------- Create Tab -------- */}
        <TabsContent value="create" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Create New Shipping Provider</CardTitle>
              <CardDescription>
                Configure a new shipping provider with its API details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Provider Name *</Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g., FedEx, UPS, DHL"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="baseUrl">Base API URL *</Label>
                  <Input
                    id="baseUrl"
                    value={form.baseUrl}
                    onChange={(e) => setForm({ ...form, baseUrl: e.target.value })}
                    placeholder="e.g., https://api.shipping.com/v1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="config">Configuration (JSON) *</Label>
                <div className="relative">
                  <textarea
                    id="config"
                    value={form.config}
                    onChange={(e) => setForm({ ...form, config: e.target.value })}
                    className="w-full h-60 p-2 border rounded-md font-mono text-sm"
                    placeholder='{"apiKey": "your-key", "defaultService": "express"}'
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Enter valid JSON configuration for this shipping provider
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={handleCancel}>
                <X className="w-4 h-4 mr-2" /> Cancel
              </Button>
              <Button onClick={handleSave}>
                <Save className="w-4 h-4 mr-2" /> Create Provider
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* -------- Edit Tab -------- */}
        <TabsContent value="edit" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Edit Shipping Provider</CardTitle>
              <CardDescription>
                Update the configuration for this shipping provider
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Provider Name *</Label>
                  <Input
                    id="edit-name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g., FedEx, UPS, DHL"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-baseUrl">Base API URL *</Label>
                  <Input
                    id="edit-baseUrl"
                    value={form.baseUrl}
                    onChange={(e) => setForm({ ...form, baseUrl: e.target.value })}
                    placeholder="e.g., https://api.shipping.com/v1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-config">Configuration (JSON) *</Label>
                <div className="relative">
                  <textarea
                    id="edit-config"
                    value={form.config}
                    onChange={(e) => setForm({ ...form, config: e.target.value })}
                    className="w-full h-60 p-2 border rounded-md font-mono text-sm"
                    placeholder='{"apiKey": "your-key", "defaultService": "express"}'
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Enter valid JSON configuration for this shipping provider
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={form.isActive}
                  onCheckedChange={(checked) => setForm({ ...form, isActive: checked })}
                  disabled
                />
                <Label htmlFor="isActive">Active Provider</Label>
                <p className="text-xs text-muted-foreground">
                  {form.isActive 
                    ? "This provider is currently active" 
                    : "This provider is currently inactive"}
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setActiveTab("browse")}>
                <X className="w-4 h-4 mr-2" /> Cancel
              </Button>
              <div className="flex gap-2">
                <Button
                  variant={form.isActive ? "outline" : "default"}
                  onClick={() => editingId && handleToggleStatus({ id: editingId, isActive: form.isActive } as ShippingProvider)}
                >
                  <Power className={`w-4 h-4 mr-2 ${form.isActive ? 'text-gray-600' : 'text-white'}`} />
                  {form.isActive ? 'Deactivate' : 'Activate'}
                </Button>
                <Button onClick={handleSave}>
                  <Save className="w-4 h-4 mr-2" /> Save Changes
                </Button>
              </div>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}