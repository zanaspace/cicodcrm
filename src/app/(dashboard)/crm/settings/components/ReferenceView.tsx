"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, Eye, Pencil, Plus, Power, PowerOff, MapPin } from "lucide-react";
import { Table, TableActionsCell, TableActionsHead, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Select";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Alert } from "@/components/ui/Alert";
import { RowActionsMenu } from "@/components/ui/RowActionsMenu";
import { PageHeader } from "@/components/ui/PageHeader";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Drawer } from "@/components/ui/Drawer";
import { Modal } from "@/components/ui/Modal";
import { toast } from "@/components/ui/Toast";
import { EmptyState, QueryState } from "@/components/feedback/States";
import { cn } from "@/lib/utils";
import { usePermissions } from "@/lib/permissions";
import { useCustomersQuery } from "@/features/customers/queries";
import { usePaymentsQuery } from "@/features/billing/queries";
import {
  useAddArea, useAddBusinessType, useAddCountry, useAddRegion, useAddSector, useCountriesQuery, useCurrenciesQuery, usePaymentMethodsQuery,
  usePriceUsage, useRenameBusinessType, useRenameSector, useSectorsQuery, useSetBusinessTypeActive, useSetCountryEnabled, useSetCurrencyEnabled,
  useSetRegionActive, useSetSectorActive, useUpdatePaymentMethod, type PriceUsage,
} from "@/features/reference/queries";
import type { Customer } from "@/lib/mock/customers";
import type { Payment } from "@/lib/mock/billing";
import {
  MORE_COUNTRIES, customersInCountry, customersInRegion, customersInSector, customersWithType, sameName,
  type Country, type CurrencySetting, type PaymentMethodSetting, type Region, type Sector,
} from "@/lib/mock/settings";
import { inputClass } from "@/app/(dashboard)/crm/catalogue/components/editor";
import { SearchBox, Switch, Tabs, combineQueries, plural } from "./shared";

const TABS = [
  { id: "sectors", label: "Sectors & business types" },
  { id: "locations", label: "Locations" },
  { id: "currencies", label: "Currencies" },
  { id: "payments", label: "Payment methods" },
] as const;
type TabId = (typeof TABS)[number]["id"];
const NO_EDIT = "Your role can't change reference data";

export function ReferenceView() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const tab = (params.get("tab") as TabId) ?? "sectors";
  const sectors = useSectorsQuery().data;
  const countries = useCountriesQuery().data;
  const currencies = useCurrenciesQuery().data;
  const methods = usePaymentMethodsQuery().data;
  const counts: Partial<Record<TabId, number>> = {
    sectors: sectors?.filter((s) => s.active).length,
    locations: countries?.filter((c) => c.enabled).length,
    currencies: currencies?.filter((c) => c.enabled).length,
    payments: methods?.filter((m) => m.enabled).length,
  };
  return (
    <div className="max-w-[1600px] w-full mx-auto">
      <PageHeader title="Reference data" subtitle="The lists every form picks from. Only what's switched on here appears in customer, lead and partner forms." />
      <div className="mb-6"><Tabs label="Reference lists" tabs={[...TABS]} value={tab} counts={counts} onChange={(t) => router.replace(t === "sectors" ? pathname : `${pathname}?tab=${t}`, { scroll: false })} /></div>
      {tab === "sectors" && <SectorsTab />}
      {tab === "locations" && <LocationsTab />}
      {tab === "currencies" && <CurrenciesTab />}
      {tab === "payments" && <PaymentsTab />}
    </div>
  );
}

/* ---------------- shared bits ---------------- */

/** Clears itself by being re-keyed by the parent after a successful add. */
function AddInline({ label, placeholder, onAdd, validate, disabled, pending, error }: {
  label: string; placeholder: string; onAdd: (v: string) => void; validate: (v: string) => string; disabled?: boolean; pending?: boolean; error?: string;
}) {
  const [v, setV] = React.useState("");
  const [err, setErr] = React.useState("");
  const submit = () => { if (pending) return; const e = validate(v.trim()); if (e) return setErr(e); onAdd(v.trim()); setErr(""); };
  const shown = err || error;
  return (
    <div className="flex flex-col gap-1" title={disabled ? NO_EDIT : undefined}>
      <div className="flex gap-2">
        <input aria-label={label} value={v} disabled={disabled} onChange={(e) => { setV(e.target.value); setErr(""); }} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); submit(); } }} placeholder={placeholder}
          className="flex-1 min-w-0 h-10 px-3 rounded-md border-[1.5px] border-[var(--input)] bg-[var(--background)] text-[0.9rem] focus:outline-none focus:border-[var(--ring)] disabled:opacity-60" />
        <Button variant="outline" onClick={submit} disabled={!v.trim() || disabled || pending}><Plus className="w-4 h-4 mr-1" /> {pending ? "Adding…" : "Add"}</Button>
      </div>
      {shown && <span className="text-[0.78rem] text-[var(--destructive)]">{shown}</span>}
    </div>
  );
}

function RenameModal({ title, initial, onSave, onClose, validate, pending, error }: {
  title: string; initial: string; onSave: (v: string) => void; onClose: () => void; validate: (v: string) => string; pending?: boolean; error?: string;
}) {
  const [v, setV] = React.useState(initial);
  const err = (v.trim() === initial ? "" : validate(v.trim())) || error;
  return (
    <Modal isOpen onClose={onClose} title={title}
      footer={<><Button variant="outline" onClick={onClose} disabled={pending}>Cancel</Button><Button disabled={!v.trim() || v.trim() === initial || !!err || pending} onClick={() => onSave(v.trim())}>{pending ? "Saving…" : "Save name"}</Button></>}>
      <label className="flex flex-col gap-1.5">
        <span className="text-[0.85rem] font-bold">Name</span>
        <input aria-label="Name" className={inputClass} value={v} onChange={(e) => setV(e.target.value)} autoFocus />
        {err ? <span className="text-[0.78rem] text-[var(--destructive)]">{err}</span> : <span className="text-[0.78rem] text-[var(--muted-foreground)]">Customers that use the old name are updated too.</span>}
      </label>
    </Modal>
  );
}

const ListButton = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
  <button type="button" onClick={onClick} aria-current={active ? "true" : undefined}
    className={cn("w-full text-left px-5 py-3 transition-colors", active ? "bg-[var(--accent)]" : "hover:bg-[var(--background)]")}>{children}</button>
);

type Pending = { title: string; description: string; impact?: string[]; label: string; run: () => void; danger?: boolean } | null;

/** Confirm a risky switch. It stays open until the change succeeds (the caller clears `pending` in onSuccess). */
function PendingDialog({ pending, busy, onClose }: { pending: Pending; busy: boolean; onClose: () => void }) {
  return (
    <ConfirmDialog isOpen={!!pending} onClose={() => { if (!busy) onClose(); }} onConfirm={() => pending?.run()} pending={busy}
      tone={pending?.danger ? "danger" : "primary"} icon={<PowerOff className="w-6 h-6" />}
      title={pending?.title ?? ""} description={pending?.description ?? ""} impact={pending?.impact} confirmLabel={pending?.label ?? "Confirm"} />
  );
}

/* ---------------- Sectors & business types ---------------- */

function SectorsTab() {
  const data = combineQueries(useSectorsQuery(), useCustomersQuery());
  return <QueryState query={data}>{([sectors, customers]) => <SectorsBody sectors={sectors} customers={customers} />}</QueryState>;
}

function SectorsBody({ sectors, customers }: { sectors: Sector[]; customers: Customer[] }) {
  const { can } = usePermissions();
  const canEdit = can("settings", "edit");
  const [selectedId, setSelectedId] = React.useState(sectors[0]?.id);
  const [query, setQuery] = React.useState("");
  const [renaming, setRenaming] = React.useState<{ kind: "sector" | "type"; id: string; name: string } | null>(null);
  const [pending, setPending] = React.useState<Pending>(null);
  const [added, setAdded] = React.useState({ sector: 0, type: 0 });
  const sector = sectors.find((s) => s.id === selectedId) ?? sectors[0];
  const gaps = sectors.filter((s) => s.active && !s.types.some((t) => t.active));
  const list = sectors.filter((s) => !query || s.name.toLowerCase().includes(query.toLowerCase()) || s.types.some((t) => t.name.toLowerCase().includes(query.toLowerCase())));
  const sectorName = (id: string) => sectors.find((s) => s.id === id)?.name ?? "Sector";
  const typeName = (sectorId: string, typeId: string) => sectors.find((s) => s.id === sectorId)?.types.find((t) => t.id === typeId)?.name ?? "Business type";

  const addSector = useAddSector({
    success: (_, v) => `${v.name} added. Now add its business types.`,
    onSuccess: (s) => { setAdded((a) => ({ ...a, sector: a.sector + 1 })); const id = (s as Sector | undefined)?.id; if (id) setSelectedId(id); },
  });
  const addType = useAddBusinessType({
    success: (_, v) => `${v.name} added to ${sectorName(v.sectorId)}`,
    onSuccess: () => setAdded((a) => ({ ...a, type: a.type + 1 })),
  });
  const setSectorActive = useSetSectorActive({ success: (_, v) => `${sectorName(v.id)} turned ${v.active ? "on" : "off"}`, onSuccess: () => setPending(null) });
  const setTypeActive = useSetBusinessTypeActive({ success: (_, v) => `${typeName(v.sectorId, v.typeId)} turned ${v.active ? "on" : "off"}`, onSuccess: () => setPending(null) });
  const renameSector = useRenameSector({ success: (_, v) => `Renamed to ${v.name}`, onSuccess: () => setRenaming(null) });
  const renameType = useRenameBusinessType({ success: (_, v) => `Renamed to ${v.name}`, onSuccess: () => setRenaming(null) });

  if (!sector) {
    return (
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-sm">
        <EmptyState title="No sectors yet" description="Add the sectors customers, leads and partners can be filed under." />
        <div className="p-4 border-t border-[var(--border)] bg-[var(--background)]">
          <AddInline key={added.sector} label="New sector" placeholder="Add a sector" disabled={!canEdit} pending={addSector.isPending} error={addSector.fieldErrors.name}
            validate={(v) => (!v ? "Enter a name" : "")} onAdd={(v) => addSector.run({ name: v })} />
        </div>
      </div>
    );
  }

  const sectorNameError = (v: string) => !v ? "Enter a name" : sectors.some((s) => sameName(s.name, v)) ? "A sector with this name exists" : "";
  const typeNameError = (v: string) => !v ? "Enter a name" : sector.types.some((t) => sameName(t.name, v)) ? `${sector.name} already has this business type` : "";

  const toggleSector = () => {
    const n = customersInSector(customers, sector.name);
    if (sector.active && n > 0) {
      setPending({ title: `Turn off ${sector.name}?`, description: "New customers, leads and partners can no longer choose it.", impact: [`${n} customer${n === 1 ? " keeps" : "s keep"} this sector on their record`, "You can turn it back on at any time"], label: "Turn off", danger: true, run: () => setSectorActive.run({ id: sector.id, active: false }) });
    } else setSectorActive.run({ id: sector.id, active: !sector.active });
  };
  const toggleType = (typeId: string) => {
    const t = sector.types.find((x) => x.id === typeId)!;
    const n = customersWithType(customers, sector.name, t.name);
    if (t.active && n > 0) {
      setPending({ title: `Turn off ${t.name}?`, description: "It disappears from the business type picker.", impact: [`${n} customer${n === 1 ? " keeps" : "s keep"} it on their record`], label: "Turn off", danger: true, run: () => setTypeActive.run({ sectorId: sector.id, typeId: t.id, active: false }) });
    } else setTypeActive.run({ sectorId: sector.id, typeId: t.id, active: !t.active });
  };

  return (
    <>
      {gaps.length > 0 && (
        <Alert tone="warning" className="mb-6" title={`${gaps.length} sector${gaps.length === 1 ? " has" : "s have"} no business types`}>
          Customers in {gaps.map((g) => g.name).join(" and ")} can&apos;t be given a business type. Add at least one to each.
        </Alert>
      )}
      <div className="grid grid-cols-[340px_1fr] gap-6 items-start">
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-[var(--border)]"><SearchBox id="sector-search" label="Find a sector or type" value={query} onChange={setQuery} placeholder="e.g. Pharmacy" width="w-full" /></div>
          <ul className="m-0 p-0 list-none divide-y divide-[var(--border)] max-h-[560px] overflow-y-auto" aria-label="Sectors">
            {list.map((s) => {
              const activeTypes = s.types.filter((t) => t.active).length;
              return (
                <li key={s.id}>
                  <ListButton active={s.id === sector.id} onClick={() => setSelectedId(s.id)}>
                    <span className={cn("font-semibold text-[0.9rem] flex items-center gap-2", !s.active && "text-[var(--muted-foreground)]")}>
                      {s.name}{!s.active && <Badge variant="muted">Off</Badge>}{s.active && activeTypes === 0 && <AlertTriangle className="w-3.5 h-3.5 text-[var(--warning)]" aria-label="No business types" />}
                    </span>
                    <span className="block text-[0.78rem] text-[var(--muted-foreground)]">{activeTypes} business type{activeTypes === 1 ? "" : "s"} · {customersInSector(customers, s.name)} customers</span>
                  </ListButton>
                </li>
              );
            })}
          </ul>
          <div className="p-4 border-t border-[var(--border)] bg-[var(--background)]">
            <AddInline key={added.sector} label="New sector" placeholder="Add a sector" validate={sectorNameError} disabled={!canEdit} pending={addSector.isPending} error={addSector.fieldErrors.name}
              onAdd={(v) => addSector.run({ name: v })} />
          </div>
        </div>

        <section className="bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-sm overflow-hidden" aria-label={`${sector.name} business types`}>
          <div className="px-6 py-4 border-b border-[var(--border)] bg-[var(--background)] flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <h2 className="text-[1.1rem] font-heading font-extrabold m-0">{sector.name}</h2>
              {canEdit && <button type="button" onClick={() => setRenaming({ kind: "sector", id: sector.id, name: sector.name })} className="text-[0.82rem] font-semibold text-[var(--primary)] flex items-center gap-1"><Pencil className="w-3.5 h-3.5" /> Rename</button>}
            </div>
            <label className="flex items-center gap-2 text-[0.85rem] font-semibold" title={canEdit ? undefined : NO_EDIT}>Offered in forms <Switch checked={sector.active} onChange={toggleSector} disabled={!canEdit || setSectorActive.isPending} label={`${sector.name} offered in forms`} /></label>
          </div>
          <div className="w-full overflow-x-auto">
            <Table className="min-w-full border-none shadow-none rounded-none">
              <TableHeader><TableRow className="hover:bg-transparent">{["Business type", "Customers", "Status"].map((h) => <TableHead key={h}>{h}</TableHead>)}<TableActionsHead /></TableRow></TableHeader>
              <TableBody>
                {sector.types.length === 0 ? (
                  <TableRow className="hover:bg-transparent"><TableCell colSpan={4} className="py-10 text-center text-[0.88rem] text-[var(--muted-foreground)]">No business types yet. Add the first one below.</TableCell></TableRow>
                ) : sector.types.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className={cn("font-medium", !t.active && "text-[var(--muted-foreground)]")}>{t.name}</TableCell>
                    <TableCell className="text-[0.88rem]">{customersWithType(customers, sector.name, t.name)}</TableCell>
                    <TableCell><StatusBadge status={t.active ? "Active" : "Draft"} label={t.active ? "On" : "Off"} /></TableCell>
                    <TableActionsCell>{canEdit && <RowActionsMenu label={`Actions for ${t.name}`} actions={[
                      { label: "Rename", icon: Pencil, onSelect: () => setRenaming({ kind: "type", id: t.id, name: t.name }) },
                      { label: t.active ? "Turn off" : "Turn on", icon: t.active ? PowerOff : Power, danger: t.active, disabled: setTypeActive.isPending, onSelect: () => toggleType(t.id) },
                    ]} />}</TableActionsCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="p-4 border-t border-[var(--border)] bg-[var(--background)]">
            <AddInline key={added.type} label="New business type" placeholder={`Add a business type to ${sector.name}`} validate={typeNameError} disabled={!canEdit} pending={addType.isPending} error={addType.fieldErrors.name}
              onAdd={(v) => addType.run({ sectorId: sector.id, name: v })} />
          </div>
        </section>
      </div>

      {renaming && (
        <RenameModal title={renaming.kind === "sector" ? "Rename sector" : `Rename business type in ${sector.name}`} initial={renaming.name} onClose={() => setRenaming(null)}
          validate={renaming.kind === "sector" ? sectorNameError : typeNameError}
          pending={renameSector.isPending || renameType.isPending}
          error={(renaming.kind === "sector" ? renameSector : renameType).fieldErrors.name}
          onSave={(v) => { if (renaming.kind === "sector") renameSector.run({ id: renaming.id, name: v }); else renameType.run({ sectorId: sector.id, typeId: renaming.id, name: v }); }} />
      )}
      <PendingDialog pending={pending} busy={setSectorActive.isPending || setTypeActive.isPending} onClose={() => setPending(null)} />
    </>
  );
}

/* ---------------- Locations ---------------- */

function LocationsTab() {
  const data = combineQueries(useCountriesQuery(), useCustomersQuery());
  return <QueryState query={data}>{([countries, customers]) => <LocationsBody countries={countries} customers={customers} />}</QueryState>;
}

function LocationsBody({ countries, customers }: { countries: Country[]; customers: Customer[] }) {
  const { can } = usePermissions();
  const canEdit = can("settings", "edit");
  const [code, setCode] = React.useState(countries[0]?.code);
  const [regionFor, setRegionFor] = React.useState<Region | null>(null);
  const [pending, setPending] = React.useState<Pending>(null);
  const [addedRegions, setAddedRegions] = React.useState(0);
  const country = countries.find((c) => c.code === code) ?? countries[0];
  const sorted = [...countries].sort((a, b) => Number(b.enabled) - Number(a.enabled) || a.name.localeCompare(b.name));
  const addable = MORE_COUNTRIES.filter(([c]) => !countries.some((x) => x.code === c));
  const complete = (c: Country) => c.expectedRegions === 0 || c.regions.length >= c.expectedRegions;
  const countryName = (c: string) => countries.find((x) => x.code === c)?.name ?? MORE_COUNTRIES.find(([x]) => x === c)?.[1] ?? c;
  const regionName = (c: string, id: string) => countries.find((x) => x.code === c)?.regions.find((r) => r.id === id)?.name ?? "Region";

  const addCountry = useAddCountry({ success: (_, v) => `${countryName(v.code)} added. Add its regions next.`, onSuccess: (_, v) => setCode(v.code) });
  const setCountryEnabled = useSetCountryEnabled({
    success: (_, v) => (v.enabled ? `${countryName(v.code)} is now offered in address forms` : `${countryName(v.code)} turned off`),
    onSuccess: () => setPending(null),
  });
  const setRegionActive = useSetRegionActive({ success: (_, v) => `${regionName(v.code, v.regionId)} turned ${v.active ? "on" : "off"}`, onSuccess: () => setPending(null) });
  const addRegion = useAddRegion({ success: (_, v) => `${v.name} added`, onSuccess: () => setAddedRegions((n) => n + 1) });

  const addCountryPicker = (
    <div className="p-4 border-t border-[var(--border)] bg-[var(--background)] rounded-b-[11px] flex flex-col gap-1.5">
      <span className="text-[0.82rem] font-bold">Add a country</span>
      <Select ariaLabel="Add a country" searchable placeholder={addCountry.isPending ? "Adding…" : "Choose a country"} value="" options={addable.map(([, n]) => n)}
        disabled={!canEdit || addCountry.isPending} title={canEdit ? undefined : NO_EDIT}
        onChange={(n) => { const [c] = addable.find(([, x]) => x === n)!; addCountry.run({ code: c }); }} />
    </div>
  );

  if (!country) {
    return (
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-sm">
        <EmptyState title="No countries yet" description="Add the countries CICOD operates in so address forms can offer them." />
        {addCountryPicker}
      </div>
    );
  }

  const toggleCountry = () => {
    const n = customersInCountry(customers, country.name);
    if (country.enabled && n > 0) {
      setPending({ title: `Stop offering ${country.name}?`, description: "It disappears from address forms. Existing records keep it.", impact: [`${n} customer${n === 1 ? " is" : "s are"} in ${country.name}`], label: "Turn off", danger: true, run: () => setCountryEnabled.run({ code: country.code, enabled: false }) });
    } else setCountryEnabled.run({ code: country.code, enabled: !country.enabled });
  };
  const toggleRegion = (r: Region) => {
    const n = customersInRegion(customers, country.name, r.name);
    if (r.active && n > 0) {
      setPending({ title: `Turn off ${r.name}?`, description: `It disappears from the ${country.regionLabel.toLowerCase()} picker for ${country.name}.`, impact: [`${n} customer${n === 1 ? " keeps" : "s keep"} it on their address`], label: "Turn off", danger: true, run: () => setRegionActive.run({ code: country.code, regionId: r.id, active: false }) });
    } else setRegionActive.run({ code: country.code, regionId: r.id, active: !r.active });
  };
  const regionError = (v: string) => !v ? "Enter a name" : country.regions.some((r) => sameName(r.name, v)) ? `${country.name} already has this ${country.regionLabel.toLowerCase()}` : "";

  return (
    <>
      <div className="grid grid-cols-[340px_1fr] gap-6 items-start">
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-sm">
          <div className="overflow-hidden rounded-t-xl">
            <ul className="m-0 p-0 list-none divide-y divide-[var(--border)]" aria-label="Countries">
            {sorted.map((c) => (
              <li key={c.code}>
                <ListButton active={c.code === country.code} onClick={() => setCode(c.code)}>
                  <span className="flex items-center justify-between gap-2">
                    <span className={cn("font-semibold text-[0.9rem]", !c.enabled && "text-[var(--muted-foreground)]")}>{c.name}</span>
                    {c.enabled ? <Badge variant="success">Operating</Badge> : <Badge variant="muted">Off</Badge>}
                  </span>
                  <span className={cn("block text-[0.78rem]", complete(c) ? "text-[var(--muted-foreground)]" : "text-[var(--warning)] font-semibold")}>
                    {c.expectedRegions ? `${c.regions.length} of ${c.expectedRegions} ${plural(c.regionLabel.toLowerCase())}` : `${c.regions.length} ${plural(c.regionLabel.toLowerCase())}`} · {customersInCountry(customers, c.name)} customers
                  </span>
                </ListButton>
              </li>
            ))}
            </ul>
          </div>
          {addCountryPicker}
        </div>

        <section className="bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-sm overflow-hidden" aria-label={`${country.name} regions`}>
          <div className="px-6 py-4 border-b border-[var(--border)] bg-[var(--background)] flex items-center justify-between gap-4">
            <div>
              <h2 className="text-[1.1rem] font-heading font-extrabold m-0">{country.name} <span className="text-[0.85rem] font-semibold text-[var(--muted-foreground)]">{country.code} · {country.continent}</span></h2>
              <p className="m-0 text-[0.8rem] text-[var(--muted-foreground)]">{plural(country.regionLabel)}, and the {plural(country.areaLabel)} inside them</p>
            </div>
            <label className="flex items-center gap-2 text-[0.85rem] font-semibold" title={canEdit ? undefined : NO_EDIT}>We operate here <Switch checked={country.enabled} onChange={toggleCountry} disabled={!canEdit || setCountryEnabled.isPending} label={`Operate in ${country.name}`} /></label>
          </div>
          {!complete(country) && (
            <div className="px-6 pt-5"><Alert tone="warning" title={`${country.regions.length} of ${country.expectedRegions} ${plural(country.regionLabel.toLowerCase())} added`}>Addresses in the missing {plural(country.regionLabel.toLowerCase())} can&apos;t be captured. Add them before turning this country on.</Alert></div>
          )}
          <div className="w-full overflow-x-auto">
            <Table className="min-w-full border-none shadow-none rounded-none">
              <TableHeader><TableRow className="hover:bg-transparent">{[country.regionLabel, `${plural(country.areaLabel)}`, "Customers", "Status"].map((h) => <TableHead key={h}>{h}</TableHead>)}<TableActionsHead /></TableRow></TableHeader>
              <TableBody>
                {country.regions.length === 0 ? (
                  <TableRow className="hover:bg-transparent"><TableCell colSpan={5} className="py-10 text-center text-[0.88rem] text-[var(--muted-foreground)]">No {plural(country.regionLabel.toLowerCase())} yet. Add the first one below.</TableCell></TableRow>
                ) : country.regions.map((r) => (
                  <TableRow key={r.id} onClick={() => setRegionFor(r)} className="cursor-pointer group">
                    <TableCell className={cn("font-medium group-hover:text-[var(--primary)]", !r.active && "text-[var(--muted-foreground)]")}>{r.name}</TableCell>
                    <TableCell className="text-[0.88rem]">{r.areas.length || <span className="text-[var(--muted-foreground)]">None yet</span>}</TableCell>
                    <TableCell className="text-[0.88rem]">{customersInRegion(customers, country.name, r.name)}</TableCell>
                    <TableCell><StatusBadge status={r.active ? "Active" : "Draft"} label={r.active ? "On" : "Off"} /></TableCell>
                    <TableActionsCell><RowActionsMenu label={`Actions for ${r.name}`} actions={[
                      { label: `View ${plural(country.areaLabel)}`, icon: MapPin, onSelect: () => setRegionFor(r) },
                      ...(canEdit ? [{ label: r.active ? "Turn off" : "Turn on", icon: r.active ? PowerOff : Power, danger: r.active, disabled: setRegionActive.isPending, onSelect: () => toggleRegion(r) }] : []),
                    ]} /></TableActionsCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="p-4 border-t border-[var(--border)] bg-[var(--background)]">
            <AddInline key={addedRegions} label={`New ${country.regionLabel.toLowerCase()}`} placeholder={`Add a ${country.regionLabel.toLowerCase()} to ${country.name}`} validate={regionError}
              disabled={!canEdit} pending={addRegion.isPending} error={addRegion.fieldErrors.name} onAdd={(v) => addRegion.run({ code: country.code, name: v })} />
          </div>
        </section>
      </div>
      <RegionDrawer country={country} canEdit={canEdit} region={regionFor ? country.regions.find((r) => r.id === regionFor.id) ?? null : null} onClose={() => setRegionFor(null)} />
      <PendingDialog pending={pending} busy={setCountryEnabled.isPending || setRegionActive.isPending} onClose={() => setPending(null)} />
    </>
  );
}

function RegionDrawer({ country, region, canEdit, onClose }: { country: Country; region: Region | null; canEdit: boolean; onClose: () => void }) {
  const [added, setAdded] = React.useState(0);
  const addArea = useAddArea({ success: (_, v) => `${v.name} added`, onSuccess: () => setAdded((n) => n + 1) });
  return (
    <Drawer isOpen={!!region} onClose={onClose} title={region ? `${region.name}, ${country.name}` : ""} subtitle={region ? `${region.areas.length} ${country.areaLabel}${region.areas.length === 1 ? "" : "s"}` : undefined}>
      {region && (
        <div className="flex flex-col gap-5">
          {region.areas.length === 0 ? <p className="m-0 text-[0.88rem] text-[var(--muted-foreground)]">No {plural(country.areaLabel)} yet. Address forms only ask for the {country.regionLabel.toLowerCase()} until some are added.</p> : (
            <ul className="m-0 p-0 list-none flex flex-wrap gap-2" aria-label={`${plural(country.areaLabel)}`}>
              {region.areas.map((a) => <li key={a} className="px-3 py-1.5 rounded-full border border-[var(--border)] text-[0.84rem]">{a}</li>)}
            </ul>
          )}
          <AddInline key={added} label={`New ${country.areaLabel}`} placeholder={`Add a ${country.areaLabel}`} disabled={!canEdit} pending={addArea.isPending} error={addArea.fieldErrors.name}
            validate={(v) => !v ? "Enter a name" : region.areas.some((a) => sameName(a, v)) ? `${region.name} already has this ${country.areaLabel}` : ""}
            onAdd={(v) => addArea.run({ code: country.code, regionId: region.id, name: v })} />
        </div>
      )}
    </Drawer>
  );
}

/* ---------------- Currencies ---------------- */

function CurrenciesTab() {
  const data = combineQueries(useCurrenciesQuery(), usePriceUsage());
  return <QueryState query={data}>{([currencies, usage]) => <CurrenciesBody currencies={currencies} usage={usage} />}</QueryState>;
}

function CurrenciesBody({ currencies, usage }: { currencies: CurrencySetting[]; usage: (code: string) => PriceUsage }) {
  const router = useRouter();
  const { can } = usePermissions();
  const canEdit = can("settings", "edit");
  const setEnabled = useSetCurrencyEnabled({ success: (_, v) => (v.enabled ? `${v.code} turned on. It can now be used for prices.` : `${v.code} turned off`) });
  const toggle = (code: string) => {
    const c = currencies.find((x) => x.code === code)!;
    if (c.enabled) {
      const u = usage(code);
      if (u.total > 0) return toast.error(`${code} is used by ${u.plans} plans and ${u.bundles} bundles. Remove those prices in Catalogue first.`);
      setEnabled.run({ code, enabled: false });
    } else {
      if (c.replacedBy) return toast.error(`${code} is no longer a valid currency code. Use ${c.replacedBy} instead.`);
      setEnabled.run({ code, enabled: true });
    }
  };
  return (
    <>
      <Alert tone="info" className="mb-6" title="Only switched-on currencies can be used for prices">
        The old CRM listed 119 currencies, all active, including retired codes. Here a currency is switched on only when CICOD sells in it.
      </Alert>
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-sm overflow-hidden">
        <div className="w-full overflow-x-auto">
          <Table className="min-w-full border-none shadow-none rounded-none">
            <TableHeader><TableRow className="hover:bg-transparent">{["Currency", "Symbol", "Used by prices", "Status"].map((h) => <TableHead key={h}>{h}</TableHead>)}<TableActionsHead /></TableRow></TableHeader>
            <TableBody>
              {currencies.length === 0 && <TableRow className="hover:bg-transparent"><TableCell colSpan={5}><EmptyState title="No currencies set up" /></TableCell></TableRow>}
              {currencies.map((c) => {
                const u = usage(c.code);
                return (
                  <TableRow key={c.code}>
                    <TableCell>
                      <div className={cn("font-semibold", !c.enabled && "text-[var(--muted-foreground)]")}><span className="font-mono mr-2">{c.code}</span>{c.name}</div>
                      {c.replacedBy && <div className="text-[0.78rem] text-[var(--warning)] font-semibold flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> Retired code, replaced by {c.replacedBy}</div>}
                    </TableCell>
                    <TableCell className="text-[0.95rem]">{c.symbol}</TableCell>
                    <TableCell className="text-[0.88rem]">{u.total ? `${u.plans} plans · ${u.bundles} bundles` : <span className="text-[var(--muted-foreground)]">Not used</span>}</TableCell>
                    <TableCell><StatusBadge status={c.enabled ? "Active" : "Draft"} label={c.enabled ? "On" : "Off"} /></TableCell>
                    <TableActionsCell><RowActionsMenu label={`Actions for ${c.code}`} actions={[
                      ...(canEdit ? [{ label: c.enabled ? "Turn off" : "Turn on", icon: c.enabled ? PowerOff : Power, danger: c.enabled, disabled: setEnabled.isPending, onSelect: () => toggle(c.code) }] : []),
                      ...(u.total ? [{ label: "See prices in Catalogue", icon: Eye, onSelect: () => router.push("/crm/catalogue/pricing") }] : []),
                    ]} /></TableActionsCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </>
  );
}

/* ---------------- Payment methods ---------------- */

function PaymentsTab() {
  const data = combineQueries(usePaymentMethodsQuery(), usePaymentsQuery());
  return <QueryState query={data}>{([methods, payments]) => <PaymentsBody methods={methods} payments={payments} />}</QueryState>;
}

function PaymentsBody({ methods, payments }: { methods: PaymentMethodSetting[]; payments: Payment[] }) {
  const { can } = usePermissions();
  const canEdit = can("settings", "edit");
  const update = useUpdatePaymentMethod({
    success: (_, { id, patch }) => (patch.requiresReference !== undefined
      ? `${id}: reference ${patch.requiresReference ? "required" : "optional"}`
      : `${id} ${patch.enabled ? "offered" : "no longer offered"} when recording payments`),
  });
  const busy = (id: string) => update.isPending && update.variables?.id === id;
  return (
    <>
      <Alert tone="info" className="mb-6" title="Billing uses this list" actions={<Link href="/crm/billing/collections"><Button size="sm" variant="outline">Open Collections</Button></Link>}>
        <em>Record offline payment</em> offers the switched-on offline methods and asks for a reference when the method needs one. The old CRM had a single channel, &ldquo;WEB&rdquo;.
      </Alert>
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-sm overflow-hidden">
        <div className="w-full overflow-x-auto">
          <Table className="min-w-full border-none shadow-none rounded-none">
            <TableHeader><TableRow className="hover:bg-transparent">{["Method", "How it's paid", "Payments recorded", "Reference required", "Offered"].map((h) => <TableHead key={h}>{h}</TableHead>)}<TableActionsHead /></TableRow></TableHeader>
            <TableBody>
              {methods.length === 0 && <TableRow className="hover:bg-transparent"><TableCell colSpan={6}><EmptyState title="No payment methods set up" /></TableCell></TableRow>}
              {methods.map((m) => {
                const n = payments.filter((p) => p.method === m.id).length;
                return (
                  <TableRow key={m.id}>
                    <TableCell><div className="font-semibold">{m.id}</div>{m.online ? <Badge variant="info" className="mt-1">Online</Badge> : <Badge variant="muted" className="mt-1">Recorded by staff</Badge>}</TableCell>
                    <TableCell className="text-[0.86rem] text-[var(--muted-foreground)] max-w-[320px]">{m.hint}</TableCell>
                    <TableCell className="text-[0.88rem]">{n}</TableCell>
                    <TableCell title={canEdit ? undefined : NO_EDIT}>{m.online ? <span className="text-[0.85rem] text-[var(--muted-foreground)]">From the gateway</span> : <Switch checked={m.requiresReference} disabled={!canEdit || busy(m.id)} label={`${m.id} reference required`} onChange={(v) => update.run({ id: m.id, patch: { requiresReference: v } })} />}</TableCell>
                    <TableCell title={canEdit ? undefined : NO_EDIT}><Switch checked={m.enabled} disabled={m.online || !canEdit || busy(m.id)} label={`${m.id} offered`} onChange={(v) => update.run({ id: m.id, patch: { enabled: v } })} /></TableCell>
                    <TableActionsCell>{canEdit && <RowActionsMenu label={`Actions for ${m.id}`} actions={[
                      { label: m.enabled ? "Stop offering" : "Offer again", icon: m.enabled ? PowerOff : Power, danger: m.enabled, disabled: m.online || busy(m.id), onSelect: () => update.run({ id: m.id, patch: { enabled: !m.enabled } }) },
                    ]} />}</TableActionsCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
      <p className="mt-3 text-[0.8rem] text-[var(--muted-foreground)]">Card can&apos;t be switched off here: it is how customers pay online.</p>
    </>
  );
}
