"use client";

import * as React from "react";
import { SlidersHorizontal, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./Button";

interface Column {
  id: string;
  label: string;
}

interface ColumnToggleProps {
  columns: Column[];
  activeColumns: string[];
  onChange: (activeIds: string[]) => void;
}

export function ColumnToggle({ columns, activeColumns, onChange }: ColumnToggleProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
    <div ref={containerRef} className="relative inline-block text-left">
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => setIsOpen(!isOpen)}
        className="h-9 border-1.5 border-[var(--input)] bg-[var(--card)] text-[var(--foreground)]"
      >
        <SlidersHorizontal className="w-4 h-4 mr-2 text-[var(--muted-foreground)]" />
        Customize View
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-[var(--popover)] border border-[var(--border)] z-50 p-1">
          <div className="px-3 py-2 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider border-b border-[var(--border)] mb-1">
            Toggle Columns
          </div>
          <div className="max-h-[250px] overflow-y-auto">
            {columns.map((col) => {
              const isActive = activeColumns.includes(col.id);
              return (
                <div
                  key={col.id}
                  onClick={() => toggleColumn(col.id)}
                  className="flex items-center px-3 py-2 text-[0.85rem] cursor-pointer rounded-sm hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)] transition-colors"
                >
                  <div className={cn(
                    "w-4 h-4 mr-3 flex items-center justify-center rounded-[3px] border",
                    isActive ? "bg-[var(--primary)] border-[var(--primary)] text-white" : "border-[var(--input)] bg-[var(--background)]"
                  )}>
                    {isActive && <Check className="w-3 h-3 text-[var(--primary-foreground)]" />}
                  </div>
                  <span className="text-[var(--popover-foreground)]">{col.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
