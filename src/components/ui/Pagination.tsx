"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./Button";
import { Select } from "./Select";

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizes?: number[];
}

/** Style guide §12: "Showing 1 to 10 of 97 results · Prev 1 2 3 … 10 Next". */
export function Pagination({ page, pageSize, total, onPageChange, onPageSizeChange, pageSizes = [10, 25, 50] }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(page, totalPages);
  const from = total === 0 ? 0 : (current - 1) * pageSize + 1;
  const to = Math.min(current * pageSize, total);

  const pages = React.useMemo<(number | "...")[]>(() => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const keep = [...new Set([1, totalPages, current - 1, current, current + 1])].filter((n) => n >= 1 && n <= totalPages).sort((a, b) => a - b);
    return keep.flatMap((n, i) => (i > 0 && n - keep[i - 1] > 1 ? ["...", n] : [n])) as (number | "...")[];
  }, [totalPages, current]);

  return (
    <div className="p-4 border-t border-[var(--border)] bg-[var(--card)] rounded-b-xl flex items-center justify-between gap-4 flex-wrap">
      <div className="flex items-center gap-4">
        <span className="text-[0.85rem] text-[var(--muted-foreground)]">
          {total === 0 ? "No results" : `Showing ${from} to ${to} of ${total.toLocaleString()} results`}
        </span>
        {onPageSizeChange && (
          <div className="flex items-center gap-2 text-[0.85rem] text-[var(--muted-foreground)]">
            Rows per page
            <Select
              ariaLabel="Rows per page"
              value={String(pageSize)}
              onChange={(v) => onPageSizeChange(Number(v))}
              options={pageSizes.map(String)}
              className="w-[80px] h-9"
            />
          </div>
        )}
      </div>
      <nav aria-label="Pagination" className="flex items-center gap-1">
        <Button variant="ghost" size="sm" className="h-8 px-2 text-[var(--muted-foreground)] font-medium" disabled={current === 1} onClick={() => onPageChange(current - 1)}>
          <ChevronLeft className="w-4 h-4 mr-1" /> Prev
        </Button>
        {pages.map((n, i) =>
          n === "..." ? (
            <span key={`e${i}`} className="w-8 flex items-center justify-center text-[var(--muted-foreground)]">…</span>
          ) : (
            <Button
              key={n}
              variant={n === current ? "outline" : "ghost"}
              size="sm"
              aria-current={n === current ? "page" : undefined}
              onClick={() => onPageChange(n)}
              className={n === current ? "h-8 w-8 p-0 border-[var(--border)] bg-[var(--card)] text-[var(--primary)] font-bold shadow-sm" : "h-8 w-8 p-0 text-[var(--foreground)] font-medium"}
            >
              {n}
            </Button>
          ),
        )}
        <Button variant="ghost" size="sm" className="h-8 px-2 text-[var(--foreground)] font-medium hover:text-[var(--primary)]" disabled={current === totalPages} onClick={() => onPageChange(current + 1)}>
          Next <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </nav>
    </div>
  );
}
