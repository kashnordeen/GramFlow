"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AccessRole, AccessUser, assignUserRole, createUserAction, setUserActive } from "@/lib/actions/admin.actions";

export function RoleAdminClient({ users, roles }: { users: AccessUser[]; roles: AccessRole[] }) {
  const router = useRouter();
  const [message, setMessage] = useState<{ kind: "error" | "success"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function run(operation: () => Promise<{ error?: string; success?: boolean }>) {
    setBusy(true); setMessage(null);
    const result = await operation();
    setBusy(false);
    setMessage(result.error ? { kind: "error", text: result.error } : { kind: "success", text: "Access settings updated." });
    if (!result.error) router.refresh();
    return result;
  }

  return <>
    {message && <div role="status" className={`alert ${message.kind === "error" ? "alert-error" : "alert-success"}`} style={{ marginBottom: "1rem" }}>{message.text}</div>}
    <form className="card" style={{ marginBottom: "1rem" }} onSubmit={async (event) => {
      event.preventDefault();
      const form = event.currentTarget;
      const data = new FormData(form);
      const result = await run(() => createUserAction(String(data.get("name") || ""), String(data.get("email") || ""), String(data.get("password") || ""), Number(data.get("roleId"))));
      if (!result.error) form.reset();
    }}>
      <h2>Create user</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: "0.75rem" }}>
        <input className="input-field" name="name" placeholder="Full name" required />
        <input className="input-field" name="email" type="email" placeholder="Email" required />
        <input className="input-field" name="password" type="password" placeholder="Temporary password" minLength={10} required />
        <select className="input-field" name="roleId" required>{roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}</select>
      </div>
      <button className="btn btn-primary" style={{ marginTop: "0.75rem" }} disabled={busy}>Create user</button>
    </form>

    <div className="card" style={{ marginBottom: "1rem" }}><h2>Users</h2>{users.map((user) => <div key={user.id} style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", alignItems: "center", padding: "0.75rem 0", borderBottom: "1px solid var(--border-subtle)", opacity: user.is_active ? 1 : 0.6 }}>
      <div style={{ flex: "1 1 260px" }}><strong>{user.name}</strong><div>{user.email} · {user.roles.join(", ") || "No role"} · {user.is_active ? "Active" : "Disabled"}</div></div>
      <select className="input-field" style={{ width: "auto" }} aria-label={`Role for ${user.email}`} defaultValue={roles.find((role) => user.roles.includes(role.name))?.id}
        onChange={(event) => run(() => assignUserRole(user.id, Number(event.target.value)))} disabled={busy || !user.is_active}>
        {roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}
      </select>
      <button type="button" className="btn" disabled={busy} onClick={() => run(() => setUserActive(user.id, !user.is_active))}>{user.is_active ? "Disable" : "Enable"}</button>
    </div>)}</div>

    <div className="card"><h2>Role permissions</h2>{roles.map((role) => <div key={role.id} style={{ marginBottom: "1rem" }}><strong>{role.name}</strong><p>{role.description}</p><small>{role.permissions.join(" · ")}</small></div>)}</div>
  </>;
}
