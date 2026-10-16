# Module inventory

Links every legacy Angular CRM page to its Next.js route, service file, backend endpoint and status, as required by
§15.7 of the *CRM Frontend Redevelopment Plan*. Status values follow §10.3: implemented, tested, blocked, or
intentionally excluded.

**Current mode:** every service runs in mock mode (`NEXT_PUBLIC_API_MODE=mock`). Each endpoint path in `src/services/*.ts`
is marked `// TODO(confirm)` until it has been checked against the Angular services and the backend. A module only
counts as complete under §14 once its live endpoints are confirmed and tested against the backend.

## Needs clarification (§15.8)

These were named in the plan (§9) but are not in the legacy page map, or their backend contract is unknown. Nothing
was built for them from assumptions.

| Item | Plan § | Question for the business / backend team |
|---|---|---|
| **Contacts** (Phase 2) | 9 | Is "Contacts" a separate legacy module, or the contact persons on a customer (built in Customer 360)? Find the Angular route. |
| **Accounts** (Phase 10) | 9 | Same as Customers (`/crm/account/*` in Angular), or a separate entity? Built as Customers for now. |
| **Payment Plans** (Phase 10) | 9 | Which Angular screen? Does it map to plan pricing periods or to instalment plans? |
| **Payment Confirmation** (Phase 10) | 9 | Which Angular screen and endpoint? Is it the offline-payment approval (maker-checker) step? |
| **Addon Types** (Phase 9) | 9 | Legacy "Addon tab" was merged into Customer 360; is there also an Addon Types admin list? |
| **Host** (Phase 13) | 9 | What does the Host module manage? No Angular route found. |
| **Affiliate** (Phase 13) | 9 | Same as Sales Channels / Partners, or a separate programme? |
| **Database Instances** (Phase 12) | 9 | The legacy *Db Instances* tab was intentionally excluded from the CRM. Confirm it stays out. |
| **Service Keys** (Phase 12) | 9 | Excluded; shown read-only as product codes. Confirm. |
| **Lifecycle configurations** (Phase 12) | 9 | Contact Group Lifecycle was merged into pipeline stages. Confirm no other lifecycle config is needed. |
| **Forgot / reset password** | 7.1 | Does the backend support it? The UI and routes exist; the live calls are TODO in `src/lib/auth/backend-auth.ts`. |
| **Auth contract** | 7.2 | Token format, lifetime, refresh, logout and the current-user endpoint, incl. how roles/permissions are returned. |
| **Permissions source** | 7.3 | Will the backend return per-module access levels, or must they be derived from a role name? |

## Legacy pages

| Legacy section › page | Legacy route | Decision | New location | New route | Service | Status |
|---|---|---|---|---|---|---|
| Customer Management › Customers | `/crm/account/search` | rebuilt | Customer Management › Customers | `/crm/customer-mgt/customers` | services/customers.ts | Implemented (mock data); live endpoint to confirm |
| Customer Management › Customer page (7 tabs) | `/crm/account/merchant?token=…` | rebuilt | Customers › Customer 360 | `/crm/customer-mgt/customers/[id]` | services/customers.ts | Implemented (mock data); live endpoint to confirm |
| Customer Management › Addon tab | `Customer page` | merged | Customer 360 › Subscription & Billing tab | `?tab=billing` | — | Implemented (mock data); live endpoint to confirm |
| Customer Management › Note tab | `Customer page` | merged | Customer 360 › Activity & Notes tab | `?tab=activity` | — | Implemented (mock data); live endpoint to confirm |
| Customer Management › Update Customer (full-page form) | `/crm/account/update?token=…` | merged | Customer 360 › Edit profile | `side drawer` | — | Implemented (mock data); live endpoint to confirm |
| Customer Management › Suspend Customer button | `Customer page header` | moved | Customer 360 › ⋯ menu › Suspend | — | — | Implemented (mock data); live endpoint to confirm |
| Service Configuration › Service Types | `/crm/service-type` | moved | Settings › Catalogue Setup › Service Types | `/crm/service-type` | services/product-management.ts | Implemented (mock data); live endpoint to confirm |
| Product Management › Product Types | `/crm/product-type` | moved | Settings › Catalogue Setup › Product Types | `/crm/product-management/product-types` | services/product-management.ts | Implemented (mock data); live endpoint to confirm |
| Product Management › Products | `/crm/product` | rebuilt | Catalogue › Products & Plans | `/crm/catalogue` | services/catalogue.ts | Implemented (mock data); live endpoint to confirm |
| Product Management › Product Captions | `/crm/product-caption` | merged | Catalogue › Plan editor › Features step | `/crm/catalogue/plans/[code]` | services/catalogue.ts | Implemented (mock data); live endpoint to confirm |
| Product Management › Bundle Groups | `/crm/bundle-groups` | moved | Settings › Catalogue Setup › Bundle Groups | `/crm/product-management/bundle-groups` | services/product-management.ts | Implemented (mock data); live endpoint to confirm |
| Product Management › Single Offers | `/crm/product-offer` | rebuilt | Catalogue › Products & Plans + Plan editor | `/crm/catalogue/plans/[code]` | services/catalogue.ts | Implemented (mock data); live endpoint to confirm |
| Product Management › Set Visibility (in the Actions menu) | `Offers and Bundles lists` | rebuilt | Plan and bundle status: Draft → Live → Archived | — | — | Implemented (mock data); live endpoint to confirm |
| Product Management › Bundles | `/crm/product-bundle-offer` | rebuilt | Catalogue › Bundles + Bundle editor | `/crm/catalogue/bundles` | services/catalogue.ts | Implemented (mock data); live endpoint to confirm |
| Billing & Payments › Subscription Payments | `/crm/subscription-payments` | rebuilt | Billing & Payments › Payments | `/crm/billing/payments` | services/billing.ts | Implemented (mock data); live endpoint to confirm |
| Billing & Payments › Dunning Plan | `/crm/dunning` | rebuilt | Billing & Payments › Dunning Policies | `/crm/billing/dunning` | services/billing.ts | Implemented (mock data); live endpoint to confirm |
| Billing & Payments › KCI | `/crm/kci` | merged | Dunning policy editor › Steps | `/crm/billing/dunning/[id]` | services/billing.ts | Implemented (mock data); live endpoint to confirm |
| Marketing › Contact Group Lifecycle | `/crm/lifecycle` | merged | Pipeline › Leads › Manage stages | `/crm/growth/leads` | services/growth.ts | Implemented (mock data); live endpoint to confirm |
| Marketing › Contact Group Types | `/crm/contact-group-type` | kept | Marketing › Contact Groups › Contact Group Types | `/crm/contact-group-type` | services/contact-groups.ts | Implemented (mock data); live endpoint to confirm |
| Marketing › Manage Contact Groups | `/crm/contact-group` | kept | Marketing › Contact Groups › Manage Contact Groups | `/crm/manage-contact-group` | services/contact-groups.ts | Implemented (mock data); live endpoint to confirm |
| Marketing › Marketing Channels | `/crm/marketing-channel` | kept | Marketing › Marketing Channels | `/crm/marketing-channel` | services/contact-groups.ts | Implemented (mock data); live endpoint to confirm |
| Marketing › Manage Campaign | `/crm/campaign` | rebuilt | Marketing › Campaigns | `/crm/growth/campaigns` | services/growth.ts | Implemented (mock data); live endpoint to confirm |
| Marketing › Leads | `/crm/lead` | rebuilt | Pipeline › Leads | `/crm/growth/leads` | services/growth.ts | Implemented (mock data); live endpoint to confirm |
| Marketing › Prospects | `/crm/account/view-prospect` | merged | Pipeline › Leads (later stages) | `/crm/growth/leads` | services/growth.ts | Implemented (mock data); live endpoint to confirm |
| Sales › Sales Channels | `/crm/sales-channel/search` | rebuilt | Partners › Partners | `/crm/growth/partners` | services/growth.ts | Implemented (mock data); live endpoint to confirm |
| Sales › Sales Commission | `/crm/sales-commission` | moved | Partners › Commission Plans | `/crm/growth/commission` | services/growth.ts | Implemented (mock data); live endpoint to confirm |
| Communication › Communication Type | `/crm/communication-type` | merged | Messaging › Templates (channel and purpose) | `/crm/growth/messaging` | services/messaging.ts, services/growth.ts | Implemented (mock data); live endpoint to confirm |
| Communication › Communication Groups | `/crm/communication-group` | merged | Campaigns › Audience step | `/crm/growth/campaigns/[id]` | services/growth.ts | Implemented (mock data); live endpoint to confirm |
| Communication › Communication Templates | `/crm/communication-template` | rebuilt | Messaging › Templates | `/crm/growth/messaging` | services/messaging.ts, services/growth.ts | Implemented (mock data); live endpoint to confirm |
| Communication › Subscription List | `/crm/subscription-list` | rebuilt | Messaging › Subscribers | `/crm/growth/messaging/subscribers` | services/messaging.ts, services/growth.ts | Implemented (mock data); live endpoint to confirm |
| Settings › Manage Users | `/crm/manage-users` | rebuilt | Settings › Users | `/crm/settings/users` | services/settings.ts | Implemented (mock data); live endpoint to confirm |
| Settings › Profile Settings | `/crm/profile-settings` | rebuilt | Settings › My Profile (also in the avatar menu) | `/crm/settings/profile` | services/settings.ts | Implemented (mock data); live endpoint to confirm |
| Settings › Sales Commission tab | `/crm/app-configuration` | merged | Partners › Commission Plans | `/crm/growth/commission` | services/growth.ts | Implemented (mock data); live endpoint to confirm |
| Settings › Db Instances tab | `/crm/app-configuration` | removed | Not in the CRM | — | — | Intentionally excluded |
| Settings › Service Keys tab | `/crm/app-configuration` | removed | Shown read-only as product codes in Catalogue | — | — | Intentionally excluded |
| Settings › Placeholders tab | `/crm/app-configuration` | merged | Messaging › Templates › variable chips | `/crm/growth/messaging` | services/messaging.ts, services/growth.ts | Implemented (mock data); live endpoint to confirm |
| Settings › Triggers tab | `/crm/app-configuration` | rebuilt | Settings › Integrations › Notifications | `/crm/settings/notifications` | services/settings.ts | Implemented (mock data); live endpoint to confirm |
| Settings › Generate Merchant Key | `/crm/generate-merchant-key` | rebuilt | Settings › Integrations › Merchant API Keys | `/crm/settings/api-keys` | services/settings.ts | Implemented (mock data); live endpoint to confirm |
| Settings › Currencies | `/crm/currency` | merged | Settings › Reference Data › Currencies | `/crm/settings/reference?tab=currencies` | services/reference.ts | Implemented (mock data); live endpoint to confirm |
| Settings › Continents | `/crm/continent` | merged | Reference Data › Locations (a column) | `/crm/settings/reference?tab=locations` | services/reference.ts | Implemented (mock data); live endpoint to confirm |
| Settings › Countries | `/crm/country` | merged | Settings › Reference Data › Locations | `/crm/settings/reference?tab=locations` | services/reference.ts | Implemented (mock data); live endpoint to confirm |
| Settings › States | `/crm/states` | merged | Reference Data › Locations (drill down) | `/crm/settings/reference?tab=locations` | services/reference.ts | Implemented (mock data); live endpoint to confirm |
| Settings › Counties | `/crm/county` | merged | Reference Data › Locations (drill down) | `/crm/settings/reference?tab=locations` | services/reference.ts | Implemented (mock data); live endpoint to confirm |
| Settings › Business Sectors | `/crm/business-sector` | merged | Reference Data › Sectors & business types | `/crm/settings/reference?tab=sectors` | services/reference.ts | Implemented (mock data); live endpoint to confirm |
| Settings › Business Types | `/crm/business-type` | merged | Reference Data › Sectors & business types | `/crm/settings/reference?tab=sectors` | services/reference.ts | Implemented (mock data); live endpoint to confirm |
| Settings › Payment Channel | `/crm/payment-channel` | merged | Reference Data › Payment methods | `/crm/settings/reference?tab=payments` | services/reference.ts | Implemented (mock data); live endpoint to confirm |
| Every page › Go Back / Go Forward buttons | `Page header` | removed | Breadcrumbs on every page | — | — | Intentionally excluded |

## New-only screens

| Screen | Route | Service | Status |
|---|---|---|---|
| Sign in | `/login` | `services/auth.ts` → `/api/auth/login` | Implemented (mock); e2e tested |
| Forgot password | `/forgot-password` | `/api/auth/forgot-password` | Implemented (mock); backend support to confirm |
| Reset password | `/reset-password?token=…` | `/api/auth/reset-password` | Implemented (mock); backend support to confirm |
| Operations dashboard | `/` | customers, billing, catalogue services | Implemented (mock) |
| Billing overview, Collections | `/crm/billing`, `/crm/billing/collections` | `services/billing.ts` | Implemented (mock) |
| Pricing grid | `/crm/catalogue/pricing` | `services/catalogue.ts` | Implemented (mock) |
| Roles & Permissions, Audit log | `/crm/settings/roles`, `/crm/settings/audit` | `services/settings.ts` | Implemented (mock) |

## Excluded from scope

| Item | Reason |
|---|---|
| Campaign Studio (`/crm/studio/*`) | Removed: not part of the current build. |
