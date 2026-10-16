import { api } from "@/lib/api-client";
import { templatesStore, upsertTemplate, type Template } from "@/lib/mock/messaging";
import { via } from "@/services/mock";

/**
 * Shared email / SMS templates (legacy Angular: Communication › Communication Templates).
 * TODO(confirm against Angular): inspect the Angular template editor and the backend payload (content format,
 * variable syntax, status values) before switching to live mode; preserve the existing content format.
 */
export const MESSAGING_ENDPOINTS = {
  templates: "/communication/templates", // TODO(confirm)
  template: (id: string) => `/communication/templates/${encodeURIComponent(id)}`, // TODO(confirm)
};

export const messagingService = {
  templates: () => via(() => templatesStore.get(), () => api.get<Template[]>(MESSAGING_ENDPOINTS.templates)),
  saveTemplate: (template: Template, isNew: boolean) =>
    via(() => { upsertTemplate(template); return template; },
      () => (isNew ? api.post<Template>(MESSAGING_ENDPOINTS.templates, { body: template }) : api.put<Template>(MESSAGING_ENDPOINTS.template(template.id), { body: template }))),
};
