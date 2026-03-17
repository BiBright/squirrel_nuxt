# Upgrades To Do

## Performance

1. **`useApi()` recreated on every action call**
   In `requests/index.vue`, `useApi()` is called inside `onAssign` and `onRemove` on every click. It should be called once at the top of setup and reused.

2. **`onMounted` instead of `useAsyncData`**
   All pages fetch data in `onMounted`, bypassing SSR. Nuxt's `useAsyncData` would fetch on the server and hydrate on the client. Requires extra setup for Sanctum session cookie forwarding.

3. **Deep reactivity on large arrays**
   `ref<T[]>([])` uses deep reactivity — Vue tracks every nested property. For lists, `shallowRef` is more performant since you only replace the array reference, not mutate individual items.



## Backend

1. **Update password logic**
   Implement a proper password update flow: current password verification, new password confirmation, and appropriate validation rules.

2. **Assign a user to one or many requests**
   Add the ability to assign one or more users to a request. This likely requires a pivot table (`request_user`) and the corresponding API endpoints (assign/unassign).

3. **Role-based request access for `company-user`**
   `company-user` should only have access to requests explicitly assigned to them.
