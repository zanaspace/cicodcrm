import { cn } from "@/lib/utils";
import type { DunningStep } from "@/lib/mock/billing";

/**
 * Horizontal dunning timeline: steps before/after the due date, the grace period, then suspension.
 * Positions are proportional to days so the gaps read correctly.
 */
export function Timeline({ steps, graceDays, autoSuspend, compact }: { steps: DunningStep[]; graceDays: number; autoSuspend: boolean; compact?: boolean }) {
  const sorted = [...steps].sort((a, b) => a.offsetDays - b.offsetDays);
  const min = Math.min(-7, ...sorted.map((s) => s.offsetDays)) - 1;
  const max = Math.max(graceDays + 1, ...sorted.map((s) => s.offsetDays)) + 1;
  const pos = (d: number) => `${((d - min) / (max - min)) * 100}%`;
  const dayLabel = (d: number) => (d === 0 ? "Due" : d < 0 ? `${-d}d before` : `${d}d after`);

  const markers = [
    ...sorted.map((s) => ({ key: s.id, d: s.offsetDays, label: s.type, tone: s.type === "Reminder" ? "bg-[var(--info)]" : "bg-[var(--warning)]" })),
    { key: "due", d: 0, label: "Due date", tone: "bg-[var(--foreground)]" },
    { key: "suspend", d: graceDays + 1, label: autoSuspend ? "Auto-suspend" : "Suspension review", tone: "bg-[var(--destructive)]" },
  ].sort((a, b) => a.d - b.d);

  // Drop a label to a second row when it sits too close to the previous one, so labels never overlap.
  const span = max - min;
  const lowered = markers.map(() => false);
  markers.forEach((m, i) => { if (i > 0 && !lowered[i - 1] && (m.d - markers[i - 1].d) / span < 0.18) lowered[i] = true; });
  const twoRows = lowered.some(Boolean);

  return (
    // Labels move to a second row when markers are close together.
    <div className={cn("relative mx-8", twoRows ? (compact ? "h-[84px]" : "h-[96px]") : compact ? "h-14" : "h-20")} aria-label="Dunning timeline">
      {/* track */}
      <div className="absolute left-0 right-0 top-3 h-1 rounded-full bg-[var(--muted)]" />
      {/* grace band */}
      {graceDays > 0 && (
        <div className="absolute top-2 h-3 rounded-full bg-[rgba(245,158,11,.25)]" style={{ left: pos(0), width: `calc(${pos(graceDays + 1)} - ${pos(0)})` }} title={`${graceDays}-day grace period`} />
      )}
      {markers.map((m, i) => (
        <div key={m.key} className="absolute -translate-x-1/2 flex flex-col items-center" style={{ left: pos(m.d), top: 0 }}>
          <span className={cn("w-4 h-4 rounded-full border-2 border-[var(--card)] shadow-sm", m.tone, m.key === "due" && "rotate-45 rounded-[3px]")} />
          <span className={cn("mt-1.5 text-center whitespace-nowrap leading-tight", compact ? "text-[0.65rem]" : "text-[0.72rem]", lowered[i] && "mt-8")}>
            <span className="block font-semibold text-[var(--foreground)]">{m.label}</span>
            <span className="block text-[var(--muted-foreground)]">{m.key === "suspend" ? `${graceDays}d grace` : dayLabel(m.d)}</span>
          </span>
        </div>
      ))}
    </div>
  );
}
