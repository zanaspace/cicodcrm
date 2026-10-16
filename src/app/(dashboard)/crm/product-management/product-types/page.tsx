"use client";

import * as React from "react";
import { Table, TableActionsCell, TableActionsHead, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { RowActionsMenu } from "@/components/ui/RowActionsMenu";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { ColumnToggle } from "@/components/ui/ColumnToggle";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import {
  Search, Plus, Pencil, Power, Trash2, Wrench, Loader2, Eye,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { ProductTypeModal, type ProductType, type ProductTypeFormValues } from "./components/ProductTypeModal";
import { useProductTypesQuery, useCreateProductType, useDeleteProductType, useUpdateProductType } from "@/features/product-management/queries";
import { usePermissions } from "@/lib/permissions";
import { ErrorState } from "@/components/feedback/States";


const ALL_COLUMNS = [
  { id: "name", label: "Name" },
  { id: "description", label: "Description" },
  { id: "createdBy", label: "Created By" },
  { id: "createdTime", label: "Created Time" },
  { id: "updatedBy", label: "Updated By" },
  { id: "updatedTime", label: "Updated Time" },
  { id: "status", label: "Status" },
];

export default function ProductTypesPage() {
  const query = useProductTypesQuery();
  const productTypes = React.useMemo(() => query.data ?? [], [query.data]);
  const { can } = usePermissions();
  const canEdit = can("catalogue", "edit");
  const canDelete = can("catalogue", "full");

  const [searchQuery, setSearchQuery] = React.useState("");
  const [debouncedQuery, setDebouncedQuery] = React.useState("");
  const [searchField] = React.useState("Select Filter");
  const [activeColumns, setActiveColumns] = React.useState<string[]>(ALL_COLUMNS.map(c => c.id));

  const [pageSize, setPageSize] = React.useState(10);
  const [page, setPage] = React.useState(1);

  const [modal, setModal] = React.useState<{ mode: "create" | "edit" | "view"; type: ProductType | null } | null>(null);
  const [toDelete, setToDelete] = React.useState<ProductType | null>(null);
  const [toToggle, setToToggle] = React.useState<ProductType | null>(null);

  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(searchQuery), 250);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const filterKey = JSON.stringify([debouncedQuery, searchField, pageSize]);
  const [pagedFilterKey, setPagedFilterKey] = React.useState(filterKey);
  if (pagedFilterKey !== filterKey) { setPagedFilterKey(filterKey); setPage(1); }

  const filtered = React.useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    return productTypes.filter((pt) => {
      if (!q) return true;
      
      switch (searchField) {
        case "Name": return pt.name.toLowerCase().includes(q);
        case "Description": return pt.description.toLowerCase().includes(q);
        case "Created By": return pt.createdBy.toLowerCase().includes(q);
        case "Updated By": return pt.updatedBy.toLowerCase().includes(q);
        case "Status": return pt.status.toLowerCase().includes(q);
        default: 
          return pt.name.toLowerCase().includes(q) || 
                 pt.description.toLowerCase().includes(q) ||
                 pt.createdBy.toLowerCase().includes(q);
      }
    });
  }, [productTypes, debouncedQuery, searchField]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIdx = (currentPage - 1) * pageSize;
  const pageRows = filtered.slice(startIdx, startIdx + pageSize);

  /* ---------- Mutations ---------- */
  /** Toast for the update in flight: edits, status and visibility changes are worded differently. */
  const updateMessage = React.useRef("");
  const create = useCreateProductType({ success: "Product type created successfully!", onSuccess: () => setModal(null) });
  const update = useUpdateProductType({ success: () => updateMessage.current, onSuccess: () => { setModal(null); setToToggle(null); } });
  const remove = useDeleteProductType({ success: () => `${toDelete?.name} deleted`, onSuccess: () => setToDelete(null) });
  const isDeleting = remove.isPending;

  const runUpdate = (id: string, patch: Partial<ProductType>, message: string) => {
    if (update.isPending) return;
    updateMessage.current = message;
    update.run({ id, patch });
  };

  const changeStatus = (s: ProductType, status: string) => {
    if (status === s.status) return;
    runUpdate(s.id, { status: status as ProductType["status"] }, `${s.name} is now ${status.toLowerCase()}`);
  };

  const handleSubmit = (values: ProductTypeFormValues) => {
    if (modal?.mode === "edit" && modal.type) runUpdate(modal.type.id, values, "Product type updated successfully!");
    else create.run(values);
  };

  const confirmDelete = () => {
    if (toDelete) remove.run({ id: toDelete.id });
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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-heading font-extrabold text-[var(--foreground)] tracking-tight">Product Types</h1>
        </div>
        <div className="flex items-center gap-3">
          {canEdit && (
          <Button variant="default" onClick={() => setModal({ mode: "create", type: null })}>
            <Plus className="w-4 h-4 mr-2" /> Create Product Type
          </Button>
          )}
        </div>
      </div>

      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-sm flex flex-col">
        <div className="p-6 flex items-end justify-between border-b border-[var(--border)] bg-[var(--card)] rounded-t-xl">
          <div className="flex items-center gap-6">
            <div className="flex flex-col gap-1.5">
              <label className="text-[0.85rem] font-bold text-[var(--foreground)]">Global Search</label>
              <div className="relative w-[320px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[var(--muted-foreground)]" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search..." 
                  className="w-full h-[2.8rem] pl-10 pr-4 rounded-[8px] border-[1.5px] border-[var(--input)] bg-[var(--card)] text-[var(--foreground)] text-[0.95rem] focus:outline-none focus:border-[var(--ring)] transition-colors"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1.5 items-end">
            <div className="flex items-center gap-2">
               <Select
                value={String(pageSize)}
                onChange={(v) => setPageSize(v === "All" ? filtered.length || 10 : Number(v))}
                options={["All", "5", "10", "25", "50"]}
                className="w-[100px] h-[2.8rem]"
              />

              <div className="w-px h-8 bg-[var(--border)] mx-2"></div>
              
              <ColumnToggle 
                columns={ALL_COLUMNS} 
                activeColumns={activeColumns} 
                onChange={setActiveColumns} 
              />
            </div>
          </div>
        </div>

        {/* Table */}
        {query.isPending ? (
          <div className="w-full p-6 space-y-4">
            <div className="skeleton h-12 w-full rounded-md" />
            {Array.from({ length: 2 }).map((_, i) => <div key={i} className="skeleton h-16 w-full rounded-md" />)}
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
                          <p className="font-semibold text-[var(--foreground)]">No product types found</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : pageRows.map((s) => (
                    <TableRow key={s.id} onClick={() => setModal({ mode: "view", type: s })} className="cursor-pointer">
                      {activeColumns.includes("name") && (
                        <TableCell className="text-[var(--foreground)] whitespace-nowrap">
                          {s.name}
                        </TableCell>
                      )}
                      {activeColumns.includes("description") && (
                        <TableCell className="text-[0.85rem] text-[var(--foreground)] max-w-[200px]">
                          <span className="line-clamp-2" title={s.description}>{s.description || "-"}</span>
                        </TableCell>
                      )}
                      {activeColumns.includes("createdBy") && (
                        <TableCell className="text-[var(--foreground)] whitespace-nowrap">{s.createdBy}</TableCell>
                      )}
                      {activeColumns.includes("createdTime") && (
                        <TableCell className="text-[0.85rem] text-[var(--foreground)] whitespace-nowrap">{s.createdTime}</TableCell>
                      )}
                      {activeColumns.includes("updatedBy") && (
                        <TableCell className="text-[var(--foreground)] whitespace-nowrap">{s.updatedBy}</TableCell>
                      )}
                      {activeColumns.includes("updatedTime") && (
                        <TableCell className="text-[0.85rem] text-[var(--foreground)] whitespace-nowrap">{s.updatedTime}</TableCell>
                      )}
                      {activeColumns.includes("status") && (
                        <TableCell>
                           <Badge variant={s.status === "Active" ? "success" : "destructive"} className="px-3 py-1 rounded-md text-[0.75rem]">{s.status}</Badge>
                        </TableCell>
                      )}
                      <TableActionsCell>
                        <RowActionsMenu
                          label={`Actions for ${s.name}`}
                          actions={[
                            { label: "View", icon: Eye, onSelect: () => setModal({ mode: "view", type: s }) },
                            ...(canEdit ? [{ label: "Edit", icon: Pencil, onSelect: () => setModal({ mode: "edit", type: s }) }] : []),
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
                    : `Showing ${startIdx + 1}-${Math.min(startIdx + pageSize, filtered.length)} of ${filtered.length} records`}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline" size="sm"
                  className="h-8 px-3 text-[var(--foreground)] font-medium"
                  disabled={currentPage === 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </Button>
                {pageNumbers.map((n, i) => n === "..." ? (
                  <span key={`e${i}`} className="w-8 flex items-center justify-center text-[var(--muted-foreground)]">...</span>
                ) : (
                  <Button
                    key={n}
                    variant={n === currentPage ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPage(n)}
                    className={n === currentPage
                      ? "h-8 w-8 p-0 bg-[var(--primary)] text-white font-bold shadow-sm"
                      : "h-8 w-8 p-0 text-[var(--foreground)] font-medium border-none bg-transparent"}
                  >
                    {n}
                  </Button>
                ))}
                <Button
                  variant="outline" size="sm"
                  className="h-8 px-3 text-[var(--foreground)] font-medium"
                  disabled={currentPage === totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      <ProductTypeModal
        isOpen={!!modal}
        mode={modal?.mode ?? "create"}
        productType={modal?.type ?? null}
        existing={productTypes}
        onClose={() => setModal(null)}
        onSubmit={handleSubmit}
        isSaving={create.isPending || update.isPending}
        onEdit={!canEdit ? undefined : () => modal?.type && setModal({ mode: "edit", type: modal.type })}
      />

      <ConfirmDialog
        isOpen={!!toToggle}
        onClose={() => setToToggle(null)}
        onConfirm={() => { if (toToggle) changeStatus(toToggle, toToggle.status === "Active" ? "Inactive" : "Active"); }}
        pending={update.isPending}
        tone={toToggle?.status === "Active" ? "danger" : "primary"}
        title={toToggle?.status === "Active" ? `Deactivate ${toToggle?.name}?` : `Activate ${toToggle?.name}?`}
        description={toToggle?.status === "Active" ? "Products of this type can no longer be created or sold. Existing customers are not affected." : "Products of this type can be created and sold again."}
        confirmLabel={toToggle?.status === "Active" ? "Deactivate" : "Activate"}
      />

      <Modal
        isOpen={!!toDelete}
        onClose={() => !isDeleting && setToDelete(null)}
        title="Delete Product Type"
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
      </Modal>
    </div>
  );
}
