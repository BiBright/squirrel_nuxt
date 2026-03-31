# Squirrel — Platform Overview

## Concept

Squirrel is a B2B supplier management platform. The core flow is: a company builds data collection forms → selects suppliers → launches requests → suppliers fill in the forms → company approves or rejects the responses.

---

## Roles & Access

| Role | Access |
|---|---|
| `master` | Global admin panel, all companies, plan management |
| `admin` / `manager` | Full management within their company |
| `company-user` | Requests, forms, suppliers, users |
| `supplier` | Only their assigned request entries |

---

## Core Entities

```
Company
├── Users (with roles)
├── Fields (reusable input definitions: text, date, file, etc.)
├── Forms (data collection templates built from Fields)
├── Suppliers (vendor database)
└── Requests
    └── RequestEntries (one per form × supplier pair)
        └── Answers (responses to each field)
```

---

## Request Lifecycle

```
1. Company creates a Request
   └── selects Forms + Suppliers + Assignee (responsible user)

2. System creates RequestEntries (one per form × supplier combination)
   └── status: awaiting_answer

3. Supplier opens their entry and fills in the form fields
   └── status: pending_approval

4. Company reviews and approves or rejects (with optional comment)
   └── status: completed | cancelled
```

---

## Pages & What They Do

| Route | Who | What |
|---|---|---|
| `/` | All roles | Dashboard with role-adapted metrics and charts |
| `/requests` | Company / Supplier | Request list or assigned supplier entries |
| `/requests/create` | Company | Create request (forms + suppliers + assignee) |
| `/requests/:id/_edit` | Company | Edit an existing request |
| `/requests/:id/entries/:entryId` | Both | Supplier fills in / Company reviews and approves |
| `/forms` | Company | Forms list |
| `/forms/:id` | Company | Create or edit a form |
| `/fields` | Company | Reusable fields list |
| `/fields/:id` | Company | Create or edit a field |
| `/suppliers` | Company | Suppliers list |
| `/suppliers/:id` | Company | Create or edit a supplier |
| `/settings` | All roles | Profile, password, company info, notifications |
| `/admin/companies` | Master | Global view of all companies and plan usage |

---

## Technical Layers

### Authentication
Laravel Sanctum (session cookies + XSRF token). Token persisted in a 7-day cookie via Pinia auth store. Auto-logout on 401.

### API Layer
`useApi` composable — thin `$fetch` wrapper that injects the XSRF token header and handles auth errors globally.

### Dynamic Forms
Fields have types: `short_text`, `long_text`, `numeric`, `date`, `template_file`, `supplier_file`. When a supplier opens a request entry, each field renders the appropriate input component based on its type.

### Toast System
Global composable (`useAppToast`) with category-based deduplication and auto-dismiss (3s base + 50ms per character, capped at 7s).

### List Pages Pattern
All list pages share a common pattern: toolbar (search + sort + view toggle), server-side pagination, blank/empty state, multi-select with bulk actions.

### Middleware

| Middleware | Rule |
|---|---|
| `auth` | Redirects to `/login` if not authenticated |
| `admin` | Blocks `company-user` role |
| `master` | Only allows `master` role |

---

## API Endpoints — Summary

```
Auth
  POST   /auth/login
  POST   /set-password/:token

Dashboard
  GET    /dashboard/card               # company user stats
  GET    /dashboard/recent-data        # recent requests
  GET    /master/dashboard             # master admin overview

Requests
  GET    /requests                     # company: all requests
  GET    /supplier/requests            # supplier: assigned entries
  POST   /requests                     # create request
  PATCH  /requests/:id                 # update request
  DELETE /requests/:id
  PATCH  /requests/:id/assign          # assign to user
  GET    /supplier/request/:id         # supplier entry detail

Request Entries
  POST   /request-entries/:id/respond  # supplier saves responses
  POST   /request-entries/:id/submit   # supplier submits for review
  POST   /request-entries/:id/approve  # company approves
  POST   /request-entries/:id/reject   # company rejects

Forms
  GET|POST          /forms
  GET|PATCH|DELETE  /forms/:id

Fields
  GET|POST          /fields
  GET|PATCH|DELETE  /fields/:id

Suppliers
  GET|POST          /suppliers
  GET|PATCH|DELETE  /suppliers/:id
  GET               /countries

Users
  GET|POST          /users
  GET|PATCH|DELETE  /users/:id
  PATCH             /profile            # update own profile
  POST              /profile            # change password

Company
  GET|PATCH         /companies/:id

Settings
  GET|PATCH         /settings

Master Admin
  GET               /master/companies   # all companies with usage data
```

---

## Component Architecture

```
app/
├── layouts/
│   ├── default.vue       — sidebar + header shell
│   └── auth.vue          — centered layout for login/password pages
├── components/
│   ├── AppHeader.vue     — top nav bar
│   ├── AppSidebar.vue    — role-aware navigation menu
│   ├── RequestsTable.vue — request list with bulk actions
│   └── ui/               — primitive components (Button, Input, Modal,
│                           Table, Badge, Select, FileUpload, etc.)
├── composables/
│   ├── useApi.ts             — $fetch wrapper with auth
│   ├── useAppToast.ts        — global toast notifications
│   ├── useUnsavedChanges.ts  — dirty-form navigation guard
│   ├── useListToolbar.ts     — search/sort/view state for list pages
│   ├── useListPagination.ts  — pagination state and helpers
│   └── useBlankState.ts      — empty/no-results state logic
└── stores/
    └── auth.ts               — token, user, company (cookie-persisted)
```

---

## Summary

Squirrel is a procurement workflow platform. Companies define **what** to collect (fields → forms), **from whom** (suppliers), then launch **requests**. Each request spawns individual entries per supplier-form pair, driving a review and approval cycle. A master admin tier manages companies and subscription plans above it all.
