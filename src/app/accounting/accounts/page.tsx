// src/app/accounting/accounts/page.tsx
"use client";

import React, { useState } from "react";
import { 
  useGetChartOfAccountsQuery, 
  useCreateChartOfAccountMutation, 
  useUpdateChartOfAccountMutation, 
  useDeleteChartOfAccountMutation 
} from "@/features/accountingApi";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Eye, MoreVertical, Search, Filter, Download, Save, X, AlertCircle } from "lucide-react";
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

export default function AccountsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [accountClassFilter, setAccountClassFilter] = useState<string>("all");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  
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
  
  // Account class options (top level categories)
  const accountClasses = [
    { value: "ASSET", label: "Assets" },
    { value: "LIABILITY", label: "Liabilities" },
    { value: "EQUITY", label: "Equity" },
    { value: "INCOME", label: "Income" },
    { value: "EXPENSE", label: "Expenses" },
  ];
  
  // Account type options (sub-categories based on class)
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
  
  // Account group options
  const accountGroups = [
    // Asset groups
    { value: "CASH_AND_BANK", label: "Cash & Bank", class: "ASSET" },
    { value: "ACCOUNTS_RECEIVABLE", label: "Accounts Receivable", class: "ASSET" },
    { value: "FIXED_ASSETS", label: "Fixed Assets", class: "ASSET" },
    { value: "INVESTMENT", label: "Investment", class: "ASSET" },
    
    // Liability groups
    { value: "ACCOUNTS_PAYABLE", label: "Accounts Payable", class: "LIABILITY" },
    { value: "EXPENSE_LIABILITIES", label: "Expense Liabilities", class: "LIABILITY" },
    { value: "STATUTORY", label: "Statutory", class: "LIABILITY" },
    { value: "LOANS", label: "Loans", class: "LIABILITY" },
    
    // Expense groups
    { value: "ADMIN_EXPENSE", label: "Admin Expense", class: "EXPENSE" },
    { value: "DIRECT_EXPENSE", label: "Direct Expense", class: "EXPENSE" },
    { value: "OPERATING_EXPENSE", label: "Operating Expense", class: "EXPENSE" },
    { value: "NON_CASH_EXPENSE", label: "Non-Cash Expense", class: "EXPENSE" },
  ];
  
  const getGroupsByClass = (accountClass: string) => {
    return accountGroups.filter(g => g.class === accountClass);
  };
  
  // Get account class prefix
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
  
  // Get display name with prefix
  const getDisplayName = () => {
    if (!formData.accountClass || !formData.name.trim()) return "";
    const prefix = getAccountClassPrefix(formData.accountClass);
    return `${prefix}: ${formData.name}`;
  };
  
  // Validate form
  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};
    
    if (!formData.name.trim()) {
      errors.name = true;
    }
    
    if (!formData.accountClass) {
      errors.accountClass = true;
    }
    
    if (!formData.accountType) {
      errors.accountType = true;
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // Filter accounts
  const filteredAccounts = accounts.filter(account => {
    const matchesSearch = searchTerm === "" || 
      account.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesClass = accountClassFilter === "all" || account.accountClass === accountClassFilter;
    
    return matchesSearch && matchesClass;
  });
  
  // Handle create account
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
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      
      // Reset account type when class changes
      if (field === "accountClass") {
        const types = getAccountTypesByClass(value);
        updated.accountType = types[0]?.value || "";
        updated.group = ""; // Reset group too
      }
      
      return updated;
    });
    
    // Clear validation error for this field
    if (hasAttemptedSubmit && validationErrors[field as keyof ValidationErrors]) {
      setValidationErrors(prev => ({
        ...prev,
        [field]: false
      }));
    }
  };
  
  // Handle update account
  const handleUpdateAccount = async (formData: Partial<AccountFormData>) => {
    if (!selectedAccount) return;
    
    try {
      await updateAccount({
        id: selectedAccount.id,
        data: formData,
      }).unwrap();
      
      toast.success("Account updated successfully");
      setIsEditDialogOpen(false);
      refetch();
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to update account");
    }
  };
  
  // Handle delete account
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
  
  // Get account class badge color
  const getAccountClassColor = (accountClass: string) => {
    switch (accountClass) {
      case "ASSET": return "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300 border-teal-200";
      case "LIABILITY": return "bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-300 border-rose-200";
      case "EQUITY": return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300 border-emerald-200";
      case "INCOME": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 border-blue-200";
      case "EXPENSE": return "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300 border-amber-200";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border-gray-200";
    }
  };
  
  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            Chart of Accounts
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage your accounting accounts and categories
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="border-gray-300 hover:bg-gray-50">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          
          <Button 
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-teal-600 hover:bg-teal-700 text-white"
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
        <Card className="border-teal-200 shadow-lg">
          <CardHeader className="bg-teal-50 dark:bg-teal-950 border-b border-teal-100">
            <CardTitle className="text-teal-900 dark:text-teal-100">Create New Account</CardTitle>
            <CardDescription className="text-teal-700 dark:text-teal-300">
              Add a new account to your chart of accounts. Code will be auto-generated.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleCreateAccount}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                {/* Account Class */}
                <div className="space-y-2">
                  <Label htmlFor="accountClass" className="text-gray-700 dark:text-gray-300 font-medium">
                    Account Class <span className="text-rose-500">*</span>
                  </Label>
                  <Select
                    value={formData.accountClass}
                    onValueChange={(value) => handleChange("accountClass", value)}
                  >
                    <SelectTrigger 
                      className={`${
                        hasAttemptedSubmit && validationErrors.accountClass
                          ? "border-rose-500 focus:ring-rose-500"
                          : "border-gray-300 focus:ring-teal-500"
                      }`}
                    >
                      <SelectValue placeholder="Select class" />
                    </SelectTrigger>
                    <SelectContent>
                      {accountClasses.map((cls) => (
                        <SelectItem key={cls.value} value={cls.value}>
                          {cls.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {hasAttemptedSubmit && validationErrors.accountClass && (
                    <div className="flex items-center gap-1 text-rose-600 text-sm mt-1">
                      <AlertCircle className="h-3 w-3" />
                      <span>Account class is required</span>
                    </div>
                  )}
                </div>
                
                {/* Account Name */}
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-gray-700 dark:text-gray-300 font-medium">
                    Account Name <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    placeholder="e.g., Cash in Hand"
                    className={`${
                      hasAttemptedSubmit && validationErrors.name
                        ? "border-rose-500 focus-visible:ring-rose-500"
                        : "border-gray-300 focus-visible:ring-teal-500"
                    }`}
                  />
                  {hasAttemptedSubmit && validationErrors.name && (
                    <div className="flex items-center gap-1 text-rose-600 text-sm mt-1">
                      <AlertCircle className="h-3 w-3" />
                      <span>Account name is required</span>
                    </div>
                  )}
                  {formData.accountClass && formData.name && (
                    <div className="text-sm text-teal-600 dark:text-teal-400 font-medium mt-1">
                      Preview: {getDisplayName()}
                    </div>
                  )}
                </div>
                
                {/* Account Type */}
                <div className="space-y-2">
                  <Label htmlFor="accountType" className="text-gray-700 dark:text-gray-300 font-medium">
                    Account Type <span className="text-rose-500">*</span>
                  </Label>
                  <Select
                    value={formData.accountType}
                    onValueChange={(value) => handleChange("accountType", value)}
                    disabled={!formData.accountClass}
                  >
                    <SelectTrigger 
                      className={`${
                        hasAttemptedSubmit && validationErrors.accountType
                          ? "border-rose-500 focus:ring-rose-500"
                          : "border-gray-300 focus:ring-teal-500"
                      }`}
                    >
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {getAccountTypesByClass(formData.accountClass).map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {hasAttemptedSubmit && validationErrors.accountType && (
                    <div className="flex items-center gap-1 text-rose-600 text-sm mt-1">
                      <AlertCircle className="h-3 w-3" />
                      <span>Account type is required</span>
                    </div>
                  )}
                </div>
                
                {/* Group */}
                <div className="space-y-2">
                  <Label htmlFor="group" className="text-gray-700 dark:text-gray-300 font-medium">
                    Group <span className="text-gray-400 text-xs">(Optional)</span>
                  </Label>
                  <Select
                    value={formData.group || "none"}
                    onValueChange={(value) => handleChange("group", value === "none" ? "" : value)}
                    disabled={!formData.accountClass}
                  >
                    <SelectTrigger className="border-gray-300 focus:ring-teal-500">
                      <SelectValue placeholder="Select group" />
                    </SelectTrigger>
                    <SelectContent>
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
              
              {/* Form Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                  className="border-gray-300 hover:bg-gray-50"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isCreating}
                  className="bg-teal-600 hover:bg-teal-700 text-white"
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
      <Card className="border-gray-200 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by code or name..."
                  className="pl-10 border-gray-300 focus-visible:ring-teal-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <Select value={accountClassFilter} onValueChange={setAccountClassFilter}>
              <SelectTrigger className="w-[180px] border-gray-300 focus:ring-teal-500">
                <SelectValue placeholder="Account Class" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {accountClasses.map(cls => (
                  <SelectItem key={cls.value} value={cls.value}>
                    {cls.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button variant="outline" size="icon" className="border-gray-300 hover:bg-gray-50">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Accounts Table */}
      <Card className="border-gray-200 shadow-sm">
        <CardHeader className="bg-teal-50 dark:bg-teal-950 border-b border-teal-100">
          <CardTitle className="text-teal-900 dark:text-teal-100">All Accounts</CardTitle>
          <CardDescription className="text-teal-700 dark:text-teal-300">
            {filteredAccounts.length} {filteredAccounts.length === 1 ? 'account' : 'accounts'} found
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-100 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800 border-b-2 border-gray-200">
                  <TableHead className="font-bold text-gray-700 dark:text-gray-300 w-[140px]">
                    Code
                  </TableHead>
                  <TableHead className="font-bold text-gray-700 dark:text-gray-300 min-w-[250px]">
                    Account Name
                  </TableHead>
                  <TableHead className="font-bold text-gray-700 dark:text-gray-300 w-[140px]">
                    Class
                  </TableHead>
                  <TableHead className="font-bold text-gray-700 dark:text-gray-300 w-[180px]">
                    Type
                  </TableHead>
                  <TableHead className="font-bold text-gray-700 dark:text-gray-300 w-[180px]">
                    Group
                  </TableHead>
                  <TableHead className="font-bold text-gray-700 dark:text-gray-300 w-[120px]">
                    Nature
                  </TableHead>
                  <TableHead className="font-bold text-gray-700 dark:text-gray-300 w-[100px]">
                    Status
                  </TableHead>
                  <TableHead className="text-right font-bold text-gray-700 dark:text-gray-300 w-[80px]">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAccounts.map((account, index) => (
                  <TableRow 
                    key={account.id}
                    className={`
                      ${index % 2 === 0 
                        ? 'bg-white dark:bg-gray-950' 
                        : 'bg-gray-50 dark:bg-gray-900'
                      }
                      hover:bg-teal-50 dark:hover:bg-teal-950 transition-colors border-b border-gray-100
                    `}
                  >
                    <TableCell className="font-mono font-semibold text-sm text-teal-700 dark:text-teal-400">
                      {account.code}
                    </TableCell>
                    <TableCell>
                      <div className="font-semibold text-gray-900 dark:text-gray-100">
                        <span className="text-teal-600 dark:text-teal-400 font-mono mr-1">
                          {account.accountClass ? `${getAccountClassPrefix(account.accountClass)}:` : ''}
                        </span>
                        {account.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${getAccountClassColor(account.accountClass)} font-medium border`}>
                        {account.accountClass}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                        {account.accountType.replace(/_/g, ' ')}
                      </span>
                    </TableCell>
                    <TableCell>
                      {account.group ? (
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {account.group.replace(/_/g, ' ')}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-gray-300 text-gray-700 dark:text-gray-300">
                        {account.nature}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={account.isActive ? "default" : "secondary"}
                        className={account.isActive 
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-900 dark:text-emerald-300" 
                          : "bg-gray-200 text-gray-700 border border-gray-300"
                        }
                      >
                        {account.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="h-8 w-8 hover:bg-teal-100 dark:hover:bg-teal-900"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuLabel className="text-gray-700">Actions</DropdownMenuLabel>
                          <DropdownMenuItem className="cursor-pointer">
                            <Eye className="h-4 w-4 mr-2 text-gray-600" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="cursor-pointer"
                            onClick={() => {
                              setSelectedAccount(account);
                              setIsEditDialogOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4 mr-2 text-teal-600" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-rose-600 cursor-pointer focus:text-rose-600 focus:bg-rose-50"
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
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {filteredAccounts.length === 0 && (
            <div className="text-center py-16 bg-gray-50 dark:bg-gray-900">
              <div className="text-gray-500 dark:text-gray-400 text-lg">
                No accounts found. Create your first account to get started.
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the account <strong>{selectedAccount?.name}</strong>.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}