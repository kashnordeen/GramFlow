import { getAccessAdminData } from "@/lib/actions/admin.actions";
import { RoleAdminClient } from "@/components/ui/RoleAdminClient";

export default async function RolesPage() {
  const { users, roles } = await getAccessAdminData();
  return <div className="page-container"><div className="page-header"><div><h1>Roles & Permissions</h1><p>Assign a centrally defined server-side access role.</p></div></div>
    <RoleAdminClient users={users} roles={roles} />
  </div>;
}
