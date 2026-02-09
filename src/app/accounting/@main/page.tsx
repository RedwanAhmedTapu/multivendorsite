// src/app/accounting/@main/page.tsx
"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, ArrowDownRight, DollarSign, TrendingUp, Users, FileText } from "lucide-react";
import Link from "next/link";
import { useGetAccountingStatisticsQuery, useGetTrialBalanceQuery } from "@/features/accountingApi";

export default function AccountingDashboard() {
  // Get current entity
  const entityType = "ADMIN";
  const entityId = undefined;
  
  // Fetch statistics
  const { data: stats } = useGetAccountingStatisticsQuery({ entityType, entityId });
  const { data: trialBalance } = useGetTrialBalanceQuery({ entityType, entityId });
  
  const statistics = [
    {
      title: "Total Vouchers",
      value: stats?.data?.voucherCount || 0,
      icon: FileText,
      change: "+12%",
      trend: "up",
      href: "/accounting/vouchers",
    },
    {
      title: "Total Accounts",
      value: stats?.data?.accountCount || 0,
      icon: DollarSign,
      change: "+5%",
      trend: "up",
      href: "/accounting/accounts",
    },
    {
      title: "Total Transactions",
      value: stats?.data?.ledgerEntryCount || 0,
      icon: TrendingUp,
      change: "+18%",
      trend: "up",
      href: "/accounting/ledger",
    },
    {
      title: "Vendor Payables",
      value: trialBalance?.data?.totals?.totalDebit ? 
        `$${parseFloat(trialBalance.data.totals.totalDebit).toLocaleString()}` : "$0",
      icon: Users,
      change: "-3%",
      trend: "down",
      href: "/accounting/reports/vendor-payables",
    },
  ];
  
  const quickActions = [
    {
      title: "Create Journal Voucher",
      description: "Create a new journal entry",
      href: "/accounting/vouchers",
      icon: FileText,
    },
    {
      title: "View Trial Balance",
      description: "Check your trial balance",
      href: "/accounting/reports/trial-balance",
      icon: TrendingUp,
    },
    {
      title: "Manage Accounts",
      description: "Update chart of accounts",
      href: "/accounting/accounts",
      icon: DollarSign,
    },
    {
      title: "View Audit Logs",
      description: "Check system activities",
      href: "/accounting/audit-logs",
      icon: ArrowUpRight,
    },
  ];
  
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Accounting Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of your accounting system
          </p>
        </div>
      </div>
      
      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statistics.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="flex items-center text-xs text-muted-foreground mt-1">
                  {stat.trend === "up" ? (
                    <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3 text-red-500 mr-1" />
                  )}
                  {stat.change} from last month
                </div>
                <Link href={stat.href}>
                  <Button variant="link" className="p-0 h-auto text-xs">
                    View details
                  </Button>
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </div>
      
      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common accounting tasks
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link href={action.href} key={action.title}>
                  <div className="flex items-center p-3 rounded-lg border hover:bg-accent transition-colors cursor-pointer">
                    <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center mr-4">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{action.title}</div>
                      <div className="text-sm text-muted-foreground">
                        {action.description}
                      </div>
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </Link>
              );
            })}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest accounting activities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-start">
                  <div className="h-2 w-2 rounded-full bg-primary mt-2 mr-3"></div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">
                      New voucher created
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Journal Voucher #JV202312001
                    </div>
                    <div className="text-xs text-muted-foreground">
                      2 hours ago
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Reports Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Financial Reports</CardTitle>
          <CardDescription>
            Quick access to financial reports
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/accounting/reports/trial-balance">
              <Card className="hover:border-primary transition-colors cursor-pointer">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="font-medium">Trial Balance</div>
                    <div className="text-sm text-muted-foreground">
                      As of today
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
            
            <Link href="/accounting/reports/profit-loss">
              <Card className="hover:border-primary transition-colors cursor-pointer">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="font-medium">Profit & Loss</div>
                    <div className="text-sm text-muted-foreground">
                      This month
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
            
            <Link href="/accounting/reports/balance-sheet">
              <Card className="hover:border-primary transition-colors cursor-pointer">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="font-medium">Balance Sheet</div>
                    <div className="text-sm text-muted-foreground">
                      Current position
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}