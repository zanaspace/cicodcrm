"use client";

import { useUrlFlag } from "@/lib/useUrlFlag";
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { KeyRound, Copy, Check, Ban, Eye, Inbox, AlertTriangle } from "lucide-react";
import { Table, TableActionsCell, TableActionsHead, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Alert } from "@/components/ui/Alert";
import { RowActionsMenu } from "@/components/ui/RowActionsMenu";
import { PageHeader } from "@/components/ui/PageHeader";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Modal } from "@/components/ui/Modal";
import { toast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";
import { useCustomers } from "@/lib/mock/customers";
import { KEY_PREFIX, REVOKE_REASONS, generateKey, revokeKey, useApiKeys, type ApiKey } from "@/lib/mock/settings";
import { inputClass } from "@/app/crm/catalogue/components/editor";
import { SearchBox, Tabs, ago, dateTime, daysSince } from "./shared";

const UNUSED_DAYS = 30;
const masked = (k: ApiKey) => `${KEY_PREFIX}••••${k.last4}`;

export function ApiKeysView() {
  const router = useRouter();
  const keys = useApiKeys();
  const [tab, setTab] = React.useState<"Active" | "Revoked">("Active");
  const [query, setQuery] = React.useState("");
  const [generating, setGenerating] = useUrlFlag("generate");
  const [revoking, setRevoking] = React.useState<ApiKey | null>(null);
  const q = query.trim().toLowerCase();
  const base = keys.filter((k) => !q || `${k.company} ${k.cicod} ${k.label}`.toLowerCase().includes(q));
  const rows = base.filter((k) => k.status === tab);
  const unused = keys.filter((k) => k.status === "Active" && !k.lastUsedAt && daysSince(k.createdAt) >= UNUSED_DAYS);

  return (
    <div className="max-w-[1600px] w-full mx-auto">
      <PageHeader title="Merchant API keys" subtitle="Keys let a merchant's own systems connect to CICOD. A key is shown once, when it's generated."
        actions={<Button onClick={() => setGenerating(true)}><KeyRound className="w-4 h-4 mr-2" /> Generate key</Button>} />

      {unused.length > 0 && (
        <Alert tone="warning" className="mb-6" title={`${unused.length} active key${unused.length === 1 ? " has" : "s have"} never been used`}>
          {unused.map((k) => `${k.company} (${k.label})`).join(", ")}: generated over {UNUSED_DAYS} days ago and never called. Revoke keys nobody needs.
        </Alert>
      )}

      <div className="mb-6"><Tabs label="Key status" tabs={[{ id: "Active", label: "Active" }, { id: "Revoked", label: "Revoked" }]} value={tab} onChange={setTab}
        counts={{ Active: base.filter((k) => k.status === "Active").length, Revoked: base.filter((k) => k.status === "Revoked").length }} /></div>

      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-sm flex flex-col">
        <div className="p-6 border-b border-[var(--border)]"><SearchBox id="key-search" value={query} onChange={setQuery} placeholder="Customer, CICOD number or label" /></div>
        <div className="w-full overflow-x-auto">
          <Table className="min-w-full border-none shadow-none rounded-none">
            <TableHeader><TableRow className="hover:bg-transparent">
              {["Customer", "Label", "Key", "Created", tab === "Active" ? "Last used" : "Revoked", "Status"].map((h) => <TableHead key={h} className="whitespace-nowrap">{h}</TableHead>)}
              <TableActionsHead />
            </TableRow></TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow className="hover:bg-transparent"><TableCell colSpan={7} className="py-16 text-center">
                  <div className="w-12 h-12 rounded-full bg-[var(--accent)] flex items-center justify-center mb-3 mx-auto"><Inbox className="w-5 h-5 text-[var(--primary)]" /></div>
                  <p className="font-semibold m-0">No {tab.toLowerCase()} keys</p>
                </TableCell></TableRow>
              ) : rows.map((k) => (
                <TableRow key={k.id}>
                  <TableCell className="whitespace-nowrap">
                    <Link href={`/crm/customer-mgt/customers/${k.cicod}`} className="font-semibold hover:text-[var(--primary)]">{k.company}</Link>
                    <div className="text-[0.8rem] text-[var(--muted-foreground)]">#{k.cicod}</div>
                  </TableCell>
                  <TableCell className="text-[0.88rem]">{k.label}</TableCell>
                  <TableCell className="font-mono text-[0.82rem] whitespace-nowrap">{masked(k)}</TableCell>
                  <TableCell className="whitespace-nowrap text-[0.85rem]">{dateTime(k.createdAt)}<span className="block text-[0.78rem] text-[var(--muted-foreground)]">by {k.createdBy}</span></TableCell>
                  <TableCell className="whitespace-nowrap text-[0.85rem]">
                    {k.status === "Revoked"
                      ? <>{k.revokedAt ? dateTime(k.revokedAt) : "—"}<span className="block text-[0.78rem] text-[var(--muted-foreground)] max-w-[220px] truncate" title={k.revokeReason}>{k.revokeReason} · by {k.revokedBy}</span></>
                      : <span className={cn(!k.lastUsedAt && daysSince(k.createdAt) >= UNUSED_DAYS && "text-[var(--warning)] font-semibold")}>{ago(k.lastUsedAt, "Never used")}</span>}
                  </TableCell>
                  <TableCell><StatusBadge status={k.status === "Active" ? "Active" : "Suspended"} label={k.status} /></TableCell>
                  <TableActionsCell><RowActionsMenu label={`Actions for ${k.company} key ${k.last4}`} actions={[
                    { label: "Open customer", icon: Eye, onSelect: () => router.push(`/crm/customer-mgt/customers/${k.cicod}`) },
                    ...(k.status === "Active" ? [{ label: "Revoke key", icon: Ban, danger: true, onSelect: () => setRevoking(k) }] : []),
                  ]} /></TableActionsCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {generating && <GenerateKeyModal onClose={() => setGenerating(false)} />}
      <ConfirmDialog
        isOpen={!!revoking}
        onClose={() => setRevoking(null)}
        onConfirm={(r) => { if (revoking) { revokeKey(revoking.id, r?.reason ?? "Other", r?.note); toast.success(`Key ending ${revoking.last4} revoked`); } setRevoking(null); }}
        tone="danger"
        icon={<Ban className="w-6 h-6" />}
        title={`Revoke ${revoking?.company}'s "${revoking?.label}" key?`}
        description="Anything using this key stops working straight away."
        impact={revoking ? [`Key ${masked(revoking)}`, "This can't be undone. Generate a new key if they still need access."] : undefined}
        reasons={REVOKE_REASONS}
        confirmLabel="Revoke key"
      />
    </div>
  );
}

/** Two steps in one dialog: choose the customer and label, then show the key once. */
function GenerateKeyModal({ onClose }: { onClose: () => void }) {
  const customers = useCustomers();
  const keys = useApiKeys();
  const [pick, setPick] = React.useState("");
  const [label, setLabel] = React.useState("");
  const [secret, setSecret] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);
  const optionFor = (c: { company: string; cicod: string }) => `${c.company} (#${c.cicod})`;
  const customer = customers.find((c) => optionFor(c) === pick);
  const existing = customer ? keys.filter((k) => k.cicod === customer.cicod && k.status === "Active") : [];
  const blocked = customer?.status === "Suspended" ? `${customer.company} is suspended. Reactivate the customer before giving them API access.` : "";
  const ready = !!customer && !!label.trim() && !blocked;

  const generate = () => { if (!customer) return; setSecret(generateKey(customer, label)); };
  const copy = async () => {
    try { await navigator.clipboard.writeText(secret!); setCopied(true); toast.success("Key copied"); }
    catch { toast.error("Couldn't copy. Select the key and copy it by hand."); }
  };

  if (secret) {
    return (
      <Modal isOpen onClose={onClose} title="Copy the key now" maxWidth="max-w-xl"
        footer={<Button onClick={onClose}>{copied ? "Done" : "I've saved it"}</Button>}>
        <div className="flex flex-col gap-4">
          <Alert tone="warning" title="You won't see this key again">Only the last four characters are kept. If it&apos;s lost, revoke it and generate a new one.</Alert>
          <div className="text-[0.85rem]"><b>{customer?.company}</b> · {label}</div>
          <div className="flex items-center gap-2">
            <code data-testid="new-key" className="flex-1 min-w-0 break-all rounded-lg border-[1.5px] border-[var(--border)] bg-[var(--background)] px-4 py-3 font-mono text-[0.85rem] select-all">{secret}</code>
            <Button variant="outline" onClick={copy}>{copied ? <Check className="w-4 h-4 mr-1.5" /> : <Copy className="w-4 h-4 mr-1.5" />}{copied ? "Copied" : "Copy"}</Button>
          </div>
          <p className="m-0 text-[0.8rem] text-[var(--muted-foreground)]">Send it to the merchant through a secure channel, never by SMS or in a support chat.</p>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen onClose={onClose} title="Generate a merchant API key" maxWidth="max-w-xl"
      footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={generate} disabled={!ready}><KeyRound className="w-4 h-4 mr-2" /> Generate key</Button></>}>
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <span className="text-[0.85rem] font-bold">Customer <span className="text-[var(--destructive)]">*</span></span>
          <Select ariaLabel="Customer" searchable placeholder="Search by name or CICOD number" value={pick} onChange={setPick} options={customers.map(optionFor)} />
          {blocked ? <span className="text-[0.78rem] text-[var(--destructive)]">{blocked}</span>
            : existing.length > 0 && <span className="text-[0.78rem] text-[var(--warning)] font-semibold flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" />{customer?.company} already has {existing.length} active key{existing.length === 1 ? "" : "s"} ({existing.map((k) => k.label).join(", ")}).</span>}
        </div>
        <label className="flex flex-col gap-1.5">
          <span className="text-[0.85rem] font-bold">What it&apos;s for <span className="text-[var(--destructive)]">*</span></span>
          <input className={inputClass} value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Website checkout, ERP connector" maxLength={40} />
          <span className="text-[0.78rem] text-[var(--muted-foreground)]">Helps the next person decide whether it&apos;s safe to revoke.</span>
        </label>
      </div>
    </Modal>
  );
}
