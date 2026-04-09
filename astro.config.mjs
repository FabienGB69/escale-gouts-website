// @ts-check
import { defineConfig } from 'astro/config'
import tailwindcss from '@tailwindcss/vite'
import mdx from '@astrojs/mdx'
import sitemap from '@astrojs/sitemap'
import vercel from '@astrojs/vercel'

export default defineConfig({
  site: 'https://www.escaleetgouts.fr',
  output: 'static', // statique par défaut, /api/contact utilise prerender:false pour SSR
  adapter: vercel({
    webAnalytics: { enabled: true }
  }),
  integrations: [
    mdx(),
    sitemap(),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
})