"use client";

import * as React from "react";
import { MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/primitives/dropdown-menu";

export type RowAction = {
  label: string;
  icon?: React.ElementType;
  onSelect: () => void;
  /** Danger actions are grouped at the bottom, in red, after a divider. */
  danger?: boolean;
  disabled?: boolean;
  hint?: string;
};

const MENU_W = 220;

/** Stops clicks reaching the table row (rows navigate on click); portal events still bubble through React. */
const stop = (e: React.SyntheticEvent) => e.stopPropagation();

/**
 * The ⋯ menu on every list row, on the shadcn/ui dropdown-menu primitive (Radix): arrow keys / Home / End /
 * typeahead, Esc closes and focus returns to the trigger, follows the trigger on scroll and hides when it
 * scrolls out of view.
 */
export function RowActionsMenu({ actions, label = "More actions", triggerClassName }: { actions: RowAction[]; label?: string; triggerClassName?: string }) {
  const safe = actions.filter((a) => !a.danger);
  const danger = actions.filter((a) => a.danger);

  const item = (a: RowAction) => (
    <DropdownMenuItem
      key={a.label}
      disabled={a.disabled}
      title={a.hint}
      variant={a.danger ? "destructive" : "default"}
      // Run after the menu has closed so a dialog opened by the action gets focus, not the trigger.
      onSelect={() => { setTimeout(a.onSelect, 0); }}
      className={cn(
        "w-full gap-2.5 px-3 py-2 text-left text-[0.85rem] rounded cursor-pointer data-[disabled]:opacity-40 [&_svg:not([class*='text-'])]:text-current",
        a.danger
          ? "text-[var(--destructive)] focus:bg-[rgba(239,68,68,.1)] focus:text-[var(--destructive)] data-[variant=destructive]:focus:bg-[rgba(239,68,68,.1)]"
          : "text-[var(--foreground)] focus:bg-[var(--accent)] focus:text-[var(--accent-foreground)]",
      )}
    >
      {a.icon && <a.icon className="w-4 h-4 shrink-0" />}
      {a.label}
    </DropdownMenuItem>
  );

  return (
    // Non-modal: the page keeps scrolling while the menu is open (as before) and opening a dialog from an item is safe.
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger
        aria-label={label}
        onClick={stop}
        className={cn("w-8 h-8 inline-flex items-center justify-center rounded-full border border-[var(--border)] bg-[var(--card)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)] data-[state=open]:bg-[var(--accent)] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--ring)]", triggerClassName)}
      >
        <MoreHorizontal className="w-4 h-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={4}
        collisionPadding={8}
        hideWhenDetached
        onClick={stop}
        style={{ width: MENU_W }}
        className="z-[60] rounded-md shadow-lg bg-[var(--popover)] text-[var(--popover-foreground)] border border-[var(--border)] p-1"
      >
        {safe.map(item)}
        {danger.length > 0 && safe.length > 0 && <DropdownMenuSeparator className="mx-0 my-1 bg-[var(--border)]" />}
        {danger.map(item)}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
