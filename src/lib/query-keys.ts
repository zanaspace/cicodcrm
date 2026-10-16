/**
 * Query keys, organized by feature. Every key includes all parameters that change the result
 * (filters, ids), so two different lists never share a cache entry.
 *
 *   queryKeys.customers.all              -> ["customers"]                  invalidate everything for the feature
 *   queryKeys.customers.list({ q: "x" }) -> ["customers", "list", { q }]   one filtered list
 *   queryKeys.customers.detail("23488")  -> ["customers", "detail", "23488"]
 */
export type KeyFilters = Record<string, unknown> | undefined;

export function createKeys<const F extends string>(feature: F) {
  return {
    all: [feature] as const,
    lists: () => [feature, "list"] as const,
    list: (filters?: KeyFilters) => [feature, "list", filters ?? {}] as const,
    details: () => [feature, "detail"] as const,
    detail: (id: string | number) => [feature, "detail", String(id)] as const,
    /** Anything else a feature needs, e.g. scoped("stats") or scoped("history", id). */
    scoped: (...parts: (string | number | KeyFilters)[]) => [feature, ...parts] as const,
  };
}

export const queryKeys = {
  session: createKeys("session"),
  customers: createKeys("customers"),
  catalogue: createKeys("catalogue"),
  productManagement: createKeys("product-management"),
  billing: createKeys("billing"),
  growth: createKeys("growth"),
  messaging: createKeys("messaging"),
  contactGroups: createKeys("contact-groups"),
  settings: createKeys("settings"),
  reference: createKeys("reference"),
  dashboard: createKeys("dashboard"),
};
