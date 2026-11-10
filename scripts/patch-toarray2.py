# One-off patcher (part 2): remaining toArray sweep sites.
import io

def patch(path, pairs):
    with io.open(path, encoding="utf-8") as f:
        s = f.read()
    for old, new in pairs:
        assert old in s, f"{path}: missing {old[:70]!r}"
        s = s.replace(old, new)
    with io.open(path, "w", encoding="utf-8") as f:
        f.write(s)
    print("patched", path)

# 4. HrmEmployeeDirectory (correct import anchor this time).
patch("src/components/hrm/HrmEmployeeDirectory.tsx", [
    ('import { EmployeeStatusBadge } from "@/othersfeatures/hrm/components/employee360/EmployeeStatusBadge";',
     'import { EmployeeStatusBadge } from "@/othersfeatures/hrm/components/employee360/EmployeeStatusBadge";' + chr(10) + 'import { toArray } from "./hrm-utils";'),
    ("          {branches?.data.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}",
     "          {toArray(branches?.data).map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}"),
    ("          {departments?.data.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}",
     "          {toArray(departments?.data).map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}"),
])

# 5. HrmReports — filter dropdowns.
patch("src/components/hrm/HrmReports.tsx", [
    ('import { usePermissions } from "@/hooks/usePermissions";',
     'import { usePermissions } from "@/hooks/usePermissions";' + chr(10) + 'import { toArray } from "./hrm-utils";'),
    ("                    {branches?.data.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}",
     "                    {toArray(branches?.data).map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}"),
    ("                    {departments?.data.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}",
     "                    {toArray(departments?.data).map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}"),
])

# 6. OrgStructureManager.
patch("src/othersfeatures/hrm/components/OrgStructureManager.tsx", [
    ("          {branches?.data.map((b) => (",
     "          {toArray(branches?.data).map((b) => ("),
    ("          {departments?.data.map((d) => (",
     "          {toArray(departments?.data).map((d) => ("),
    ("          {designations?.data.map((d) => (",
     "          {toArray(designations?.data).map((d) => ("),
    ("import { useGetBranchesQuery,",
     'import { toArray } from "@/components/hrm/hrm-utils";' + chr(10) + "import { useGetBranchesQuery,"),
])

# 7. EmployeeProfileDrawer.
patch("src/othersfeatures/hrm/components/EmployeeProfileDrawer.tsx", [
    ('  useGetEmployeesQuery,\n} from "../../../features/hrmApi";',
     '  useGetEmployeesQuery,\n} from "../../../features/hrmApi";' + chr(10) + 'import { toArray } from "@/components/hrm/hrm-utils";'),
    ("                  {branches?.data.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}",
     "                  {toArray(branches?.data).map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}"),
    ("                  {departments?.data.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}",
     "                  {toArray(departments?.data).map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}"),
    ("                  {designations?.data.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}",
     "                  {toArray(designations?.data).map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}"),
])

# 8. Employee360Page — lifecycle dialog org lists.
patch("src/othersfeatures/hrm/pages/Employee360Page.tsx", [
    ('import { EmployeeProfileDrawer } from "../components/EmployeeProfileDrawer";',
     'import { EmployeeProfileDrawer } from "../components/EmployeeProfileDrawer";' + chr(10) + 'import { toArray } from "@/components/hrm/hrm-utils";'),
    ("          designations={designations?.data ?? []}",
     "          designations={toArray(designations?.data)}"),
    ("          branches={branches?.data ?? []}",
     "          branches={toArray(branches?.data)}"),
    ("          departments={departments?.data ?? []}",
     "          departments={toArray(departments?.data)}"),
])

# 9. HrmOrgChart — designations list.
patch("src/components/hrm/HrmOrgChart.tsx", [
    ('  useGetReportingStructureQuery,\n} from "@/features/hrmApi";',
     '  useGetReportingStructureQuery,\n} from "@/features/hrmApi";' + chr(10) + 'import { toArray } from "./hrm-utils";'),
    ("    const desigs = designations?.data ?? [];",
     "    const desigs = toArray(designations?.data);"),
])
print("part 2 done")
