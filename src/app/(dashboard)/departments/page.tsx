import { getDivisions } from "@/lib/actions/departments";
import { DivisionManager } from "@/components/departments/division-manager";

export default async function DepartmentsPage() {
  const divisions = await getDivisions();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Divisions & Departments</h1>
        <p className="text-muted-foreground">
          Manage organizational structure
        </p>
      </div>
      <DivisionManager divisions={divisions} />
    </div>
  );
}
