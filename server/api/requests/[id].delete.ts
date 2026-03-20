export default defineEventHandler(async (event): Promise<unknown> => {
    const config = useRuntimeConfig()
    const id = getRouterParam(event, 'id')
    return $fetch(`${config.apiBaseUrl}/api/requests/${id}`, {
        method: 'DELETE',
        headers: {
            'Accept': 'application/json',
            'Cookie': getRequestHeader(event, 'cookie') ?? '',
            'X-XSRF-TOKEN': decodeURIComponent(getCookie(event, 'XSRF-TOKEN') ?? '')
        }
    })
})