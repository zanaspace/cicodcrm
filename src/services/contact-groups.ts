import { api } from "@/lib/api-client";
import { CURRENT_USER } from "@/lib/format";
import {
  CONTACT_GROUP_ID_PREFIX, CONTACT_GROUP_STORES, formatRecordTime,
  type ContactGroupKind, type ContactGroupRecord, type ContactGroupRecordInput,
} from "@/lib/mock/contact-groups";
import { mockReject, via } from "@/services/mock";

/**
 * Contact group reference lists: contact groups, contact group types, contact group lifecycles and marketing channels
 * (legacy Angular routes /crm/manage-contact-group, /crm/contact-group-type, /crm/contact-group-lifecycle,
 * /crm/marketing-channel). Each list offers list, create, edit (including Active / Inactive) and delete.
 * TODO(confirm against Angular): endpoint paths, payload field names (name / key / description / status) and whether
 * status changes have their own endpoint.
 */
const BASE: Record<ContactGroupKind, string> = {
  groups: "/contact-groups", // TODO(confirm)
  types: "/contact-group-types", // TODO(confirm)
  lifecycles: "/contact-group-lifecycles", // TODO(confirm)
  channels: "/marketing-channels", // TODO(confirm)
};

export const CONTACT_GROUP_ENDPOINTS = {
  list: (kind: ContactGroupKind) => BASE[kind],
  record: (kind: ContactGroupKind, id: string) => `${BASE[kind]}/${encodeURIComponent(id)}`, // TODO(confirm)
};

/** The mock rejects duplicates the way the backend should (409 with field errors), so the form can show them. */
function assertUnique(kind: ContactGroupKind, input: Partial<ContactGroupRecordInput>, exceptId?: string) {
  const others = CONTACT_GROUP_STORES[kind].get().filter((r) => r.id !== exceptId);
  const fieldErrors: Record<string, string> = {};
  if (input.name !== undefined && others.some((r) => r.name.toLowerCase() === input.name!.trim().toLowerCase())) fieldErrors.name = "This name is already in use";
  if (input.key !== undefined && others.some((r) => r.key === input.key!.trim())) fieldErrors.key = "This key is already in use";
  if (Object.keys(fieldErrors).length) mockReject("Some details are already in use.", 409, fieldErrors);
}

function findMock(kind: ContactGroupKind, id: string) {
  return CONTACT_GROUP_STORES[kind].get().find((r) => r.id === id) ?? mockReject("Record not found.", 404);
}

export const contactGroupsService = {
  list: (kind: ContactGroupKind) =>
    via(() => CONTACT_GROUP_STORES[kind].get(), () => api.get<ContactGroupRecord[]>(CONTACT_GROUP_ENDPOINTS.list(kind))),

  create: (kind: ContactGroupKind, input: ContactGroupRecordInput) =>
    via(() => {
      assertUnique(kind, input);
      const now = formatRecordTime();
      const record: ContactGroupRecord = { id: `${CONTACT_GROUP_ID_PREFIX[kind]}-${Date.now()}`, ...input, createdBy: CURRENT_USER, createdTime: now, updatedBy: CURRENT_USER, updatedTime: now };
      CONTACT_GROUP_STORES[kind].set((prev) => [record, ...prev]);
      return record;
    }, () => api.post<ContactGroupRecord>(CONTACT_GROUP_ENDPOINTS.list(kind), { body: input })),

  /** Edits a record; also used for Activate / Deactivate (`{ status }`). */
  update: (kind: ContactGroupKind, id: string, patch: Partial<ContactGroupRecordInput>) =>
    via(() => {
      findMock(kind, id);
      assertUnique(kind, patch, id);
      CONTACT_GROUP_STORES[kind].set((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch, updatedBy: CURRENT_USER, updatedTime: formatRecordTime() } : r)));
      return findMock(kind, id);
    }, () => api.patch<ContactGroupRecord>(CONTACT_GROUP_ENDPOINTS.record(kind, id), { body: patch })),

  remove: (kind: ContactGroupKind, id: string) =>
    via(() => {
      findMock(kind, id);
      CONTACT_GROUP_STORES[kind].set((prev) => prev.filter((r) => r.id !== id));
    }, () => api.delete<void>(CONTACT_GROUP_ENDPOINTS.record(kind, id))),
};
