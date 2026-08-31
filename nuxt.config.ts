export default defineNuxtConfig({
  ssr: true,
  app: {
    baseURL: '/tamii/'
  },
  nitro: {
    preset: 'github_pages'
  }
})
