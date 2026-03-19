/**
 * HTTP error hint map.
 *
 * Keys are exact status codes (string) or range fallbacks ('2xx', '3xx', …).
 * Exact codes take priority. 401 is intentionally absent — useApi redirects
 * to /login on 401, so no toast should appear.
 *
 * These hints are shown to the user only when the backend does NOT send a
 * usable message (see resolveMessage in useToast).
 */
export const HTTP_ERRORS: Record<string, string> = {
  // Network failure — no response received
  '0':   'Could not connect to the server. Check your connection.',

  // 3xx
  '3xx': 'The request was redirected unexpectedly.',

  // 4xx range fallback
  '4xx': 'The request could not be processed.',
  '400': 'The request contained invalid data.',
  '403': "You don't have permission to perform this action.",
  '404': 'The resource could not be found.',
  '409': 'This conflicts with existing data.',
  '422': 'Please check your input and try again.',
  '429': "You're sending requests too fast. Please slow down.",

  // 5xx — never use backend messages here, they may contain internals
  '5xx': 'Try again later.',
  '500': 'Something went wrong on the server. Try again later.',
  '502': 'The server received an invalid response. Try again later.',
  '503': 'The service is temporarily unavailable. Try again shortly.',
  '504': 'The server did not respond in time. Try again later.',
}

export function resolveHint(status: number): string {
  return (
    HTTP_ERRORS[String(status)]
    ?? HTTP_ERRORS[`${String(status)[0]}xx`]
    ?? 'An unexpected error occurred.'
  )
}
