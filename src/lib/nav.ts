import type { ElementType } from "react";
import {
  LayoutDashboard, Users, Layers, Target, Briefcase, MessageSquare, CreditCard, Settings, Funnel,
  LayoutTemplate, Send, Contact, Plug, ShieldCheck,
} from "lucide-react";

export type NavLeaf = { label: string; href: string };
export type NavFolder = { label: string; children: NavLeaf[] };
export type NavGroup = {
  title: string;
  icon: ElementType;
  /** A group with an href is a single link (no accordion). */
  href?: string;
  children?: (NavLeaf | NavFolder)[];
};
export type NavSection = { caption: string; groups: NavGroup[] };

/**
 * Single source of truth for the sidebar and the breadcrumb.
 * Max two levels under a group; reference data lives under Settings.
 */
export const NAV: NavSection[] = [
  {
    caption: "Daily Operations",
    groups: [
      { title: "Dashboard", icon: LayoutDashboard, href: "/" },
      { title: "Customer Management", icon: Users, children: [{ label: "Customers", href: "/crm/customer-mgt/customers" }] },
      {
        title: "Catalogue", icon: Layers, children: [
          { label: "Products & Plans", href: "/crm/catalogue" },
          { label: "Bundles", href: "/crm/catalogue/bundles" },
          { label: "Pricing", href: "/crm/catalogue/pricing" },
        ],
      },
      {
        title: "Billing & Payments", icon: CreditCard, children: [
          { label: "Overview", href: "/crm/billing" },
          { label: "Payments", href: "/crm/billing/payments" },
          { label: "Collections", href: "/crm/billing/collections" },
          { label: "Dunning Policies", href: "/crm/billing/dunning" },
        ],
      },
    ],
  },
  {
    caption: "Growth",
    groups: [
      {
        title: "Pipeline", icon: Funnel, children: [
          { label: "Leads", href: "/crm/growth/leads" },
        ],
      },
      {
        title: "Marketing", icon: Target, children: [
          { label: "Campaigns", href: "/crm/growth/campaigns" },
          {
            label: "Contact Groups", children: [
              { label: "Contact Group Lifecycle", href: "/crm/contact-group-lifecycle" },
              { label: "Contact Group Types", href: "/crm/contact-group-type" },
              { label: "Manage Contact Groups", href: "/crm/manage-contact-group" },
            ],
          },
          { label: "Marketing Channels", href: "/crm/marketing-channel" },
        ],
      },
      {
        title: "Partners", icon: Briefcase, children: [
          { label: "Partners", href: "/crm/growth/partners" },
          { label: "Commission Plans", href: "/crm/growth/commission" },
        ],
      },
      {
        title: "Messaging", icon: MessageSquare, children: [
          { label: "Templates", href: "/crm/growth/messaging" },
          { label: "Subscribers", href: "/crm/growth/messaging/subscribers" },
        ],
      },
    ],
  },
  {
    // Campaign Studio, brought in from the CAMPAIGNStudioFE project for team review.
    caption: "Campaign Studio",
    groups: [
      { title: "Template Library", icon: LayoutTemplate, href: "/crm/studio/templates" },
      { title: "Campaigns", icon: Send, href: "/crm/studio/campaigns" },
      { title: "Contacts", icon: Contact, href: "/crm/studio/contacts" },
      { title: "Integrations", icon: Plug, href: "/crm/studio/integrations" },
      { title: "Studio Admin", icon: ShieldCheck, href: "/crm/studio/admin" },
    ],
  },
  {
    caption: "Administration",
    groups: [
      {
        title: "Settings", icon: Settings, children: [
          { label: "Overview", href: "/crm/settings" },
          {
            label: "Team & Access", children: [
              { label: "Users", href: "/crm/settings/users" },
              { label: "Roles & Permissions", href: "/crm/settings/roles" },
              { label: "Audit Log", href: "/crm/settings/audit" },
            ],
          },
          { label: "My Profile", href: "/crm/settings/profile" },
          { label: "Reference Data", href: "/crm/settings/reference" },
          {
            label: "Catalogue Setup", children: [
              { label: "Service Types", href: "/crm/service-type" },
              { label: "Product Types", href: "/crm/product-management/product-types" },
              { label: "Bundle Groups", href: "/crm/product-management/bundle-groups" },
            ],
          },
          {
            label: "Integrations", children: [
              { label: "Merchant API Keys", href: "/crm/settings/api-keys" },
              { label: "Notifications", href: "/crm/settings/notifications" },
            ],
          },
        ],
      },
    ],
  },
];

export const isFolder = (n: NavLeaf | NavFolder): n is NavFolder => "children" in n;

const covers = (href: string, pathname: string) =>
  href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");

export type NavMatch = { section: string; group: NavGroup; folder?: NavFolder; leaf?: NavLeaf; href: string };

/** Longest-prefix match, so detail pages (/customers/23488) light up their list page. */
export function matchNav(pathname: string): NavMatch | undefined {
  let best: NavMatch | undefined;
  for (const section of NAV) {
    for (const group of section.groups) {
      if (group.href && covers(group.href, pathname) && (!best || group.href.length > best.href.length)) best = { section: section.caption, group, href: group.href };
      for (const child of group.children ?? []) {
        const leaves = isFolder(child) ? child.children.map((leaf) => ({ leaf, folder: child })) : [{ leaf: child, folder: undefined }];
        for (const { leaf, folder } of leaves) {
          if (covers(leaf.href, pathname) && (!best || leaf.href.length > best.href.length)) best = { section: section.caption, group, folder, leaf, href: leaf.href };
        }
      }
    }
  }
  return best;
}
