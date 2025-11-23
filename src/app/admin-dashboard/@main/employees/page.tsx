// app/admin/employees/page.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Users, Download, Filter } from 'lucide-react';
import { useGetAdminEmployeesQuery, useGetAdminEmployeeStatsQuery } from '@/features/employeeApi';
import Link from 'next/link';
import { EmployeeStats } from '@/components/admin/employee/employee-stats';
import { EmployeeTable } from '@/components/admin/employee/employee-table';

export default function AllEmployeesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [designation, setDesignation] = useState('');
  const [isActive, setIsActive] = useState<boolean | undefined>(undefined);

  const { data: employeesData, isLoading: employeesLoading, error: employeesError } = useGetAdminEmployeesQuery({
    page,
    search,
    department,
    designation,
    isActive,
    limit: 10,
  });

  const { data: statsData, isLoading: statsLoading } = useGetAdminEmployeeStatsQuery();

  const employees = employeesData?.data || [];
  const pagination = employeesData?.pagination;
  const stats = statsData?.data;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">All Employees</h1>
          <p className="text-muted-foreground">
            Manage and view all employees in your organization
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Link href="/admin-dashboard/employees/add">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Employee
            </Button>
          </Link>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && <EmployeeStats stats={stats} />}

      {/* Main Content */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Employee Directory
              </CardTitle>
              <CardDescription>
                Browse and manage all employees with advanced filtering options
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Filter className="w-4 h-4" />
              <span>{pagination?.total || 0} employees found</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <EmployeeTable
            employees={employees}
            isLoading={employeesLoading}
            pagination={pagination}
            filters={{
              search,
              department,
              designation,
              isActive,
            }}
            onFiltersChange={{
              setSearch,
              setDepartment,
              setDesignation,
              setIsActive,
            }}
            onPageChange={setPage}
          />
        </CardContent>
      </Card>
    </div>
  );
}