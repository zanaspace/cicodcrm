import { LIFECYCLE_STAGES, lifecycleLabel, type Lifecycle } from "@/lib/mock/customers";

/** Compact onboarding progress for table cells: four bars + current stage. */
export function LifecycleProgress({ stage }: { stage: Lifecycle }) {
  const idx = LIFECYCLE_STAGES.findIndex((s) => s.id === stage);
  const done = idx === LIFECYCLE_STAGES.length - 1;
  return (
    <div className="flex flex-col gap-1.5 min-w-[150px]" title={`Step ${idx + 1} of ${LIFECYCLE_STAGES.length}: ${lifecycleLabel(stage)}`}>
      <div className="flex gap-1" aria-hidden>
        {LIFECYCLE_STAGES.map((s, i) => (
          <span key={s.id} className={`h-1.5 flex-1 rounded-full ${i <= idx ? (done ? "bg-[var(--success)]" : "bg-[var(--primary)]") : "bg-[var(--muted)]"}`} />
        ))}
      </div>
      <span className="text-[0.8rem] text-[var(--muted-foreground)] whitespace-nowrap">{lifecycleLabel(stage)}</span>
    </div>
  );
}
