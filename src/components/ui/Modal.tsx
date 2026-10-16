"use client";

import React from "react";
import { X } from "lucide-react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { cn } from "@/lib/utils";
import { Dialog, DialogClose, DialogDescription, DialogOverlay, DialogPortal, DialogTitle } from "@/components/ui/primitives/dialog";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: string;
  /** Optional short line under the title; it becomes the dialog's accessible description. */
  description?: React.ReactNode;
  /** Id of an element inside the body that describes the dialog (used when there is no `description`). */
  ariaDescribedBy?: string;
}

/** Clicks on toasts must not count as "outside" and close the dialog. */
export function isToastTarget(target: EventTarget | null) {
  return target instanceof Element && !!target.closest("[data-sonner-toaster]");
}

/**
 * Centered dialog on the shadcn/ui dialog primitive (Radix): focus trap, Esc to close, overlay click
 * closes, focus returns to the trigger, background scroll is locked. Focus lands on the first field of
 * the body (not the close button), as before.
 */
export function Modal({ isOpen, onClose, title, children, footer, maxWidth = "max-w-lg", description, ariaDescribedBy }: ModalProps) {
  const contentRef = React.useRef<HTMLDivElement>(null);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogPortal>
        {/* The overlay is also the centering/scroll container (Radix "scrollable overlay" pattern). */}
        <DialogOverlay className="flex items-center justify-center overflow-y-auto bg-black/60 backdrop-blur-sm p-4 modal-backdrop-enter">
          <DialogPrimitive.Content
            ref={contentRef}
            data-slot="dialog-content"
            {...(description ? {} : { "aria-describedby": ariaDescribedBy })}
            onOpenAutoFocus={(e) => {
              e.preventDefault();
              const first = contentRef.current?.querySelector<HTMLElement>(
                '[data-modal-body] :is(button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]))',
              );
              (first ?? contentRef.current)?.focus();
            }}
            onInteractOutside={(e) => { if (isToastTarget(e.target)) e.preventDefault(); }}
            className={cn("relative w-full bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-2xl flex flex-col modal-dialog-enter focus:outline-none", maxWidth)}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--border)]">
              <div className="min-w-0">
                <DialogTitle className="text-[1.1rem] leading-normal font-heading font-bold text-[var(--foreground)] m-0">{title}</DialogTitle>
                {description && <DialogDescription asChild className="mt-1 text-[0.85rem] text-[var(--muted-foreground)]"><div>{description}</div></DialogDescription>}
              </div>
              <DialogClose
                aria-label="Close dialog"
                className="w-8 h-8 shrink-0 flex items-center justify-center rounded-full bg-[var(--muted)] hover:bg-[var(--accent)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--ring)]"
              >
                <X className="w-4 h-4" />
              </DialogClose>
            </div>

            {/* Body */}
            <div data-modal-body className="px-6 py-6 overflow-y-auto max-h-[70vh]">
              {children}
            </div>

            {/* Footer */}
            {footer && (
              <div className="px-6 py-5 border-t border-[var(--border)] bg-[var(--background)] rounded-b-2xl flex justify-end gap-3">
                {footer}
              </div>
            )}
          </DialogPrimitive.Content>
        </DialogOverlay>
      </DialogPortal>
    </Dialog>
  );
}
