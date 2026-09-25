import { getAccessAdminData } from "@/lib/actions/admin.actions";
import { RoleAdminClient } from "@/components/ui/RoleAdminClient";
import { WorkspaceHeader } from "@/components/ui/Workspace";

export default async function RolesPage() {
  const { users, roles } = await getAccessAdminData();
  return <div className="workspace-page"><WorkspaceHeader eyebrow="ADMIN / ACCESS CONTROL" title="Roles & permissions" description="Create team accounts, assign access and keep permission boundaries visible." aside={<div className="workspace-hero-stat"><span>Team members</span><strong>{users.length}</strong></div>} />
    <RoleAdminClient users={users} roles={roles} />
  </div>;
}
