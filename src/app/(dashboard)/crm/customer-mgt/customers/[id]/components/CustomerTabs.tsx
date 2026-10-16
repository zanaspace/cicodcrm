import Link from "next/link";

export const CUSTOMER_TABS = [
  { id: "overview", label: "Overview" },
  { id: "billing", label: "Subscription & Billing" },
  { id: "users", label: "Users" },
  { id: "tickets", label: "Tickets" },
  { id: "activity", label: "Activity & Notes" },
] as const;
export type CustomerTabId = (typeof CUSTOMER_TABS)[number]["id"];

/** Old tab names still resolve, so existing links keep working. */
const LEGACY: Record<string, CustomerTabId> = {
  Overview: "overview", Subscription: "billing", "Billing & Invoices": "billing", Addon: "billing",
  "User Management": "users", Tickets: "tickets", Note: "activity",
};

export function resolveTab(tab?: string): CustomerTabId {
  if (!tab) return "overview";
  return (CUSTOMER_TABS.find((t) => t.id === tab)?.id ?? LEGACY[tab] ?? "overview");
}

export function CustomerTabs({ activeTab, customerId, counts }: { activeTab: CustomerTabId; customerId: string; counts?: Partial<Record<CustomerTabId, number>> }) {
  return (
    <div role="tablist" aria-label="Customer sections" className="flex items-center bg-[var(--muted)] p-1.5 rounded-lg w-full gap-1 overflow-x-auto">
      {CUSTOMER_TABS.map((tab) => {
        const isActive = activeTab === tab.id;
        const count = counts?.[tab.id];
        return (
          <Link
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            href={`/crm/customer-mgt/customers/${customerId}?tab=${tab.id}`}
            scroll={false}
            className={`px-5 py-2 rounded-md font-heading font-semibold text-[0.85rem] transition-all whitespace-nowrap flex items-center gap-2 ${
              isActive
                ? "bg-[var(--card)] text-[var(--foreground)] shadow-sm"
                : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            }`}
          >
            {tab.label}
            {!!count && <span className="min-w-5 px-1.5 rounded-full bg-[var(--accent)] text-[var(--accent-foreground)] text-[0.7rem] font-bold">{count}</span>}
          </Link>
        );
      })}
    </div>
  );
}
