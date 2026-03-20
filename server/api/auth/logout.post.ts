export default defineEventHandler(async (event): Promise<unknown> => {
  const config = useRuntimeConfig()
  const xsrfToken = getCookie(event, 'XSRF-TOKEN')

  try {
    const response = await $fetch.raw(`${config.apiBaseUrl}/api/auth/logout`, {
      method: 'POST',
      headers: {
        'Cookie': getRequestHeader(event, 'cookie') ?? '',
        'X-XSRF-TOKEN': decodeURIComponent(xsrfToken ?? ''),
        'Origin': config.public.frontendUrl ?? '',
        'Referer': getRequestHeader(event, 'referer') ?? '',
      },
    })

    const setCookies = response.headers.getSetCookie()
    setCookies.forEach(cookie => appendResponseHeader(event, 'Set-Cookie', cookie))

    return response._data
  }
  catch (error: unknown) {
    const e = error as { statusCode?: number; statusMessage?: string; data?: unknown }
    throw createError({
      statusCode: e?.statusCode ?? 500,
      statusMessage: e?.statusMessage ?? 'Internal Server Error',
      data: e?.data,
    })
  }
})
