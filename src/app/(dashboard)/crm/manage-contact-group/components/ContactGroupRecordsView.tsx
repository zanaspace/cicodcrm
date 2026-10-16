"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { ColumnToggle } from "@/components/ui/ColumnToggle";
import { StatusDropdown } from "@/components/ui/StatusDropdown";
import { Modal } from "@/components/ui/Modal";
import { toast } from "@/components/ui/Toast";
import { Badge } from "@/components/ui/Badge";
import { ErrorState } from "@/components/feedback/States";
import {
  Search, Download, Plus, ChevronLeft, ChevronRight, MoreHorizontal, Pencil, Power, Trash2, Wrench, Loader2,
} from "lucide-react";
import { usePermissions } from "@/lib/permissions";
import { CONTACT_GROUP_STATUSES, type ContactGroupKind } from "@/lib/mock/contact-groups";
import {
  useContactGroupRecordsQuery, useCreateContactGroupRecord, useDeleteContactGroupRecord, useUpdateContactGroupRecord,
} from "@/features/contact-groups/queries";
import { ContactGroupModal, type ContactGroup, type ContactGroupFormValues } from "./ContactGroupModal";
import { CONTACT_GROUP_CONFIG } from "./config";

const STATUS_OPTIONS: string[] = CONTACT_GROUP_STATUSES;

const columnsFor = (label: string) => [
  { id: "name", label: `${label} Name` },
  { id: "description", label: "Description" },
  { id: "key", label: `${label} Key` },
  { id: "status", label: "Status" },
  { id: "createdBy", label: "Created By" },
  { id: "createdTime", label: "Created Time" },
  { id: "updatedBy", label: "Updated By" },
  { id: "updatedTime", label: "Updated Time" },
];

/* ------------------------------------------------------------------ */
/* Row actions menu — rendered in a portal so it isn't clipped by the  */
/* table's horizontal scroll container.                                */
/* ------------------------------------------------------------------ */
function RowActionsMenu({
  group, onEdit, onToggleStatus, onDelete, busy,
}: {
  busy?: boolean;
  group: ContactGroup;
  onEdit: () => void;
  onToggleStatus: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [pos, setPos] = React.useState({ top: 0, left: 0 });
  const btnRef = React.useRef<HTMLButtonElement>(null);
  const menuRef = React.useRef<HTMLDivElement>(null);

  const MENU_W = 184;
  const MENU_H = 136;

  const toggle = () => {
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      const openUp = r.bottom + MENU_H + 8 > window.innerHeight;
      setPos({ top: openUp ? r.top - MENU_H - 6 : r.bottom + 6, left: r.right - MENU_W });
    }
    setOpen((o) => !o);
  };

  React.useEffect(() => {
    if (!open) return;
    const close = (e: Event) => {
      const t = e.target as Node;
      if (menuRef.current?.contains(t) || btnRef.current?.contains(t)) return;
      setOpen(false);
    };
    const closeNow = () => setOpen(false);
    document.addEventListener("mousedown", close);
    window.addEventListener("scroll", closeNow, true);
    window.addEventListener("resize", closeNow);
    return () => {
      document.removeEventListener("mousedown", close);
      window.removeEventListener("scroll", closeNow, true);
      window.removeEventListener("resize", closeNow);
    };
  }, [open]);

  const item = "w-full flex items-center gap-2.5 px-3 py-2 text-[0.85rem] font-medium rounded transition-colors text-left";
  const run = (fn: () => void) => () => { setOpen(false); fn(); };

  return (
    <>
      <button
        ref={btnRef}
        onClick={toggle}
        disabled={busy}
        aria-label={`More actions for ${group.name}`}
        className={`h-8 w-8 inline-flex items-center justify-center rounded-full border transition-colors ${
          open
            ? "border-[var(--ring)] text-[var(--foreground)] bg-[var(--accent)]"
            : "border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)]"
        }`}
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>
      {open && typeof document !== "undefined" && createPortal(
        <div
          ref={menuRef}
          style={{ top: pos.top, left: pos.left, width: MENU_W }}
          className="fixed z-[60] bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-xl p-1 animate-in fade-in zoom-in-95 duration-150"
        >
          <button className={`${item} text-[var(--foreground)] hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]`} onClick={run(onEdit)}>
            <Pencil className="w-4 h-4" /> Edit
          </button>
          <button className={`${item} text-[var(--foreground)] hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]`} onClick={run(onToggleStatus)}>
            <Power className="w-4 h-4" /> {group.status === "Active" ? "Deactivate" : "Activate"}
          </button>
          <div className="h-px bg-[var(--border)] my-1" />
          <button className={`${item} text-[var(--destructive)] hover:bg-[rgba(239,68,68,.1)]`} onClick={run(onDelete)}>
            <Trash2 className="w-4 h-4" /> Delete
          </button>
        </div>,
        document.body
      )}
    </>
  );
}

/**
 * Shared screen for the four contact group reference lists (contact groups, contact group types,
 * contact group lifecycles, marketing channels). Creating, editing and deleting need edit access to Marketing.
 */
export function ContactGroupRecordsView({ kind }: { kind: ContactGroupKind }) {
  const { label, noun, short, searchId } = CONTACT_GROUP_CONFIG[kind];
  const ALL_COLUMNS = React.useMemo(() => columnsFor(label), [label]);
  const query = useContactGroupRecordsQuery(kind);
  const groups = React.useMemo(() => query.data ?? [], [query.data]);
  const canEdit = usePermissions().can("marketing", "edit");

  const [searchQuery, setSearchQuery] = React.useState("");
  const [debouncedQuery, setDebouncedQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("All");
  const [activeColumns, setActiveColumns] = React.useState<string[]>(["name", "description", "key", "status", "createdBy", "updatedTime"]);

  const [pageSize, setPageSize] = React.useState(10);
  const [page, setPage] = React.useState(1);

  const [modal, setModal] = React.useState<{ mode: "create" | "edit" | "view"; group: ContactGroup | null } | null>(null);
  const [toDelete, setToDelete] = React.useState<ContactGroup | null>(null);

  // Debounce the search box; filtering happens on the loaded list.
  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // Back to the first page whenever the filters change.
  const filterKey = `${debouncedQuery}|${statusFilter}|${pageSize}`;
  const [lastFilterKey, setLastFilterKey] = React.useState(filterKey);
  if (filterKey !== lastFilterKey) { setLastFilterKey(filterKey); setPage(1); }

  const filtered = React.useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    return groups.filter((s) => {
      const matchesSearch = !q ||
        s.name.toLowerCase().includes(q) ||
        s.key.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q);
      const matchesStatus = statusFilter === "All" || s.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [groups, debouncedQuery, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIdx = (currentPage - 1) * pageSize;
  const pageRows = filtered.slice(startIdx, startIdx + pageSize);

  /* ---------- Mutations ---------- */
  const create = useCreateContactGroupRecord(kind, { success: `${label} type created successfully!`, onSuccess: () => setModal(null) });
  const save = useUpdateContactGroupRecord(kind, { success: `${label} type updated successfully!`, onSuccess: () => setModal(null) });
  const setStatus = useUpdateContactGroupRecord(kind, { success: (r) => `${r.name} is now ${r.status.toLowerCase()}` });
  const remove = useDeleteContactGroupRecord(kind, { success: () => `${toDelete?.name ?? label} deleted`, onSuccess: () => setToDelete(null) });
  const isSaving = create.isPending || save.isPending;
  const isDeleting = remove.isPending;

  const changeStatus = (s: ContactGroup, status: string) => {
    if (status === s.status || !canEdit) return;
    setStatus.run({ id: s.id, patch: { status: status as ContactGroup["status"] } });
  };

  const handleSubmit = (values: ContactGroupFormValues) => {
    if (modal?.mode === "edit" && modal.group) save.run({ id: modal.group.id, patch: values });
    else create.run(values);
  };

  const closeModal = () => {
    if (isSaving) return;
    create.reset();
    save.reset();
    setModal(null);
  };

  const confirmDelete = () => {
    if (toDelete) remove.run({ id: toDelete.id });
  };

  const handleExport = () => {
    const cols = ALL_COLUMNS.filter((c) => activeColumns.includes(c.id));
    const esc = (v: string) => `"${String(v).replace(/"/g, '""')}"`;
    const csv = [
      cols.map((c) => esc(c.label)).join(","),
      ...filtered.map((s) => cols.map((c) => esc(s[c.id as keyof ContactGroup] as string)).join(",")),
    ].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${short}-types.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${filtered.length} ${noun}${filtered.length === 1 ? "" : "s"}`);
  };

  /* ---------- Pagination numbers ---------- */
  const pageNumbers = React.useMemo<(number | "...")[]>(() => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const set = new Set([1, totalPages, currentPage - 1, currentPage, currentPage + 1].filter((n) => n >= 1 && n <= totalPages));
    const sorted = [...set].sort((a, b) => a - b);
    const out: (number | "...")[] = [];
    sorted.forEach((n, i) => {
      if (i > 0 && n - sorted[i - 1] > 1) out.push("...");
      out.push(n);
    });
    return out;
  }, [totalPages, currentPage]);

  const visibleColCount = activeColumns.length + 1;

  return (
    <div className="max-w-[1600px] w-full mx-auto">

      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-heading font-extrabold text-[var(--foreground)] tracking-tight">{label}</h1>
          <p className="text-[var(--muted-foreground)] mt-1">Define and manage the {short} stages for contact groups.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleExport} disabled={filtered.length === 0}>
            <Download className="w-4 h-4 mr-2" /> Export
          </Button>
          {canEdit && (
            <Button variant="default" onClick={() => setModal({ mode: "create", group: null })}>
              <Plus className="w-4 h-4 mr-2" /> New {label}
            </Button>
          )}
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-sm flex flex-col">

        {/* Filters */}
        <div className="p-6 flex items-end justify-between border-b border-[var(--border)] bg-[var(--card)] rounded-t-xl">
          <div className="flex items-center gap-6">
            <div className="flex flex-col gap-1.5">
              <label htmlFor={searchId} className="text-[0.85rem] font-bold text-[var(--foreground)]">Global Search</label>
              <div className="relative w-[320px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[var(--muted-foreground)]" />
                <input
                  id={searchId}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, key, description..."
                  className="w-full h-[2.8rem] pl-10 pr-4 rounded-[8px] border-[1.5px] border-[var(--input)] bg-[var(--card)] text-[var(--foreground)] text-[0.95rem] focus:outline-none focus:border-[var(--ring)] transition-colors"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              options={["All", ...STATUS_OPTIONS]}
              className="w-[130px] h-[2.8rem]"
            />
            <div className="w-px h-8 bg-[var(--border)] mx-2" />
            <ColumnToggle columns={ALL_COLUMNS} activeColumns={activeColumns} onChange={setActiveColumns} />
          </div>
        </div>

        {/* Table */}
        {query.isPending ? (
          <div className="w-full p-6 space-y-4" aria-busy="true" aria-label={`Loading ${noun}s`}>
            <div className="skeleton h-12 w-full rounded-md" />
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-16 w-full rounded-md" />)}
          </div>
        ) : query.isError ? (
          <div className="p-6"><ErrorState error={query.error} onRetry={() => query.refetch()} /></div>
        ) : (
          <>
            <div className="w-full overflow-x-auto">
              <Table className="min-w-full border-none shadow-none rounded-none">
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    {ALL_COLUMNS.map((col) => activeColumns.includes(col.id) && (
                      <TableHead key={col.id} className="whitespace-nowrap">{col.label}</TableHead>
                    ))}
                    <TableHead className="text-right sticky right-0 bg-[var(--background)]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pageRows.length === 0 ? (
                    <TableRow className="hover:bg-transparent">
                      <TableCell colSpan={visibleColCount} className="py-16">
                        <div className="flex flex-col items-center justify-center text-center">
                          <div className="w-12 h-12 rounded-full bg-[var(--accent)] flex items-center justify-center mb-3">
                            <Wrench className="w-5 h-5 text-[var(--primary)]" />
                          </div>
                          <p className="font-semibold text-[var(--foreground)]">No {short}s found</p>
                          <p className="text-[0.85rem] text-[var(--muted-foreground)] mt-1">
                            {groups.length === 0 ? (canEdit ? `Create your first ${noun} to get started.` : `No ${noun}s have been set up yet.`) : "Try adjusting your search or status filter."}
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : pageRows.map((s) => (
                    <TableRow key={s.id}>
                      {activeColumns.includes("name") && (
                        <TableCell className="font-semibold text-[var(--foreground)] whitespace-nowrap">
                          <button
                            onClick={() => setModal({ mode: "view", group: s })}
                            className="font-mono text-[0.88rem] hover:text-[var(--primary)] hover:underline transition-colors"
                          >
                            {s.name}
                          </button>
                        </TableCell>
                      )}
                      {activeColumns.includes("description") && (
                        <TableCell className="text-[0.85rem] text-[var(--muted-foreground)] max-w-[340px]">
                          <span className="line-clamp-2" title={s.description}>{s.description || "—"}</span>
                        </TableCell>
                      )}
                      {activeColumns.includes("key") && (
                        <TableCell>
                          <span className="font-mono text-[0.8rem] px-2 py-0.5 rounded bg-[var(--muted)] text-[var(--foreground)]">{s.key}</span>
                        </TableCell>
                      )}
                      {activeColumns.includes("status") && (
                        <TableCell>
                          {canEdit
                            ? <StatusDropdown status={s.status} options={STATUS_OPTIONS} onChange={(v) => changeStatus(s, v)} />
                            : <Badge variant={s.status === "Active" ? "success" : "destructive"}>{s.status}</Badge>}
                        </TableCell>
                      )}
                      {activeColumns.includes("createdBy") && (
                        <TableCell className="text-[var(--foreground)] font-medium whitespace-nowrap">{s.createdBy}</TableCell>
                      )}
                      {activeColumns.includes("createdTime") && (
                        <TableCell className="text-[0.85rem] text-[var(--muted-foreground)] whitespace-nowrap">{s.createdTime}</TableCell>
                      )}
                      {activeColumns.includes("updatedBy") && (
                        <TableCell className="text-[var(--foreground)] font-medium whitespace-nowrap">{s.updatedBy}</TableCell>
                      )}
                      {activeColumns.includes("updatedTime") && (
                        <TableCell className="text-[0.85rem] text-[var(--muted-foreground)] whitespace-nowrap">{s.updatedTime}</TableCell>
                      )}
                      <TableCell className="text-right sticky right-0 bg-[var(--card)] border-l border-[var(--border)]">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            className="rounded-full px-5 h-8 font-semibold"
                            onClick={() => setModal({ mode: "view", group: s })}
                          >
                            View
                          </Button>
                          {canEdit && (
                            <RowActionsMenu
                              group={s}
                              busy={setStatus.isPending}
                              onEdit={() => setModal({ mode: "edit", group: s })}
                              onToggleStatus={() => changeStatus(s, s.status === "Active" ? "Inactive" : "Active")}
                              onDelete={() => setToDelete(s)}
                            />
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination Footer */}
            <div className="p-4 border-t border-[var(--border)] bg-[var(--card)] rounded-b-xl flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <span className="text-[0.85rem] text-[var(--muted-foreground)]">
                  {filtered.length === 0
                    ? "No results"
                    : `Showing ${startIdx + 1} to ${Math.min(startIdx + pageSize, filtered.length)} of ${filtered.length} results`}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[0.8rem] text-[var(--muted-foreground)]">Rows per page</span>
                  <Select
                    value={String(pageSize)}
                    onChange={(v) => setPageSize(Number(v))}
                    options={["5", "10", "25", "50"]}
                    className="w-[76px] [&>div:first-child]:h-8 [&>div:first-child]:px-3"
                  />
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost" size="sm"
                  className="h-8 px-2 text-[var(--foreground)] font-medium hover:text-[var(--primary)]"
                  disabled={currentPage === 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" /> Prev
                </Button>
                {pageNumbers.map((n, i) => n === "..." ? (
                  <span key={`e${i}`} className="w-8 flex items-center justify-center text-[var(--muted-foreground)]">...</span>
                ) : (
                  <Button
                    key={n}
                    variant={n === currentPage ? "outline" : "ghost"}
                    size="sm"
                    onClick={() => setPage(n)}
                    className={n === currentPage
                      ? "h-8 w-8 p-0 border-[var(--border)] bg-[var(--card)] text-[var(--primary)] font-bold shadow-sm"
                      : "h-8 w-8 p-0 text-[var(--foreground)] font-medium"}
                  >
                    {n}
                  </Button>
                ))}
                <Button
                  variant="ghost" size="sm"
                  className="h-8 px-2 text-[var(--foreground)] font-medium hover:text-[var(--primary)]"
                  disabled={currentPage === totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Create / Edit / View */}
      <ContactGroupModal
        kind={kind}
        isOpen={!!modal}
        mode={modal?.mode ?? "create"}
        record={modal?.group ?? null}
        existing={groups}
        onClose={closeModal}
        onSubmit={handleSubmit}
        onEdit={() => { if (modal?.group) setModal({ mode: "edit", group: modal.group }); }}
        isSaving={isSaving}
        serverErrors={modal?.mode === "edit" ? save.fieldErrors : create.fieldErrors}
        canEdit={canEdit}
      />

      {/* Delete confirmation */}
      <Modal
        isOpen={!!toDelete}
        onClose={() => !isDeleting && setToDelete(null)}
        title={`Delete ${label}`}
        footer={
          <>
            <Button variant="outline" onClick={() => setToDelete(null)} disabled={isDeleting}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={isDeleting} className="min-w-[110px]">
              {isDeleting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Deleting...</> : "Delete"}
            </Button>
          </>
        }
      >
        <p className="text-[0.92rem] text-[var(--foreground)]">
          Are you sure you want to delete <span className="font-mono font-semibold">{toDelete?.name}</span>?
        </p>
        <p className="text-[0.85rem] text-[var(--muted-foreground)] mt-2">
          Products and offers linked to this {short} may stop working. This action cannot be undone.
        </p>
      </Modal>
    </div>
  );
}
