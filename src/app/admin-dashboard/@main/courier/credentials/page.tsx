// app/admin/courier/credentials/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Key,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  EyeOff,
  TestTube,
  RefreshCw,
  Building2,
  Shield,
  Cloud,
  Settings,
  ArrowRight,
  Check,
} from "lucide-react";
import {
  useGetCourierProvidersQuery,
  useCreateCourierProviderMutation,
  useCreateCourierCredentialsMutation,
  useUpdateCourierCredentialsMutation,
  useDeleteCourierCredentialsMutation,
  useTestCourierCredentialsMutation,
  useToggleCredentialStatusMutation,
  useRefreshCredentialTokenMutation,
  type CourierProvider,
  type CourierCredential,
  type Environment,
  type CourierAuthType,
} from "@/features/courierApi";
import { toast } from "sonner";

type ProviderTemplate = {
  name: string;
  displayName: string;
  description: string;
  productionBaseUrl: string;
  sandboxBaseUrl: string;
  authType: CourierAuthType;
};

const PROVIDER_TEMPLATES: Record<string, ProviderTemplate> = {
  Pathao: {
    name: "Pathao",
    displayName: "Pathao",
    description: "Pathao Courier Service - Bangladesh's leading delivery platform",
    productionBaseUrl: "https://api.pathao.com",
    sandboxBaseUrl: "https://api-sandbox.pathao.com",
    authType: "OAUTH2",
  },
  RedX: {
    name: "RedX",
    displayName: "RedX",
    description: "RedX Courier Service - Fast and reliable delivery",
    productionBaseUrl: "https://api.redx.com.bd",
    sandboxBaseUrl: "https://api-sandbox.redx.com.bd",
    authType: "BEARER",
  },
  Steadfast: {
    name: "Steadfast",
    displayName: "Steadfast",
    description: "Steadfast Courier Service",
    productionBaseUrl: "https://api.steadfast.com.bd",
    sandboxBaseUrl: "",
    authType: "API_KEY",
  },
  Paperfly: {
    name: "Paperfly",
    displayName: "Paperfly",
    description: "Paperfly Courier Service",
    productionBaseUrl: "https://api.paperfly.com.bd",
    sandboxBaseUrl: "",
    authType: "API_KEY",
  },
};

export default function CourierCredentialsPage() {
  const [selectedProvider, setSelectedProvider] = useState<CourierProvider | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedCredential, setSelectedCredential] = useState<CourierCredential | null>(null);
  const [activeTab, setActiveTab] = useState<string>("providers");

  const { data: providersData, isLoading, refetch } = useGetCourierProvidersQuery({
    includeCredentials: true,
  });
  const providers = providersData?.data || [];

  // Auto-switch to add-provider tab if no providers exist
  useEffect(() => {
    if (!isLoading && providers.length === 0) {
      setActiveTab("add-provider");
    }
  }, [isLoading, providers.length]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Courier Credentials</h1>
          <p className="text-muted-foreground">
            Manage API credentials for courier integrations
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          <Key className="w-3 h-3 mr-1" />
          Platform Admin
        </Badge>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="providers">
            <Building2 className="w-4 h-4 mr-2" />
            Providers ({providers.length})
          </TabsTrigger>
          <TabsTrigger value="add-provider">
            <Plus className="w-4 h-4 mr-2" />
            Add New
          </TabsTrigger>
          <TabsTrigger value="manage" disabled={!selectedProvider}>
            <Settings className="w-4 h-4 mr-2" />
            Manage
          </TabsTrigger>
        </TabsList>

        {/* Providers Tab */}
        <TabsContent value="providers" className="space-y-6">
          {providers.length === 0 ? (
            <Card className="bg-gradient-to-br from-teal-50 to-blue-50 border-teal-100">
              <CardContent className="flex flex-col items-center justify-center py-16 space-y-6">
                <div className="p-4 rounded-full bg-white shadow-sm">
                  <Cloud className="w-12 h-12 text-teal-600" />
                </div>
                <div className="text-center space-y-2 max-w-md">
                  <h3 className="text-2xl font-bold">No Courier Providers Yet</h3>
                  <p className="text-muted-foreground">
                    Get started by adding your first courier provider and configuring its API credentials.
                    We'll guide you through the process.
                  </p>
                </div>
                <Button size="lg" onClick={() => setActiveTab("add-provider")} className="mt-4">
                  <Plus className="w-5 h-5 mr-2" />
                  Add Your First Provider
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-teal-50 border-teal-100">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Courier Providers
                </CardTitle>
                <CardDescription>
                  Select a provider to manage credentials or add a new provider
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {isLoading ? (
                    <Card>
                      <CardContent className="flex items-center justify-center h-32">
                        <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
                      </CardContent>
                    </Card>
                  ) : (
                    providers.map((provider) => (
                      <ProviderCard
                        key={provider.id}
                        provider={provider}
                        isSelected={selectedProvider?.id === provider.id}
                        onSelect={() => {
                          setSelectedProvider(provider);
                          setActiveTab("manage");
                        }}
                        onAddCredentials={() => {
                          setSelectedProvider(provider);
                          setActiveTab("add-provider");
                        }}
                      />
                    ))
                  )}
                </div>

                {/* Quick Add More Providers */}
                <div className="mt-8 pt-6 border-t">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Add More Providers</h3>
                    <Button variant="outline" size="sm" onClick={() => setActiveTab("add-provider")}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Provider
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {Object.entries(PROVIDER_TEMPLATES)
                      .filter(([key]) => !providers.find(p => p.name === key))
                      .slice(0, 4)
                      .map(([key, template]) => (
                        <Button
                          key={key}
                          variant="outline"
                          size="sm"
                          className="justify-start"
                          onClick={() => setActiveTab("add-provider")}
                        >
                          <Plus className="w-3 h-3 mr-2" />
                          {template.displayName}
                        </Button>
                      ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Add Provider/Credentials Tab */}
        <TabsContent value="add-provider">
          <AddProviderAndCredentialsTab
            selectedProvider={selectedProvider}
            onSuccess={() => {
              refetch();
              setSelectedProvider(null);
              setActiveTab("providers");
            }}
            onCancel={() => {
              setSelectedProvider(null);
              setActiveTab("providers");
            }}
          />
        </TabsContent>

        {/* Manage Tab */}
        <TabsContent value="manage">
          {selectedProvider ? (
            <ManageProviderTab
              provider={selectedProvider}
              onBack={() => {
                setSelectedProvider(null);
                setActiveTab("providers");
              }}
              onEdit={(credential) => {
                setSelectedCredential(credential);
                setActiveTab("add-provider");
              }}
              onDelete={(credential) => {
                setSelectedCredential(credential);
                setShowDeleteDialog(true);
              }}
              onRefetch={refetch}
            />
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center h-48 space-y-4">
                <AlertCircle className="w-12 h-12 text-muted-foreground" />
                <div className="text-center space-y-2">
                  <h3 className="text-lg font-semibold">No Provider Selected</h3>
                  <p className="text-muted-foreground">
                    Please select a provider from the Providers tab
                  </p>
                </div>
                <Button onClick={() => setActiveTab("providers")}>
                  Go to Providers
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      {selectedCredential && (
        <DeleteConfirmationDialog
          credential={selectedCredential}
          open={showDeleteDialog}
          onClose={() => {
            setShowDeleteDialog(false);
            setSelectedCredential(null);
          }}
          onSuccess={() => {
            refetch();
          }}
        />
      )}
    </div>
  );
}

// ==================== PROVIDER CARD ====================
function ProviderCard({
  provider,
  isSelected,
  onSelect,
  onAddCredentials,
}: {
  provider: CourierProvider;
  isSelected: boolean;
  onSelect: () => void;
  onAddCredentials: () => void;
}) {
  const prodCredentials = provider.courier_credentials?.filter((c) => c.environment === "PRODUCTION");
  const sandboxCredentials = provider.courier_credentials?.filter((c) => c.environment === "SANDBOX");

  const hasProduction = (prodCredentials?.length || 0) > 0;
  const hasSandbox = (sandboxCredentials?.length || 0) > 0;

  return (
    <Card className={`${isSelected ? 'ring-2 ring-primary' : ''} transition-all hover:shadow-md`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <div className={`p-2 rounded-full ${provider.isActive ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
              <Building2 className="w-4 h-4" />
            </div>
            {provider.displayName}
          </CardTitle>
          <Badge variant={provider.isActive ? "default" : "secondary"}>
            {provider.isActive ? "Active" : "Inactive"}
          </Badge>
        </div>
        {provider.description && (
          <CardDescription className="line-clamp-2">{provider.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Production</span>
            {hasProduction ? (
              <div className="flex items-center gap-1 text-green-600">
                <CheckCircle className="w-4 h-4" />
                <span className="text-xs">Configured</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-gray-400">
                <XCircle className="w-4 h-4" />
                <span className="text-xs">Not set</span>
              </div>
            )}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Sandbox</span>
            {hasSandbox ? (
              <div className="flex items-center gap-1 text-green-600">
                <CheckCircle className="w-4 h-4" />
                <span className="text-xs">Configured</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-gray-400">
                <XCircle className="w-4 h-4" />
                <span className="text-xs">Not set</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1" onClick={onSelect}>
            <Settings className="w-4 h-4 mr-2" />
            Manage
          </Button>
          <Button size="sm" className="flex-1" onClick={onAddCredentials}>
            <Plus className="w-4 h-4 mr-2" />
            Add Creds
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ==================== ADD PROVIDER AND CREDENTIALS TAB ====================
function AddProviderAndCredentialsTab({
  selectedProvider,
  onSuccess,
  onCancel,
}: {
  selectedProvider: CourierProvider | null;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [step, setStep] = useState<"provider" | "credentials">(selectedProvider ? "credentials" : "provider");
  const [environment, setEnvironment] = useState<Environment>("PRODUCTION");
  const [showSecrets, setShowSecrets] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [newProvider, setNewProvider] = useState<CourierProvider | null>(null);

  const [providerForm, setProviderForm] = useState({
    name: "",
    displayName: "",
    description: "",
    productionBaseUrl: "",
    sandboxBaseUrl: "",
    authType: "API_KEY" as CourierAuthType,
  });

  const [credentialsForm, setCredentialsForm] = useState({
    clientId: "",
    clientSecret: "",
    username: "",
    password: "",
    apiKey: "",
    bearerToken: "",
    storeId: "",
    merchantId: "",
  });

  const [createProvider, { isLoading: isCreatingProvider }] = useCreateCourierProviderMutation();
  const [createCredentials, { isLoading: isCreatingCredentials }] = useCreateCourierCredentialsMutation();

  // Load template when selected
  const handleTemplateSelect = (templateKey: string) => {
    const template = PROVIDER_TEMPLATES[templateKey];
    if (template) {
      setSelectedTemplate(templateKey);
      setProviderForm({
        name: template.name,
        displayName: template.displayName,
        description: template.description,
        productionBaseUrl: template.productionBaseUrl,
        sandboxBaseUrl: template.sandboxBaseUrl,
        authType: template.authType,
      });
    }
  };

  // Step 1: Create Provider
  const handleCreateProvider = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!providerForm.name || !providerForm.displayName || !providerForm.productionBaseUrl) {
      toast.error("Validation Error", {
        description: "Please fill in all required fields",
      });
      return;
    }

    try {
      const result = await createProvider({
        name: providerForm.name,
        displayName: providerForm.displayName,
        description: providerForm.description,
        productionBaseUrl: providerForm.productionBaseUrl,
        sandboxBaseUrl: providerForm.sandboxBaseUrl,
        authType: providerForm.authType,
        supportsCOD: true,
        supportsTracking: true,
        supportsBulkOrder: false,
        supportsWebhook: false,
        priority: 100,
        isPreferred: false,
      }).unwrap();

      toast.success("Provider created successfully");

      setNewProvider(result.data!);
      setStep("credentials");
    } catch (error: any) {
      console.error("Error creating provider:", error);
      toast.error("Failed to create provider", {
        description: error?.data?.message || "Please try again",
      });
    }
  };

  // Step 2: Create Credentials
  const handleCreateCredentials = async (e: React.FormEvent) => {
    e.preventDefault();

    const provider = selectedProvider || newProvider;
    if (!provider) {
      toast.error("No provider selected");
      return;
    }

    // Validate based on auth type
    if (provider.authType === "OAUTH2") {
      if (!credentialsForm.clientId || !credentialsForm.clientSecret || !credentialsForm.username || !credentialsForm.password) {
        toast.error("Validation Error", {
          description: "Please fill in all OAuth2 credentials",
        });
        return;
      }
    } else if (provider.authType === "BEARER") {
      if (!credentialsForm.bearerToken) {
        toast.error("Validation Error", {
          description: "Please enter Bearer Token",
        });
        return;
      }
    } else if (provider.authType === "API_KEY") {
      if (!credentialsForm.apiKey) {
        toast.error("Validation Error", {
          description: "Please enter API Key",
        });
        return;
      }
    }

    try {
      await createCredentials({
        courierProviderId: provider.id,
        environment,
        ...credentialsForm,
      }).unwrap();

      toast.success("Credentials created successfully");

      onSuccess();
    } catch (error: any) {
      console.error("Error creating credentials:", error);
      toast.error("Failed to create credentials", {
        description: error?.data?.message || "Please try again",
      });
    }
  };

  // Determine auth type
  const provider = selectedProvider || newProvider;
  const authType = provider?.authType || providerForm.authType;

  return (
    <div className="space-y-6">
      {/* Progress Indicator */}
      {!selectedProvider && (
        <Card className="bg-gradient-to-r from-teal-50 to-blue-50 border-teal-200">
          <CardContent className="py-6">
            <div className="flex items-center justify-center gap-4">
              <div className={`flex items-center gap-2 ${step === "provider" ? "text-teal-700 font-semibold" : "text-gray-500"}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === "provider" ? "bg-teal-600 text-white" : newProvider ? "bg-green-600 text-white" : "bg-gray-300 text-gray-600"}`}>
                  {newProvider ? <Check className="w-5 h-5" /> : "1"}
                </div>
                <span>Create Provider</span>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400" />
              <div className={`flex items-center gap-2 ${step === "credentials" ? "text-teal-700 font-semibold" : "text-gray-400"}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === "credentials" ? "bg-teal-600 text-white" : "bg-gray-300 text-gray-600"}`}>
                  2
                </div>
                <span>Add Credentials</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 1: Provider Form */}
      {step === "provider" && !selectedProvider && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Template Selection */}
          <Card className="lg:col-span-1 bg-teal-50 border-teal-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Quick Start Templates
              </CardTitle>
              <CardDescription>
                Select a pre-configured provider template
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {Object.entries(PROVIDER_TEMPLATES).map(([key, template]) => (
                <Button
                  key={key}
                  variant={selectedTemplate === key ? "default" : "outline"}
                  className="w-full justify-start"
                  onClick={() => handleTemplateSelect(key)}
                >
                  <Building2 className="w-4 h-4 mr-2" />
                  {template.displayName}
                </Button>
              ))}
            </CardContent>
          </Card>

          {/* Provider Details Form */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Provider Details</CardTitle>
              <CardDescription>
                Enter the courier provider information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateProvider} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Provider Name (Internal) *</Label>
                    <Input
                      value={providerForm.name}
                      onChange={(e) => setProviderForm({ ...providerForm, name: e.target.value })}
                      placeholder="e.g., Pathao"
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Internal identifier (no spaces)
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Display Name *</Label>
                    <Input
                      value={providerForm.displayName}
                      onChange={(e) => setProviderForm({ ...providerForm, displayName: e.target.value })}
                      placeholder="e.g., Pathao Courier"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input
                    value={providerForm.description}
                    onChange={(e) => setProviderForm({ ...providerForm, description: e.target.value })}
                    placeholder="Brief description of the courier service"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Authentication Type *</Label>
                  <Select 
                    value={providerForm.authType} 
                    onValueChange={(v: CourierAuthType) => setProviderForm({ ...providerForm, authType: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="API_KEY">API Key</SelectItem>
                      <SelectItem value="BEARER">Bearer Token</SelectItem>
                      <SelectItem value="OAUTH2">OAuth 2.0</SelectItem>
                      <SelectItem value="BASIC">Basic Auth</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Production Base URL *</Label>
                    <Input
                      value={providerForm.productionBaseUrl}
                      onChange={(e) => setProviderForm({ ...providerForm, productionBaseUrl: e.target.value })}
                      placeholder="https://api.example.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Sandbox Base URL (Optional)</Label>
                    <Input
                      value={providerForm.sandboxBaseUrl}
                      onChange={(e) => setProviderForm({ ...providerForm, sandboxBaseUrl: e.target.value })}
                      placeholder="https://api-sandbox.example.com"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t">
                  <Button type="button" variant="outline" onClick={onCancel}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isCreatingProvider}>
                    {isCreatingProvider ? "Creating..." : "Create Provider & Continue"}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 2: Credentials Form */}
      {step === "credentials" && provider && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Provider Info */}
          <Card className="lg:col-span-1 bg-teal-50 border-teal-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                {provider.displayName}
              </CardTitle>
              <CardDescription>
                {provider.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Provider Name</p>
                <p className="font-mono text-sm">{provider.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Production URL</p>
                <p className="font-mono text-xs truncate">{provider.productionBaseUrl}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Auth Type</p>
                <Badge variant="outline">
                  {authType === "OAUTH2" ? "OAuth 2.0" : authType === "BEARER" ? "Bearer Token" : authType === "API_KEY" ? "API Key" : "Basic Auth"}
                </Badge>
              </div>

              <div className="space-y-2 pt-4 border-t">
                <Label>Environment *</Label>
                <Select value={environment} onValueChange={(v: Environment) => setEnvironment(v)} required>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PRODUCTION">Production</SelectItem>
                    <SelectItem value="SANDBOX">Sandbox</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Credentials Form */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                API Credentials
              </CardTitle>
              <CardDescription>
                Enter your {environment.toLowerCase()} environment credentials for {provider.displayName}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateCredentials} className="space-y-6">
                {/* OAuth2 (Pathao) */}
                {authType === "OAUTH2" && (
                  <div className="space-y-6">
                    <Alert>
                      <AlertCircle className="w-4 h-4" />
                      <AlertDescription>
                        OAuth 2.0 authentication requires Client ID, Client Secret, Username, and Password
                      </AlertDescription>
                    </Alert>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label>Client ID *</Label>
                        <Input
                          value={credentialsForm.clientId}
                          onChange={(e) => setCredentialsForm({ ...credentialsForm, clientId: e.target.value })}
                          required
                          placeholder="Enter Client ID"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Client Secret *</Label>
                        <div className="relative">
                          <Input
                            type={showSecrets ? "text" : "password"}
                            value={credentialsForm.clientSecret}
                            onChange={(e) => setCredentialsForm({ ...credentialsForm, clientSecret: e.target.value })}
                            required
                            placeholder="Enter Client Secret"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3"
                            onClick={() => setShowSecrets(!showSecrets)}
                          >
                            {showSecrets ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label>Username *</Label>
                        <Input
                          value={credentialsForm.username}
                          onChange={(e) => setCredentialsForm({ ...credentialsForm, username: e.target.value })}
                          required
                          placeholder="Enter Username"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Password *</Label>
                        <div className="relative">
                          <Input
                            type={showSecrets ? "text" : "password"}
                            value={credentialsForm.password}
                            onChange={(e) => setCredentialsForm({ ...credentialsForm, password: e.target.value })}
                            required
                            placeholder="Enter Password"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3"
                            onClick={() => setShowSecrets(!showSecrets)}
                          >
                            {showSecrets ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Optional fields for OAuth2 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label>Store ID (Optional)</Label>
                        <Input
                          value={credentialsForm.storeId}
                          onChange={(e) => setCredentialsForm({ ...credentialsForm, storeId: e.target.value })}
                          placeholder="Enter Store ID"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Merchant ID (Optional)</Label>
                        <Input
                          value={credentialsForm.merchantId}
                          onChange={(e) => setCredentialsForm({ ...credentialsForm, merchantId: e.target.value })}
                          placeholder="Enter Merchant ID"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Bearer Token (RedX) */}
                {authType === "BEARER" && (
                  <div className="space-y-4">
                    <Alert>
                      <AlertCircle className="w-4 h-4" />
                      <AlertDescription>
                        Bearer Token authentication - enter your API token
                      </AlertDescription>
                    </Alert>

                    <div className="space-y-2">
                      <Label>Bearer Token *</Label>
                      <div className="relative">
                        <Input
                          type={showSecrets ? "text" : "password"}
                          value={credentialsForm.bearerToken}
                          onChange={(e) => setCredentialsForm({ ...credentialsForm, bearerToken: e.target.value })}
                          required
                          placeholder="Enter your API bearer token"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => setShowSecrets(!showSecrets)}
                        >
                          {showSecrets ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* API Key */}
                {authType === "API_KEY" && (
                  <div className="space-y-4">
                    <Alert>
                      <AlertCircle className="w-4 h-4" />
                      <AlertDescription>
                        API Key authentication - enter your API key
                      </AlertDescription>
                    </Alert>

                    <div className="space-y-2">
                      <Label>API Key *</Label>
                      <div className="relative">
                        <Input
                          type={showSecrets ? "text" : "password"}
                          value={credentialsForm.apiKey}
                          onChange={(e) => setCredentialsForm({ ...credentialsForm, apiKey: e.target.value })}
                          required
                          placeholder="Enter your API key"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => setShowSecrets(!showSecrets)}
                        >
                          {showSecrets ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-6 border-t">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowSecrets(!showSecrets)}
                  >
                    {showSecrets ? <EyeOff className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
                    {showSecrets ? "Hide Secrets" : "Show Secrets"}
                  </Button>
                  <div className="flex gap-2">
                    {!selectedProvider && (
                      <Button type="button" variant="outline" onClick={() => setStep("provider")}>
                        ← Back
                      </Button>
                    )}
                    <Button type="button" variant="outline" onClick={onCancel}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isCreatingCredentials}>
                      {isCreatingCredentials ? "Saving..." : "Save Credentials"}
                    </Button>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

// ==================== MANAGE PROVIDER TAB ====================
function ManageProviderTab({
  provider,
  onBack,
  onEdit,
  onDelete,
  onRefetch,
}: {
  provider: CourierProvider;
  onBack: () => void;
  onEdit: (credential: CourierCredential) => void;
  onDelete: (credential: CourierCredential) => void;
  onRefetch: () => void;
}) {
  const [testCredentials] = useTestCourierCredentialsMutation();
  const [refreshToken] = useRefreshCredentialTokenMutation();
  const [testingId, setTestingId] = useState<string | null>(null);
  const [refreshingId, setRefreshingId] = useState<string | null>(null);

  const handleTest = async (credential: CourierCredential) => {
    setTestingId(credential.id);
    try {
      await testCredentials({ credentialId: credential.id }).unwrap();
      toast.success("Credentials are valid!");
    } catch (error: any) {
      toast.error("Test failed", {
        description: error?.data?.message || "Credential test failed",
      });
    } finally {
      setTestingId(null);
    }
  };

  const handleRefreshToken = async (credential: CourierCredential) => {
    if (credential.courier_providers?.authType !== "OAUTH2") {
      toast.error("Not supported", {
        description: "Token refresh is only available for OAuth2 providers",
      });
      return;
    }

    setRefreshingId(credential.id);
    try {
      await refreshToken({ credentialId: credential.id }).unwrap();
      toast.success("Token refreshed successfully");
      onRefetch();
    } catch (error: any) {
      toast.error("Refresh failed", {
        description: error?.data?.message || "Failed to refresh token",
      });
    } finally {
      setRefreshingId(null);
    }
  };

  const prodCredentials = provider.courier_credentials?.filter((c) => c.environment === "PRODUCTION") || [];
  const sandboxCredentials = provider.courier_credentials?.filter((c) => c.environment === "SANDBOX") || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={onBack}>
              ← Back
            </Button>
            <div>
              <h2 className="text-2xl font-bold tracking-tight">{provider.displayName}</h2>
              <p className="text-muted-foreground">{provider.description}</p>
            </div>
          </div>
        </div>
        <Badge variant={provider.isActive ? "default" : "secondary"}>
          {provider.isActive ? "Active" : "Inactive"}
        </Badge>
      </div>

      {/* Provider Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-teal-50 border-teal-100">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Provider Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="font-medium">{provider.displayName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Internal Name</p>
              <p className="font-mono text-sm">{provider.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Auth Type</p>
              <Badge variant="outline">{provider.authType}</Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Production URL</p>
              <p className="font-mono text-sm truncate">{provider.productionBaseUrl}</p>
            </div>
            {provider.sandboxBaseUrl && (
              <div>
                <p className="text-sm text-muted-foreground">Sandbox URL</p>
                <p className="font-mono text-sm truncate">{provider.sandboxBaseUrl}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Credentials Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Credentials Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-green-100 text-green-600">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-medium">Production</p>
                  <p className="text-sm text-muted-foreground">{prodCredentials.length} credential(s)</p>
                </div>
              </div>
              {prodCredentials.length > 0 ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <XCircle className="w-5 h-5 text-gray-400" />
              )}
            </div>
            <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-blue-100 text-blue-600">
                  <Cloud className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-medium">Sandbox</p>
                  <p className="text-sm text-muted-foreground">{sandboxCredentials.length} credential(s)</p>
                </div>
              </div>
              {sandboxCredentials.length > 0 ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <XCircle className="w-5 h-5 text-gray-400" />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Statistics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total Orders</span>
              <span className="font-semibold">{provider._count?.courier_orders || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Serviceable Areas</span>
              <span className="font-semibold">{provider._count?.courier_serviceable_areas || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Priority</span>
              <Badge variant="outline">{provider.priority}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Credentials Tables */}
      <Tabs defaultValue="production" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="production">Production Credentials</TabsTrigger>
          <TabsTrigger value="sandbox">Sandbox Credentials</TabsTrigger>
        </TabsList>

        <TabsContent value="production">
          <CredentialsTable
            credentials={prodCredentials}
            onEdit={onEdit}
            onDelete={onDelete}
            onTest={handleTest}
            onRefreshToken={handleRefreshToken}
            testingId={testingId}
            refreshingId={refreshingId}
          />
        </TabsContent>

        <TabsContent value="sandbox">
          <CredentialsTable
            credentials={sandboxCredentials}
            onEdit={onEdit}
            onDelete={onDelete}
            onTest={handleTest}
            onRefreshToken={handleRefreshToken}
            testingId={testingId}
            refreshingId={refreshingId}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ==================== CREDENTIALS TABLE ====================
function CredentialsTable({
  credentials,
  onEdit,
  onDelete,
  onTest,
  onRefreshToken,
  testingId,
  refreshingId,
}: {
  credentials: CourierCredential[];
  onEdit: (credential: CourierCredential) => void;
  onDelete: (credential: CourierCredential) => void;
  onTest: (credential: CourierCredential) => void;
  onRefreshToken: (credential: CourierCredential) => void;
  testingId: string | null;
  refreshingId: string | null;
}) {
  if (credentials.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center h-48 space-y-4">
          <AlertCircle className="w-12 h-12 text-muted-foreground" />
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold">No Credentials Found</h3>
            <p className="text-muted-foreground">
              No credentials configured for this environment
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="border rounded-lg bg-white">
      <Table>
        <TableHeader>
          <TableRow className="bg-teal-50 hover:bg-teal-50">
            <TableHead className="font-semibold">Status</TableHead>
            <TableHead className="font-semibold">Credentials</TableHead>
            <TableHead className="font-semibold">Token Status</TableHead>
            <TableHead className="font-semibold">Last Updated</TableHead>
            <TableHead className="font-semibold">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {credentials.map((credential) => (
            <TableRow key={credential.id} className="hover:bg-gray-50">
              <TableCell>
                {credential.isActive ? (
                  <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">
                    Active
                  </Badge>
                ) : (
                  <Badge variant="secondary">Inactive</Badge>
                )}
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  <code className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                    {credential.clientId || credential.apiKey || credential.bearerToken?.substring(0, 8) + "..." || "•••••••••"}
                  </code>
                  <p className="text-xs text-muted-foreground">
                    {credential.username ? `User: ${credential.username}` : "No username"}
                  </p>
                </div>
              </TableCell>
              <TableCell>
                {credential.accessToken ? (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span className="text-sm">Valid</span>
                    {credential.tokenExpiresAt && (
                      <span className="text-xs text-muted-foreground">
                        expires {new Date(credential.tokenExpiresAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                    <span className="text-sm">Not Authenticated</span>
                  </div>
                )}
              </TableCell>
              <TableCell className="text-sm">
                <div className="space-y-1">
                  <div>{new Date(credential.updatedAt).toLocaleDateString()}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(credential.updatedAt).toLocaleTimeString()}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onTest(credential)}
                    disabled={testingId === credential.id}
                    className="hover:bg-blue-50"
                    title="Test credentials"
                  >
                    {testingId === credential.id ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <TestTube className="w-4 h-4" />
                    )}
                  </Button>
                  {credential.courier_providers?.authType === "OAUTH2" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRefreshToken(credential)}
                      disabled={refreshingId === credential.id}
                      className="hover:bg-purple-50"
                      title="Refresh OAuth token"
                    >
                      {refreshingId === credential.id ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4" />
                      )}
                    </Button>
                  )}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => onEdit(credential)}
                    className="hover:bg-teal-50"
                    title="Edit credentials"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(credential)}
                    className="text-destructive hover:bg-red-50"
                    title="Delete credentials"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// ==================== DELETE CONFIRMATION DIALOG ====================
function DeleteConfirmationDialog({
  credential,
  open,
  onClose,
  onSuccess,
}: {
  credential: CourierCredential;
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}) {
  const [deleteCredentials, { isLoading }] = useDeleteCourierCredentialsMutation();

  const handleDelete = async () => {
    try {
      await deleteCredentials({ credentialId: credential.id }).unwrap();
      toast.success("Credentials deleted successfully");
      onClose();
      if (onSuccess) onSuccess();
    } catch (error: any) {
      toast.error("Failed to delete credentials", {
        description: error?.data?.message || "Please try again",
      });
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete these credentials. All active courier operations using these
            credentials will fail. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={isLoading} className="bg-destructive">
            {isLoading ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}