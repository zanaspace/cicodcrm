"use client";

import * as React from "react";
import { SlidersHorizontal, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./Button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/primitives/dropdown-menu";

interface Column {
  id: string;
  label: string;
}

interface ColumnToggleProps {
  columns: Column[];
  activeColumns: string[];
  onChange: (activeIds: string[]) => void;
}

/** "Customize View" column picker on the shadcn/ui dropdown-menu primitive (checkbox items, stays open while toggling). */
export function ColumnToggle({ columns, activeColumns, onChange }: ColumnToggleProps) {
  const toggleColumn = (id: string) => {
    if (activeColumns.includes(id)) {
      if (activeColumns.length > 3) { // prevent hiding all columns
        onChange(activeColumns.filter(c => c !== id));
      }
    } else {
      onChange([...activeColumns, id]);
    }
  };

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-9 border-1.5 border-[var(--input)] bg-[var(--card)] text-[var(--foreground)]"
        >
          <SlidersHorizontal className="w-4 h-4 mr-2 text-[var(--muted-foreground)]" />
          Customize View
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-56 rounded-md shadow-lg bg-[var(--popover)] text-[var(--popover-foreground)] border border-[var(--border)] z-50 p-1"
      >
        <DropdownMenuLabel className="px-3 py-2 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
          Toggle Columns
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="mx-0 mt-0 mb-1 bg-[var(--border)]" />
        <div className="max-h-[250px] overflow-y-auto">
          {columns.map((col) => {
            const isActive = activeColumns.includes(col.id);
            const locked = isActive && activeColumns.length <= 3;
            return (
              <DropdownMenuCheckboxItem
                key={col.id}
                checked={isActive}
                // Keep the menu open so several columns can be toggled in a row.
                onSelect={(e) => { e.preventDefault(); toggleColumn(col.id); }}
                aria-disabled={locked || undefined}
                title={locked ? "At least 3 columns stay visible" : undefined}
                className="px-3 py-2 text-[0.85rem] cursor-pointer rounded-sm transition-colors focus:bg-[var(--accent)] focus:text-[var(--accent-foreground)] [&>span:first-child]:hidden"
              >
                <div className={cn(
                  "w-4 h-4 mr-1 flex items-center justify-center rounded-[3px] border",
                  isActive ? "bg-[var(--primary)] border-[var(--primary)] text-white" : "border-[var(--input)] bg-[var(--background)]"
                )}>
                  {isActive && <Check className="size-3 text-[var(--primary-foreground)]" />}
                </div>
                <span className="text-[var(--popover-foreground)]">{col.label}</span>
              </DropdownMenuCheckboxItem>
            );
          })}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
