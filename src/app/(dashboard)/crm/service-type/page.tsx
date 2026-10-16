"use client";

import * as React from "react";
import { Table, TableActionsCell, TableActionsHead, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { RowActionsMenu } from "@/components/ui/RowActionsMenu";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { toast } from "@/components/ui/Toast";
import { ColumnToggle } from "@/components/ui/ColumnToggle";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Modal } from "@/components/ui/Modal";
import {
  Search, ChevronLeft, ChevronRight, Download, Plus, Pencil, Power, Trash2, Wrench, Loader2, Eye,
} from "lucide-react";
import { ServiceTypeModal, type ServiceType, type ServiceTypeFormValues } from "./components/ServiceTypeModal";
import { useServiceTypesQuery, useCreateServiceType, useDeleteServiceType, useUpdateServiceType } from "@/features/product-management/queries";
import { usePermissions } from "@/lib/permissions";
import { ErrorState } from "@/components/feedback/States";

const STATUS_OPTIONS = ["Active", "Inactive"];

const ALL_COLUMNS = [
  { id: "name", label: "Service Type Name" },
  { id: "description", label: "Description" },
  { id: "key", label: "Service Key" },
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
export default function ServiceTypesPage() {
  const query = useServiceTypesQuery();
  const services = React.useMemo(() => query.data ?? [], [query.data]);
  const { can } = usePermissions();
  const canEdit = can("catalogue", "edit");
  const canDelete = can("catalogue", "full");

  const [searchQuery, setSearchQuery] = React.useState("");
  const [debouncedQuery, setDebouncedQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("All");
  const [activeColumns, setActiveColumns] = React.useState<string[]>(["name", "description", "key", "status", "createdBy", "updatedTime"]);

  const [pageSize, setPageSize] = React.useState(10);
  const [page, setPage] = React.useState(1);

  const [modal, setModal] = React.useState<{ mode: "create" | "edit" | "view"; service: ServiceType | null } | null>(null);
  const [toDelete, setToDelete] = React.useState<ServiceType | null>(null);
  const [toToggle, setToToggle] = React.useState<ServiceType | null>(null);

  // Simulate API latency on search / filter changes (same pattern as Customers)
  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(searchQuery), 250);
    return () => clearTimeout(t);
  }, [searchQuery, statusFilter]);

  const filterKey = JSON.stringify([debouncedQuery, statusFilter, pageSize]);
  const [pagedFilterKey, setPagedFilterKey] = React.useState(filterKey);
  if (pagedFilterKey !== filterKey) { setPagedFilterKey(filterKey); setPage(1); }

  const filtered = React.useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    return services.filter((s) => {
      const matchesSearch = !q ||
        s.name.toLowerCase().includes(q) ||
        s.key.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q);
      const matchesStatus = statusFilter === "All" || s.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [services, debouncedQuery, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIdx = (currentPage - 1) * pageSize;
  const pageRows = filtered.slice(startIdx, startIdx + pageSize);

  /* ---------- Mutations ---------- */
  /** Toast for the update in flight: edits, status and visibility changes are worded differently. */
  const updateMessage = React.useRef("");
  const create = useCreateServiceType({ success: "Service type created successfully!", onSuccess: () => setModal(null) });
  const update = useUpdateServiceType({ success: () => updateMessage.current, onSuccess: () => { setModal(null); setToToggle(null); } });
  const remove = useDeleteServiceType({ success: () => `${toDelete?.name} deleted`, onSuccess: () => setToDelete(null) });
  const isDeleting = remove.isPending;

  const runUpdate = (id: string, patch: Partial<ServiceType>, message: string) => {
    if (update.isPending) return;
    updateMessage.current = message;
    update.run({ id, patch });
  };

  const changeStatus = (s: ServiceType, status: string) => {
    if (status === s.status) return;
    runUpdate(s.id, { status: status as ServiceType["status"] }, `${s.name} is now ${status.toLowerCase()}`);
  };

  const handleSubmit = (values: ServiceTypeFormValues) => {
    if (modal?.mode === "edit" && modal.service) runUpdate(modal.service.id, values, "Service type updated successfully!");
    else create.run(values);
  };

  const confirmDelete = () => {
    if (toDelete) remove.run({ id: toDelete.id });
  };

  const handleExport = () => {
    const cols = ALL_COLUMNS.filter((c) => activeColumns.includes(c.id));
    const esc = (v: string) => `"${String(v).replace(/"/g, '""')}"`;
    const csv = [
      cols.map((c) => esc(c.label)).join(","),
      ...filtered.map((s) => cols.map((c) => esc(s[c.id as keyof ServiceType] as string)).join(",")),
    ].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "service-types.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${filtered.length} service type${filtered.length === 1 ? "" : "s"}`);
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
          <h1 className="text-3xl font-heading font-extrabold text-[var(--foreground)] tracking-tight">Service Types</h1>
          <p className="text-[var(--muted-foreground)] mt-1">Define and manage the services offered across CICOD products.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleExport} disabled={filtered.length === 0}>
            <Download className="w-4 h-4 mr-2" /> Export
          </Button>
          {canEdit && (
          <Button variant="default" onClick={() => setModal({ mode: "create", service: null })}>
            <Plus className="w-4 h-4 mr-2" /> New Service Type
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
              <label htmlFor="svc-search" className="text-[0.85rem] font-bold text-[var(--foreground)]">Global Search</label>
              <div className="relative w-[320px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[var(--muted-foreground)]" />
                <input
                  id="svc-search"
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
          <div className="w-full p-6 space-y-4">
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
                    <TableActionsHead />
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
                          <p className="font-semibold text-[var(--foreground)]">No service types found</p>
                          <p className="text-[0.85rem] text-[var(--muted-foreground)] mt-1">
                            {services.length === 0 ? "Create your first service type to get started." : "Try adjusting your search or status filter."}
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : pageRows.map((s) => (
                    <TableRow key={s.id} onClick={() => setModal({ mode: "view", service: s })} className="cursor-pointer">
                      {activeColumns.includes("name") && (
                        <TableCell className="font-semibold text-[var(--foreground)] whitespace-nowrap">
                          <button
                            onClick={() => setModal({ mode: "view", service: s })}
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
                          <StatusBadge status={s.status} />
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
                      <TableActionsCell>
                        <RowActionsMenu
                          label={`Actions for ${s.name}`}
                          actions={[
                            { label: "View", icon: Eye, onSelect: () => setModal({ mode: "view", service: s }) },
                            ...(canEdit ? [{ label: "Edit", icon: Pencil, onSelect: () => setModal({ mode: "edit", service: s }) }] : []),
                            ...(canEdit ? [{ label: s.status === "Active" ? "Deactivate" : "Activate", icon: Power, onSelect: () => setToToggle(s) }] : []),
                            ...(canDelete ? [{ label: "Delete", icon: Trash2, danger: true, onSelect: () => setToDelete(s) }] : []),
                          ]}
                        />
                      </TableActionsCell>
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
      <ServiceTypeModal
        isOpen={!!modal}
        mode={modal?.mode ?? "create"}
        service={modal?.service ?? null}
        existing={services}
        onClose={() => setModal(null)}
        onSubmit={handleSubmit}
        isSaving={create.isPending || update.isPending}
        onEdit={!canEdit ? undefined : () => modal?.service && setModal({ mode: "edit", service: modal.service })}
      />

      {/* Status change confirmation: deactivating a service affects every product built on it */}
      <ConfirmDialog
        isOpen={!!toToggle}
        onClose={() => setToToggle(null)}
        onConfirm={() => { if (toToggle) changeStatus(toToggle, toToggle.status === "Active" ? "Inactive" : "Active"); }}
        pending={update.isPending}
        tone={toToggle?.status === "Active" ? "danger" : "primary"}
        title={toToggle?.status === "Active" ? `Deactivate ${toToggle?.name}?` : `Activate ${toToggle?.name}?`}
        description={toToggle?.status === "Active"
          ? "Products that use this service can no longer be sold. Existing customers are not affected."
          : "Products that use this service can be sold again."}
        confirmLabel={toToggle?.status === "Active" ? "Deactivate" : "Activate"}
      />

      {/* Delete confirmation */}
      <Modal
        isOpen={!!toDelete}
        onClose={() => !isDeleting && setToDelete(null)}
        title="Delete Service Type"
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
          Products and offers linked to this service may stop working. This action cannot be undone.
        </p>
      </Modal>
    </div>
  );
}
