# CICOD CRM frontend conventions

How this codebase implements the *CRM Frontend Redevelopment Plan* (`CRM frontend Redesign flow_V2.pdf`).
Read this before adding a screen or an API call.

## Layers

```
Screen (app/(dashboard)/crm/**)          renders data, owns local UI state only
  └─ Feature hooks (features/<x>/queries.ts)   TanStack Query: useXQuery() / useDoX() mutations
       └─ Service (services/<x>.ts)            one function per backend operation
            ├─ mock branch  → lib/mock/* stores   (NEXT_PUBLIC_API_MODE=mock)
            └─ live branch  → lib/api-client.ts   → /api/backend/* → CRM backend
```

- **Screens never** import a `*Store`, a `use*` store hook, or a mutating function from `@/lib/mock/*`, and never call
  `fetch`. They may import **types, constants and pure helpers** from `@/lib/mock/*` (e.g. `getHealth`, `pricingGaps`,
  `SEGMENTS`) until those move to `src/types` / domain helpers.
- **Services** hold every endpoint path, in an `*_ENDPOINTS` object at the top of the file. Paths not yet confirmed
  against the Angular app are marked `// TODO(confirm)`. Do not invent behaviour: if a contract is unclear, leave the
  TODO and list it in `docs/MODULE_INVENTORY.md` under *Needs clarification* (§15.8 of the plan).
- **Feature hooks** own query keys (`lib/query-keys.ts`) and cache invalidation. A mutation invalidates every query its
  side effects can change (e.g. a collections action refreshes billing, customers and the dashboard).

## Reading data

```tsx
const customers = useCustomersQuery();
return (
  <QueryState query={customers}>
    {(rows) => <CustomersTable rows={rows} />}
  </QueryState>
);
```

`QueryState`, `LoadingState`, `EmptyState` and `ErrorState` live in `components/feedback/States.tsx`. Every screen shows
a loading state, an error state with *Try again*, and an empty state where a list can be empty.

## Changing data

```tsx
const record = useRecordOfflinePayment({ success: "Payment recorded" });
<Button disabled={record.isPending} onClick={() => record.run({ cicod, input })}>
  {record.isPending ? "Saving…" : "Record payment"}
</Button>
```

`useCrmMutation` (`lib/mutations.ts`) gives: `isPending` (disable the button), `run()` (ignores double submits),
success / error toasts, `fieldErrors` for showing backend validation next to fields, and cache refresh. Close a
modal or navigate in `onSuccess`, never straight after calling `run()`.

## Permissions

The model is in `lib/permissions/model.ts`: each role grants `none | view | edit | full` per module.

| Need | Use |
|---|---|
| Hide a nav item / block a page | automatic: `moduleForPath()` maps routes to modules; `Sidebar` and `RequirePathAccess` use it |
| Create / edit buttons | `can(module, "edit")` |
| Risky actions (suspend, publish, revoke, delete, change commission) | `can(module, "full")` |

```tsx
const { can } = usePermissions();
{can("billing", "full") && <Button variant="destructive">Suspend</Button>}
```

Hiding a control is a convenience. The backend must still reject unauthorized requests.

## Authentication

- `/api/auth/login|logout|me|forgot-password|reset-password` are route handlers that set / clear an **HttpOnly,
  SameSite=Lax, signed** session cookie (`lib/auth/session.ts`). Browser code never sees a token.
- In live mode the backend token sits inside that cookie; `/api/backend/[...path]` adds it to each request.
- `src/proxy.ts` (Next 16's renamed middleware) redirects signed-out visitors to `/login?next=…`. It is an early
  check only; route handlers verify the session themselves.
- Any 401 from any request clears the Query cache and returns the user to `/login?expired=1`.

## UI components

`components/ui/primitives/*` are shadcn/ui components (do not edit them for app-specific behaviour).
`components/ui/*` (Button, Modal, Select, Drawer, …) are the CRM's components built on those primitives; screens use
these. Add new standard components with `npx shadcn@latest add <name>`; they land in `primitives/`.

## Environment

See `.env.example`. Only `NEXT_PUBLIC_*` values reach the browser. `lib/env.ts` is the only place that reads env vars.

## Checks

```
npm run typecheck   # tsc --noEmit
npm run lint
npm test            # vitest unit tests
npm run test:e2e    # playwright smoke tests (starts the dev server)
```
