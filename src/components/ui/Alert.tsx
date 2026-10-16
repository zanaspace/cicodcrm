import * as React from "react";
import { AlertCircle, AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { Alert as AlertPrimitive, AlertDescription, AlertTitle } from "@/components/ui/primitives/alert";

/** Style guide §9 "Alerts & Callouts". */
const TONES = {
  default: { box: "border-[var(--border)] bg-[var(--card)]", title: "text-[var(--foreground)]", desc: "text-[var(--muted-foreground)]", Icon: Info, icon: "text-[var(--foreground)]" },
  info: { box: "border-[rgba(59,130,246,.3)] bg-[rgba(59,130,246,.03)]", title: "text-[var(--info)]", desc: "text-[var(--muted-foreground)]", Icon: Info, icon: "text-[var(--info)]" },
  warning: { box: "border-[rgba(245,158,11,.35)] bg-[rgba(245,158,11,.04)]", title: "text-[var(--foreground)]", desc: "text-[var(--muted-foreground)]", Icon: AlertTriangle, icon: "text-[var(--warning)]" },
  destructive: { box: "border-[rgba(239,68,68,.3)] bg-[rgba(239,68,68,.02)]", title: "text-[var(--destructive)]", desc: "text-[var(--destructive)]", Icon: AlertCircle, icon: "text-[var(--destructive)]" },
};

interface AlertProps {
  tone?: keyof typeof TONES;
  title: string;
  children?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

/** Built on the shadcn/ui alert primitive; keeps the CRM callout layout (icon · text · actions). */
export function Alert({ tone = "default", title, children, actions, className }: AlertProps) {
  const t = TONES[tone];
  return (
    <AlertPrimitive
      role={tone === "destructive" ? "alert" : "status"}
      className={cn("flex w-auto items-stretch gap-4 p-5 rounded-[var(--radius)] border text-[length:inherit] shadow-[0_4px_12px_rgba(0,0,0,0.02)]", t.box, className)}
    >
      {/* Wrapped so the primitive's `[&>svg]` sizing/colour rules don't apply to the icon. */}
      <span aria-hidden className="shrink-0 mt-0.5">
        <t.Icon className={cn("w-5 h-5", t.icon)} />
      </span>
      <div className="flex-1 min-w-0">
        <AlertTitle className={cn("min-h-0 line-clamp-none tracking-normal font-heading font-bold text-[1rem] mb-1", t.title)}>{title}</AlertTitle>
        {children && <AlertDescription className={cn("block text-[0.9rem]", t.desc)}>{children}</AlertDescription>}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0 self-center">{actions}</div>}
    </AlertPrimitive>
  );
}
