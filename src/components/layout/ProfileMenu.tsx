"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { LogOut, Settings, Star, UserCircle } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import { initials } from "@/lib/format";
import { roleName, useCurrentUser } from "@/lib/mock/settings";
import { openFavoritesManager } from "@/lib/favorites";

/** Avatar button with the account menu: profile, favorites, settings and log out. */
export function ProfileMenu() {
  const router = useRouter();
  const me = useCurrentUser();
  const [open, setOpen] = React.useState(false);
  const box = React.useRef<HTMLDivElement>(null);
  const trigger = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    if (!open) return;
    box.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
    const onDown = (e: MouseEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setOpen(false); trigger.current?.focus(); return; }
      if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
      e.preventDefault();
      const items = [...(box.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [])];
      const i = items.indexOf(document.activeElement as HTMLElement);
      items[(i + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length]?.focus();
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open]);

  const go = (fn: () => void) => () => { setOpen(false); fn(); };
  const item = "w-full flex items-center gap-3 px-3 py-2 rounded-md text-left text-[0.88rem] transition-colors focus:outline-none focus:bg-[var(--muted)] hover:bg-[var(--muted)]";

  return (
    <div ref={box} className="relative">
      <button ref={trigger} type="button" onClick={() => setOpen((o) => !o)} aria-haspopup="menu" aria-expanded={open} aria-label="Account menu" title={me.name}
        className={cn("w-9 h-9 rounded-full bg-[var(--accent)] border-2 flex items-center justify-center text-[var(--primary)] font-heading font-bold text-[0.8rem] shadow-sm transition-colors",
          open ? "border-[var(--primary)]" : "border-[var(--card)] hover:border-[var(--primary)]/50")}>
        {initials(me.name)}
      </button>
      {open && (
        <div role="menu" aria-label="Account" className="absolute right-0 top-12 z-50 w-[270px] bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-[var(--border)] bg-[var(--background)]">
            <div className="font-heading font-bold text-[0.92rem] truncate">{me.name}</div>
            <div className="text-[0.8rem] text-[var(--muted-foreground)] truncate">{me.email}</div>
            <Badge variant="secondary" className="mt-2">{roleName(me.roleId)}</Badge>
          </div>
          <div className="p-1.5 flex flex-col">
            <button role="menuitem" className={item} onClick={go(() => router.push("/crm/settings/profile"))}><UserCircle className="w-4 h-4 text-[var(--muted-foreground)]" /> My profile</button>
            <button role="menuitem" className={item} onClick={go(openFavoritesManager)}><Star className="w-4 h-4 text-[var(--muted-foreground)]" /> Manage favorites</button>
            <button role="menuitem" className={item} onClick={go(() => router.push("/crm/settings"))}><Settings className="w-4 h-4 text-[var(--muted-foreground)]" /> Settings</button>
          </div>
          <div className="p-1.5 border-t border-[var(--border)]">
            <button role="menuitem" className={cn(item, "text-[var(--destructive)] font-semibold")} onClick={go(() => router.push("/login?signedout=1"))}><LogOut className="w-4 h-4" /> Log out</button>
          </div>
        </div>
      )}
    </div>
  );
}
