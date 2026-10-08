"use client";

import { createStore, useStore } from "@/lib/store";
import { newId } from "@/lib/format";

/**
 * Favorites: pages (with their filters) and quick actions pinned to the top of the sidebar.
 * A per-user preference, so unlike the prototype's data it is kept in this browser (localStorage).
 */
export type Favorite = { id: string; kind: "page" | "action"; label: string; href: string; actionId?: string };

export const QUICK_ACTIONS = [
  { id: "new-customer", label: "New customer", href: "/crm/customer-mgt/customers?new=1", description: "Open the New Customer wizard" },
  { id: "new-lead", label: "New lead", href: "/crm/growth/leads?new=1", description: "Capture a lead" },
  { id: "new-campaign", label: "New campaign", href: "/crm/growth/campaigns/new", description: "Start a campaign draft" },
  { id: "new-plan", label: "New plan", href: "/crm/catalogue/plans/new", description: "Create a catalogue plan" },
  { id: "add-partner", label: "Add partner", href: "/crm/growth/partners?new=1", description: "Register an ICE, business or delivery partner" },
  { id: "invite-user", label: "Invite user", href: "/crm/settings/users?invite=1", description: "Give a colleague access to the CRM" },
  { id: "generate-key", label: "Generate API key", href: "/crm/settings/api-keys?generate=1", description: "Issue a merchant API key" },
] as const;
export type QuickActionId = (typeof QUICK_ACTIONS)[number]["id"];

export const MAX_FAVORITES = 10;
const KEY = "crm-favorites-v1";
const DEFAULTS: Favorite[] = [
  { id: "fav-overdue", kind: "page", label: "Overdue customers", href: "/crm/customer-mgt/customers?segment=overdue" },
  { id: "fav-collections", kind: "page", label: "Collections", href: "/crm/billing/collections" },
  { id: "fav-new-customer", kind: "action", label: "New customer", href: "/crm/customer-mgt/customers?new=1", actionId: "new-customer" },
];

export const favoritesStore = createStore<Favorite[]>(DEFAULTS);
export const useFavorites = () => useStore(favoritesStore);

const valid = (f: unknown): f is Favorite => {
  const x = f as Favorite;
  return !!x && typeof x.id === "string" && typeof x.label === "string" && typeof x.href === "string" && x.href.startsWith("/") && (x.kind === "page" || x.kind === "action");
};
let loaded = false;
/** Reads the saved list once, after hydration (call it from an effect), then saves every change. */
export function loadFavorites() {
  if (loaded) return;
  loaded = true;
  try {
    const raw = localStorage.getItem(KEY);
    const list = raw ? JSON.parse(raw) : null;
    if (Array.isArray(list)) favoritesStore.set(list.filter(valid).slice(0, MAX_FAVORITES));
  } catch { /* storage blocked: keep the defaults for this session */ }
  favoritesStore.subscribe(() => { try { localStorage.setItem(KEY, JSON.stringify(favoritesStore.get())); } catch { /* ignore */ } });
}

export const favoriteFor = (href: string) => favoritesStore.get().find((f) => f.href === href);

/** Adds a favorite. Returns why it couldn't, or null. */
export function addFavorite(f: Omit<Favorite, "id">): string | null {
  const list = favoritesStore.get();
  if (list.some((x) => x.href === f.href)) return "Already in your favorites";
  if (list.length >= MAX_FAVORITES) return `You can keep up to ${MAX_FAVORITES} favorites. Remove one first.`;
  favoritesStore.set([...list, { ...f, label: f.label.trim().slice(0, 40), id: newId("fav") }]);
  return null;
}
export function addQuickAction(id: QuickActionId) {
  const a = QUICK_ACTIONS.find((x) => x.id === id)!;
  return addFavorite({ kind: "action", label: a.label, href: a.href, actionId: a.id });
}
export const removeFavorite = (id: string) => favoritesStore.set((prev) => prev.filter((f) => f.id !== id));
export const renameFavorite = (id: string, label: string) => favoritesStore.set((prev) => prev.map((f) => (f.id === id ? { ...f, label: label.trim().slice(0, 40) } : f)));
export function moveFavorite(id: string, dir: -1 | 1) {
  favoritesStore.set((prev) => {
    const i = prev.findIndex((f) => f.id === id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= prev.length) return prev;
    const next = [...prev];
    [next[i], next[j]] = [next[j], next[i]];
    return next;
  });
}

/** Opens the Manage favorites dialog from anywhere (sidebar, profile menu). */
export const favoritesManagerStore = createStore(false);
export const openFavoritesManager = () => favoritesManagerStore.set(true);
