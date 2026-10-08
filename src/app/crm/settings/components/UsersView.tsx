"use client";

import { useUrlFlag } from "@/lib/useUrlFlag";
import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { UserPlus, Eye, Shield, UserX, UserCheck, Send, Inbox, X, Clock, Check } from "lucide-react";
import { Table, TableActionsCell, TableActionsHead, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import { RowActionsMenu } from "@/components/ui/RowActionsMenu";
import { PageHeader } from "@/components/ui/PageHeader";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Drawer } from "@/components/ui/Drawer";
import { Modal } from "@/components/ui/Modal";
import { toast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";
import { formatDate, formatPhone, toE164 } from "@/lib/format";
import {
  ACCESS_LEVELS, CURRENT_USER_ID, DEACTIVATE_REASONS, MODULES, STALE_DAYS, accessChanges, adminGuard, changeRole, deactivateUser,
  inviteUser, reactivateUser, resendInvite, roleName, useAudit, useRoles, useUsers, type User,
} from "@/lib/mock/settings";
import { inputClass } from "@/app/crm/catalogue/components/editor";
import { Avatar, SearchBox, Tabs, ago, dateTime, daysSince } from "./shared";

const ANY = "All roles";
const VIEWS = [
  { id: "active", label: "Active" },
  { id: "stale", label: `Not signed in ${STALE_DAYS}+ days` },
  { id: "invited", label: "Invited" },
  { id: "deactivated", label: "Deactivated" },
] as const;
type ViewId = (typeof VIEWS)[number]["id"];
const isStale = (u: User) => u.status === "Active" && !!u.lastActiveAt && daysSince(u.lastActiveAt) >= STALE_DAYS;
const inView = (u: User, v: ViewId) => (v === "active" ? u.status === "Active" : v === "stale" ? isStale(u) : v === "invited" ? u.status === "Invited" : u.status === "Deactivated");

export function UsersView() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const users = useUsers();
  const roles = useRoles();
  const view = (params.get("view") as ViewId) ?? "active";
  const role = params.get("role") ?? ANY;
  const [query, setQuery] = React.useState("");
  const [inviting, setInviting] = useUrlFlag("invite");
  const [viewing, setViewing] = React.useState<User | null>(null);
  const [roleFor, setRoleFor] = React.useState<User | null>(null);
  const [deactivating, setDeactivating] = React.useState<User | null>(null);
  const [reactivating, setReactivating] = React.useState<User | null>(null);

  const setParams = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(patch)) { if (!v || v === ANY || (k === "view" && v === "active")) next.delete(k); else next.set(k, v); }
    router.replace(next.toString() ? `${pathname}?${next}` : pathname, { scroll: false });
  };

  const q = query.trim().toLowerCase();
  const base = users.filter((u) => (role === ANY || roleName(u.roleId) === role) && (!q || `${u.name} ${u.email}`.toLowerCase().includes(q)));
  const counts = Object.fromEntries(VIEWS.map((v) => [v.id, base.filter((u) => inView(u, v.id)).length])) as Record<ViewId, number>;
  const rows = base.filter((u) => inView(u, view)).sort((a, b) => a.name.localeCompare(b.name));
  const staleAll = users.filter(isStale).length;
  const live = (u: User) => users.find((x) => x.id === u.id) ?? u;

  const guarded = (u: User, then: () => void) => { const why = adminGuard(u.id); if (why) toast.error(why); else then(); };
  const actionsFor = (u: User) => [
    { label: "View details", icon: Eye, onSelect: () => setViewing(u) },
    ...(u.status !== "Deactivated" ? [{ label: "Change role…", icon: Shield, onSelect: () => setRoleFor(u) }] : []),
    ...(u.status === "Invited" ? [{ label: "Resend invite", icon: Send, onSelect: () => { resendInvite(u.id); toast.success(`Invite sent again to ${u.email}`); } }] : []),
    ...(u.status === "Deactivated" ? [{ label: "Reactivate", icon: UserCheck, onSelect: () => setReactivating(u) }] : []),
    ...(u.status !== "Deactivated" ? [{ label: u.status === "Invited" ? "Cancel invite" : "Deactivate", icon: UserX, danger: true, onSelect: () => guarded(u, () => setDeactivating(u)) }] : []),
  ];

  return (
    <div className="max-w-[1600px] w-full mx-auto">
      <PageHeader
        title="Users"
        subtitle="Who can sign in to the CRM, and which role decides what they can do."
        actions={<>
          <Link href="/crm/settings/roles"><Button variant="outline"><Shield className="w-4 h-4 mr-2" /> Roles & permissions</Button></Link>
          <Button onClick={() => setInviting(true)}><UserPlus className="w-4 h-4 mr-2" /> Invite user</Button>
        </>}
      />

      {staleAll > 0 && view !== "stale" && (
        <Alert tone="warning" className="mb-6" title={`${staleAll} active user${staleAll === 1 ? " hasn't" : "s haven't"} signed in for ${STALE_DAYS}+ days`}
          actions={<Button size="sm" variant="outline" onClick={() => setParams({ view: "stale" })}>Review them</Button>}>
          Unused accounts are a security risk. Deactivate the ones that no longer need access.
        </Alert>
      )}

      <div className="mb-6"><Tabs label="User views" tabs={[...VIEWS]} value={view} onChange={(v) => setParams({ view: v })} counts={counts} urgent={["stale"]} /></div>

      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-sm flex flex-col">
        <div className="p-6 flex items-end gap-4 flex-wrap border-b border-[var(--border)]">
          <SearchBox id="user-search" value={query} onChange={setQuery} placeholder="Name or email" />
          <div className="flex flex-col gap-1.5">
            <span className="text-[0.85rem] font-bold">Role</span>
            <Select ariaLabel="Role" value={role} onChange={(v) => setParams({ role: v })} options={[ANY, ...roles.map((r) => r.name)]} className="w-[220px] h-[2.8rem]" />
          </div>
          {(query || role !== ANY) && <button onClick={() => { setQuery(""); setParams({ role: null }); }} className="h-[2.8rem] px-2 text-[0.85rem] font-semibold text-[var(--primary)] flex items-center gap-1"><X className="w-4 h-4" /> Clear filters</button>}
        </div>
        <div className="w-full overflow-x-auto">
          <Table className="min-w-full border-none shadow-none rounded-none">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                {["User", "Role", view === "invited" ? "Invited" : view === "deactivated" ? "Deactivated" : "Last signed in", "Phone", "Added", "Status"].map((h) => <TableHead key={h} className="whitespace-nowrap">{h}</TableHead>)}
                <TableActionsHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow className="hover:bg-transparent"><TableCell colSpan={7} className="py-16 text-center">
                  <div className="w-12 h-12 rounded-full bg-[var(--accent)] flex items-center justify-center mb-3 mx-auto"><Inbox className="w-5 h-5 text-[var(--primary)]" /></div>
                  <p className="font-semibold m-0">No users here</p>
                </TableCell></TableRow>
              ) : rows.map((u) => (
                <TableRow key={u.id} onClick={() => setViewing(u)} className="cursor-pointer group">
                  <TableCell className="whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <Avatar name={u.name} muted={u.status !== "Active"} />
                      <div>
                        <div className="font-semibold group-hover:text-[var(--primary)]">{u.name}{u.id === CURRENT_USER_ID && <span className="ml-2 text-[0.75rem] font-semibold text-[var(--muted-foreground)]">(you)</span>}</div>
                        <div className="text-[0.8rem] text-[var(--muted-foreground)]">{u.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell><Badge variant={u.roleId === "admin" ? "secondary" : "muted"}>{roleName(u.roleId)}</Badge></TableCell>
                  <TableCell className="whitespace-nowrap text-[0.88rem]">
                    {u.status === "Invited" ? <span>{ago(u.invitedAt)}<span className="block text-[0.78rem] text-[var(--muted-foreground)]">Not accepted yet</span></span>
                      : u.status === "Deactivated" ? <span>{formatDate(u.deactivatedAt)}<span className="block text-[0.78rem] text-[var(--muted-foreground)] max-w-[220px] truncate" title={u.deactivatedReason}>{u.deactivatedReason}</span></span>
                      : <span className={cn(isStale(u) && "text-[var(--warning)] font-semibold flex items-center gap-1")}>{isStale(u) && <Clock className="w-3.5 h-3.5" />}{ago(u.lastActiveAt)}</span>}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-[0.88rem]">{formatPhone(u.phone)}</TableCell>
                  <TableCell className="whitespace-nowrap text-[0.85rem]">{formatDate(u.createdAt)}<span className="block text-[0.78rem] text-[var(--muted-foreground)]">by {u.createdBy}</span></TableCell>
                  <TableCell><StatusBadge status={u.status === "Active" ? "Active" : u.status === "Invited" ? "Pending" : "Draft"} label={u.status} /></TableCell>
                  <TableActionsCell><RowActionsMenu label={`Actions for ${u.name}`} actions={actionsFor(u)} /></TableActionsCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {inviting && <InviteDrawer onClose={() => setInviting(false)} />}
      <UserDrawer user={viewing ? live(viewing) : null} onClose={() => setViewing(null)}
        onChangeRole={(u) => setRoleFor(u)} onDeactivate={(u) => guarded(u, () => setDeactivating(u))} onReactivate={(u) => setReactivating(u)} />
      {roleFor && <ChangeRoleModal user={live(roleFor)} onClose={() => setRoleFor(null)} />}
      <ConfirmDialog
        isOpen={!!deactivating}
        onClose={() => setDeactivating(null)}
        onConfirm={(r) => { if (deactivating) { deactivateUser(deactivating.id, r?.reason ?? "Other", r?.note); toast.success(deactivating.status === "Invited" ? `Invite for ${deactivating.name} cancelled` : `${deactivating.name} deactivated`); } setDeactivating(null); }}
        tone="danger"
        icon={<UserX className="w-6 h-6" />}
        title={deactivating?.status === "Invited" ? `Cancel the invite for ${deactivating?.name}?` : `Deactivate ${deactivating?.name}?`}
        description={deactivating?.status === "Invited" ? "The invite link stops working." : "They can't sign in from now on."}
        impact={deactivating?.status === "Invited" ? undefined : [
          "Their name stays on everything they created or changed",
          "Leads they own keep their owner; reassign them from Pipeline › Leads",
          "You can reactivate them later with the same role",
        ]}
        reasons={DEACTIVATE_REASONS}
        confirmLabel={deactivating?.status === "Invited" ? "Cancel invite" : "Deactivate"}
      />
      <ConfirmDialog
        isOpen={!!reactivating}
        onClose={() => setReactivating(null)}
        onConfirm={() => { if (reactivating) { reactivateUser(reactivating.id); toast.success(`${reactivating.name} reactivated`); } setReactivating(null); }}
        icon={<UserCheck className="w-6 h-6" />}
        title={`Reactivate ${reactivating?.name}?`}
        description={reactivating?.lastActiveAt ? "They can sign in again straight away." : "They never accepted their invite, so a new one is sent."}
        impact={reactivating ? [`Role: ${roleName(reactivating.roleId)}. Change it first if their job has changed.`] : undefined}
        confirmLabel="Reactivate"
      />
    </div>
  );
}

/* ---------------- Invite ---------------- */

function InviteDrawer({ onClose }: { onClose: () => void }) {
  const users = useUsers();
  const roles = useRoles();
  const [v, setV] = React.useState({ name: "", email: "", phone: "", roleId: "" });
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const set = (k: keyof typeof v, value: string) => { setV((p) => ({ ...p, [k]: value })); setErrors((e) => ({ ...e, [k]: "" })); };
  const email = v.email.trim().toLowerCase();
  const outside = /@/.test(email) && !/@(cicod\.com|crowninteractive\.com)$/.test(email);

  const submit = () => {
    const e: Record<string, string> = {};
    if (!v.name.trim()) e.name = "Enter their name";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Enter a valid email";
    else if (users.some((u) => u.email === email && u.status !== "Deactivated")) e.email = "Someone already uses this email";
    const phone = v.phone.trim() ? toE164(v.phone) : "";
    if (phone === null) e.phone = "Enter a Nigerian mobile number, e.g. 0803 123 4567";
    if (!v.roleId) e.roleId = "Choose a role";
    if (Object.keys(e).length) return setErrors(e);
    const reactivate = users.find((u) => u.email === email && u.status === "Deactivated");
    if (reactivate) { e.email = `${reactivate.name} had this email and was deactivated. Reactivate them instead.`; return setErrors(e); }
    const u = inviteUser({ name: v.name.trim(), email, phone: phone || "", roleId: v.roleId });
    toast.success(`Invite sent to ${u.email}`);
    onClose();
  };

  return (
    <Drawer isOpen onClose={onClose} title="Invite a user" subtitle="They get an email with a link to set their own password. Nobody else ever sees it."
      footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={submit}><Send className="w-4 h-4 mr-2" /> Send invite</Button></>}>
      <div className="flex flex-col gap-5">
        <FormField label="Full name" required error={errors.name}><input className={inputClass} value={v.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Amaka Okeke" /></FormField>
        <FormField label="Work email" required error={errors.email} hint={!errors.email && outside ? "This isn't a company address. Check it's right before sending." : undefined} hintTone={outside ? "warning" : undefined}>
          <input className={inputClass} type="email" value={v.email} onChange={(e) => set("email", e.target.value)} placeholder="name@cicod.com" />
        </FormField>
        <FormField label="Phone" error={errors.phone} hint={!errors.phone && v.phone && toE164(v.phone) ? `Saved as ${formatPhone(toE164(v.phone)!)}` : "Optional"}>
          <input className={inputClass} value={v.phone} onChange={(e) => set("phone", e.target.value)} placeholder="0803 123 4567" />
        </FormField>
        <div className="flex flex-col gap-2">
          <span className="text-[0.85rem] font-bold">Role <span className="text-[var(--destructive)]">*</span></span>
          <div role="radiogroup" aria-label="Role" className="flex flex-col gap-2">
            {roles.map((r) => (
              <button key={r.id} type="button" role="radio" aria-checked={v.roleId === r.id} onClick={() => set("roleId", r.id)}
                className={cn("text-left px-4 py-3 rounded-lg border-[1.5px] transition-colors flex items-start gap-3", v.roleId === r.id ? "border-[var(--primary)] bg-[var(--accent)]" : "border-[var(--border)] hover:border-[var(--primary)]/50")}>
                <span className={cn("mt-0.5 w-4 h-4 rounded-full border-2 shrink-0", v.roleId === r.id ? "border-[var(--primary)] bg-[var(--primary)]" : "border-[var(--input)]")} />
                <span><span className="font-heading font-semibold text-[0.9rem] block">{r.name}</span><span className="text-[0.78rem] text-[var(--muted-foreground)]">{r.description}</span></span>
              </button>
            ))}
          </div>
          {errors.roleId && <span className="text-[0.78rem] text-[var(--destructive)]">{errors.roleId}</span>}
        </div>
      </div>
    </Drawer>
  );
}

function FormField({ label, required, error, hint, hintTone, children }: { label: string; required?: boolean; error?: string; hint?: string; hintTone?: "warning"; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[0.85rem] font-bold">{label}{required && <span className="text-[var(--destructive)]"> *</span>}</span>
      {children}
      {error ? <span className="text-[0.78rem] text-[var(--destructive)]">{error}</span> : hint && <span className={cn("text-[0.78rem]", hintTone === "warning" ? "text-[var(--warning)] font-semibold" : "text-[var(--muted-foreground)]")}>{hint}</span>}
    </label>
  );
}

/* ---------------- Change role ---------------- */

function ChangeRoleModal({ user, onClose }: { user: User; onClose: () => void }) {
  const roles = useRoles();
  const [to, setTo] = React.useState(user.roleId);
  const from = roles.find((r) => r.id === user.roleId)!;
  const target = roles.find((r) => r.id === to)!;
  const changes = to === user.roleId ? [] : accessChanges(from.access, target.access);
  const guard = user.roleId === "admin" && to !== "admin" ? adminGuard(user.id) : null;
  const save = () => { changeRole(user.id, to); toast.success(`${user.name} is now ${target.name}`); onClose(); };
  return (
    <Modal isOpen onClose={onClose} title={`Change role: ${user.name}`} maxWidth="max-w-xl"
      footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={save} disabled={to === user.roleId || !!guard}>{to === user.roleId ? "Choose a new role" : `Make ${target.name}`}</Button></>}>
      <div className="flex flex-col gap-4">
        <div role="radiogroup" aria-label="New role" className="grid grid-cols-2 gap-2">
          {roles.map((r) => (
            <button key={r.id} type="button" role="radio" aria-checked={to === r.id} onClick={() => setTo(r.id)}
              className={cn("text-left px-3 py-2.5 rounded-lg border-[1.5px] transition-colors", to === r.id ? "border-[var(--primary)] bg-[var(--accent)]" : "border-[var(--border)] hover:border-[var(--primary)]/50")}>
              <span className="font-heading font-semibold text-[0.88rem] flex items-center justify-between">{r.name}{r.id === user.roleId && <span className="text-[0.7rem] font-semibold text-[var(--muted-foreground)]">Current</span>}</span>
              <span className="text-[0.75rem] text-[var(--muted-foreground)] line-clamp-1">{r.description}</span>
            </button>
          ))}
        </div>
        {guard && <Alert tone="destructive" title="Can't change this role">{guard}</Alert>}
        {!guard && changes.length > 0 && (
          <div className="rounded-lg border border-[var(--border)] p-4">
            <div className="text-[0.8rem] font-bold uppercase tracking-wider text-[var(--muted-foreground)] mb-2">What changes for {user.name.split(" ")[0]}</div>
            <ul className="m-0 pl-0 list-none flex flex-col gap-1.5 text-[0.86rem]">
              {changes.map((c) => <li key={c} className="flex gap-2"><span className="text-[var(--primary)]">•</span>{c}</li>)}
            </ul>
          </div>
        )}
      </div>
    </Modal>
  );
}

/* ---------------- Details ---------------- */

function UserDrawer({ user, onClose, onChangeRole, onDeactivate, onReactivate }: { user: User | null; onClose: () => void; onChangeRole: (u: User) => void; onDeactivate: (u: User) => void; onReactivate: (u: User) => void }) {
  const roles = useRoles();
  const auditLog = useAudit();
  if (!user) return <Drawer isOpen={false} onClose={onClose} title="">{null}</Drawer>;
  const role = roles.find((r) => r.id === user.roleId);
  const history = auditLog.filter((a) => a.target === user.name || a.actor === user.name).slice(0, 6);
  return (
    <Drawer isOpen onClose={onClose} title={user.name} subtitle={<span className="flex items-center gap-2"><StatusBadge status={user.status === "Active" ? "Active" : user.status === "Invited" ? "Pending" : "Draft"} label={user.status} />{user.email}</span>}
      footer={user.status === "Deactivated"
        ? <Button onClick={() => { onClose(); onReactivate(user); }}><UserCheck className="w-4 h-4 mr-2" /> Reactivate</Button>
        : <><Button variant="outline" onClick={() => { onClose(); onDeactivate(user); }}>{user.status === "Invited" ? "Cancel invite" : "Deactivate"}</Button><Button onClick={() => { onClose(); onChangeRole(user); }}><Shield className="w-4 h-4 mr-2" /> Change role</Button></>}>
      <dl className="grid grid-cols-[130px_1fr] gap-y-3 text-[0.88rem] m-0">
        <dt className="text-[var(--muted-foreground)]">Phone</dt><dd className="m-0">{formatPhone(user.phone)}</dd>
        <dt className="text-[var(--muted-foreground)]">Last signed in</dt><dd className="m-0">{user.lastActiveAt ? dateTime(user.lastActiveAt) : "Never"}</dd>
        <dt className="text-[var(--muted-foreground)]">Added</dt><dd className="m-0">{formatDate(user.createdAt)} by {user.createdBy}</dd>
        {user.deactivatedReason && <><dt className="text-[var(--muted-foreground)]">Deactivated</dt><dd className="m-0">{formatDate(user.deactivatedAt)} · {user.deactivatedReason}</dd></>}
      </dl>
      {role && (
        <div className="mt-6">
          <div className="text-[0.8rem] font-bold uppercase tracking-wider text-[var(--muted-foreground)] mb-2">Role: {role.name}</div>
          <ul className="m-0 p-0 list-none rounded-lg border border-[var(--border)] divide-y divide-[var(--border)]">
            {MODULES.map((m) => {
              const a = role.access[m.id];
              return (
                <li key={m.id} className="px-4 py-2.5 flex items-center justify-between text-[0.86rem]">
                  <span>{m.label}</span>
                  <span className={cn("font-semibold flex items-center gap-1", a === "none" ? "text-[var(--muted-foreground)]" : a === "full" ? "text-[var(--primary)]" : "")}>{a !== "none" && <Check className="w-3.5 h-3.5" />}{ACCESS_LEVELS.find((l) => l.id === a)!.label}</span>
                </li>
              );
            })}
          </ul>
          <Link href={`/crm/settings/roles?role=${role.id}`} className="inline-block mt-2 text-[0.82rem] font-semibold text-[var(--primary)]">Open {role.name} role</Link>
        </div>
      )}
      <div className="mt-6">
        <div className="text-[0.8rem] font-bold uppercase tracking-wider text-[var(--muted-foreground)] mb-2">History</div>
        {history.length === 0 ? <p className="m-0 text-[0.85rem] text-[var(--muted-foreground)]">No changes recorded yet.</p> : (
          <ul className="m-0 p-0 list-none flex flex-col gap-3">
            {history.map((a) => <li key={a.id} className="text-[0.85rem]"><b>{a.action}</b>{a.detail ? ` · ${a.detail}` : ""}<span className="block text-[0.78rem] text-[var(--muted-foreground)]">{dateTime(a.at)} · by {a.actor}</span></li>)}
          </ul>
        )}
      </div>
    </Drawer>
  );
}
