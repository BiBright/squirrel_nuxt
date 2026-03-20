export default defineEventHandler(async (event): Promise<unknown> => {
    const config = useRuntimeConfig()
    const id = getRouterParam(event, 'id')
    const body = await readBody(event)
    return $fetch(`${config.apiBaseUrl}/api/requests/${id}/assign`, {
        method: 'PATCH',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Cookie': getRequestHeader(event, 'cookie') ?? '',
            'X-XSRF-TOKEN': decodeURIComponent(getCookie(event, 'XSRF-TOKEN') ?? '')
        },
        body,
    })
})