"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, UserPlus, UsersRound } from "lucide-react";
import { AccessRole, AccessUser, assignUserRole, createUserAction, setUserActive } from "@/lib/actions/admin.actions";
import { WorkspacePanel, WorkspaceSection } from "@/components/ui/Workspace";

export function RoleAdminClient({ users, roles }: { users: AccessUser[]; roles: AccessRole[] }) {
  const router = useRouter();
  const [message, setMessage] = useState<{ kind: "error" | "success"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function run(operation: () => Promise<{ error?: string; success?: boolean }>) {
    setBusy(true);
    setMessage(null);
    try {
      const result = await operation();
      setMessage(result.error ? { kind: "error", text: result.error } : { kind: "success", text: "Access settings updated." });
      if (!result.error) router.refresh();
      return result;
    } catch {
      setMessage({ kind: "error", text: "Could not update access settings. Try again." });
      return { error: "Request failed" };
    } finally { setBusy(false); }
  }

  return <>
    {message && <div role="status" className={`alert ${message.kind === "error" ? "alert-error" : "alert-success"}`}>{message.text}</div>}
    <div className="workspace-grid" data-layout="form">
      <WorkspacePanel icon={<UserPlus size={20} />} title="Create team member" description="Set a temporary password and assign an initial role.">
        <form onSubmit={async (event) => {
          event.preventDefault();
          const form = event.currentTarget;
          const data = new FormData(form);
          const result = await run(() => createUserAction(String(data.get("name") || ""), String(data.get("email") || ""), String(data.get("password") || ""), Number(data.get("roleId"))));
          if (!result.error) form.reset();
        }}>
          <div className="form-group"><label htmlFor="member-name">Full name</label><input id="member-name" className="input-field" name="name" autoComplete="name" required /></div>
          <div className="form-group"><label htmlFor="member-email">Work email</label><input id="member-email" className="input-field" name="email" type="email" autoComplete="email" required /></div>
          <div className="form-group"><label htmlFor="member-password">Temporary password</label><input id="member-password" className="input-field" name="password" type="password" autoComplete="new-password" minLength={10} required /></div>
          <div className="form-group"><label htmlFor="member-role">Access role</label><select id="member-role" className="input-field" name="roleId" required>{roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}</select></div>
          <button className="btn btn-primary" type="submit" disabled={busy}>{busy ? "Saving..." : "Create member"}</button>
        </form>
      </WorkspacePanel>
      <WorkspacePanel icon={<ShieldCheck size={20} />} title="Role definitions" description="Permissions are enforced on the server." accent>
        <div className="role-list">{roles.map((role) => <div className="role-definition" key={role.id}><strong>{role.name}</strong><p>{role.description}</p><small>{role.permissions.join(" · ")}</small></div>)}</div>
      </WorkspacePanel>
    </div>
    <WorkspaceSection title="Team access" description="Change roles or disable accounts without deleting history." aside={<span className="work-pill"><UsersRound size={14} aria-hidden="true" /> {users.length} members</span>} />
    <div className="workspace-panel team-list">{users.length === 0 && <div className="work-empty">No team members yet.</div>}{users.map((user) => <div className="team-row" key={user.id}>
      <div className="team-identity"><span className="customer-avatar-badge">{user.name.charAt(0).toUpperCase()}</span><div><strong>{user.name}</strong><span>{user.email}</span></div></div>
      <span className="work-pill">{user.is_active ? "Active" : "Disabled"}</span>
      <select className="input-field" aria-label={`Role for ${user.email}`} defaultValue={roles.find((role) => user.roles.includes(role.name))?.id} onChange={(event) => run(() => assignUserRole(user.id, Number(event.target.value)))} disabled={busy || !user.is_active}>{roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}</select>
      <button type="button" className="btn btn-secondary" disabled={busy} onClick={() => run(() => setUserActive(user.id, !user.is_active))}>{user.is_active ? "Disable" : "Enable"}</button>
    </div>)}</div>
  </>;
}
