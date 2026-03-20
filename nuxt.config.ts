export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
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
          href: 'https://fonts.googleapis.com/icon?family=Material+Icons+Round',
        },
      ],
    },
  },

  runtimeConfig: {
    apiBaseUrl: process.env.NUXT_API_SECRET_URL,
    public: {
      frontendUrl: process.env.NUXT_PUBLIC_FRONTEND_URL,
    },
  },
})
