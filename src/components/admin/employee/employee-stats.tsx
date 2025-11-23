// components/admin/employees/employee-stats.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, UserCheck, UserX, BarChart3 } from 'lucide-react';
import type { EmployeeStats as EmployeeStatsType } from '@/features/employeeApi';

interface EmployeeStatsProps {
  stats: EmployeeStatsType;
}

export function EmployeeStats({ stats }: EmployeeStatsProps) {
  const statCards = [
    {
      title: 'Total Employees',
      value: stats.totalEmployees,
      icon: Users,
      description: 'All employees in system',
      color: 'text-blue-600',
    },
    {
      title: 'Active Employees',
      value: stats.activeEmployees,
      icon: UserCheck,
      description: 'Currently active',
      color: 'text-green-600',
    },
    {
      title: 'Inactive Employees',
      value: stats.inactiveEmployees,
      icon: UserX,
      description: 'Currently inactive',
      color: 'text-orange-600',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statCards.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <stat.icon className={`h-4 w-4 ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground">{stat.description}</p>
          </CardContent>
        </Card>
      ))}
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Departments</CardTitle>
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{Object.keys(stats.byDepartment).length}</div>
          <p className="text-xs text-muted-foreground">Active departments</p>
        </CardContent>
      </Card>
    </div>
  );
}