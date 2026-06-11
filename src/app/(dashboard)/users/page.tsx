import { getUsers } from "@/lib/actions/users";
import { getDepartments } from "@/lib/actions/departments";
import { UsersTable } from "@/components/users/users-table";

export default async function UsersPage() {
  const [users, departments] = await Promise.all([
    getUsers(),
    getDepartments(),
  ]);

  return (
    <div className="space-y-6">
      <UsersTable users={users} departments={departments} />
    </div>
  );
}
