"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { Badge } from "./Badge";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/primitives/dropdown-menu";

interface StatusDropdownProps {
  status: string;
  onChange: (newStatus: string) => void;
  options?: string[];
  /** Optional accessible name for the trigger (defaults to "Status: <status>"). */
  ariaLabel?: string;
}

/** Status pill that opens a menu of statuses; shadcn/ui dropdown-menu primitive (keyboard + focus return). */
export function StatusDropdown({ status, onChange, options = ["Active", "Pending", "Suspended"], ariaLabel }: StatusDropdownProps) {
  const variant =
    status === "Active" ? "success" :
    status === "Pending" ? "warning" :
    status === "Suspended" || status === "Inactive" ? "destructive" : "default";

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger
        aria-label={ariaLabel ?? `Status: ${status}. Change status`}
        className="relative inline-block select-none cursor-pointer rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
      >
        <Badge variant={variant} className="flex items-center gap-1 px-2.5 transition-opacity hover:opacity-80">
          {status}
          <ChevronDown className="w-3 h-3" />
        </Badge>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        sideOffset={4}
        className="w-[120px] min-w-[120px] bg-[var(--card)] text-[var(--foreground)] border border-[var(--border)] rounded-md shadow-lg z-50 p-1"
      >
        <DropdownMenuRadioGroup value={status} onValueChange={onChange}>
          {options.map((opt) => (
            <DropdownMenuRadioItem
              key={opt}
              value={opt}
              className={cn(
                // The CRM highlights the current status with a tint instead of a radio dot.
                "px-3 py-1.5 text-[0.8rem] font-medium cursor-pointer rounded transition-colors [&>span:first-child]:hidden",
                "text-[var(--foreground)] focus:bg-[var(--accent)] focus:text-[var(--accent-foreground)]",
                "data-[state=checked]:bg-[rgba(242,169,59,0.08)] data-[state=checked]:text-[var(--primary)]",
              )}
            >
              {opt}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
