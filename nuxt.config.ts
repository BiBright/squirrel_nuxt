export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  ssr: false,
devtools: { enabled: true },

  modules: [
    '@pinia/nuxt',
    '@vueuse/nuxt',
    '@nuxt/eslint',
  ],

  components: [
    { path: '~/components', pathPrefix: false },
  ],

  css: ['~/assets/scss/main.scss'],

  app: {
    head: {
      link: [
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/icon?family=Material+Icons+Round|Material+Icons+Outlined',
        },
      ],
    },
  },

  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE,
      apiOrigin: process.env.NUXT_PUBLIC_API_ORIGIN,
    },
  },
})
