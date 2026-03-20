export default defineEventHandler(async (event): Promise<unknown> => {
    const config = useRuntimeConfig()
    return $fetch(`${config.apiBaseUrl}/api/requests`, {
        headers: {
            'Cookie': getRequestHeader(event, 'cookie') ?? '',
            'Origin': config.public.frontendUrl,
        }
    })
})