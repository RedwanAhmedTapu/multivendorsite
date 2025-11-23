// components/admin/employees/employee-table.tsx
'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Search,
  MoreHorizontal,
  Edit,
  Key,
  Eye,
  EyeOff,
  Trash2,
  AlertTriangle,
  Filter,
  ChevronLeft,
  ChevronRight,
  Users,
} from 'lucide-react';
import type { Employee, EmployeeFilters } from '@/features/employeeApi';
import {
  useToggleAdminEmployeeStatusMutation,
  useUpdateEmployeePermissionsMutation,
} from '@/features/employeeApi';
import { toast } from 'sonner';
import { EmployeePermissionsDialog } from './employee-permissions-dialog';
import { EditEmployeeDialog } from './edit-employee-dialog';

interface EmployeeTableProps {
  employees: Employee[];
  isLoading: boolean;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  filters: EmployeeFilters;
  onFiltersChange: {
    setSearch: (value: string) => void;
    setDepartment: (value: string) => void;
    setDesignation: (value: string) => void;
    setIsActive: (value: boolean | undefined) => void;
  };
  onPageChange: (page: number) => void;
}

type ActionType = 'toggle-status' | 'delete';

interface ConfirmationDialogState {
  isOpen: boolean;
  action: ActionType;
  employee: Employee | null;
  title: string;
  description: string;
  confirmText: string;
  variant: 'default' | 'destructive';
}

export function EmployeeTable({
  employees,
  isLoading,
  pagination,
  filters,
  onFiltersChange,
  onPageChange,
}: EmployeeTableProps) {
  const [toggleStatus] = useToggleAdminEmployeeStatusMutation();
  const [updatePermissions] = useUpdateEmployeePermissionsMutation();

  const [confirmationDialog, setConfirmationDialog] = useState<ConfirmationDialogState>({
    isOpen: false,
    action: 'toggle-status',
    employee: null,
    title: '',
    description: '',
    confirmText: '',
    variant: 'default',
  });

  const [permissionsDialog, setPermissionsDialog] = useState<{
    isOpen: boolean;
    employee: Employee | null;
  }>({
    isOpen: false,
    employee: null,
  });

  const [editDialog, setEditDialog] = useState<{
    isOpen: boolean;
    employee: Employee | null;
  }>({
    isOpen: false,
    employee: null,
  });

  const showConfirmationDialog = (
    action: ActionType,
    employee: Employee,
    options: {
      title: string;
      description: string;
      confirmText: string;
      variant?: 'default' | 'destructive';
    }
  ) => {
    setConfirmationDialog({
      isOpen: true,
      action,
      employee,
      ...options,
      variant: options.variant || 'default',
    });
  };

  const handleToggleStatus = (employee: Employee) => {
    const action = employee.isActive ? 'deactivate' : 'activate';
    showConfirmationDialog('toggle-status', employee, {
      title: `${employee.isActive ? 'Deactivate' : 'Activate'} Employee`,
      description: `Are you sure you want to ${action} ${employee.user?.name}? This will ${employee.isActive ? 'prevent' : 'allow'} them to access the system.`,
      confirmText: `${employee.isActive ? 'Deactivate' : 'Activate'}`,
      variant: employee.isActive ? 'destructive' : 'default',
    });
  };

  const handleConfirmAction = async () => {
    if (!confirmationDialog.employee) return;

    const { action, employee } = confirmationDialog;

    try {
      switch (action) {
        case 'toggle-status':
          await toggleStatus(employee.id).unwrap();
          toast.success(`Employee ${employee.isActive ? 'deactivated' : 'activated'} successfully`);
          break;
      }
    } catch (error: any) {
      toast.error(error?.data?.message || `Failed to ${action} employee`);
    } finally {
      setConfirmationDialog(prev => ({ ...prev, isOpen: false }));
    }
  };

  const getStatusBadge = (employee: Employee) => {
    if (employee.isActive) {
      return <Badge variant="default">Active</Badge>;
    }
    return <Badge variant="secondary">Inactive</Badge>;
  };

  const getPermissionsBadge = (permissions: any) => {
    const activePermissions = Object.values(permissions).filter(Boolean).length;
    return (
      <Badge variant="outline">
        {activePermissions} permission{activePermissions !== 1 ? 's' : ''}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-muted-foreground">Loading employees...</div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search employees by name, email, or designation..."
              className="pl-8"
              value={filters.search || ''}
              onChange={(e) => onFiltersChange.setSearch(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2">
            <select 
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              value={filters.isActive?.toString() || ''}
              onChange={(e) => {
                const value = e.target.value;
                onFiltersChange.setIsActive(
                  value === '' ? undefined : value === 'true'
                );
              }}
            >
              <option value="">All Status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Department & Designation</TableHead>
                <TableHead>Permissions</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell>
                    <div className="flex flex-col space-y-1">
                      <div className="font-semibold">{employee.user?.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {employee.user?.email}
                      </div>
                      {employee.user?.phone && (
                        <div className="text-sm text-muted-foreground">
                          {employee.user.phone}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex flex-col">
                      <div className="font-medium">{employee.department}</div>
                      <div className="text-sm text-muted-foreground">
                        {employee.designation}
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    {getPermissionsBadge(employee.permissions)}
                  </TableCell>
                  
                  <TableCell>
                    {getStatusBadge(employee)}
                  </TableCell>
                  
                  <TableCell>
                    <div className="text-sm text-muted-foreground">
                      {new Date(employee.createdAt).toLocaleDateString()}
                    </div>
                  </TableCell>
                  
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        
                        <DropdownMenuItem onClick={() => setEditDialog({ isOpen: true, employee })}>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit Employee
                        </DropdownMenuItem>

                        <DropdownMenuItem onClick={() => setPermissionsDialog({ isOpen: true, employee })}>
                          <Key className="w-4 h-4 mr-2" />
                          Manage Permissions
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />

                        <DropdownMenuItem 
                          onClick={() => handleToggleStatus(employee)}
                          className={employee.isActive ? "text-orange-600" : "text-green-600"}
                        >
                          {employee.isActive ? (
                            <>
                              <EyeOff className="w-4 h-4 mr-2" />
                              Deactivate
                            </>
                          ) : (
                            <>
                              <Eye className="w-4 h-4 mr-2" />
                              Activate
                            </>
                          )}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
              {pagination.total} entries
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <div className="text-sm">
                Page {pagination.page} of {pagination.totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {employees.length === 0 && (
          <div className="text-center py-12 text-muted-foreground border rounded-lg">
            <div className="flex flex-col items-center gap-2">
              <Users className="h-8 w-8" />
              <div>
                {filters.search || filters.isActive !== undefined
                  ? "No employees match your filters" 
                  : "No employees found"
                }
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={confirmationDialog.isOpen} onOpenChange={(open) => setConfirmationDialog(prev => ({ ...prev, isOpen: open }))}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {confirmationDialog.variant === 'destructive' && (
                <AlertTriangle className="h-5 w-5 text-destructive" />
              )}
              {confirmationDialog.title}
            </DialogTitle>
            <DialogDescription>
              {confirmationDialog.description}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setConfirmationDialog(prev => ({ ...prev, isOpen: false }))}
              className="sm:flex-1"
            >
              Cancel
            </Button>
            <Button
              variant={confirmationDialog.variant === 'destructive' ? 'destructive' : 'default'}
              onClick={handleConfirmAction}
              className="sm:flex-1"
            >
              {confirmationDialog.confirmText}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Permissions Dialog */}
      <EmployeePermissionsDialog
        open={permissionsDialog.isOpen}
        onOpenChange={(open) => setPermissionsDialog(prev => ({ ...prev, isOpen: open }))}
        employee={permissionsDialog.employee}
      />

      {/* Edit Employee Dialog */}
      <EditEmployeeDialog
        open={editDialog.isOpen}
        onOpenChange={(open) => setEditDialog(prev => ({ ...prev, isOpen: open }))}
        employee={editDialog.employee}
      />
    </>
  );
}