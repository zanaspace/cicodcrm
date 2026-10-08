"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Plus, Copy, Lock, Trash2, Save, Users as UsersIcon, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import { PageHeader } from "@/components/ui/PageHeader";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { toast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";
import { newId } from "@/lib/format";
import { ACCESS_LEVELS, MODULES, accessChanges, deleteRole, saveRole, useRoles, useUsers, type Access, type Role, sameName } from "@/lib/mock/settings";
import { inputClass } from "@/app/crm/catalogue/components/editor";

export function RolesView() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const roles = useRoles();
  const users = useUsers();
  const selectedId = params.get("role") ?? roles[0].id;
  const [draft, setDraft] = React.useState<Role | null>(null);
  const saved = roles.find((r) => r.id === selectedId);
  const role = draft ?? saved ?? roles[0];
  const isNew = !!draft && !roles.some((r) => r.id === draft.id);
  const [confirming, setConfirming] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);

  const holders = (id: string) => users.filter((u) => u.roleId === id && u.status !== "Deactivated");
  const select = (id: string) => { setDraft(null); router.replace(`${pathname}?role=${id}`, { scroll: false }); };
  const edit = (p: Partial<Role>) => setDraft({ ...role, ...p });
  const setAccess = (m: (typeof MODULES)[number]["id"], a: Access) => edit({ access: { ...role.access, [m]: a } });
  const changes = saved && draft ? accessChanges(saved.access, draft.access) : [];
  const renamed = saved && draft && saved.name !== draft.name;
  const nameError = !role.name.trim() ? "Give the role a name" : roles.some((r) => r.id !== role.id && sameName(r.name, role.name)) ? "Another role has this name" : "";
  const dirty = isNew || changes.length > 0 || !!renamed || (saved && draft && saved.description !== draft.description);

  const startCopy = (from: Role) => setDraft({ ...from, id: newId("role"), name: `${from.name} (copy)`, builtIn: false, locked: false });
  const startNew = () => setDraft({ id: newId("role"), name: "New role", description: "", builtIn: false, access: Object.fromEntries(MODULES.map((m) => [m.id, "view"])) as Role["access"] });
  const commit = () => {
    const r = { ...role, name: role.name.trim(), description: role.description.trim() };
    saveRole(r);
    toast.success(isNew ? `${r.name} role created` : `${r.name} role saved`);
    setDraft(null); setConfirming(false);
    router.replace(`${pathname}?role=${r.id}`, { scroll: false });
  };

  return (
    <div className="max-w-[1600px] w-full mx-auto">
      <PageHeader
        title="Roles & permissions"
        subtitle="A role decides what its people can see and change in each part of the CRM."
        actions={<Button onClick={startNew}><Plus className="w-4 h-4 mr-2" /> New role</Button>}
      />

      <div className="grid grid-cols-[320px_1fr] gap-6 items-start">
        <nav aria-label="Roles" className="bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-sm overflow-hidden">
          <ul className="m-0 p-0 list-none divide-y divide-[var(--border)]">
            {[...roles, ...(isNew && draft ? [draft] : [])].map((r) => {
              const active = r.id === role.id;
              const n = holders(r.id).length;
              return (
                <li key={r.id}>
                  <button type="button" onClick={() => (r.id === draft?.id && isNew ? undefined : select(r.id))} aria-current={active ? "true" : undefined}
                    className={cn("w-full text-left px-5 py-4 transition-colors", active ? "bg-[var(--accent)]" : "hover:bg-[var(--background)]")}>
                    <span className="flex items-center justify-between gap-2">
                      <span className="font-heading font-bold text-[0.92rem] flex items-center gap-1.5">{r.locked && <Lock className="w-3.5 h-3.5 text-[var(--muted-foreground)]" />}{r.name}</span>
                      <span className="text-[0.75rem] font-semibold text-[var(--muted-foreground)] flex items-center gap-1"><UsersIcon className="w-3.5 h-3.5" />{n}</span>
                    </span>
                    <span className="block text-[0.78rem] text-[var(--muted-foreground)] mt-0.5 line-clamp-2">{r.description || "No description yet"}</span>
                    {!r.builtIn && <Badge variant="info" className="mt-2">{r.id === draft?.id && isNew ? "Not saved" : "Custom"}</Badge>}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <section className="bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-sm overflow-hidden" aria-label={`${role.name} permissions`}>
          <div className="px-6 py-5 border-b border-[var(--border)] bg-[var(--background)] flex items-start justify-between gap-6">
            <div className="flex-1 min-w-0 flex flex-col gap-3">
              {role.builtIn ? (
                <div>
                  <h2 className="text-[1.15rem] font-heading font-extrabold m-0 flex items-center gap-2">{role.name}<Badge variant="muted">Built-in</Badge></h2>
                  <p className="text-[0.85rem] text-[var(--muted-foreground)] m-0 mt-1">{role.description}</p>
                </div>
              ) : (
                <div className="grid grid-cols-[1fr_2fr] gap-3">
                  <label className="flex flex-col gap-1"><span className="text-[0.8rem] font-bold">Role name</span>
                    <input aria-label="Role name" className={inputClass} value={role.name} onChange={(e) => edit({ name: e.target.value })} />
                    {nameError && <span className="text-[0.75rem] text-[var(--destructive)]">{nameError}</span>}
                  </label>
                  <label className="flex flex-col gap-1"><span className="text-[0.8rem] font-bold">Description</span>
                    <input aria-label="Description" className={inputClass} value={role.description} onChange={(e) => edit({ description: e.target.value })} placeholder="Who is this role for?" />
                  </label>
                </div>
              )}
              <p className="m-0 text-[0.82rem] text-[var(--muted-foreground)]">
                {holders(role.id).length} {holders(role.id).length === 1 ? "person has" : "people have"} this role.{" "}
                {holders(role.id).length > 0 && <Link href={`/crm/settings/users?role=${encodeURIComponent(role.name)}`} className="font-semibold text-[var(--primary)]">See who</Link>}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {!isNew && <Button variant="outline" size="sm" onClick={() => startCopy(saved ?? role)}><Copy className="w-4 h-4 mr-1.5" /> Copy</Button>}
              {!role.builtIn && !isNew && (
                <Button variant="outline" size="sm" onClick={() => (holders(role.id).length ? toast.error(`Move its ${holders(role.id).length} people to another role first`) : setDeleting(true))}><Trash2 className="w-4 h-4 mr-1.5" /> Delete</Button>
              )}
            </div>
          </div>

          {role.locked && <div className="px-6 pt-5"><Alert tone="info" title="Admin can't be edited">Admins always have full access, so there is always someone who can manage users and fix permissions.</Alert></div>}

          <div className="p-6">
            <table className="w-full border-collapse text-[0.88rem]">
              <thead>
                <tr>
                  <th className="text-left py-2 pr-4 font-heading text-[0.78rem] uppercase tracking-wider text-[var(--muted-foreground)]">Area</th>
                  {ACCESS_LEVELS.map((l) => (
                    <th key={l.id} className="py-2 px-2 text-center w-[120px]">
                      <span className="block font-heading text-[0.78rem] uppercase tracking-wider text-[var(--muted-foreground)]">{l.label}</span>
                      <span className="block text-[0.7rem] font-normal text-[var(--muted-foreground)] normal-case">{l.hint}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MODULES.map((m) => (
                  <tr key={m.id} className="border-t border-[var(--border)]">
                    <td className="py-3 pr-4">
                      <div className="font-semibold">{m.label}</div>
                      <div className="text-[0.75rem] text-[var(--muted-foreground)]">Full also allows: {m.full.toLowerCase()}</div>
                    </td>
                    {ACCESS_LEVELS.map((l) => {
                      const on = role.access[m.id] === l.id;
                      return (
                        <td key={l.id} className="py-3 px-2 text-center">
                          <button type="button" role="radio" aria-checked={on} aria-label={`${m.label}: ${l.label}`} disabled={role.locked}
                            onClick={() => setAccess(m.id, l.id)}
                            className={cn("w-6 h-6 rounded-full border-2 inline-flex items-center justify-center transition-colors disabled:cursor-not-allowed",
                              on ? "border-[var(--primary)] bg-[var(--primary)]" : "border-[var(--input)] hover:border-[var(--primary)]", role.locked && !on && "opacity-40")}>
                            {on && <span className="w-2 h-2 rounded-full bg-[var(--primary-foreground)]" />}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!role.locked && (
            <div className="px-6 py-4 border-t border-[var(--border)] bg-[var(--background)] flex items-center justify-between gap-4">
              <span className="text-[0.82rem] text-[var(--muted-foreground)]">{dirty ? (isNew ? "New role, not saved yet" : `${changes.length + (renamed ? 1 : 0)} unsaved change${changes.length + (renamed ? 1 : 0) === 1 ? "" : "s"}`) : "No changes"}</span>
              <div className="flex gap-2">
                {dirty && <Button variant="outline" onClick={() => { setDraft(null); if (isNew) select(roles[0].id); }}>Discard</Button>}
                <Button disabled={!dirty || !!nameError} onClick={() => (isNew || holders(role.id).length === 0 ? commit() : setConfirming(true))}><Save className="w-4 h-4 mr-2" /> {isNew ? "Create role" : "Save changes"}</Button>
              </div>
            </div>
          )}
        </section>
      </div>

      <ConfirmDialog
        isOpen={confirming}
        onClose={() => setConfirming(false)}
        onConfirm={commit}
        icon={<ShieldCheck className="w-6 h-6" />}
        title={`Change what ${role.name} can do?`}
        description={`This applies straight away to the ${holders(role.id).length} ${holders(role.id).length === 1 ? "person" : "people"} with this role.`}
        impact={[...(renamed && saved ? [`Renamed from ${saved.name}`] : []), ...changes]}
        confirmLabel="Save changes"
      />
      <ConfirmDialog
        isOpen={deleting}
        onClose={() => setDeleting(false)}
        onConfirm={() => { deleteRole(role.id); toast.success(`${role.name} role deleted`); setDeleting(false); select(roles[0].id); }}
        tone="danger"
        icon={<Trash2 className="w-6 h-6" />}
        title={`Delete the ${role.name} role?`}
        description="Nobody has this role, so no one loses access."
        confirmLabel="Delete role"
      />
    </div>
  );
}
