import Link from "next/link";

/**
 * Single-series horizontal bars: one hue (brand primary), direct value labels in text ink,
 * 4px rounded data end, hover/focus tooltip, and every row is a link into the filtered list.
 */
export function BarList({ rows, max, unit }: { rows: { key: string; label: string; value: number; display: string; href: string }[]; max: number; unit: string }) {
  return (
    <ul className="flex flex-col gap-3" aria-label="Bar chart">
      {rows.map((r) => (
        <li key={r.key}>
          <Link href={r.href} title={`${r.label}: ${r.display} ${unit}`} className="group grid grid-cols-[170px_1fr_auto] items-center gap-4 rounded-md -mx-2 px-2 py-1 hover:bg-[var(--sidebar-accent)] focus-visible:outline-2 focus-visible:outline-[var(--ring)]">
            <span className="text-[0.85rem] text-[var(--foreground)] truncate">{r.label}</span>
            <span className="h-3 rounded-r-[4px] bg-[var(--muted)]/50 overflow-hidden">
              <span className="block h-full rounded-r-[4px] bg-[var(--primary)] group-hover:opacity-80 transition-opacity" style={{ width: `${Math.max(r.value ? 2 : 0, (r.value / max) * 100)}%` }} />
            </span>
            <span className="text-[0.85rem] font-semibold text-[var(--foreground)] font-mono text-right min-w-[80px]">{r.display}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
