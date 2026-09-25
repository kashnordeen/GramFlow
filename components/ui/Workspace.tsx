import type { ReactNode } from "react";

export function WorkspaceHeader({ eyebrow, title, description, aside }: { eyebrow: string; title: string; description: string; aside?: ReactNode }) {
  return <header className="workspace-hero"><div><span className="workspace-kicker">{eyebrow}</span><h1>{title}</h1><p>{description}</p></div>{aside}</header>;
}

export function WorkspacePanel({ icon, title, description, children, footer, accent = false }: { icon?: ReactNode; title: string; description?: string; children: ReactNode; footer?: ReactNode; accent?: boolean }) {
  return <section className="workspace-panel" data-accent={accent || undefined}>
    <div className="panel-head">{icon && <span className="panel-icon" aria-hidden="true">{icon}</span>}<div><h2>{title}</h2>{description && <p>{description}</p>}</div></div>
    <div className="panel-body">{children}</div>
    {footer && <div className="panel-foot">{footer}</div>}
  </section>;
}

export function WorkspaceSection({ title, description, aside }: { title: string; description?: string; aside?: ReactNode }) {
  return <div className="section-heading"><div><h2>{title}</h2>{description && <p>{description}</p>}</div>{aside}</div>;
}
