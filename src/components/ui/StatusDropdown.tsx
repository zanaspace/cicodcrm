"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { Badge } from "./Badge";
import { cn } from "@/lib/utils";

interface StatusDropdownProps {
  status: string;
  onChange: (newStatus: string) => void;
  options?: string[];
}

export function StatusDropdown({ status, onChange, options = ["Active", "Pending", "Suspended"] }: StatusDropdownProps) {
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

  const variant = 
    status === "Active" ? "success" : 
    status === "Pending" ? "warning" : 
    status === "Suspended" || status === "Inactive" ? "destructive" : "default";

  return (
    <div ref={containerRef} className="relative inline-block select-none">
      <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer inline-block">
        <Badge variant={variant} className="flex items-center gap-1 px-2.5 transition-opacity hover:opacity-80">
          {status}
          <ChevronDown className="w-3 h-3" />
        </Badge>
      </div>
      
      {isOpen && (
        <div className="absolute top-[calc(100%+4px)] left-0 w-[120px] bg-[var(--card)] border border-[var(--border)] rounded-md shadow-lg z-50 p-1">
          {options.map((opt) => (
            <div
              key={opt}
              onClick={() => {
                onChange(opt);
                setIsOpen(false);
              }}
              className={cn(
                "px-3 py-1.5 text-[0.8rem] font-medium cursor-pointer rounded transition-colors",
                status === opt 
                  ? "bg-[rgba(242,169,59,0.08)] text-[var(--primary)]" 
                  : "text-[var(--foreground)] hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]"
              )}
            >
              {opt}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
