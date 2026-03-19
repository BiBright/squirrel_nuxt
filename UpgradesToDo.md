# Upgrades To Do

## Performance

1. **`useApi()` recreated on every action call**
   In `requests/index.vue`, `useApi()` is called inside `onAssign` and `onRemove` on every click. It should be called once at the top of setup and reused.

2. **`onMounted` instead of `useAsyncData`**
   All pages fetch data in `onMounted`, bypassing SSR. Nuxt's `useAsyncData` would fetch on the server and hydrate on the client. Requires extra setup for Sanctum session cookie forwarding.

3. **Deep reactivity on large arrays**
   `ref<T[]>([])` uses deep reactivity — Vue tracks every nested property. For lists, `shallowRef` is more performant since you only replace the array reference, not mutate individual items.



## Backend

1. **Global search endpoint (`/searchmaster`)**
   The `AppSearch` component is fully built but has no backend to call. The endpoint needs to be created in `squirrel_backend`:
   - Route: `POST /api/searchmaster` (auth-protected)
   - Request body: `{ search: string[] }` — array of terms (split by spaces on the frontend)
   - Logic: determine user role from the authenticated session, then:
     - `admin` / `company-user` → search `suppliers`, `fields`, `forms` tables by name (`LIKE %term%`), filtered by `company_id`
     - supplier user → search `requests` by form name or supplier name, filtered by user ownership
   - Response (admin/company-user):
     ```json
     { "success": [
       { "supplier_id": 1, "supplier_name": "..." },
       { "fields_id": 2, "fields_name": "..." },
       { "forms_id": 3, "forms_name": "..." }
     ]}
     ```
   - Response (no results): `{ "error": "No results found." }`
   - Multiple terms use AND logic: all terms must match the name

2. **Update password logic**
   Implement a proper password update flow: current password verification, new password confirmation, and appropriate validation rules.

2. **Assign a user to one or many requests**
   Add the ability to assign one or more users to a request. This likely requires a pivot table (`request_user`) and the corresponding API endpoints (assign/unassign).

3. **Role-based request access for `company-user`**
   `company-user` should only have access to requests explicitly assigned to them.



## Frontend

1. **Find an alternative to chart.js**
