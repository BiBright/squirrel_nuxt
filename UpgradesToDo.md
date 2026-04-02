# Upgrades To Do

## Performance

1. **`useApi()` recreated on every action call**
   In `requests/index.vue`, `useApi()` is called inside `onAssign` and `onRemove` on every click. It should be called once at the top of setup and reused.

2. **`onMounted` instead of `useAsyncData`**
   All pages fetch data in `onMounted`, bypassing SSR. Nuxt's `useAsyncData` would fetch on the server and hydrate on the client. Requires extra setup for Sanctum session cookie forwarding.

3. **Deep reactivity on large arrays**
   `ref<T[]>([])` uses deep reactivity — Vue tracks every nested property. For lists, `shallowRef` is more performant since you only replace the array reference, not mutate individual items.



## Backend

1. **Store and expose approval/rejection comments on request entries**
   The frontend sends a `comment` body param on approve/reject, but the backend completely ignores it. Comments should accumulate as a history (like Squirrel_Companys) and be visible to all roles including suppliers.
   - Add `comments` JSON column (nullable) to `request_entries` via migration — format: `[{user: string, date: string, comment: string}]`
   - In `approveEntry` and `rejectEntry` controllers: read `$request->input('comment')`, build a new comment object (user name + `now()->format('H:i d/m/Y')` + comment text), append to existing array, persist
   - Expose in `RequestEntryResource`: `'comments' => $this->comments ?? []`
   - The `showEntry` endpoint already returns `RequestEntryResource` — no extra route needed

2. **`Rejected` status for request entries**
   `markAsRejected()` in `RequestEntry.php` currently sets status back to `awaiting_answer`. It needs a proper `rejected` status so the frontend can distinguish between "never submitted" and "rejected and awaiting revision".
   - Add `case Rejected = 'rejected'` to `app/Enums/RequestStatus.php` with label `'Rejected'`
   - Update `markAsRejected()` to set `RequestStatus::Rejected` instead of `RequestStatus::AwaitingAnswer`
   - Update `isTerminal()` — `Rejected` is NOT terminal (supplier must be able to resubmit)
   - Update the supplier `respond`/`submit` validation: allow submission when status is `rejected` (same as `awaiting_answer`)
   - The `rejectEntry` controller already returns `new RequestEntryResource($entry->fresh())` — frontend will pick up the new status automatically

2. **File download endpoint for request entry responses**
   Files uploaded by suppliers are stored via `Storage::putFile(...)` (default disk = local). They are not publicly accessible and need a download route.
   - Route (inside `role:admin|company-user|supplier` group): `GET /request-entries/{entry}/responses/{fieldId}/file`
   - Controller method in `RequestController`:
     ```php
     public function downloadEntryFile(RequestEntry $entry, int $fieldId): mixed
     {
         $this->authorizeEntryAccess($entry);
         $response = $entry->responses()->where('field_id', $fieldId)->first();
         if (!$response || !$response->file_path) {
             return ApiResponse::error('File not found.', 404);
         }
         return Storage::download($response->file_path, $response->file_name);
     }
     ```
   - Frontend uses: `${apiBase}/request-entries/${entryId}/responses/${field.id}/file`

3. **Supplier needs access to field template files**
   Suppliers can't see the "download & reattach" file for `template_file` fields because:
   - `GET /forms/{id}` is behind `role:admin|company-user` — supplier hits the fallback which sets `template_file_name: null`
   - `GET /fields/{id}/template` (download route) is also behind `role:admin|company-user`

   Two fixes needed:
   - Include `template_file_name` and `template_file_url` in the fields returned by `GET /supplier/request/{request}` (`ShowSupplierRequestAction`)
   - Make the field template download route accessible to suppliers — either move it outside the role middleware or add a supplier-specific route: `GET /fields/{field}/template`

4. **Reset completed request entries when a form or field is edited**
   When a form or any of its fields is updated, all related `RequestEntry` records with status `completed` should reset to `awaiting_answer` so the supplier re-fills with the updated data. `cancelled` entries must not be touched.
   - Hook into `UpdateFormAction` (and any field update action) after the update is persisted
   - Query:
     ```php
     RequestEntry::where('form_id', $form->id)
         ->where('status', RequestStatus::Completed)
         ->update(['status' => RequestStatus::AwaitingAnswer, 'approved_at' => null]);
     ```
   - Only trigger when fields actually changed (added/removed/reordered) to avoid unnecessary resets

4. **Global search endpoint (`/searchmaster`)**
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
