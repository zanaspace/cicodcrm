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
import { cn } from "@/lib/utils";
import { useCustomers } from "@/lib/mock/customers";
import { usePlans, useBundles } from "@/lib/mock/catalogue";
import { usePayments } from "@/lib/mock/billing";
import {
  MORE_COUNTRIES, addArea, addBusinessType, addCountry, addRegion, addSector, customersInCountry, customersInRegion, customersInSector,
  customersWithType, priceUsage, renameBusinessType, renameSector, sameName, setBusinessTypeActive, setCountryEnabled, setCurrencyEnabled,
  setRegionActive, setSectorActive, updatePaymentMethod, useCountryList, useCurrencies, usePaymentMethods, useSectorList,
  type Country, type Region,
} from "@/lib/mock/settings";
import { inputClass } from "@/app/crm/catalogue/components/editor";
import { SearchBox, Switch, Tabs, plural } from "./shared";

const TABS = [
  { id: "sectors", label: "Sectors & business types" },
  { id: "locations", label: "Locations" },
  { id: "currencies", label: "Currencies" },
  { id: "payments", label: "Payment methods" },
] as const;
type TabId = (typeof TABS)[number]["id"];

export function ReferenceView() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const tab = (params.get("tab") as TabId) ?? "sectors";
  const sectors = useSectorList();
  const countries = useCountryList();
  const currencies = useCurrencies();
  const methods = usePaymentMethods();
  const counts: Record<TabId, number> = {
    sectors: sectors.filter((s) => s.active).length,
    locations: countries.filter((c) => c.enabled).length,
    currencies: currencies.filter((c) => c.enabled).length,
    payments: methods.filter((m) => m.enabled).length,
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

function AddInline({ label, placeholder, onAdd, validate, disabled }: { label: string; placeholder: string; onAdd: (v: string) => void; validate: (v: string) => string; disabled?: boolean }) {
  const [v, setV] = React.useState("");
  const [err, setErr] = React.useState("");
  const submit = () => { const e = validate(v.trim()); if (e) return setErr(e); onAdd(v.trim()); setV(""); setErr(""); };
  return (
    <div className="flex flex-col gap-1">
      <div className="flex gap-2">
        <input aria-label={label} value={v} disabled={disabled} onChange={(e) => { setV(e.target.value); setErr(""); }} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); submit(); } }} placeholder={placeholder}
          className="flex-1 min-w-0 h-10 px-3 rounded-md border-[1.5px] border-[var(--input)] bg-[var(--background)] text-[0.9rem] focus:outline-none focus:border-[var(--ring)] disabled:opacity-60" />
        <Button variant="outline" onClick={submit} disabled={!v.trim() || disabled}><Plus className="w-4 h-4 mr-1" /> Add</Button>
      </div>
      {err && <span className="text-[0.78rem] text-[var(--destructive)]">{err}</span>}
    </div>
  );
}

function RenameModal({ title, initial, onSave, onClose, validate }: { title: string; initial: string; onSave: (v: string) => void; onClose: () => void; validate: (v: string) => string }) {
  const [v, setV] = React.useState(initial);
  const err = v.trim() === initial ? "" : validate(v.trim());
  return (
    <Modal isOpen onClose={onClose} title={title}
      footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button disabled={!v.trim() || v.trim() === initial || !!err} onClick={() => { onSave(v.trim()); onClose(); }}>Save name</Button></>}>
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

/* ---------------- Sectors & business types ---------------- */

function SectorsTab() {
  const sectors = useSectorList();
  const customers = useCustomers();
  const [selectedId, setSelectedId] = React.useState(sectors[0]?.id);
  const [query, setQuery] = React.useState("");
  const [renaming, setRenaming] = React.useState<{ kind: "sector" | "type"; id: string; name: string } | null>(null);
  const [pending, setPending] = React.useState<Pending>(null);
  const sector = sectors.find((s) => s.id === selectedId) ?? sectors[0];
  const gaps = sectors.filter((s) => s.active && !s.types.some((t) => t.active));
  const list = sectors.filter((s) => !query || s.name.toLowerCase().includes(query.toLowerCase()) || s.types.some((t) => t.name.toLowerCase().includes(query.toLowerCase())));

  const sectorNameError = (v: string) => !v ? "Enter a name" : sectors.some((s) => sameName(s.name, v)) ? "A sector with this name exists" : "";
  const typeNameError = (v: string) => !v ? "Enter a name" : sector.types.some((t) => sameName(t.name, v)) ? `${sector.name} already has this business type` : "";

  const toggleSector = () => {
    const n = customersInSector(customers, sector.name);
    if (sector.active && n > 0) {
      setPending({ title: `Turn off ${sector.name}?`, description: "New customers, leads and partners can no longer choose it.", impact: [`${n} customer${n === 1 ? " keeps" : "s keep"} this sector on their record`, "You can turn it back on at any time"], label: "Turn off", danger: true, run: () => { setSectorActive(sector.id, false); toast.success(`${sector.name} turned off`); } });
    } else { setSectorActive(sector.id, !sector.active); toast.success(`${sector.name} turned ${sector.active ? "off" : "on"}`); }
  };
  const toggleType = (typeId: string) => {
    const t = sector.types.find((x) => x.id === typeId)!;
    const n = customersWithType(customers, sector.name, t.name);
    if (t.active && n > 0) {
      setPending({ title: `Turn off ${t.name}?`, description: "It disappears from the business type picker.", impact: [`${n} customer${n === 1 ? " keeps" : "s keep"} it on their record`], label: "Turn off", danger: true, run: () => { setBusinessTypeActive(sector.id, t.id, false); toast.success(`${t.name} turned off`); } });
    } else { setBusinessTypeActive(sector.id, t.id, !t.active); toast.success(`${t.name} turned ${t.active ? "off" : "on"}`); }
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
            <AddInline label="New sector" placeholder="Add a sector" validate={sectorNameError} onAdd={(v) => { const s = addSector(v); setSelectedId(s.id); toast.success(`${v} added. Now add its business types.`); }} />
          </div>
        </div>

        {sector && (
          <section className="bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-sm overflow-hidden" aria-label={`${sector.name} business types`}>
            <div className="px-6 py-4 border-b border-[var(--border)] bg-[var(--background)] flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <h2 className="text-[1.1rem] font-heading font-extrabold m-0">{sector.name}</h2>
                <button type="button" onClick={() => setRenaming({ kind: "sector", id: sector.id, name: sector.name })} className="text-[0.82rem] font-semibold text-[var(--primary)] flex items-center gap-1"><Pencil className="w-3.5 h-3.5" /> Rename</button>
              </div>
              <label className="flex items-center gap-2 text-[0.85rem] font-semibold">Offered in forms <Switch checked={sector.active} onChange={toggleSector} label={`${sector.name} offered in forms`} /></label>
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
                      <TableActionsCell><RowActionsMenu label={`Actions for ${t.name}`} actions={[
                        { label: "Rename", icon: Pencil, onSelect: () => setRenaming({ kind: "type", id: t.id, name: t.name }) },
                        { label: t.active ? "Turn off" : "Turn on", icon: t.active ? PowerOff : Power, danger: t.active, onSelect: () => toggleType(t.id) },
                      ]} /></TableActionsCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="p-4 border-t border-[var(--border)] bg-[var(--background)]">
              <AddInline label="New business type" placeholder={`Add a business type to ${sector.name}`} validate={typeNameError} onAdd={(v) => { addBusinessType(sector.id, v); toast.success(`${v} added to ${sector.name}`); }} />
            </div>
          </section>
        )}
      </div>

      {renaming && (
        <RenameModal title={renaming.kind === "sector" ? "Rename sector" : `Rename business type in ${sector.name}`} initial={renaming.name} onClose={() => setRenaming(null)}
          validate={renaming.kind === "sector" ? sectorNameError : typeNameError}
          onSave={(v) => { if (renaming.kind === "sector") renameSector(renaming.id, v); else renameBusinessType(sector.id, renaming.id, v); toast.success(`Renamed to ${v}`); }} />
      )}
      <PendingDialog pending={pending} onClose={() => setPending(null)} />
    </>
  );
}

function PendingDialog({ pending, onClose }: { pending: Pending; onClose: () => void }) {
  return (
    <ConfirmDialog isOpen={!!pending} onClose={onClose} onConfirm={() => { pending?.run(); onClose(); }}
      tone={pending?.danger ? "danger" : "primary"} icon={<PowerOff className="w-6 h-6" />}
      title={pending?.title ?? ""} description={pending?.description ?? ""} impact={pending?.impact} confirmLabel={pending?.label ?? "Confirm"} />
  );
}

/* ---------------- Locations ---------------- */

function LocationsTab() {
  const countries = useCountryList();
  const customers = useCustomers();
  const [code, setCode] = React.useState(countries[0].code);
  const [regionFor, setRegionFor] = React.useState<Region | null>(null);
  const [pending, setPending] = React.useState<Pending>(null);
  const country = countries.find((c) => c.code === code) ?? countries[0];
  const sorted = [...countries].sort((a, b) => Number(b.enabled) - Number(a.enabled) || a.name.localeCompare(b.name));
  const addable = MORE_COUNTRIES.filter(([c]) => !countries.some((x) => x.code === c));
  const complete = (c: Country) => c.expectedRegions === 0 || c.regions.length >= c.expectedRegions;

  const toggleCountry = () => {
    const n = customersInCountry(customers, country.name);
    if (country.enabled && n > 0) {
      setPending({ title: `Stop offering ${country.name}?`, description: "It disappears from address forms. Existing records keep it.", impact: [`${n} customer${n === 1 ? " is" : "s are"} in ${country.name}`], label: "Turn off", danger: true, run: () => { setCountryEnabled(country.code, false); toast.success(`${country.name} turned off`); } });
    } else { setCountryEnabled(country.code, !country.enabled); toast.success(country.enabled ? `${country.name} turned off` : `${country.name} is now offered in address forms`); }
  };
  const toggleRegion = (r: Region) => {
    const n = customersInRegion(customers, country.name, r.name);
    if (r.active && n > 0) {
      setPending({ title: `Turn off ${r.name}?`, description: `It disappears from the ${country.regionLabel.toLowerCase()} picker for ${country.name}.`, impact: [`${n} customer${n === 1 ? " keeps" : "s keep"} it on their address`], label: "Turn off", danger: true, run: () => { setRegionActive(country.code, r.id, false); toast.success(`${r.name} turned off`); } });
    } else { setRegionActive(country.code, r.id, !r.active); toast.success(`${r.name} turned ${r.active ? "off" : "on"}`); }
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
          <div className="p-4 border-t border-[var(--border)] bg-[var(--background)] rounded-b-[11px] flex flex-col gap-1.5">
            <span className="text-[0.82rem] font-bold">Add a country</span>
            <Select ariaLabel="Add a country" searchable placeholder="Choose a country" value="" options={addable.map(([, n]) => n)}
              onChange={(n) => { const [c] = addable.find(([, x]) => x === n)!; addCountry(c); setCode(c); toast.success(`${n} added. Add its regions next.`); }} />
          </div>
        </div>

        <section className="bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-sm overflow-hidden" aria-label={`${country.name} regions`}>
          <div className="px-6 py-4 border-b border-[var(--border)] bg-[var(--background)] flex items-center justify-between gap-4">
            <div>
              <h2 className="text-[1.1rem] font-heading font-extrabold m-0">{country.name} <span className="text-[0.85rem] font-semibold text-[var(--muted-foreground)]">{country.code} · {country.continent}</span></h2>
              <p className="m-0 text-[0.8rem] text-[var(--muted-foreground)]">{plural(country.regionLabel)}, and the {plural(country.areaLabel)} inside them</p>
            </div>
            <label className="flex items-center gap-2 text-[0.85rem] font-semibold">We operate here <Switch checked={country.enabled} onChange={toggleCountry} label={`Operate in ${country.name}`} /></label>
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
                      { label: r.active ? "Turn off" : "Turn on", icon: r.active ? PowerOff : Power, danger: r.active, onSelect: () => toggleRegion(r) },
                    ]} /></TableActionsCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="p-4 border-t border-[var(--border)] bg-[var(--background)]">
            <AddInline label={`New ${country.regionLabel.toLowerCase()}`} placeholder={`Add a ${country.regionLabel.toLowerCase()} to ${country.name}`} validate={regionError} onAdd={(v) => { addRegion(country.code, v); toast.success(`${v} added`); }} />
          </div>
        </section>
      </div>
      <RegionDrawer country={country} region={regionFor ? country.regions.find((r) => r.id === regionFor.id) ?? null : null} onClose={() => setRegionFor(null)} />
      <PendingDialog pending={pending} onClose={() => setPending(null)} />
    </>
  );
}

function RegionDrawer({ country, region, onClose }: { country: Country; region: Region | null; onClose: () => void }) {
  return (
    <Drawer isOpen={!!region} onClose={onClose} title={region ? `${region.name}, ${country.name}` : ""} subtitle={region ? `${region.areas.length} ${country.areaLabel}${region.areas.length === 1 ? "" : "s"}` : undefined}>
      {region && (
        <div className="flex flex-col gap-5">
          {region.areas.length === 0 ? <p className="m-0 text-[0.88rem] text-[var(--muted-foreground)]">No {plural(country.areaLabel)} yet. Address forms only ask for the {country.regionLabel.toLowerCase()} until some are added.</p> : (
            <ul className="m-0 p-0 list-none flex flex-wrap gap-2" aria-label={`${plural(country.areaLabel)}`}>
              {region.areas.map((a) => <li key={a} className="px-3 py-1.5 rounded-full border border-[var(--border)] text-[0.84rem]">{a}</li>)}
            </ul>
          )}
          <AddInline label={`New ${country.areaLabel}`} placeholder={`Add a ${country.areaLabel}`}
            validate={(v) => !v ? "Enter a name" : region.areas.some((a) => sameName(a, v)) ? `${region.name} already has this ${country.areaLabel}` : ""}
            onAdd={(v) => { addArea(country.code, region.id, v); toast.success(`${v} added`); }} />
        </div>
      )}
    </Drawer>
  );
}

/* ---------------- Currencies ---------------- */

function CurrenciesTab() {
  const router = useRouter();
  const currencies = useCurrencies();
  usePlans(); useBundles(); // re-render when prices change
  const toggle = (code: string) => {
    const c = currencies.find((x) => x.code === code)!;
    if (c.enabled) {
      const u = priceUsage(code);
      if (u.total > 0) return toast.error(`${code} is used by ${u.plans} plans and ${u.bundles} bundles. Remove those prices in Catalogue first.`);
      setCurrencyEnabled(code, false); toast.success(`${code} turned off`);
    } else {
      if (c.replacedBy) return toast.error(`${code} is no longer a valid currency code. Use ${c.replacedBy} instead.`);
      setCurrencyEnabled(code, true); toast.success(`${code} turned on. It can now be used for prices.`);
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
              {currencies.map((c) => {
                const u = priceUsage(c.code);
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
                      { label: c.enabled ? "Turn off" : "Turn on", icon: c.enabled ? PowerOff : Power, danger: c.enabled, onSelect: () => toggle(c.code) },
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
  const methods = usePaymentMethods();
  const payments = usePayments();
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
              {methods.map((m) => {
                const n = payments.filter((p) => p.method === m.id).length;
                return (
                  <TableRow key={m.id}>
                    <TableCell><div className="font-semibold">{m.id}</div>{m.online ? <Badge variant="info" className="mt-1">Online</Badge> : <Badge variant="muted" className="mt-1">Recorded by staff</Badge>}</TableCell>
                    <TableCell className="text-[0.86rem] text-[var(--muted-foreground)] max-w-[320px]">{m.hint}</TableCell>
                    <TableCell className="text-[0.88rem]">{n}</TableCell>
                    <TableCell>{m.online ? <span className="text-[0.85rem] text-[var(--muted-foreground)]">From the gateway</span> : <Switch checked={m.requiresReference} label={`${m.id} reference required`} onChange={(v) => { updatePaymentMethod(m.id, { requiresReference: v }); toast.success(`${m.id}: reference ${v ? "required" : "optional"}`); }} />}</TableCell>
                    <TableCell><Switch checked={m.enabled} disabled={m.online} label={`${m.id} offered`} onChange={(v) => { updatePaymentMethod(m.id, { enabled: v }); toast.success(`${m.id} ${v ? "offered" : "no longer offered"} when recording payments`); }} /></TableCell>
                    <TableActionsCell><RowActionsMenu label={`Actions for ${m.id}`} actions={[
                      { label: m.enabled ? "Stop offering" : "Offer again", icon: m.enabled ? PowerOff : Power, danger: m.enabled, disabled: m.online, onSelect: () => { updatePaymentMethod(m.id, { enabled: !m.enabled }); toast.success(`${m.id} ${m.enabled ? "no longer offered" : "offered"}`); } },
                    ]} /></TableActionsCell>
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
