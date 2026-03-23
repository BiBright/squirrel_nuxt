export default defineEventHandler(async (event): Promise<unknown> => {
    const config = useRuntimeConfig()
    const cookie = getRequestHeader(event, 'cookie') ?? ''
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
