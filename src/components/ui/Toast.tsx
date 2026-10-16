"use client";

import { toast as sonner } from "sonner";
import { Toaster as SonnerToaster } from "@/components/ui/primitives/sonner";

/**
 * App-wide notifications, built on the shadcn/ui sonner primitive.
 * `toast.success("Saved")`, `toast.error("Couldn't save")`, `toast.info("Heads up")`.
 */
export const toast = {
  success: (message: string) => { sonner.success(message); },
  error: (message: string) => { sonner.error(message); },
  info: (message: string) => { sonner.info(message); },
};

export function Toaster() {
  return <SonnerToaster position="top-right" richColors closeButton duration={3500} />;
}
