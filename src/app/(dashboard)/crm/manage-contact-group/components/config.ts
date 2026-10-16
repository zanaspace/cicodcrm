import type { ContactGroupKind } from "@/lib/mock/contact-groups";

/**
 * Wording for the four contact group reference lists, which share one screen and one modal.
 * `label` is the title-case name, `noun` the lower-case name, `short` the one-word name used in a few sentences.
 */
export type ContactGroupListConfig = { label: string; noun: string; short: string; searchId: string };

export const CONTACT_GROUP_CONFIG: Record<ContactGroupKind, ContactGroupListConfig> = {
  groups: { label: "Contact Group", noun: "contact group", short: "group", searchId: "cg-search" },
  types: { label: "Contact Group Type", noun: "contact group type", short: "type", searchId: "cgt-search" },
  lifecycles: { label: "Contact Group Lifecycle", noun: "contact group lifecycle", short: "lifecycle", searchId: "cgl-search" },
  channels: { label: "Marketing Channel", noun: "marketing channel", short: "channel", searchId: "mc-search" },
};
