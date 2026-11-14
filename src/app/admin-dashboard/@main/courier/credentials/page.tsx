// app/admin-dashboard/@main/courier/credentials/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  AlertCircle, ArrowRight, Building2, Check, ChevronLeft, Cloud, Eye, EyeOff, Key,
  PencilLine, Plus, RefreshCw, Settings, Shield, TestTube, Trash2, Wallet, XCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  Badge, Button, Card, EmptyState, Field, Modal, Notice, PageHeader, PageTabs,
  PayoutShell, Skeleton, cx, inputCls, tableCls, tdCls, thCls,
} from "@/components/payouts/ui";
import {
  useGetCourierProvidersQuery,
  useCreateCourierProviderMutation,
  useCreateCourierCredentialsMutation,
  useUpdateCourierCredentialsMutation,
  useDeleteCourierCredentialsMutation,
  useTestCourierCredentialsMutation,
  useRefreshCredentialTokenMutation,
  useLazySteadfastGetBalanceQuery,
  type CourierProvider,
  type CourierCredential,
  type Environment,
  type CourierAuthType,
} from "@/features/courierApi";

type ProviderTemplate = {
  name: string;
  displayName: string;
  description: string;
  productionBaseUrl: string;
  sandboxBaseUrl: string;
  authType: CourierAuthType;
  supportsCOD?: boolean;
  supportsTracking?: boolean;
  supportsBulkOrder?: boolean;
  supportsWebhook?: boolean;
};

const PROVIDER_TEMPLATES: Record<string, ProviderTemplate> = {
  Pathao: {
    name: "Pathao",
    displayName: "Pathao",
    description: "Pathao Courier Service - Bangladesh's leading delivery platform",
    productionBaseUrl: "https://api.pathao.com",
    sandboxBaseUrl: "https://api-sandbox.pathao.com",
    authType: "OAUTH2",
    supportsCOD: true,
    supportsTracking: true,
    supportsBulkOrder: false,
    supportsWebhook: true,
  },
  RedX: {
    name: "RedX",
    displayName: "RedX",
    description: "RedX Courier Service - Fast and reliable delivery",
    productionBaseUrl: "https://api.redx.com.bd",
    sandboxBaseUrl: "https://api-sandbox.redx.com.bd",
    authType: "BEARER",
    supportsCOD: true,
    supportsTracking: true,
    supportsBulkOrder: false,
    supportsWebhook: true,
  },
  Steadfast: {
    name: "Steadfast",
    displayName: "Steadfast",
    description: "Steadfast Courier Service",
    // Steadfast has a single API base for both environments — there's no
    // separate sandbox host (see Steadfast's own API docs). Point both at
    // the same URL so picking "Sandbox" in the environment selector still
    // works instead of hitting an empty/broken base URL.
    productionBaseUrl: "https://portal.packzy.com/api/v1",
    sandboxBaseUrl: "https://portal.packzy.com/api/v1",
    authType: "API_KEY",
    supportsCOD: true,
    supportsTracking: true,
    // Matches courier.service.ts's real Steadfast implementation:
    // steadfastBulkCreateOrder exists, but there's no webhook (poll
    // steadfastCheckStatus instead).
    supportsBulkOrder: true,
    supportsWebhook: false,
  },
  Paperfly: {
    name: "Paperfly",
    displayName: "Paperfly",
    description: "Paperfly Courier Service",
    productionBaseUrl: "https://api.paperfly.com.bd",
    sandboxBaseUrl: "",
    authType: "API_KEY",
    supportsCOD: true,
    supportsTracking: true,
    supportsBulkOrder: false,
    supportsWebhook: false,
  },
};

const AUTH_LABEL: Record<CourierAuthType, string> = {
  OAUTH2: "OAuth 2.0",
  BEARER: "Bearer Token",
  API_KEY: "API Key",
  BASIC: "Basic Auth",
};

export default function CourierCredentialsPage() {
  const [selectedProvider, setSelectedProvider] = useState<CourierProvider | null>(null);
  const [editingCredential, setEditingCredential] = useState<CourierCredential | null>(null);
  const [deletingCredential, setDeletingCredential] = useState<CourierCredential | null>(null);
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
    <PayoutShell>
      <PageHeader
        icon={<Key />}
        title="Courier Credentials"
        subtitle="Manage API credentials for courier integrations. Secrets are stored encrypted and only ever shown masked."
        actions={
          <>
            <Link href="/admin-dashboard/courier">
              <Button variant="secondary">
                <ChevronLeft className="h-3.5 w-3.5" /> Back to Courier
              </Button>
            </Link>
            <Badge tone="blue" dot>Platform Admin</Badge>
          </>
        }
      />

      <PageTabs
        active={activeTab}
        onChange={setActiveTab}
        items={[
          { key: "providers", label: `Providers (${providers.length})`, icon: <Building2 /> },
          { key: "add-provider", label: editingCredential ? "Edit Credentials" : "Add New", icon: <Plus /> },
          { key: "manage", label: "Manage", icon: <Settings /> },
        ]}
      />

      {activeTab === "providers" && (
        <ProvidersTab
          providers={providers}
          isLoading={isLoading}
          selectedProviderId={selectedProvider?.id}
          onManage={(provider) => {
            setSelectedProvider(provider);
            setEditingCredential(null);
            setActiveTab("manage");
          }}
          onAddCredentials={(provider) => {
            setSelectedProvider(provider);
            setEditingCredential(null);
            setActiveTab("add-provider");
          }}
          onAddProvider={() => {
            setSelectedProvider(null);
            setEditingCredential(null);
            setActiveTab("add-provider");
          }}
        />
      )}

      {activeTab === "add-provider" && (
        <AddProviderAndCredentialsTab
          selectedProvider={selectedProvider}
          editingCredential={editingCredential}
          onSuccess={() => {
            refetch();
            setSelectedProvider(null);
            setEditingCredential(null);
            setActiveTab("providers");
          }}
          onCancel={() => {
            setSelectedProvider(null);
            setEditingCredential(null);
            setActiveTab("providers");
          }}
        />
      )}

      {activeTab === "manage" &&
        (selectedProvider ? (
          <ManageProviderTab
            provider={selectedProvider}
            onBack={() => {
              setSelectedProvider(null);
              setActiveTab("providers");
            }}
            onEdit={(credential) => {
              setEditingCredential(credential);
              setActiveTab("add-provider");
            }}
            onDelete={(credential) => setDeletingCredential(credential)}
            onRefetch={refetch}
          />
        ) : (
          <EmptyState
            icon={<Building2 />}
            title="No provider selected"
            body="Select a provider from the Providers tab first."
            action={<Button size="sm" variant="secondary" onClick={() => setActiveTab("providers")}>Go to Providers</Button>}
          />
        ))}

      <DeleteCredentialModal
        credential={deletingCredential}
        onClose={() => setDeletingCredential(null)}
        onSuccess={() => refetch()}
      />
    </PayoutShell>
  );
}

// ==================== PROVIDERS TAB ====================
function ProvidersTab({
  providers,
  isLoading,
  selectedProviderId,
  onManage,
  onAddCredentials,
  onAddProvider,
}: {
  providers: CourierProvider[];
  isLoading: boolean;
  selectedProviderId?: string;
  onManage: (provider: CourierProvider) => void;
  onAddCredentials: (provider: CourierProvider) => void;
  onAddProvider: () => void;
}) {
  if (!isLoading && providers.length === 0) {
    return (
      <EmptyState
        icon={<Cloud />}
        title="No courier providers yet"
        body="Get started by adding your first courier provider and configuring its API credentials. We'll guide you through the process."
        action={
          <Button onClick={onAddProvider}>
            <Plus className="h-3.5 w-3.5" /> Add Your First Provider <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        }
      />
    );
  }

  const remainingTemplates = Object.entries(PROVIDER_TEMPLATES).filter(
    ([key]) => !providers.find((p) => p.name === key)
  );

  return (
    <div className="space-y-4">
      {isLoading ? (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-lg border border-slate-200 bg-white p-4">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-slate-100" />
                <div className="space-y-1.5">
                  <div className="h-3 w-24 rounded bg-slate-200" />
                  <div className="h-2.5 w-16 rounded bg-slate-100" />
                </div>
              </div>
              <div className="mt-3 h-2.5 w-40 rounded bg-slate-100" />
              <div className="mt-3 h-7 w-24 rounded-md bg-slate-100" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {providers.map((provider) => (
            <ProviderCard
              key={provider.id}
              provider={provider}
              isSelected={selectedProviderId === provider.id}
              onSelect={() => onManage(provider)}
              onAddCredentials={() => onAddCredentials(provider)}
            />
          ))}
        </div>
      )}

      {remainingTemplates.length > 0 && (
        <Card title="Add More Providers" subtitle="Pre-configured courier templates">
          <div className="flex flex-wrap gap-2">
            {remainingTemplates.slice(0, 4).map(([key, template]) => (
              <Button key={key} size="sm" variant="secondary" onClick={onAddProvider}>
                <Plus className="h-3.5 w-3.5" /> {template.displayName}
              </Button>
            ))}
          </div>
        </Card>
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

  const envRow = (label: string, configured: boolean) => (
    <div className="flex items-center justify-between text-[12px]">
      <span className="font-medium text-slate-700">{label}</span>
      <Badge tone={configured ? "green" : "slate"} dot>
        {configured ? "Connected" : "Not connected"}
      </Badge>
    </div>
  );

  return (
    <Card className={cx("p-4", isSelected && "ring-2 ring-[#4338CA]")}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span
            className={cx(
              "grid h-9 w-9 shrink-0 place-items-center rounded-lg [&>svg]:h-4 [&>svg]:w-4",
              provider.isActive ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"
            )}
          >
            <Building2 />
          </span>
          <div className="min-w-0">
            <p className="truncate text-[13px] font-semibold text-slate-800">{provider.displayName}</p>
            <p className="truncate text-[11px] text-slate-500">{AUTH_LABEL[provider.authType]}</p>
          </div>
        </div>
        <Badge tone={provider.isActive ? "green" : "slate"} dot>
          {provider.isActive ? "Active" : "Inactive"}
        </Badge>
      </div>

      {provider.description && (
        <p className="mt-2 line-clamp-2 text-[11px] leading-4 text-slate-500">{provider.description}</p>
      )}

      <div className="mt-3 space-y-1.5 border-t border-slate-100 pt-3">
        {envRow("Production", (prodCredentials?.length || 0) > 0)}
        {envRow("Sandbox", (sandboxCredentials?.length || 0) > 0)}
      </div>

      <div className="mt-3 flex gap-2 border-t border-slate-100 pt-3">
        <Button size="sm" variant="secondary" className="flex-1" onClick={onSelect}>
          <Settings className="h-3.5 w-3.5" /> Manage
        </Button>
        <Button size="sm" className="flex-1" onClick={onAddCredentials}>
          <Plus className="h-3.5 w-3.5" /> Add Creds
        </Button>
      </div>
    </Card>
  );
}

// ==================== ADD PROVIDER AND CREDENTIALS TAB ====================
const EMPTY_CREDENTIALS_FORM = {
  clientId: "",
  clientSecret: "",
  username: "",
  password: "",
  apiKey: "",
  bearerToken: "",
  storeId: "",
  merchantId: "",
};

function SecretField({
  label, value, onChange, placeholder, required, hint,
}: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; required?: boolean; hint?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <Field label={label} hint={hint} error={required && value.trim() === "" ? `${label.replace(" *", "")} is required` : null}>
      <div className="relative">
        <input
          className={cx(inputCls, "pr-9")}
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete="off"
        />
        <button
          type="button"
          aria-label={show ? "Hide secret" : "Show secret"}
          onClick={() => setShow(!show)}
          className="absolute right-1 top-1/2 -translate-y-1/2 rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
        >
          {show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
        </button>
      </div>
    </Field>
  );
}

function AddProviderAndCredentialsTab({
  selectedProvider,
  editingCredential,
  onSuccess,
  onCancel,
}: {
  selectedProvider: CourierProvider | null;
  editingCredential: CourierCredential | null;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const isEditing = Boolean(editingCredential);
  const [step, setStep] = useState<"provider" | "credentials">(
    selectedProvider || editingCredential ? "credentials" : "provider"
  );
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

  const [credentialsForm, setCredentialsForm] = useState(EMPTY_CREDENTIALS_FORM);

  const [createProvider, { isLoading: isCreatingProvider }] = useCreateCourierProviderMutation();
  const [createCredentials, { isLoading: isCreatingCredentials }] = useCreateCourierCredentialsMutation();
  const [updateCredentials, { isLoading: isUpdatingCredentials }] = useUpdateCourierCredentialsMutation();

  // Reset local form state whenever the selected provider / credential
  // identity changes — Radix-style tab switching keeps the component mounted,
  // so without this the previous provider's typed values would leak through.
  useEffect(() => {
    if (editingCredential) {
      // Edit mode: prefill non-secret fields; secrets stay blank — the backend
      // keeps the stored (encrypted) value when a secret field is left blank.
      setCredentialsForm({
        clientId: editingCredential.clientId || "",
        clientSecret: "",
        username: editingCredential.username || "",
        password: "",
        apiKey: "",
        bearerToken: "",
        storeId: editingCredential.storeId || "",
        merchantId: editingCredential.merchantId || "",
      });
      setEnvironment(editingCredential.environment);
      setShowSecrets(false);
      setStep("credentials");
      return;
    }

    setCredentialsForm(EMPTY_CREDENTIALS_FORM);
    setShowSecrets(false);
    setEnvironment("PRODUCTION");
    setStep(selectedProvider ? "credentials" : "provider");

    if (!selectedProvider) {
      setNewProvider(null);
      setSelectedTemplate("");
      setProviderForm({
        name: "",
        displayName: "",
        description: "",
        productionBaseUrl: "",
        sandboxBaseUrl: "",
        authType: "API_KEY",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProvider?.id, editingCredential?.id]);

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

  const handleCreateProvider = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!providerForm.name || !providerForm.displayName || !providerForm.productionBaseUrl) {
      toast.error("Validation Error", { description: "Please fill in all required fields" });
      return;
    }

    const template = PROVIDER_TEMPLATES[selectedTemplate];

    try {
      const result = await createProvider({
        name: providerForm.name,
        displayName: providerForm.displayName,
        description: providerForm.description,
        productionBaseUrl: providerForm.productionBaseUrl,
        sandboxBaseUrl: providerForm.sandboxBaseUrl,
        authType: providerForm.authType,
        supportsCOD: template?.supportsCOD ?? true,
        supportsTracking: template?.supportsTracking ?? true,
        supportsBulkOrder: template?.supportsBulkOrder ?? false,
        supportsWebhook: template?.supportsWebhook ?? false,
        priority: 100,
        isPreferred: false,
      }).unwrap();

      toast.success("Provider created successfully");
      setNewProvider(result.data!);
      setStep("credentials");
    } catch (error: any) {
      toast.error("Failed to create provider", {
        description: error?.data?.message || "Please try again",
      });
    }
  };

  const handleSaveCredentials = async (e: React.FormEvent) => {
    e.preventDefault();

    const provider = selectedProvider || newProvider;
    if (!provider && !isEditing) {
      toast.error("No provider selected");
      return;
    }

    const isSteadfast = (provider?.name || "").toLowerCase() === "steadfast";

    if (isEditing) {
      // Blank secret fields are omitted so the backend keeps the stored value.
      try {
        await updateCredentials({
          credentialId: editingCredential!.id,
          clientId: credentialsForm.clientId || undefined,
          username: credentialsForm.username || undefined,
          storeId: credentialsForm.storeId || undefined,
          merchantId: credentialsForm.merchantId || undefined,
          ...(credentialsForm.clientSecret ? { clientSecret: credentialsForm.clientSecret } : {}),
          ...(credentialsForm.password ? { password: credentialsForm.password } : {}),
          ...(credentialsForm.apiKey ? { apiKey: credentialsForm.apiKey } : {}),
          ...(credentialsForm.bearerToken ? { bearerToken: credentialsForm.bearerToken } : {}),
        }).unwrap();
        toast.success("Credentials updated successfully");
        onSuccess();
      } catch (error: any) {
        toast.error("Failed to update credentials", {
          description: error?.data?.message || "Please try again",
        });
      }
      return;
    }

    if (provider!.authType === "OAUTH2") {
      if (!credentialsForm.clientId || !credentialsForm.clientSecret || !credentialsForm.username || !credentialsForm.password) {
        toast.error("Validation Error", { description: "Please fill in all OAuth2 credentials" });
        return;
      }
    } else if (provider!.authType === "BEARER") {
      if (!credentialsForm.bearerToken) {
        toast.error("Validation Error", { description: "Please enter Bearer Token" });
        return;
      }
    } else if (provider!.authType === "API_KEY") {
      if (!credentialsForm.apiKey) {
        toast.error("Validation Error", { description: "Please enter API Key" });
        return;
      }
      // Steadfast's API_KEY auth is really a KEY + SECRET pair
      // (Api-Key / Secret-Key headers) — see getSteadfastHeaders() in
      // courier.service.ts, which reads apiKey + clientSecret off this
      // same credential row.
      if (isSteadfast && !credentialsForm.clientSecret) {
        toast.error("Validation Error", { description: "Steadfast also requires a Secret Key" });
        return;
      }
    }

    try {
      await createCredentials({
        courierProviderId: provider!.id,
        environment,
        ...credentialsForm,
      }).unwrap();

      toast.success("Credentials created successfully");
      onSuccess();
    } catch (error: any) {
      toast.error("Failed to create credentials", {
        description: error?.data?.message || "Please try again",
      });
    }
  };

  const provider = selectedProvider || newProvider;
  const authType = isEditing
    ? editingCredential!.courier_providers?.authType || provider?.authType
    : provider?.authType || providerForm.authType;
  const isSteadfastProvider = isEditing
    ? editingCredential!.courier_providers?.name?.toLowerCase() === "steadfast"
    : (provider?.name || providerForm.name).toLowerCase() === "steadfast";

  if (isEditing && !editingCredential) return null;

  return (
    <div className="space-y-4">
      {!selectedProvider && !isEditing && (
        <Card>
          <div className="flex items-center justify-center gap-4 py-1">
            <div className="flex items-center gap-2">
              <span
                className={cx(
                  "grid h-7 w-7 place-items-center rounded-full text-[12px] font-semibold",
                  step === "provider" ? "bg-[#4338CA] text-white" : newProvider ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-600"
                )}
              >
                {newProvider ? <Check className="h-3.5 w-3.5" /> : "1"}
              </span>
              <span className={cx("text-[12px] font-medium", step === "provider" ? "text-[#4338CA]" : "text-slate-500")}>
                Create Provider
              </span>
            </div>
            <ArrowRight className="h-4 w-4 text-slate-300" />
            <div className="flex items-center gap-2">
              <span
                className={cx(
                  "grid h-7 w-7 place-items-center rounded-full text-[12px] font-semibold",
                  step === "credentials" ? "bg-[#4338CA] text-white" : "bg-slate-200 text-slate-600"
                )}
              >
                2
              </span>
              <span className={cx("text-[12px] font-medium", step === "credentials" ? "text-[#4338CA]" : "text-slate-400")}>
                Add Credentials
              </span>
            </div>
          </div>
        </Card>
      )}

      {step === "provider" && !selectedProvider && !isEditing && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card title="Quick Start Templates" subtitle="Select a pre-configured provider template">
            <div className="space-y-2">
              {Object.entries(PROVIDER_TEMPLATES).map(([key, template]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleTemplateSelect(key)}
                  className={cx(
                    "flex w-full items-center gap-2 rounded border px-3 py-2 text-left text-[12px] font-medium transition-colors",
                    selectedTemplate === key
                      ? "border-[#4338CA] bg-indigo-50 text-[#4338CA]"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                  )}
                >
                  <Building2 className="h-3.5 w-3.5 shrink-0" />
                  {template.displayName}
                </button>
              ))}
            </div>
          </Card>

          <Card title="Provider Details" subtitle="Enter the courier provider information" className="lg:col-span-2">
            <form onSubmit={handleCreateProvider} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field label="Provider Name (Internal) *" hint="Internal identifier (no spaces).">
                  <input
                    className={inputCls}
                    value={providerForm.name}
                    onChange={(e) => setProviderForm({ ...providerForm, name: e.target.value })}
                    placeholder="e.g., Pathao"
                    required
                  />
                </Field>
                <Field label="Display Name *">
                  <input
                    className={inputCls}
                    value={providerForm.displayName}
                    onChange={(e) => setProviderForm({ ...providerForm, displayName: e.target.value })}
                    placeholder="e.g., Pathao Courier"
                    required
                  />
                </Field>
              </div>

              <Field label="Description">
                <input
                  className={inputCls}
                  value={providerForm.description}
                  onChange={(e) => setProviderForm({ ...providerForm, description: e.target.value })}
                  placeholder="Brief description of the courier service"
                />
              </Field>

              <Field
                label="Authentication Type *"
                hint={
                  providerForm.name.toLowerCase() === "steadfast" && providerForm.authType === "API_KEY"
                    ? "Steadfast's \"API Key\" auth is really a Key + Secret pair — you'll enter both in the next step."
                    : undefined
                }
              >
                <select
                  className={inputCls}
                  value={providerForm.authType}
                  onChange={(e) => setProviderForm({ ...providerForm, authType: e.target.value as CourierAuthType })}
                >
                  <option value="API_KEY">API Key</option>
                  <option value="BEARER">Bearer Token</option>
                  <option value="OAUTH2">OAuth 2.0</option>
                  <option value="BASIC">Basic Auth</option>
                </select>
              </Field>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field label="Production Base URL *">
                  <input
                    className={inputCls}
                    value={providerForm.productionBaseUrl}
                    onChange={(e) => setProviderForm({ ...providerForm, productionBaseUrl: e.target.value })}
                    placeholder="https://api.example.com"
                    required
                  />
                </Field>
                <Field label="Sandbox Base URL (Optional)">
                  <input
                    className={inputCls}
                    value={providerForm.sandboxBaseUrl}
                    onChange={(e) => setProviderForm({ ...providerForm, sandboxBaseUrl: e.target.value })}
                    placeholder="https://api-sandbox.example.com"
                  />
                </Field>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
                <Button type="submit" loading={isCreatingProvider}>
                  {isCreatingProvider ? "Creating..." : "Create Provider & Continue"} <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {step === "credentials" && (provider || isEditing) && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card
            title={isEditing ? `Edit Credentials — ${editingCredential!.environment}` : provider!.displayName}
            subtitle={isEditing ? undefined : provider!.description}
          >
            <div className="space-y-3 text-[12px]">
              {!isEditing && (
                <>
                  <div>
                    <p className="text-[11px] text-slate-500">Provider Name</p>
                    <p className="font-mono text-[12px] text-slate-800">{provider!.name}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-500">Production URL</p>
                    <p className="truncate font-mono text-[11px] text-slate-800">{provider!.productionBaseUrl}</p>
                  </div>
                </>
              )}
              <div>
                <p className="text-[11px] text-slate-500">Auth Type</p>
                <Badge tone="blue">{AUTH_LABEL[authType as CourierAuthType] || authType}</Badge>
              </div>

              {!isEditing && (
                <Field label="Environment *">
                  <select
                    className={inputCls}
                    value={environment}
                    onChange={(e) => setEnvironment(e.target.value as Environment)}
                  >
                    <option value="PRODUCTION">Production</option>
                    <option value="SANDBOX">Sandbox</option>
                  </select>
                </Field>
              )}
              {isSteadfastProvider && (
                <p className="text-[11px] leading-4 text-slate-500">
                  Steadfast has one API for both environments — Sandbox here just stores a separate
                  credential row, it doesn&apos;t hit a different host.
                </p>
              )}

              {isEditing && (
                <Notice tone="violet">
                  Secret fields are intentionally blank. Type a new value to replace the stored
                  secret — leaving a field blank keeps the existing value unchanged.
                </Notice>
              )}
            </div>
          </Card>

          <Card
            title={isEditing ? "Update API Credentials" : "API Credentials"}
            subtitle={
              isEditing
                ? `Editing ${editingCredential!.courier_providers?.displayName || "credential"} — only changed values are sent.`
                : `Enter your ${environment.toLowerCase()} environment credentials for ${provider!.displayName}.`
            }
            className="lg:col-span-2"
          >
            <form onSubmit={handleSaveCredentials} className="space-y-4">
              {authType === "OAUTH2" && (
                <>
                  <Notice tone="violet">
                    OAuth 2.0 authentication requires Client ID, Client Secret, Username, and Password.
                  </Notice>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <Field label="Client ID *">
                      <input
                        className={inputCls}
                        value={credentialsForm.clientId}
                        onChange={(e) => setCredentialsForm({ ...credentialsForm, clientId: e.target.value })}
                        placeholder="Enter Client ID"
                        required={!isEditing}
                        autoComplete="off"
                      />
                    </Field>
                    <SecretField
                      label={isEditing ? "Client Secret (blank = keep current)" : "Client Secret *"}
                      value={credentialsForm.clientSecret}
                      onChange={(v) => setCredentialsForm({ ...credentialsForm, clientSecret: v })}
                      placeholder={isEditing ? "Leave blank to keep current secret" : "Enter Client Secret"}
                      required={!isEditing}
                    />
                    <Field label="Username *">
                      <input
                        className={inputCls}
                        value={credentialsForm.username}
                        onChange={(e) => setCredentialsForm({ ...credentialsForm, username: e.target.value })}
                        placeholder="Enter Username"
                        required={!isEditing}
                        autoComplete="off"
                      />
                    </Field>
                    <SecretField
                      label={isEditing ? "Password (blank = keep current)" : "Password *"}
                      value={credentialsForm.password}
                      onChange={(v) => setCredentialsForm({ ...credentialsForm, password: v })}
                      placeholder={isEditing ? "Leave blank to keep current password" : "Enter Password"}
                      required={!isEditing}
                    />
                    <Field label="Store ID (Optional)">
                      <input
                        className={inputCls}
                        value={credentialsForm.storeId}
                        onChange={(e) => setCredentialsForm({ ...credentialsForm, storeId: e.target.value })}
                        placeholder="Enter Store ID"
                        autoComplete="off"
                      />
                    </Field>
                    <Field label="Merchant ID (Optional)">
                      <input
                        className={inputCls}
                        value={credentialsForm.merchantId}
                        onChange={(e) => setCredentialsForm({ ...credentialsForm, merchantId: e.target.value })}
                        placeholder="Enter Merchant ID"
                        autoComplete="off"
                      />
                    </Field>
                  </div>
                </>
              )}

              {authType === "BEARER" && (
                <>
                  <Notice tone="violet">Bearer Token authentication — enter your API token.</Notice>
                  <SecretField
                    label={isEditing ? "Bearer Token (blank = keep current)" : "Bearer Token *"}
                    value={credentialsForm.bearerToken}
                    onChange={(v) => setCredentialsForm({ ...credentialsForm, bearerToken: v })}
                    placeholder={isEditing ? "Leave blank to keep current token" : "Enter your API bearer token"}
                    required={!isEditing}
                  />
                </>
              )}

              {authType === "API_KEY" && (
                <>
                  <Notice tone="violet">
                    {isSteadfastProvider
                      ? "Steadfast authenticates with an Api-Key and Secret-Key pair, sent as headers on every request."
                      : "API Key authentication — enter your API key."}
                  </Notice>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <SecretField
                      label={isEditing ? "Api-Key (blank = keep current)" : isSteadfastProvider ? "Api-Key *" : "API Key *"}
                      value={credentialsForm.apiKey}
                      onChange={(v) => setCredentialsForm({ ...credentialsForm, apiKey: v })}
                      placeholder={isEditing ? "Leave blank to keep current key" : isSteadfastProvider ? "Enter your Steadfast Api-Key" : "Enter your API key"}
                      required={!isEditing}
                    />
                    {isSteadfastProvider && (
                      <SecretField
                        label={isEditing ? "Secret-Key (blank = keep current)" : "Secret-Key *"}
                        value={credentialsForm.clientSecret}
                        onChange={(v) => setCredentialsForm({ ...credentialsForm, clientSecret: v })}
                        placeholder={isEditing ? "Leave blank to keep current secret" : "Enter your Steadfast Secret-Key"}
                        required={!isEditing}
                        hint={"Stored in the credential's Client Secret column — there's no separate secretKey field on the backend."}
                      />
                    )}
                  </div>
                </>
              )}

              <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                {!isEditing ? (
                  <Button type="button" variant="ghost" size="sm" onClick={() => setShowSecrets(!showSecrets)}>
                    {showSecrets ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    {showSecrets ? "Hide Secrets" : "Show Secrets"}
                  </Button>
                ) : <span />}
                <div className="flex gap-2">
                  {!selectedProvider && !isEditing && (
                    <Button type="button" variant="ghost" onClick={() => setStep("provider")}>
                      <ChevronLeft className="h-3.5 w-3.5" /> Back
                    </Button>
                  )}
                  <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
                  <Button
                    type="submit"
                    loading={isCreatingCredentials || isUpdatingCredentials}
                    disabled={showSecrets ? false : undefined}
                  >
                    {isCreatingCredentials || isUpdatingCredentials
                      ? "Saving..."
                      : isEditing ? "Update Credentials" : "Save Credentials"}
                  </Button>
                </div>
              </div>
            </form>
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
  const [getSteadfastBalance] = useLazySteadfastGetBalanceQuery();
  const [testingId, setTestingId] = useState<string | null>(null);
  const [refreshingId, setRefreshingId] = useState<string | null>(null);
  const [credTab, setCredTab] = useState<"production" | "sandbox">("production");

  const isSteadfast = provider.name.toLowerCase() === "steadfast";

  const handleTest = async (credential: CourierCredential) => {
    setTestingId(credential.id);
    try {
      if (isSteadfast) {
        // courier.controller.ts's testCourierCredentials only implements
        // Pathao/RedX and returns "not implemented" for everything else.
        // Steadfast's balance endpoint is a practical substitute — it
        // fails with a real auth error if the Api-Key/Secret-Key pair is
        // wrong, exactly like a dedicated credential test would.
        const result = await getSteadfastBalance({
          courierProviderId: provider.id,
          environment: credential.environment,
        }).unwrap();
        toast.success("Steadfast credentials are valid!", {
          description: `Current balance: ৳${result.data?.current_balance ?? 0}`,
        });
      } else {
        await testCredentials({ credentialId: credential.id }).unwrap();
        toast.success("Credentials are valid!");
      }
    } catch (error: any) {
      toast.error("Test failed", {
        description: error?.data?.message || error?.data?.error || "Credential test failed",
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
  const activeCredentials = credTab === "production" ? prodCredentials : sandboxCredentials;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Button size="sm" variant="secondary" onClick={onBack}>
            <ChevronLeft className="h-3.5 w-3.5" /> Back
          </Button>
          <h2 className="text-[16px] font-semibold text-slate-900">{provider.displayName}</h2>
          <Badge tone={provider.isActive ? "green" : "slate"} dot>
            {provider.isActive ? "Active" : "Inactive"}
          </Badge>
        </div>
        <Badge tone="blue">{AUTH_LABEL[provider.authType]}</Badge>
      </div>

      {isSteadfast && (
        <Notice tone="violet">
          Steadfast doesn&apos;t have a city/zone/area API like Pathao or RedX — pricing comes from
          a flat-rate pricing rule instead. See the{" "}
          <Link href="/admin-dashboard/courier" className="font-semibold underline">Courier Management</Link>{" "}
          page to check balance, look up a consignment&apos;s status, or place a bulk order.
        </Notice>
      )}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <Card title="Provider Details">
          <dl className="space-y-2 text-[12px]">
            <div>
              <dt className="text-[11px] text-slate-500">Internal Name</dt>
              <dd className="font-mono text-[12px] text-slate-800">{provider.name}</dd>
            </div>
            <div>
              <dt className="text-[11px] text-slate-500">Production URL</dt>
              <dd className="truncate font-mono text-[11px] text-slate-800">{provider.productionBaseUrl}</dd>
            </div>
            {provider.sandboxBaseUrl && (
              <div>
                <dt className="text-[11px] text-slate-500">Sandbox URL</dt>
                <dd className="truncate font-mono text-[11px] text-slate-800">{provider.sandboxBaseUrl}</dd>
              </div>
            )}
          </dl>
        </Card>

        <Card title="Credentials Summary">
          <div className="space-y-2">
            {[
              { label: "Production", rows: prodCredentials.length, tone: "text-emerald-600 bg-emerald-50" },
              { label: "Sandbox", rows: sandboxCredentials.length, tone: "text-sky-600 bg-sky-50" },
            ].map((env) => (
              <div key={env.label} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2">
                <div className="flex items-center gap-2">
                  <span className={cx("grid h-7 w-7 place-items-center rounded-md [&>svg]:h-3.5 [&>svg]:w-3.5", env.tone)}>
                    <Shield />
                  </span>
                  <div>
                    <p className="text-[12px] font-medium text-slate-800">{env.label}</p>
                    <p className="text-[10px] text-slate-500">{env.rows} credential(s)</p>
                  </div>
                </div>
                {env.rows > 0
                  ? <Check className="h-4 w-4 text-emerald-600" />
                  : <XCircle className="h-4 w-4 text-slate-300" />}
              </div>
            ))}
          </div>
        </Card>

        <Card title="Statistics">
          <dl className="space-y-2 text-[12px]">
            <div className="flex justify-between">
              <dt className="text-slate-500">Total Orders</dt>
              <dd className="font-semibold tabular-nums text-slate-800">{provider._count?.courier_orders || 0}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Serviceable Areas</dt>
              <dd className="font-semibold tabular-nums text-slate-800">
                {isSteadfast ? "N/A (flat-rate)" : provider._count?.courier_serviceable_areas || 0}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Priority</dt>
              <dd><Badge tone="slate">{provider.priority}</Badge></dd>
            </div>
          </dl>
        </Card>
      </div>

      <div className="flex items-center gap-1 border-b border-slate-200">
        {(["production", "sandbox"] as const).map((key) => (
          <button
            key={key}
            role="tab"
            aria-selected={credTab === key}
            onClick={() => setCredTab(key)}
            className={cx(
              "relative flex items-center gap-1.5 px-3 pb-2.5 pt-1 text-[13px] font-medium transition-colors",
              credTab === key ? "text-[#4338CA]" : "text-slate-500 hover:text-slate-800"
            )}
          >
            {key === "production" ? "Production Credentials" : "Sandbox Credentials"}
            <span
              aria-hidden
              className={cx(
                "absolute inset-x-1 -bottom-px h-0.5 rounded-full",
                credTab === key ? "bg-[#4338CA]" : "bg-transparent"
              )}
            />
          </button>
        ))}
      </div>

      <CredentialsTable
        credentials={activeCredentials}
        onEdit={onEdit}
        onDelete={onDelete}
        onTest={handleTest}
        onRefreshToken={handleRefreshToken}
        testingId={testingId}
        refreshingId={refreshingId}
      />
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
      <EmptyState
        icon={<Shield />}
        title="No credentials found"
        body="No credentials configured for this environment yet."
      />
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
      <table className={tableCls}>
        <thead>
          <tr>
            <th className={thCls}>Status</th>
            <th className={thCls}>Credentials</th>
            <th className={thCls}>Token Status</th>
            <th className={thCls}>Last Updated</th>
            <th className={`${thCls} text-right`}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {credentials.map((credential) => {
            const isSteadfastCred = credential.courier_providers?.name?.toLowerCase() === "steadfast";
            return (
              <tr key={credential.id} className="transition-colors hover:bg-indigo-50/40">
                <td className={tdCls}>
                  <Badge tone={credential.isActive ? "green" : "slate"} dot>
                    {credential.isActive ? "Active" : "Inactive"}
                  </Badge>
                </td>
                <td className={tdCls}>
                  <div className="space-y-0.5">
                    <code className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-600">
                      {credential.clientId || credential.apiKey || "••••••••"}
                    </code>
                    <p className="text-[11px] text-slate-500">
                      {isSteadfastCred
                        ? credential.clientSecret
                          ? "Secret-Key: configured"
                          : "Secret-Key: missing"
                        : credential.username
                          ? `User: ${credential.username}`
                          : "No username"}
                    </p>
                  </div>
                </td>
                <td className={tdCls}>
                  {isSteadfastCred ? (
                    <span className="flex items-center gap-1.5 text-[12px] text-slate-600">
                      <span aria-hidden className="h-2 w-2 rounded-full bg-sky-500" /> Static key — no token
                    </span>
                  ) : credential.accessToken ? (
                    <span className="flex flex-wrap items-center gap-1.5 text-[12px] text-slate-600">
                      <span aria-hidden className="h-2 w-2 rounded-full bg-emerald-500" /> Valid
                      {credential.tokenExpiresAt && (
                        <span className="text-[11px] text-slate-400">
                          expires {new Date(credential.tokenExpiresAt).toLocaleDateString()}
                        </span>
                      )}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-[12px] text-slate-600">
                      <span aria-hidden className="h-2 w-2 rounded-full bg-slate-400" /> Not authenticated
                    </span>
                  )}
                </td>
                <td className={`${tdCls} text-[12px]`}>
                  <div>{new Date(credential.updatedAt).toLocaleDateString()}</div>
                  <div className="text-[11px] text-slate-400">
                    {new Date(credential.updatedAt).toLocaleTimeString()}
                  </div>
                </td>
                <td className={tdCls}>
                  <div className="flex justify-end gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      title={isSteadfastCred ? "Test by checking balance" : "Test credentials"}
                      onClick={() => onTest(credential)}
                      loading={testingId === credential.id}
                    >
                      <TestTube className="h-3.5 w-3.5" />
                    </Button>
                    {credential.courier_providers?.authType === "OAUTH2" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        title="Refresh OAuth token"
                        onClick={() => onRefreshToken(credential)}
                        loading={refreshingId === credential.id}
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" title="Edit credentials" onClick={() => onEdit(credential)}>
                      <PencilLine className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="sm" variant="danger" title="Delete credentials" onClick={() => onDelete(credential)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ==================== DELETE CONFIRMATION ====================
function DeleteCredentialModal({
  credential,
  onClose,
  onSuccess,
}: {
  credential: CourierCredential | null;
  onClose: () => void;
  onSuccess?: () => void;
}) {
  const [deleteCredentials, { isLoading }] = useDeleteCourierCredentialsMutation();

  const handleDelete = async () => {
    if (!credential) return;
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
    <Modal
      open={Boolean(credential)}
      title="Delete credentials?"
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="danger" loading={isLoading} onClick={handleDelete}>Delete</Button>
        </>
      }
    >
      <p className="text-[13px] leading-5 text-slate-600">
        This will permanently delete these credentials. All active courier operations using these
        credentials will fail. This action cannot be undone.
      </p>
    </Modal>
  );
}
