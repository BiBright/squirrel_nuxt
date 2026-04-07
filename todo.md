# TODO

## useFormValidation composable

**File:** `app/composables/useFormValidation.ts`

**Purpose:** Generic required-field validation for any form on the platform. Blocks submit if required fields are empty and scrolls to the first error.

**Accepts:**
- `fields` — `Ref/ComputedRef<Field[]>` with `{ id, name, required, ... }`
- `answers` — `reactive Record<number, string>` (text/number/date values)
- `uploadedFiles` — `reactive Record<number, File>` (new file uploads)
- `getExistingFile` — `(fieldId) => string | null` (checks server-side existing file)
- `needsFile` — `(field) => boolean` (same logic already used in entry page)

**Returns:**
- `fieldErrors` — `reactive Record<number, string>` (error message per field id)
- `validate` — `() => boolean` (runs validation, returns true if clean)

**Validation logic:**
1. Clear previous errors
2. Loop required fields → check text answer OR uploaded/existing file
3. On error → `querySelector('[data-field-id="X"]')` on first error → `scrollIntoView({ behavior: 'smooth', block: 'center' })`
4. Return `false` if errors, `true` if all good

**Template changes needed (entry page + any future form):**
- Add `data-field-id="field.id"` to each field wrapper div
- Show error message below each field if `fieldErrors[field.id]` exists
- Call `validate()` in the submit handler and return early if false
