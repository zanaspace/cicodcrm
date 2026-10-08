"use client";

import * as React from "react";
import { Table, TableActionsCell, TableActionsHead, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { RowActionsMenu } from "@/components/ui/RowActionsMenu";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { toast } from "@/components/ui/Toast";
import {
  Search, Plus, Pencil, Trash2, Wrench, Loader2, Eye,
} from "lucide-react";
import { ColumnToggle } from "@/components/ui/ColumnToggle";
import { BundleGroupModal, type BundleGroup, type BundleGroupFormValues } from "./components/BundleGroupModal";

const CURRENT_USER = "Adeola Adesina";

const ALL_COLUMNS = [
  { id: "select", label: "" },
  { id: "name", label: "Bundle Group Name" },
  { id: "key", label: "Group Key" },
  { id: "description", label: "Description" },
  { id: "createdBy", label: "Created By" },
  { id: "createdTime", label: "Created Time" },
  { id: "updatedBy", label: "Updated By" },
  { id: "updatedTime", label: "Updated Time" },
  { id: "status", label: "Status" },
];

const INITIAL_GROUPS: BundleGroup[] = [
  { 
    id: "bg-1", 
    name: "NIPOST", 
    key: "nipost_bundles",
    description: "for NIPOST project", 
    createdBy: "Adeola Adesina", 
    createdTime: "06-03-2024 09:52:59 AM", 
    updatedBy: "", 
    updatedTime: "", 
    status: "Active" 
  },
  { 
    id: "bg-2", 
    name: "CICOD Enterprise", 
    key: "cicod_enterprise",
    description: "This is a bundle group for CICOD Enterprise Product", 
    createdBy: "Williams Tomita", 
    createdTime: "07-09-2020 12:56:17 PM", 
    updatedBy: "", 
    updatedTime: "", 
    status: "Active" 
  },
];

function formatNow(d = new Date()) {
  const pad = (n: number) => String(n).padStart(2, "0");
  const h = d.getHours();
  const h12 = h % 12 || 12;
  return `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()} ${pad(h12)}:${pad(d.getMinutes())} ${h < 12 ? "AM" : "PM"}`;
}

export default function BundleGroupsPage() {
  const [groups, setGroups] = React.useState<BundleGroup[]>(INITIAL_GROUPS);

  const [isLoading, setIsLoading] = React.useState(true);
  const [activeColumns, setActiveColumns] = React.useState<string[]>(ALL_COLUMNS.map(c => c.id));
  const [searchQuery, setSearchQuery] = React.useState("");
  const [debouncedQuery, setDebouncedQuery] = React.useState("");
  const [searchField, setSearchField] = React.useState("Select Filter");

  const [pageSize, setPageSize] = React.useState(10);
  const [page, setPage] = React.useState(1);

  const [modal, setModal] = React.useState<{ mode: "create" | "edit" | "view"; group: BundleGroup | null } | null>(null);
  const [toDelete, setToDelete] = React.useState<BundleGroup | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());

  React.useEffect(() => {
    // Debounce only; the skeleton shows on first load, not on every keystroke.
    const t = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setIsLoading(false);
    }, 250);
    return () => clearTimeout(t);
  }, [searchQuery]);

  React.useEffect(() => { setPage(1); }, [debouncedQuery, searchField, pageSize]);

  const filtered = React.useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    return groups.filter((pt) => {
      if (!q) return true;
      
      switch (searchField) {
        case "Bundle Group Name": return pt.name.toLowerCase().includes(q);
        case "Group Key": return pt.key.toLowerCase().includes(q);
        case "Description": return pt.description.toLowerCase().includes(q);
        case "Created By": return pt.createdBy.toLowerCase().includes(q);
        default: 
          return pt.name.toLowerCase().includes(q) || 
                 pt.key.toLowerCase().includes(q) ||
                 pt.description.toLowerCase().includes(q);
      }
    });
  }, [groups, debouncedQuery, searchField]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIdx = (currentPage - 1) * pageSize;
  const pageRows = filtered.slice(startIdx, startIdx + pageSize);

  const toggleSelectAll = () => {
    if (selectedIds.size === pageRows.length && pageRows.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(pageRows.map((r) => r.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  /* ---------- Mutations ---------- */
  const updateGroup = (id: string, patch: Partial<BundleGroup>) => {
    setGroups((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch, updatedBy: CURRENT_USER, updatedTime: formatNow() } : s)));
  };

  const handleSubmit = (values: BundleGroupFormValues) => {
    if (modal?.mode === "edit" && modal.group) {
      updateGroup(modal.group.id, values);
      toast.success("Bundle group updated successfully!");
    } else {
      const now = formatNow();
      setGroups((prev) => [
        { id: `bg-${Date.now()}`, ...values, createdBy: CURRENT_USER, createdTime: now, updatedBy: "", updatedTime: "", status: "Active" },
        ...prev,
      ]);
      toast.success("Bundle group created successfully!");
    }
    setModal(null);
  };

  const confirmDelete = () => {
    if (!toDelete) return;
    setIsDeleting(true);
    setTimeout(() => {
      setGroups((prev) => prev.filter((s) => s.id !== toDelete.id));
      toast.success(`${toDelete.name} deleted`);
      setIsDeleting(false);
      setToDelete(null);
    }, 1200);
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

  const visibleColCount = ALL_COLUMNS.length + 1;

  return (
    <div className="max-w-[1600px] w-full mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-heading font-extrabold text-[var(--foreground)] tracking-tight">Bundle Groups</h1>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="default" onClick={() => setModal({ mode: "create", group: null })}>
            <Plus className="w-4 h-4 mr-2" /> Create Bundle Group
          </Button>
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
        {isLoading ? (
          <div className="w-full p-6 space-y-4">
            <div className="skeleton h-12 w-full rounded-md" />
            {Array.from({ length: 2 }).map((_, i) => <div key={i} className="skeleton h-16 w-full rounded-md" />)}
          </div>
        ) : (
          <>
            <div className="w-full overflow-x-auto">
              <Table className="min-w-full border-none shadow-none rounded-none">
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    {ALL_COLUMNS.map((col) => activeColumns.includes(col.id) && (
                      <TableHead key={col.id} className={col.id === "select" ? "w-10 px-4" : "whitespace-nowrap"}>
                        {col.id === "select" ? (
                           <input 
                             type="checkbox" 
                             className="w-4 h-4 rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)]"
                             checked={selectedIds.size === pageRows.length && pageRows.length > 0}
                             onChange={toggleSelectAll}
                           />
                        ) : col.label}
                      </TableHead>
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
                          <p className="font-semibold text-[var(--foreground)]">No bundle groups found</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : pageRows.map((s) => (
                    <TableRow key={s.id} onClick={() => setModal({ mode: "view", group: s })} className="cursor-pointer">
                      {activeColumns.includes("select") && (
                        <TableCell className="w-10 px-4" onClick={(e) => e.stopPropagation()}>
                           <input 
                             type="checkbox" 
                             className="w-4 h-4 rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)]"
                             checked={selectedIds.has(s.id)}
                             onChange={() => toggleSelect(s.id)}
                           />
                        </TableCell>
                      )}
                      {activeColumns.includes("name") && (
                        <TableCell className="text-[var(--foreground)] whitespace-nowrap font-medium">
                          {s.name}
                        </TableCell>
                      )}
                      {activeColumns.includes("key") && (
                        <TableCell className="text-[var(--foreground)] whitespace-nowrap">
                          {s.key}
                        </TableCell>
                      )}
                      {activeColumns.includes("description") && (
                        <TableCell className="text-[0.85rem] text-[var(--foreground)]">
                          <span className="line-clamp-2 w-[220px]" title={s.description}>{s.description || "-"}</span>
                        </TableCell>
                      )}
                      {activeColumns.includes("createdBy") && (
                        <TableCell className="text-[var(--foreground)] whitespace-nowrap">{s.createdBy}</TableCell>
                      )}
                      {activeColumns.includes("createdTime") && (
                        <TableCell className="text-[0.85rem] text-[var(--foreground)] whitespace-nowrap">{s.createdTime}</TableCell>
                      )}
                      {activeColumns.includes("updatedBy") && (
                        <TableCell className="text-[var(--foreground)] whitespace-nowrap">{s.updatedBy || "-"}</TableCell>
                      )}
                      {activeColumns.includes("updatedTime") && (
                        <TableCell className="text-[0.85rem] text-[var(--foreground)] whitespace-nowrap">{s.updatedTime || "-"}</TableCell>
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
                            { label: "View", icon: Eye, onSelect: () => setModal({ mode: "view", group: s }) },
                            { label: "Edit", icon: Pencil, onSelect: () => setModal({ mode: "edit", group: s }) },
                            { label: "Delete", icon: Trash2, danger: true, onSelect: () => setToDelete(s) },
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

      <BundleGroupModal
        isOpen={!!modal}
        mode={modal?.mode ?? "create"}
        bundleGroup={modal?.group ?? null}
        existing={groups}
        onClose={() => setModal(null)}
        onSubmit={handleSubmit}
        onEdit={() => modal?.group && setModal({ mode: "edit", group: modal.group })}
      />

      <Modal
        isOpen={!!toDelete}
        onClose={() => !isDeleting && setToDelete(null)}
        title="Delete Bundle Group"
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
