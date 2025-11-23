'use client';

import React, { useState } from 'react';
import { useGetAdminEmployeesQuery } from '@/features/employeeApi';
import {  Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Users } from 'lucide-react';
import { EmployeePermissionsDialog } from '@/components/admin/employee/employee-permissions-dialog';

export default function EmployeePermissionsPage() {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Fetch employees from API
  const { data: employeesData, isLoading } = useGetAdminEmployeesQuery({ page: 1, limit: 10 });

  const employees = employeesData?.data || [];

  // Get the selected employee object
  const selectedEmployee = employees.find(emp => emp.id === selectedEmployeeId) || null;

  const handleOpenDialog = (employeeId: string) => {
    setSelectedEmployeeId(employeeId);
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Manage Employee Permissions</h1>
        <p className="text-muted-foreground">
          Select an employee to view or edit their permissions
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Employees
          </CardTitle>
          <CardDescription>
            Click "Edit Permissions" to manage employee access
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p>Loading employees...</p>
          ) : employees.length === 0 ? (
            <p>No employees found.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {employees.map(emp => (
                <Card key={emp.id} className="p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{emp.user?.name || 'Unnamed'}</p>
                      <p className="text-sm text-muted-foreground">{emp.designation} - {emp.department}</p>
                    </div>
                    <button  onClick={() => handleOpenDialog(emp.id)}>
                      Edit Permissions
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Employee Permissions Dialog */}
      {selectedEmployee && (
        <EmployeePermissionsDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          employee={selectedEmployee}
        />
      )}
    </div>
  );
}
