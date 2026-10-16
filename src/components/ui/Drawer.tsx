"use client";

import React from "react";
import { X } from "lucide-react";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/primitives/sheet";
import { isToastTarget } from "./Modal";

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

/**
 * Right-hand panel for details that should keep the list in view, on the shadcn/ui sheet primitive
 * (Radix dialog): Esc and overlay click close it, focus is trapped inside and returns to the trigger.
 */
export function Drawer({ isOpen, onClose, title, subtitle, children, footer }: DrawerProps) {
  const panelRef = React.useRef<HTMLDivElement>(null);
  return (
    <Sheet open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent
        side="right"
        showCloseButton={false}
        {...(subtitle ? {} : { "aria-describedby": undefined })}
        // Focus the panel itself (as before), not its first button.
        ref={panelRef}
        onOpenAutoFocus={(e) => { e.preventDefault(); panelRef.current?.focus(); }}
        onInteractOutside={(e) => { if (isToastTarget(e.target)) e.preventDefault(); }}
        className="w-full max-w-[520px] sm:max-w-[520px] h-full gap-0 bg-[var(--card)] border-l border-[var(--border)] shadow-2xl flex flex-col focus:outline-none drawer-enter"
      >
        <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-[var(--border)]">
          <div className="min-w-0">
            <SheetTitle className="text-[1.1rem] font-heading font-bold text-[var(--foreground)] m-0">{title}</SheetTitle>
            {subtitle && <SheetDescription asChild className="mt-1 text-[0.85rem] text-[var(--muted-foreground)]"><div>{subtitle}</div></SheetDescription>}
          </div>
          <SheetClose
            aria-label="Close panel"
            className="w-8 h-8 shrink-0 flex items-center justify-center rounded-full bg-[var(--muted)] hover:bg-[var(--accent)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--ring)]"
          >
            <X className="w-4 h-4" />
          </SheetClose>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-6">{children}</div>
        {footer && <div className="px-6 py-4 border-t border-[var(--border)] bg-[var(--background)] flex justify-end gap-3">{footer}</div>}
      </SheetContent>
    </Sheet>
  );
}
