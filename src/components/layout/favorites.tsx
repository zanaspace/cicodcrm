"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ArrowDown, ArrowUp, Briefcase, Check, Funnel, KeyRound, Layers, Megaphone, Plus, Settings2, Star, Trash2, UserCog, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { toast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";
import { matchNav } from "@/lib/nav";
import { useStore } from "@/lib/store";
import { ACTION_FLAGS } from "@/lib/useUrlFlag";
import {
  MAX_FAVORITES, QUICK_ACTIONS, addFavorite, addQuickAction, favoritesManagerStore, loadFavorites, moveFavorite, openFavoritesManager,
  removeFavorite, renameFavorite, useFavorites, type Favorite, type QuickActionId,
} from "@/lib/favorites";

const ACTION_ICON: Record<QuickActionId, React.ElementType> = {
  "new-customer": UserPlus, "new-lead": Funnel, "new-campaign": Megaphone, "new-plan": Layers,
  "add-partner": Briefcase, "invite-user": UserCog, "generate-key": KeyRound,
};
/** Actions use their own icon; pages use the icon of their sidebar group. */
export function favoriteIcon(f: Favorite): React.ElementType {
  if (f.kind === "action" && f.actionId) return ACTION_ICON[f.actionId as QuickActionId] ?? Plus;
  return matchNav(f.href.split("?")[0])?.group.icon ?? Star;
}

/** The current URL without form-opening flags, which is what a favorite saves. */
function useCurrentHref() {
  const pathname = usePathname();
  const params = useSearchParams();
  const kept = new URLSearchParams(params.toString());
  ACTION_FLAGS.forEach((f) => kept.delete(f));
  const qs = kept.toString();
  return { pathname, query: kept, full: qs ? `${pathname}?${qs}` : pathname };
}
const humanize = (v: string) => v.replace(/[-_+]/g, " ").replace(/^\w/, (c) => c.toUpperCase());

/** Renders a favorite's icon (a module-level lucide component chosen by kind). */
function FavoriteIcon({ f, className }: { f: Favorite; className?: string }) {
  return React.createElement(favoriteIcon(f), { className, "aria-hidden": true });
}

/* ---------------- Star in the top bar ---------------- */

export function FavoriteStar({ pageLabel }: { pageLabel: string }) {
  const { pathname, query, full } = useCurrentHref();
  const favorites = useFavorites();
  const existing = favorites.find((f) => f.href === full);
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [withFilters, setWithFilters] = React.useState(true);
  const box = React.useRef<HTMLDivElement>(null);
  const hasFilters = [...query.keys()].length > 0;

  React.useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open]);

  const click = () => {
    if (existing) { removeFavorite(existing.id); toast.success(`Removed “${existing.label}” from favorites`); return; }
    const filters = [...query.entries()].filter(([k]) => k !== "page").map(([, v]) => humanize(v)).slice(0, 2);
    setName(filters.length ? `${pageLabel} · ${filters.join(", ")}` : pageLabel);
    setWithFilters(true);
    setOpen(true);
  };
  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const why = addFavorite({ kind: "page", label: name, href: withFilters ? full : pathname });
    if (why) return toast.error(why);
    toast.success(`Added “${name.trim()}” to favorites`);
    setOpen(false);
  };

  return (
    <div ref={box} className="relative shrink-0">
      <button type="button" onClick={click} aria-pressed={!!existing} aria-label={existing ? "Remove this page from favorites" : "Add this page to favorites"}
        title={existing ? "Remove from favorites" : "Add to favorites"}
        className={cn("w-8 h-8 rounded-md flex items-center justify-center transition-colors hover:bg-[var(--muted)]", existing ? "text-[var(--primary)]" : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]")}>
        <Star className="w-[18px] h-[18px]" fill={existing ? "currentColor" : "none"} />
      </button>
      {open && (
        <form onSubmit={save} role="dialog" aria-label="Add to favorites"
          className="absolute left-0 top-10 z-50 w-[320px] bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-lg p-4 flex flex-col gap-3">
          <div className="font-heading font-bold text-[0.92rem]">Add to favorites</div>
          <label className="flex flex-col gap-1.5">
            <span className="text-[0.8rem] font-bold">Name</span>
            <input autoFocus value={name} onChange={(e) => setName(e.target.value)} maxLength={40}
              className="h-10 px-3 rounded-md border-[1.5px] border-[var(--input)] bg-[var(--background)] text-[0.9rem] focus:outline-none focus:border-[var(--ring)]" />
          </label>
          {hasFilters && (
            <label className="flex items-center gap-2 text-[0.84rem] cursor-pointer">
              <input type="checkbox" checked={withFilters} onChange={(e) => setWithFilters(e.target.checked)} className="w-4 h-4 accent-[var(--primary)]" />
              Keep the current filters and tab
            </label>
          )}
          <div className="flex justify-between items-center gap-2 pt-1">
            <button type="button" onClick={() => { setOpen(false); openFavoritesManager(); }} className="text-[0.8rem] font-semibold text-[var(--primary)]">Manage favorites</button>
            <div className="flex gap-2">
              <Button type="button" size="sm" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" size="sm" disabled={!name.trim()}>Add</Button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}

/* ---------------- Sidebar section ---------------- */

export function FavoritesSection({ isCollapsed }: { isCollapsed: boolean }) {
  const favorites = useFavorites();
  const { full } = useCurrentHref();
  React.useEffect(() => { loadFavorites(); }, []);

  return (
    <ul aria-label="Favorites" className="flex flex-col gap-0.5">
      {isCollapsed ? <li aria-hidden className="h-0 border-b border-[var(--sidebar-border)] w-8 mx-auto mb-3 mt-1" /> : (
        <li className="flex items-center justify-between px-3 pt-2 pb-2">
          <span className="text-[0.75rem] text-[#6B7787] uppercase font-semibold tracking-wider flex items-center gap-1.5"><Star className="w-3.5 h-3.5" /> Favorites</span>
          <button type="button" onClick={openFavoritesManager} aria-label="Manage favorites" title="Manage favorites"
            className="p-1 rounded-md text-[var(--sidebar-foreground)] hover:text-[var(--sidebar-accent-foreground)] hover:bg-[var(--sidebar-accent)]"><Settings2 className="w-4 h-4" /></button>
        </li>
      )}
      {favorites.length === 0 && !isCollapsed && (
        <li className="px-3 pb-1 text-[0.8rem] text-[var(--muted-foreground)]">Star <Star className="w-3.5 h-3.5 inline -mt-0.5" /> a page in the top bar to pin it here.</li>
      )}
      {favorites.map((f) => {
        const active = f.kind === "page" && f.href === full;
        return (
          <li key={f.id} title={isCollapsed ? f.label : undefined}>
            <Link href={f.href} aria-current={active ? "page" : undefined}
              className={cn("flex items-center gap-3 px-3 py-2 rounded-lg transition-colors", isCollapsed && "justify-center",
                active ? "text-[var(--sidebar-accent-foreground)] bg-[var(--accent)] font-heading font-semibold" : "text-[var(--sidebar-foreground)] hover:bg-[var(--sidebar-accent)] hover:text-[var(--sidebar-accent-foreground)]")}>
              <span className="relative shrink-0">
                <FavoriteIcon f={f} className="w-[18px] h-[18px]" />
                {f.kind === "action" && <Plus aria-hidden className="w-2.5 h-2.5 absolute -right-1.5 -bottom-1 bg-[var(--sidebar-background)] rounded-full text-[var(--primary)]" strokeWidth={3} />}
              </span>
              {!isCollapsed && <span className="text-[0.88rem] truncate">{f.label}</span>}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/* ---------------- Manage favorites ---------------- */

export function FavoritesManager() {
  const open = useStore(favoritesManagerStore);
  const favorites = useFavorites();
  const close = () => favoritesManagerStore.set(false);
  return (
    <Modal isOpen={open} onClose={close} title="Favorites" maxWidth="max-w-2xl" footer={<Button onClick={close}>Done</Button>}>
      <div className="flex flex-col gap-6">
        <section aria-labelledby="fav-yours">
          <div className="flex items-center justify-between mb-2">
            <h3 id="fav-yours" className="m-0 text-[0.8rem] font-bold uppercase tracking-wider text-[var(--muted-foreground)]">In your sidebar</h3>
            <span className="text-[0.78rem] text-[var(--muted-foreground)]">{favorites.length} of {MAX_FAVORITES}</span>
          </div>
          {favorites.length === 0 ? (
            <p className="m-0 text-[0.86rem] text-[var(--muted-foreground)] rounded-lg border border-dashed border-[var(--border)] p-4">Nothing pinned yet. Add a quick action below, or star <Star className="w-3.5 h-3.5 inline -mt-0.5" /> any page in the top bar.</p>
          ) : (
            <ol className="m-0 p-0 list-none flex flex-col gap-2" aria-label="Your favorites">
              {favorites.map((f, i) => <FavoriteRow key={f.id} f={f} first={i === 0} last={i === favorites.length - 1} />)}
            </ol>
          )}
          <p className="m-0 mt-2 text-[0.78rem] text-[var(--muted-foreground)]">Tip: star a page while a filter or tab is on (for example Renewal overdue) to pin that exact view.</p>
        </section>
        <section aria-labelledby="fav-actions">
          <h3 id="fav-actions" className="m-0 mb-2 text-[0.8rem] font-bold uppercase tracking-wider text-[var(--muted-foreground)]">Quick actions</h3>
          <ul className="m-0 p-0 list-none grid grid-cols-2 gap-2">
            {QUICK_ACTIONS.map((a) => {
              const added = favorites.some((f) => f.href === a.href);
              const Icon = ACTION_ICON[a.id];
              return (
                <li key={a.id} className="flex items-center gap-3 rounded-lg border border-[var(--border)] px-3 py-2.5">
                  <span className="w-8 h-8 rounded-md bg-[var(--accent)] flex items-center justify-center shrink-0"><Icon className="w-4 h-4 text-[var(--primary)]" /></span>
                  <span className="flex-1 min-w-0"><span className="block font-semibold text-[0.86rem]">{a.label}</span><span className="block text-[0.75rem] text-[var(--muted-foreground)] truncate">{a.description}</span></span>
                  {added ? <span className="text-[0.78rem] font-semibold text-[var(--success)] flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Added</span>
                    : <Button size="sm" variant="outline" aria-label={`Add ${a.label} to favorites`} onClick={() => { const why = addQuickAction(a.id); if (why) toast.error(why); }}><Plus className="w-3.5 h-3.5 mr-1" /> Add</Button>}
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </Modal>
  );
}

function FavoriteRow({ f, first, last }: { f: Favorite; first: boolean; last: boolean }) {
  const [label, setLabel] = React.useState(f.label);
  const commit = () => { if (label.trim() && label.trim() !== f.label) renameFavorite(f.id, label); else setLabel(f.label); };
  const btn = "w-8 h-8 rounded-md border border-[var(--border)] flex items-center justify-center text-[var(--muted-foreground)] hover:text-[var(--foreground)] disabled:opacity-35 disabled:cursor-not-allowed";
  return (
    <li className="flex items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2">
      <FavoriteIcon f={f} className="w-4 h-4 text-[var(--primary)] shrink-0" />
      <input aria-label={`Name of ${f.label}`} value={label} maxLength={40} onChange={(e) => setLabel(e.target.value)} onBlur={commit} onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
        className="flex-1 min-w-0 h-8 px-2 rounded-md border border-transparent hover:border-[var(--input)] focus:border-[var(--ring)] bg-transparent text-[0.88rem] font-semibold focus:outline-none" />
      <span className="text-[0.72rem] font-semibold uppercase tracking-wider text-[var(--muted-foreground)] w-[52px] text-center">{f.kind === "action" ? "Action" : "Page"}</span>
      <button type="button" className={btn} aria-label={`Move ${f.label} up`} disabled={first} onClick={() => moveFavorite(f.id, -1)}><ArrowUp className="w-4 h-4" /></button>
      <button type="button" className={btn} aria-label={`Move ${f.label} down`} disabled={last} onClick={() => moveFavorite(f.id, 1)}><ArrowDown className="w-4 h-4" /></button>
      <button type="button" className={cn(btn, "hover:text-[var(--destructive)]")} aria-label={`Remove ${f.label}`} onClick={() => { removeFavorite(f.id); toast.success(`Removed “${f.label}”`); }}><Trash2 className="w-4 h-4" /></button>
    </li>
  );
}
