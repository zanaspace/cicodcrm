"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { toast } from "@/components/ui/Toast";
import {
  Search, Plus, ChevronLeft, ChevronRight, MoreHorizontal, Pencil, Power, Trash2, Wrench, Loader2, View
} from "lucide-react";
import { ColumnToggle } from "@/components/ui/ColumnToggle";
import { SingleOfferModal, type SingleOffer, type SingleOfferFormValues } from "./components/SingleOfferModal";

const CURRENT_USER = "Williams Tomita";

const ALL_COLUMNS = [
  { id: "offerCode", label: "Offer Code" },
  { id: "offerName", label: "Offer Name" },
  { id: "product", label: "Product" },
  { id: "tenantType", label: "Tenant Type" },
  { id: "subscriptionType", label: "Subscription Type" },
  { id: "createdBy", label: "Created By" },
  { id: "createdTime", label: "Created Time" },
  { id: "updatedBy", label: "Updated By" },
  { id: "updatedTime", label: "Updated Time" },
  { id: "webVisibility", label: "Web Visibility" },
  { id: "status", label: "Status" },
];

const INITIAL_OFFERS: SingleOffer[] = [
  { 
    id: "so-1", 
    offerCode: "UCG009",
    offerName: "Premium",
    product: "Unified Collections Gateway",
    tenantType: "MERCHANT",
    subscriptionType: "PER_USER",
    createdBy: "Williams Tomita", 
    createdTime: "08-09-2020 04:08:15 AM", 
    updatedBy: "Isaac Adegunle", 
    updatedTime: "24-08-2021 01:13:47 PM", 
    webVisibility: true,
    status: "Active" 
  },
  { 
    id: "so-2", 
    offerCode: "UCG008",
    offerName: "Standard",
    product: "Unified Collections Gateway",
    tenantType: "MERCHANT",
    subscriptionType: "PER_USER",
    createdBy: "Williams Tomita", 
    createdTime: "08-09-2020 04:03:37 AM", 
    updatedBy: "Isaac Adegunle", 
    updatedTime: "24-08-2021 01:15:53 PM", 
    webVisibility: true,
    status: "Active" 
  },
];

function formatNow(d = new Date()) {
  const pad = (n: number) => String(n).padStart(2, "0");
  const h = d.getHours();
  const h12 = h % 12 || 12;
  return `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()} ${pad(h12)}:${pad(d.getMinutes())} ${h < 12 ? "AM" : "PM"}`;
}

function RowActionsMenu({
  offer, onView, onEdit, onToggleVisibility, onToggleStatus, onDelete,
}: {
  offer: SingleOffer;
  onView: () => void;
  onEdit: () => void;
  onToggleVisibility: () => void;
  onToggleStatus: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [pos, setPos] = React.useState({ top: 0, left: 0 });
  const btnRef = React.useRef<HTMLButtonElement>(null);
  const menuRef = React.useRef<HTMLDivElement>(null);

  const MENU_W = 184;
  const MENU_H = 180;

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
        className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[var(--accent)] text-[var(--muted-foreground)] transition-colors"
      >
        <MoreHorizontal className="w-[18px] h-[18px]" />
      </button>
      {open && typeof document !== "undefined" && createPortal(
        <div
          ref={menuRef}
          style={{ top: pos.top, left: pos.left, width: MENU_W }}
          className="fixed z-[60] bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-xl p-1 animate-in fade-in zoom-in-95 duration-150"
        >
          <button className={`${item} text-[var(--foreground)] hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]`} onClick={run(onView)}>
            <View className="w-4 h-4" /> View
          </button>
          <button className={`${item} text-[var(--foreground)] hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]`} onClick={run(onEdit)}>
            <Pencil className="w-4 h-4" /> Update
          </button>
          <button className={`${item} text-[var(--foreground)] hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]`} onClick={run(onToggleVisibility)}>
            <Power className="w-4 h-4" /> Set Visibility: {offer.webVisibility ? "OFF" : "ON"}
          </button>
          <button className={`${item} text-[var(--foreground)] hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]`} onClick={run(onToggleStatus)}>
            <Power className="w-4 h-4" /> {offer.status === "Active" ? "Suspend" : "Activate"}
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

export default function SingleOffersPage() {
  const [offers, setOffers] = React.useState<SingleOffer[]>(INITIAL_OFFERS);

  const [isLoading, setIsLoading] = React.useState(true);
  const [activeColumns, setActiveColumns] = React.useState<string[]>(ALL_COLUMNS.map(c => c.id));
  const [searchQuery, setSearchQuery] = React.useState("");
  const [debouncedQuery, setDebouncedQuery] = React.useState("");
  const [searchField, setSearchField] = React.useState("Select Filter");

  const [pageSize, setPageSize] = React.useState(10);
  const [page, setPage] = React.useState(1);

  const [modal, setModal] = React.useState<{ mode: "create" | "edit" | "view"; offer: SingleOffer | null } | null>(null);
  const [toDelete, setToDelete] = React.useState<SingleOffer | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  React.useEffect(() => {
    setIsLoading(true);
    const t = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setIsLoading(false);
    }, 600);
    return () => clearTimeout(t);
  }, [searchQuery]);

  React.useEffect(() => { setPage(1); }, [debouncedQuery, searchField, pageSize]);

  const filtered = React.useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    return offers.filter((pt) => {
      if (!q) return true;
      
      switch (searchField) {
        case "Offer Code": return pt.offerCode.toLowerCase().includes(q);
        case "Offer Name": return pt.offerName.toLowerCase().includes(q);
        case "Product": return pt.product.toLowerCase().includes(q);
        case "Tenant Type": return pt.tenantType.toLowerCase().includes(q);
        default: 
          return pt.offerName.toLowerCase().includes(q) || 
                 pt.offerCode.toLowerCase().includes(q) ||
                 pt.product.toLowerCase().includes(q);
      }
    });
  }, [offers, debouncedQuery, searchField]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIdx = (currentPage - 1) * pageSize;
  const pageRows = filtered.slice(startIdx, startIdx + pageSize);

  /* ---------- Mutations ---------- */
  const updateOffer = (id: string, patch: Partial<SingleOffer>) => {
    setOffers((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch, updatedBy: CURRENT_USER, updatedTime: formatNow() } : s)));
  };

  const changeStatus = (s: SingleOffer, status: string) => {
    if (status === s.status) return;
    updateOffer(s.id, { status: status as SingleOffer["status"] });
    toast.success(`${s.offerName} is now ${status.toLowerCase()}`);
  };

  const toggleVisibility = (s: SingleOffer) => {
    updateOffer(s.id, { webVisibility: !s.webVisibility });
    toast.success(`Web visibility for ${s.offerName} turned ${!s.webVisibility ? "ON" : "OFF"}`);
  };

  const handleSubmit = (values: SingleOfferFormValues) => {
    if (modal?.mode === "edit" && modal.offer) {
      updateOffer(modal.offer.id, values);
      toast.success("Offer updated successfully!");
    } else {
      const now = formatNow();
      setOffers((prev) => [
        { id: `so-${Date.now()}`, ...values, createdBy: CURRENT_USER, createdTime: now, updatedBy: "", updatedTime: "", status: "Active", webVisibility: true },
        ...prev,
      ]);
      toast.success("Offer created successfully!");
    }
    setModal(null);
  };

  const confirmDelete = () => {
    if (!toDelete) return;
    setIsDeleting(true);
    setTimeout(() => {
      setOffers((prev) => prev.filter((s) => s.id !== toDelete.id));
      toast.success(`${toDelete.offerName} deleted`);
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
          <h1 className="text-3xl font-heading font-extrabold text-[var(--foreground)] tracking-tight">Product Offers</h1>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="default" onClick={() => setModal({ mode: "create", offer: null })}>
            <Plus className="w-4 h-4 mr-2" /> Create Product Offer
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
                      <TableHead key={col.id} className="whitespace-nowrap">{col.label}</TableHead>
                    ))}
                    <TableHead className="text-right sticky right-0 bg-[var(--card)]">Actions</TableHead>
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
                          <p className="font-semibold text-[var(--foreground)]">No offers found</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : pageRows.map((s) => (
                    <TableRow key={s.id}>
                      {activeColumns.includes("offerCode") && (
                        <TableCell className="text-[var(--foreground)] whitespace-nowrap font-medium">
                          {s.offerCode}
                        </TableCell>
                      )}
                      {activeColumns.includes("offerName") && (
                        <TableCell className="text-[var(--primary)] font-semibold whitespace-nowrap cursor-pointer hover:underline" onClick={() => setModal({mode: "view", offer: s})}>
                          {s.offerName}
                        </TableCell>
                      )}
                      {activeColumns.includes("product") && (
                        <TableCell className="text-[var(--foreground)] whitespace-nowrap">
                           <span className="text-[0.9rem] max-w-[200px] block whitespace-normal" title={s.product}>{s.product}</span>
                        </TableCell>
                      )}
                      {activeColumns.includes("tenantType") && (
                        <TableCell className="text-[var(--foreground)] whitespace-nowrap">{s.tenantType}</TableCell>
                      )}
                      {activeColumns.includes("subscriptionType") && (
                        <TableCell className="text-[var(--foreground)] whitespace-nowrap">{s.subscriptionType}</TableCell>
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
                      {activeColumns.includes("webVisibility") && (
                        <TableCell>
                           {/* Toggle switch visual */}
                           <div className="flex items-center gap-2">
                             <button 
                               className={`w-10 h-5 rounded-full relative transition-colors ${s.webVisibility ? "bg-[var(--success)]" : "bg-gray-300"}`}
                               onClick={() => toggleVisibility(s)}
                             >
                               <span className={`absolute top-0.5 bottom-0.5 w-4 rounded-full bg-white transition-all ${s.webVisibility ? "left-5" : "left-0.5"}`} />
                             </button>
                             <span className="text-[0.75rem] font-bold text-[var(--foreground)]">{s.webVisibility ? "ON" : "OFF"}</span>
                           </div>
                        </TableCell>
                      )}
                      {activeColumns.includes("status") && (
                        <TableCell>
                           <Badge variant={s.status === "Active" ? "success" : "destructive"} className="px-3 py-1 rounded-md text-[0.75rem]">{s.status}</Badge>
                        </TableCell>
                      )}
                      <TableCell className="text-right sticky right-0 bg-[var(--card)] border-l border-[var(--border)]">
                        <div className="flex items-center justify-end gap-2">
                          <RowActionsMenu
                            offer={s}
                            onView={() => setModal({ mode: "view", offer: s })}
                            onEdit={() => setModal({ mode: "edit", offer: s })}
                            onToggleVisibility={() => toggleVisibility(s)}
                            onToggleStatus={() => changeStatus(s, s.status === "Active" ? "Inactive" : "Active")}
                            onDelete={() => setToDelete(s)}
                          />
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

      <SingleOfferModal
        isOpen={!!modal}
        mode={modal?.mode ?? "create"}
        offer={modal?.offer ?? null}
        existing={offers}
        onClose={() => setModal(null)}
        onSubmit={handleSubmit}
        onEdit={() => modal?.offer && setModal({ mode: "edit", offer: modal.offer })}
      />

      <Modal
        isOpen={!!toDelete}
        onClose={() => !isDeleting && setToDelete(null)}
        title="Delete Single Offer"
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
          Are you sure you want to delete <span className="font-mono font-semibold">{toDelete?.offerName}</span>?
        </p>
      </Modal>
    </div>
  );
}
