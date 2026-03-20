export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()

  const response = await $fetch.raw(`${config.apiBaseUrl}/sanctum/csrf-cookie`, {
    headers: {
      'Cookie': getRequestHeader(event, 'cookie') ?? '',
    },
  })

  const setCookies = response.headers.getSetCookie()
  setCookies.forEach(cookie => appendResponseHeader(event, 'Set-Cookie', cookie))

  return { ok: true }
})
