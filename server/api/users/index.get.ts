export default defineEventHandler(async (event): Promise<unknown> => {
    // Access runtime config to get the backend base URL and frontend URL
    const config = useRuntimeConfig()

    // Forward the browser's cookies (laravel_session, XSRF-TOKEN) to the backend
    const cookie = getRequestHeader(event, 'cookie') ?? ''

    // Read any query params from the request (e.g. ?page=2 for pagination)
    const query = getQuery(event)

    // Build the query string if params exist, otherwise empty string
    const qs = Object.keys(query).length
        ? '?' + new URLSearchParams(
            Object.fromEntries(
                Object.entries(query).map(([k, v]) => [k, String(v)]),
            ),
        ).toString()
        : ''

    // Proxy the request to the backend, forwarding cookies and origin
    return $fetch(`${config.apiBaseUrl}/api/users${qs}`, {
        headers: {
            'Accept': 'application/json',
            'Cookie': cookie,
            // Origin tells Laravel Sanctum this request comes from a trusted domain
            'Origin': config.public.frontendUrl,
        },
    })
})
