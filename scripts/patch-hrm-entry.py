# One-off patcher: mount HrmWorkspaceEntry in the existing dashboards.
import io

def patch(path, pairs):
    with io.open(path, encoding="utf-8") as f:
        s = f.read()
    for old, new in pairs:
        assert old in s, f"{path}: missing {old[:70]!r}"
        s = s.replace(old, new, 1)
    with io.open(path, "w", encoding="utf-8") as f:
        f.write(s)
    print("patched", path)

NL = chr(10)

# 1. Admin dashboard home.
patch("src/app/admin-dashboard/@main/page.tsx", [
    ("import React from 'react';" + NL + "import { DollarSign, Users, ShoppingCart } from 'lucide-react';",
     "import React from 'react';" + NL + "import { DollarSign, Users, ShoppingCart } from 'lucide-react';" + NL + "import { HrmWorkspaceEntry } from '@/components/hrm/HrmWorkspaceEntry';"),
    ("  return (" + NL + '    <div className="min-h-screen  ">' + NL + '      <div className="max-w-7xl mx-auto space-y-6">' + NL + "        {/* Top Stats Grid */}",
     "  return (" + NL + '    <div className="min-h-screen  ">' + NL + '      <div className="max-w-7xl mx-auto space-y-6">' + NL + '        <div className="flex justify-end"><HrmWorkspaceEntry /></div>' + NL + "        {/* Top Stats Grid */}"),
])

# 2. Vendor dashboard home (main return, after the no-vendor guard).
patch("src/app/vendor-dashboard/@main/page.tsx", [
    ("import OnboardingWizard from '@/components/vendorinfo/OnboardingWizard';",
     "import OnboardingWizard from '@/components/vendorinfo/OnboardingWizard';" + NL + "import { HrmWorkspaceEntry } from '@/components/hrm/HrmWorkspaceEntry';"),
    ("  return (" + NL + '    <div className="min-h-screen bg-gray-50 ">' + NL + '      <div className="container mx-auto px-4">' + NL + "        <OnboardingWizard ",
     "  return (" + NL + '    <div className="min-h-screen bg-gray-50 ">' + NL + '      <div className="container mx-auto px-4">' + NL + '        <div className="flex justify-end pt-4"><HrmWorkspaceEntry /></div>' + NL + "        <OnboardingWizard "),
])

# 3. Employee Management page header (admin + vendor HR surface).
patch("src/othersfeatures/hrm/pages/EmployeeManagementPage.tsx", [
    ('import { usePermissions } from "../../../hooks/usePermissions";',
     'import { usePermissions } from "../../../hooks/usePermissions";' + NL + 'import { HrmWorkspaceEntry } from "@/components/hrm/HrmWorkspaceEntry";'),
    ('        <div>' + NL + '          <h1 className="text-xl font-semibold text-gray-900">Employee Management</h1>',
     '        <HrmWorkspaceEntry />' + NL + '        <div>' + NL + '          <h1 className="text-xl font-semibold text-gray-900">Employee Management</h1>'),
])

# 4. Employee Self-Service page (employee surface).
patch("src/othersfeatures/hrm/pages/EmployeeSelfServicePage.tsx", [
    ("import { useGetMyProfileQuery,",
     'import { HrmWorkspaceEntry } from "@/components/hrm/HrmWorkspaceEntry";' + NL + "import { useGetMyProfileQuery,"),
    ('      <div className="rounded-xl border border-gray-200 p-4">' + NL + '        <h1 className="text-lg font-semibold text-gray-900">My Profile</h1>',
     '      <div className="flex justify-end"><HrmWorkspaceEntry /></div>' + NL + '      <div className="rounded-xl border border-gray-200 p-4">' + NL + '        <h1 className="text-lg font-semibold text-gray-900">My Profile</h1>'),
])
