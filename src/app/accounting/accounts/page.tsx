// src/app/accounting/accounts/page.tsx
"use client";

import React, { useMemo, useState } from "react";
import {
  useGetChartOfAccountsQuery,
  useCreateChartOfAccountMutation,
  useUpdateChartOfAccountMutation,
  useDeleteChartOfAccountMutation,
} from "@/features/accountingApi";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  MoreVertical,
  Search,
  Download,
  Save,
  X,
  AlertCircle,
  BarChart3,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";

interface AccountFormData {
  name: string;
  accountClass: string;
  accountType: string;
  group?: string;
  entityType: string;
}

interface ValidationErrors {
  name?: boolean;
  accountClass?: boolean;
  accountType?: boolean;
}

type SortField = "code" | "name" | "accountClass" | "accountType" | "nature";
type SortDirection = "asc" | "desc";

// ============================================
// STYLE MAPS — dark cyan/blue glass theme
// ============================================

const CLASS_STYLES: Record<string, string> = {
  ASSET: "bg-sky-400/10 text-sky-300 border-sky-400/25",
  LIABILITY: "bg-rose-400/10 text-rose-300 border-rose-400/25",
  EQUITY: "bg-emerald-400/10 text-emerald-300 border-emerald-400/25",
  INCOME: "bg-indigo-400/10 text-indigo-300 border-indigo-400/25",
  EXPENSE: "bg-amber-400/10 text-amber-300 border-amber-400/25",
};

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

const glassCard = "rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md";
const darkField =
  "border-white/10 bg-white/5 text-white placeholder:text-white/30 focus-visible:ring-cyan-400/50 focus-visible:border-cyan-400/40";
const errorField = "border-rose-400/50 bg-rose-400/5 text-white focus-visible:ring-rose-400/50";
const dialogSurface = "bg-slate-900 border border-white/10 text-white";

export default function AccountsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [accountClassFilter, setAccountClassFilter] = useState<string>("all");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const [sortField, setSortField] = useState<SortField>("code");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Form state
  const [formData, setFormData] = useState<AccountFormData>({
    name: "",
    accountClass: "",
    accountType: "",
    group: "",
    entityType: "ADMIN",
  });

  // Get current entity from user context
  const currentUser = { role: "ADMIN" }; // Replace with actual user context
  const entityType = currentUser.role === "VENDOR" ? "VENDOR" : "ADMIN";
  const entityId = currentUser.role === "VENDOR" ? "vendor-id" : undefined;

  // Fetch accounts
  const { data: accountsResponse, isLoading, refetch } = useGetChartOfAccountsQuery(
    { entityType, entityId },
    { skip: !entityType }
  );

  // Mutations
  const [createAccount, { isLoading: isCreating }] = useCreateChartOfAccountMutation();
  const [updateAccount] = useUpdateChartOfAccountMutation();
  const [deleteAccount] = useDeleteChartOfAccountMutation();

  const accounts = accountsResponse?.data || [];

  const accountClasses = [
    { value: "ASSET", label: "Assets" },
    { value: "LIABILITY", label: "Liabilities" },
    { value: "EQUITY", label: "Equity" },
    { value: "INCOME", label: "Income" },
    { value: "EXPENSE", label: "Expenses" },
  ];

  const getAccountTypesByClass = (accountClass: string) => {
    switch (accountClass) {
      case "ASSET":
        return [
          { value: "CURRENT_ASSET", label: "Current Asset" },
          { value: "FIXED_ASSET", label: "Fixed Asset" },
          { value: "NON_CURRENT_ASSET", label: "Non-Current Asset" },
        ];
      case "LIABILITY":
        return [
          { value: "CURRENT_LIABILITY", label: "Current Liability" },
          { value: "NON_CURRENT_LIABILITY", label: "Non-Current Liability" },
        ];
      case "EQUITY":
        return [{ value: "EQUITY", label: "Equity" }];
      case "INCOME":
        return [{ value: "INCOME", label: "Income" }];
      case "EXPENSE":
        return [{ value: "EXPENSE", label: "Expense" }];
      default:
        return [];
    }
  };

  const accountGroups = [
    { value: "CASH_AND_BANK", label: "Cash & Bank", class: "ASSET" },
    { value: "ACCOUNTS_RECEIVABLE", label: "Accounts Receivable", class: "ASSET" },
    { value: "FIXED_ASSETS", label: "Fixed Assets", class: "ASSET" },
    { value: "INVESTMENT", label: "Investment", class: "ASSET" },
    { value: "ACCOUNTS_PAYABLE", label: "Accounts Payable", class: "LIABILITY" },
    { value: "EXPENSE_LIABILITIES", label: "Expense Liabilities", class: "LIABILITY" },
    { value: "STATUTORY", label: "Statutory", class: "LIABILITY" },
    { value: "LOANS", label: "Loans", class: "LIABILITY" },
    { value: "ADMIN_EXPENSE", label: "Admin Expense", class: "EXPENSE" },
    { value: "DIRECT_EXPENSE", label: "Direct Expense", class: "EXPENSE" },
    { value: "OPERATING_EXPENSE", label: "Operating Expense", class: "EXPENSE" },
    { value: "NON_CASH_EXPENSE", label: "Non-Cash Expense", class: "EXPENSE" },
  ];

  const getGroupsByClass = (accountClass: string) => {
    return accountGroups.filter((g) => g.class === accountClass);
  };

  const getAccountClassPrefix = (accountClass: string) => {
    switch (accountClass) {
      case "ASSET": return "AS";
      case "LIABILITY": return "LI";
      case "EQUITY": return "EQ";
      case "INCOME": return "IN";
      case "EXPENSE": return "EX";
      default: return "";
    }
  };

  const getDisplayName = () => {
    if (!formData.accountClass || !formData.name.trim()) return "";
    const prefix = getAccountClassPrefix(formData.accountClass);
    return `${prefix}: ${formData.name}`;
  };

  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};
    if (!formData.name.trim()) errors.name = true;
    if (!formData.accountClass) errors.accountClass = true;
    if (!formData.accountType) errors.accountType = true;
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ── Filter, sort, paginate ────────────────────────────────────────────────
  const filteredAccounts = useMemo(() => {
    return accounts.filter((account) => {
      const matchesSearch =
        searchTerm === "" ||
        account.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        account.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesClass = accountClassFilter === "all" || account.accountClass === accountClassFilter;
      return matchesSearch && matchesClass;
    });
  }, [accounts, searchTerm, accountClassFilter]);

  const sortedAccounts = useMemo(() => {
    const sorted = [...filteredAccounts].sort((a, b) => {
      const aVal = String(a[sortField] ?? "").toLowerCase();
      const bVal = String(b[sortField] ?? "").toLowerCase();
      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [filteredAccounts, sortField, sortDirection]);

  const totalPages = Math.max(1, Math.ceil(sortedAccounts.length / pageSize));
  const paginatedAccounts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedAccounts.slice(start, start + pageSize);
  }, [sortedAccounts, currentPage, pageSize]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
    setCurrentPage(1);
  };

  const SortHeader = ({ field, label, className = "" }: { field: SortField; label: string; className?: string }) => {
    const isActive = sortField === field;
    return (
      <th
        onClick={() => handleSort(field)}
        className={`select-none cursor-pointer whitespace-nowrap px-4 py-3 text-left text-xs font-bold text-white/40 hover:bg-white/5 hover:text-white/60 transition-colors ${className}`}
      >
        <span className="inline-flex items-center gap-1.5">
          {label}
          <span className="flex flex-col -space-y-1">
            <ChevronUp
              size={11}
              className={isActive && sortDirection === "asc" ? "text-cyan-300" : "text-white/15"}
            />
            <ChevronDown
              size={11}
              className={isActive && sortDirection === "desc" ? "text-cyan-300" : "text-white/15"}
            />
          </span>
        </span>
      </th>
    );
  };

  // ── Mutations ──────────────────────────────────────────────────────────────
  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setHasAttemptedSubmit(true);

    if (!validateForm()) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      await createAccount({
        name: formData.name.trim(),
        accountClass: formData.accountClass,
        accountType: formData.accountType,
        group: formData.group || undefined,
        nature: formData.accountClass,
        entityType,
        entityId,
        isSystem: false,
      }).unwrap();

      toast.success("Account created successfully");
      resetForm();
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to create account");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      accountClass: "",
      accountType: "",
      group: "",
      entityType: "ADMIN",
    });
    setValidationErrors({});
    setHasAttemptedSubmit(false);
    setShowCreateForm(false);
    refetch();
  };

  const handleChange = (field: keyof AccountFormData, value: any) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === "accountClass") {
        const types = getAccountTypesByClass(value);
        updated.accountType = types[0]?.value || "";
        updated.group = "";
      }
      return updated;
    });

    if (hasAttemptedSubmit && validationErrors[field as keyof ValidationErrors]) {
      setValidationErrors((prev) => ({ ...prev, [field]: false }));
    }
  };

  const handleDeleteAccount = async () => {
    if (!selectedAccount) return;
    try {
      await deleteAccount(selectedAccount.id).unwrap();
      toast.success("Account deleted successfully");
      setIsDeleteDialogOpen(false);
      refetch();
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to delete account");
    }
  };

  const getAccountClassColor = (accountClass: string) =>
    CLASS_STYLES[accountClass] || "bg-white/5 text-white/50 border-white/15";

  const renderAccountActions = (account: any) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-white/50 hover:bg-white/10 hover:text-white rounded-lg">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 bg-slate-900 border border-white/10 text-white/80">
        <DropdownMenuLabel className="text-white/40 text-xs">Actions</DropdownMenuLabel>
        <DropdownMenuItem className="cursor-pointer focus:bg-white/10 focus:text-white">
          <Eye className="h-4 w-4 mr-2 text-white/50" />
          View Details
        </DropdownMenuItem>
        <DropdownMenuItem
          className="cursor-pointer focus:bg-white/10 focus:text-white"
          onClick={() => setSelectedAccount(account)}
        >
          <Edit className="h-4 w-4 mr-2 text-cyan-300" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-white/10" />
        <DropdownMenuItem
          className="text-rose-400 cursor-pointer focus:text-rose-300 focus:bg-rose-400/10"
          onClick={() => {
            setSelectedAccount(account);
            setIsDeleteDialogOpen(true);
          }}
          disabled={account.isSystem || !account.canDelete}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  if (isLoading) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-slate-950">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-cyan-950" />
        <div className="relative flex flex-col items-center justify-center h-screen gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-white/10 border-t-cyan-400" />
          <span className="text-sm text-white/35 font-medium">Loading accounts...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950">
      {/* Background — matches sidebar, dashboard & vouchers */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-cyan-950" />
      <div className="absolute -top-24 -left-16 w-72 h-72 rounded-full bg-cyan-500/20 blur-[100px]" />
      <div className="absolute top-1/3 -right-24 w-80 h-80 rounded-full bg-blue-600/15 blur-[110px]" />
      <div className="absolute bottom-0 left-1/3 w-64 h-64 rounded-full bg-cyan-400/10 blur-[90px]" />

      <div className="relative max-w-screen-xl mx-auto p-4 sm:p-6 space-y-5">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/30 shrink-0">
              <BarChart3 size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">
                Chart of Accounts
              </h1>
              <p className="text-xs sm:text-sm text-white/35 mt-0.5">
                Manage your accounting accounts and categories
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 md:flex-none border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white rounded-lg"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>

            <Button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className={
                showCreateForm
                  ? "flex-1 md:flex-none border border-white/10 bg-white/5 text-white/70 hover:bg-white/10 rounded-lg"
                  : "flex-1 md:flex-none bg-gradient-to-r from-cyan-400 to-blue-500 hover:opacity-90 text-white border-0 shadow-lg shadow-cyan-500/30 rounded-lg"
              }
            >
              {showCreateForm ? (
                <>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  New Account
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Inline Create Form */}
        {showCreateForm && (
          <Card className={`${glassCard} overflow-hidden`}>
            <CardHeader className="border-b border-white/10">
              <CardTitle className="text-white">Create New Account</CardTitle>
              <CardDescription className="text-white/35">
                Add a new account to your chart of accounts. Code will be auto-generated.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleCreateAccount}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                  <div className="space-y-2">
                    <Label htmlFor="accountClass" className="text-white/50 font-semibold text-xs uppercase tracking-wider">
                      Account Class <span className="text-rose-400">*</span>
                    </Label>
                    <Select
                      value={formData.accountClass}
                      onValueChange={(value) => handleChange("accountClass", value)}
                    >
                      <SelectTrigger
                        className={`rounded-lg ${
                          hasAttemptedSubmit && validationErrors.accountClass ? errorField : darkField
                        }`}
                      >
                        <SelectValue placeholder="Select class" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-white/10 text-white">
                        {accountClasses.map((cls) => (
                          <SelectItem key={cls.value} value={cls.value}>
                            {cls.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {hasAttemptedSubmit && validationErrors.accountClass && (
                      <div className="flex items-center gap-1 text-rose-400 text-xs mt-1">
                        <AlertCircle className="h-3 w-3" />
                        <span>Account class is required</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-white/50 font-semibold text-xs uppercase tracking-wider">
                      Account Name <span className="text-rose-400">*</span>
                    </Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleChange("name", e.target.value)}
                      placeholder="e.g., Cash in Hand"
                      className={`rounded-lg ${hasAttemptedSubmit && validationErrors.name ? errorField : darkField}`}
                    />
                    {hasAttemptedSubmit && validationErrors.name && (
                      <div className="flex items-center gap-1 text-rose-400 text-xs mt-1">
                        <AlertCircle className="h-3 w-3" />
                        <span>Account name is required</span>
                      </div>
                    )}
                    {formData.accountClass && formData.name && (
                      <div className="text-xs text-cyan-300 font-semibold mt-1">
                        Preview: {getDisplayName()}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="accountType" className="text-white/50 font-semibold text-xs uppercase tracking-wider">
                      Account Type <span className="text-rose-400">*</span>
                    </Label>
                    <Select
                      value={formData.accountType}
                      onValueChange={(value) => handleChange("accountType", value)}
                      disabled={!formData.accountClass}
                    >
                      <SelectTrigger
                        className={`rounded-lg ${
                          hasAttemptedSubmit && validationErrors.accountType ? errorField : darkField
                        }`}
                      >
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-white/10 text-white">
                        {getAccountTypesByClass(formData.accountClass).map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {hasAttemptedSubmit && validationErrors.accountType && (
                      <div className="flex items-center gap-1 text-rose-400 text-xs mt-1">
                        <AlertCircle className="h-3 w-3" />
                        <span>Account type is required</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="group" className="text-white/50 font-semibold text-xs uppercase tracking-wider">
                      Group <span className="text-white/25 text-xs normal-case">(Optional)</span>
                    </Label>
                    <Select
                      value={formData.group || "none"}
                      onValueChange={(value) => handleChange("group", value === "none" ? "" : value)}
                      disabled={!formData.accountClass}
                    >
                      <SelectTrigger className={`rounded-lg ${darkField}`}>
                        <SelectValue placeholder="Select group" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-white/10 text-white">
                        <SelectItem value="none">No Group</SelectItem>
                        {getGroupsByClass(formData.accountClass).map((group) => (
                          <SelectItem key={group.value} value={group.value}>
                            {group.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetForm}
                    className="border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white rounded-lg"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isCreating}
                    className="bg-gradient-to-r from-cyan-400 to-blue-500 hover:opacity-90 text-white border-0 shadow-lg shadow-cyan-500/30 rounded-lg"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {isCreating ? "Creating..." : "Create Account"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <Card className={glassCard}>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
              <div className="relative w-full sm:max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                <Input
                  placeholder="Search by code or name..."
                  className={`pl-9 rounded-lg ${darkField}`}
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>

              <div className="flex items-center gap-3">
                <Select
                  value={accountClassFilter}
                  onValueChange={(v) => {
                    setAccountClassFilter(v);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className={`w-full sm:w-[160px] rounded-lg ${darkField}`}>
                    <SelectValue placeholder="Account Class" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-white/10 text-white">
                    <SelectItem value="all">All Classes</SelectItem>
                    {accountClasses.map((cls) => (
                      <SelectItem key={cls.value} value={cls.value}>
                        {cls.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={String(pageSize)}
                  onValueChange={(v) => {
                    setPageSize(Number(v));
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className={`w-[110px] rounded-lg ${darkField}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-white/10 text-white">
                    {PAGE_SIZE_OPTIONS.map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        {n} / page
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Accounts Table — desktop, sortable */}
        <Card className={`${glassCard} hidden md:block overflow-hidden`}>
          <CardHeader className="border-b border-white/10">
            <CardTitle className="text-white">All Accounts</CardTitle>
            <CardDescription className="text-white/35">
              {sortedAccounts.length} {sortedAccounts.length === 1 ? "account" : "accounts"} found
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] border-collapse">
                <thead>
                  <tr className="border-b border-white/10">
                    <SortHeader field="code" label="Code" />
                    <SortHeader field="name" label="Account Name" />
                    <SortHeader field="accountClass" label="Class" />
                    <SortHeader field="accountType" label="Type" />
                    <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-bold text-white/40">
                      Group
                    </th>
                    <SortHeader field="nature" label="Nature" />
                    <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-bold text-white/40">
                      Status
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-bold text-white/40">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedAccounts.map((account, index) => (
                    <tr
                      key={account.id}
                      className={`${index % 2 === 0 ? "bg-transparent" : "bg-white/[0.02]"} border-b border-white/5 hover:bg-cyan-400/5 transition-colors`}
                    >
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-xs font-semibold text-white/45">
                        {account.code}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-medium text-white/80">
                          <span className="text-cyan-300/70 font-mono mr-1 text-xs">
                            {account.accountClass ? `${getAccountClassPrefix(account.accountClass)}:` : ""}
                          </span>
                          {account.name}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <Badge className={`${getAccountClassColor(account.accountClass)} font-semibold border rounded-full`}>
                          {account.accountClass}
                        </Badge>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span className="text-xs text-white/45 font-medium">
                          {account.accountType?.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        {account.group ? (
                          <span className="text-xs text-white/45">{account.group.replace(/_/g, " ")}</span>
                        ) : (
                          <span className="text-xs text-white/20">-</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <Badge variant="outline" className="border-white/15 bg-white/5 text-white/50 rounded-full font-medium">
                          {account.nature}
                        </Badge>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <Badge
                          className={
                            account.isActive
                              ? "bg-emerald-400/10 text-emerald-300 border border-emerald-400/25 rounded-full font-semibold"
                              : "bg-white/5 text-white/40 border border-white/15 rounded-full font-semibold"
                          }
                        >
                          {account.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right">{renderAccountActions(account)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {sortedAccounts.length === 0 && <EmptyState />}

            {sortedAccounts.length > 0 && (
              <PaginationFooter
                currentPage={currentPage}
                totalPages={totalPages}
                pageSize={pageSize}
                totalItems={sortedAccounts.length}
                onPrev={() => setCurrentPage((p) => Math.max(1, p - 1))}
                onNext={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              />
            )}
          </CardContent>
        </Card>

        {/* Accounts — mobile card list */}
        <div className="md:hidden space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-sm font-bold text-white/70">All Accounts</span>
            <span className="text-xs text-white/35">
              {sortedAccounts.length} {sortedAccounts.length === 1 ? "account" : "accounts"}
            </span>
          </div>

          {sortedAccounts.length === 0 ? (
            <Card className={glassCard}>
              <CardContent className="p-0">
                <EmptyState />
              </CardContent>
            </Card>
          ) : (
            paginatedAccounts.map((account) => (
              <Card key={account.id} className={glassCard}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3 mb-2.5">
                    <div className="min-w-0">
                      <p className="font-mono text-xs font-semibold text-white/40">{account.code}</p>
                      <p className="text-sm font-medium text-white/85 mt-0.5">
                        <span className="text-cyan-300/70 font-mono mr-1 text-xs">
                          {account.accountClass ? `${getAccountClassPrefix(account.accountClass)}:` : ""}
                        </span>
                        {account.name}
                      </p>
                    </div>
                    {renderAccountActions(account)}
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap mb-2">
                    <Badge className={`${getAccountClassColor(account.accountClass)} font-semibold border rounded-full`}>
                      {account.accountClass}
                    </Badge>
                    <Badge variant="outline" className="border-white/15 bg-white/5 text-white/50 rounded-full font-medium">
                      {account.nature}
                    </Badge>
                    <Badge
                      className={
                        account.isActive
                          ? "bg-emerald-400/10 text-emerald-300 border border-emerald-400/25 rounded-full font-semibold"
                          : "bg-white/5 text-white/40 border border-white/15 rounded-full font-semibold"
                      }
                    >
                      {account.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between text-xs text-white/40">
                    <span>{account.accountType?.replace(/_/g, " ")}</span>
                    <span>{account.group ? account.group.replace(/_/g, " ") : "No group"}</span>
                  </div>
                </CardContent>
              </Card>
            ))
          )}

          {sortedAccounts.length > 0 && (
            <Card className={glassCard}>
              <CardContent className="p-4">
                <PaginationFooter
                  currentPage={currentPage}
                  totalPages={totalPages}
                  pageSize={pageSize}
                  totalItems={sortedAccounts.length}
                  onPrev={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  onNext={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  compact
                />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent className={dialogSurface}>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-rose-400">
                <AlertCircle className="h-5 w-5" />
                Are you absolutely sure?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-white/50">
                This will permanently delete the account{" "}
                <strong className="text-white">{selectedAccount?.name}</strong>. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteAccount}
                className="bg-rose-500 hover:bg-rose-600 text-white"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

// ============================================
// Empty state
// ============================================

function EmptyState() {
  return (
    <div className="text-center py-16 px-4">
      <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-3">
        <BarChart3 size={20} className="text-white/25" />
      </div>
      <div className="text-white/60 text-sm font-semibold mb-1">No accounts found</div>
      <p className="text-xs text-white/30">Create your first account to get started.</p>
    </div>
  );
}

// ============================================
// Pagination footer — shared by desktop table and mobile list
// ============================================

function PaginationFooter({
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  onPrev,
  onNext,
  compact = false,
}: {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  onPrev: () => void;
  onNext: () => void;
  compact?: boolean;
}) {
  const rangeStart = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const rangeEnd = totalItems === 0 ? 0 : Math.min(currentPage * pageSize, totalItems);

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-3 ${
        compact ? "" : "border-t border-white/10 px-4 py-3"
      }`}
    >
      <span className="text-xs text-white/40">
        Showing <span className="font-semibold text-white/70">{rangeStart}-{rangeEnd}</span> of{" "}
        <span className="font-semibold text-white/70">{totalItems}</span>
      </span>
      <div className="flex items-center gap-1.5">
        <Button
          variant="outline"
          size="sm"
          className="rounded-lg border-white/10 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white text-xs h-8 disabled:opacity-30"
          disabled={currentPage === 1}
          onClick={onPrev}
        >
          Prev
        </Button>
        <span className="text-xs text-white/40 px-2">
          {currentPage} / {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          className="rounded-lg border-white/10 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white text-xs h-8 disabled:opacity-30"
          disabled={currentPage === totalPages}
          onClick={onNext}
        >
          Next
        </Button>
      </div>
    </div>
  );
}