/**
 * Permission model shared by the server (session, route checks) and the browser (navigation, pages, actions).
 * A role grants one access level per module. Levels are ordered: none < view < edit < full.
 * Hiding a control is a convenience only; the backend must still authorize every request.
 */
export const MODULES = [
  { id: "customers", label: "Customers", full: "Suspend and reactivate customers" },
  { id: "catalogue", label: "Catalogue", full: "Publish, unpublish and archive plans and bundles" },
  { id: "billing", label: "Billing & Payments", full: "Record payments, suspend for non-payment, publish dunning policies" },
  { id: "pipeline", label: "Pipeline", full: "Convert leads, manage pipeline stages" },
  { id: "marketing", label: "Marketing & Messaging", full: "Launch campaigns, edit shared templates" },
  { id: "partners", label: "Partners", full: "Verify, reject and suspend partners; change commission" },
  { id: "settings", label: "Settings", full: "Users, roles, reference data, API keys" },
] as const;

export type ModuleId = (typeof MODULES)[number]["id"];
export type Access = "none" | "view" | "edit" | "full";
export type AccessMap = Record<ModuleId, Access>;

export const ACCESS_LEVELS: { id: Access; label: string; hint: string }[] = [
  { id: "none", label: "No access", hint: "Hidden from the menu" },
  { id: "view", label: "View", hint: "See records, change nothing" },
  { id: "edit", label: "Edit", hint: "Create and edit records" },
  { id: "full", label: "Full", hint: "Edit, plus the risky actions" },
];

const RANK: Record<Access, number> = { none: 0, view: 1, edit: 2, full: 3 };

/** True when `access` grants at least `needed` on `module`. */
export function hasAccess(access: Partial<AccessMap> | undefined, module: ModuleId, needed: Access = "view"): boolean {
  return RANK[access?.[module] ?? "none"] >= RANK[needed];
}

/**
 * Which module owns a route. Routes not listed (dashboard, own profile) are open to every signed-in user.
 * Order matters: the first prefix that matches wins.
 */
const ROUTE_MODULES: [prefix: string, module: ModuleId][] = [
  ["/crm/customer-mgt", "customers"],
  ["/crm/catalogue", "catalogue"],
  ["/crm/product-management", "catalogue"],
  ["/crm/service-type", "catalogue"],
  ["/crm/billing", "billing"],
  ["/crm/growth/leads", "pipeline"],
  ["/crm/growth/partners", "partners"],
  ["/crm/growth/commission", "partners"],
  ["/crm/growth/campaigns", "marketing"],
  ["/crm/growth/messaging", "marketing"],
  ["/crm/manage-contact-group", "marketing"],
  ["/crm/contact-group-type", "marketing"],
  ["/crm/contact-group-lifecycle", "marketing"],
  ["/crm/marketing-channel", "marketing"],
  ["/crm/settings", "settings"],
];
const OPEN_ROUTES = ["/crm/settings/profile"];

const covers = (prefix: string, pathname: string) => pathname === prefix || pathname.startsWith(prefix + "/");

export function moduleForPath(pathname: string): ModuleId | null {
  if (OPEN_ROUTES.some((p) => covers(p, pathname))) return null;
  for (const [prefix, owner] of ROUTE_MODULES) if (covers(prefix, pathname)) return owner;
  return null;
}

export function canOpenPath(access: Partial<AccessMap> | undefined, pathname: string): boolean {
  const owner = moduleForPath(pathname);
  return owner === null || hasAccess(access, owner, "view");
}
