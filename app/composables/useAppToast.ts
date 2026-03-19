import { resolveHint } from '~/utils/httpErrors'

/**
 * Toast types:
 *   'success' — operation completed (green)
 *   'error'   — operation failed (red)
 *
 * Categories (used for deduplication — only one toast per category at a time):
 *   'profile' | 'password' | 'notifications' | 'request'
 *   'supplier' | 'user' | 'form' | 'field' | 'general'
 *
 * Usage:
 *   toast.success('User created', { category: 'user' })
 *   toast.error(err, "Couldn't create user", { category: 'user' })
 */

export type ToastType = 'success' | 'error'

export type ToastCategory =
  | 'profile'
  | 'password'
  | 'notifications'
  | 'request'
  | 'supplier'
  | 'user'
  | 'form'
  | 'field'
  | 'general'

export interface ToastItem {
  id: number
  type: ToastType
  category: ToastCategory
  title: string
  message: string
  duration: number
}

// ── Internal helpers ──────────────────────────────────────────────────────

interface NormalizedError {
  status: number
  data?: Record<string, unknown>
}

// Handles both real network failures (TypeError — no response) and HTTP errors
// (FetchError from ofetch with statusCode + data).
function normalizeError(err: unknown): NormalizedError {
  if (err instanceof TypeError) return { status: 0 }
  const e = err as { statusCode?: number; status?: number; data?: Record<string, unknown> }
  return {
    status: e.statusCode ?? e.status ?? 0,
    data: e.data,
  }
}

// Message resolution rules:
//   422 → backend message (field-level errors from Laravel preferred over message string)
//   5xx → always use the map (backend message may contain internal details)
//   everything else → map hint
function resolveMessage(status: number, data?: Record<string, unknown>): string {
  if (status === 422) {
    const errors = data?.errors as Record<string, string[]> | undefined
    if (errors) {
      const first = Object.values(errors)[0]?.[0]
      if (first) return first
    }
    if (typeof data?.message === 'string' && data.message) return data.message
  }

  return resolveHint(status)
}

// Longer messages need more time to read.
// Formula: 3 s base + 50 ms per character, capped at 7 s.
function calcDuration(title: string, message: string): number {
  return Math.min(3000 + (title.length + message.length) * 50, 7000)
}

let _nextId = 0

// ── Composable ────────────────────────────────────────────────────────────
export function useAppToast() {
  // useState is keyed globally — every call shares the exact same reactive array.
  const toasts = useState<ToastItem[]>('app:toasts', () => [])

  function _push(item: Omit<ToastItem, 'id'>) {
    const id = ++_nextId
    toasts.value.push({ ...item, id })
    setTimeout(() => remove(id), item.duration)
  }

  // Replace any existing toast of the same category instead of stacking.
  function _dedupe(category: ToastCategory) {
    const existing = toasts.value.find(t => t.category === category)
    if (existing) remove(existing.id)
  }

  function success(title: string, options?: { message?: string; category?: ToastCategory }) {
    const category = options?.category ?? 'general'
    const message = options?.message ?? ''
    _dedupe(category)
    _push({ type: 'success', category, title, message, duration: calcDuration(title, message) })
  }

  function error(err: unknown, title: string, options?: { category?: ToastCategory }) {
    const { status, data } = normalizeError(err)

    if (status === 401) return

    const category = options?.category ?? 'general'
    const message = resolveMessage(status, data)
    _dedupe(category)
    _push({ type: 'error', category, title, message, duration: calcDuration(title, message) })
  }

  function remove(id: number) {
    const idx = toasts.value.findIndex(t => t.id === id)
    if (idx !== -1) toasts.value.splice(idx, 1)
  }

  return { toasts, success, error, remove }
}
