"use client";

import * as React from "react";
import { ShieldOff } from "lucide-react";
import { useSessionUser } from "@/features/auth/hooks";
import { canOpenPath, hasAccess, moduleForPath, MODULES, type Access, type ModuleId } from "@/lib/permissions/model";

export * from "@/lib/permissions/model";

/**
 * Permission checks for the signed-in user. Use for navigation visibility, page access, and showing or
 * disabling create / edit / delete / risky actions. The backend still authorizes every request.
 *
 *   const { can } = usePermissions();
 *   {can("billing", "full") && <Button>Suspend</Button>}
 */
export function usePermissions() {
  const user = useSessionUser();
  return React.useMemo(() => ({
    can: (module: ModuleId, level: Access = "view") => hasAccess(user?.access, module, level),
    canOpen: (pathname: string) => canOpenPath(user?.access, pathname),
    access: user?.access,
  }), [user]);
}

/** Renders children only when the user has `level` on `module` (or `fallback` otherwise). */
export function Can({ module, level = "view", fallback = null, children }: { module: ModuleId; level?: Access; fallback?: React.ReactNode; children: React.ReactNode }) {
  const { can } = usePermissions();
  return <>{can(module, level) ? children : fallback}</>;
}

/** Page-level guard used by the dashboard layout: shows a "no access" state instead of the page. */
export function RequirePathAccess({ pathname, children }: { pathname: string; children: React.ReactNode }) {
  const user = useSessionUser();
  const { canOpen } = usePermissions();
  if (!user) return null; // the layout shows its own loading state until the session is known
  if (canOpen(pathname)) return <>{children}</>;
  const owner = moduleForPath(pathname);
  const label = MODULES.find((m) => m.id === owner)?.label ?? "this area";
  return (
    <div role="alert" className="max-w-[520px] mx-auto mt-16 bg-[var(--card)] border border-[var(--border)] rounded-xl p-8 text-center flex flex-col items-center gap-3">
      <ShieldOff className="w-8 h-8 text-[var(--muted-foreground)]" aria-hidden />
      <h1 className="m-0 font-heading text-[1.25rem] font-bold">You don&apos;t have access to {label}</h1>
      <p className="m-0 text-[0.9rem] text-[var(--muted-foreground)]">
        Your role ({user.role.name}) can&apos;t open this page. Ask an admin to change your role in Settings › Roles &amp; Permissions.
      </p>
    </div>
  );
}
