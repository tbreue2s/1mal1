import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { resolve } from 'path'

export default defineConfig({
  base: './',
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        v2: resolve(import.meta.dirname, 'v2/index.html')
      }
    }
  },
  plugins: [
    tailwindcss(),
    svelte(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'favicon.svg',
        'apple-touch-icon.png',
        'pwa-192x192.png',
        'pwa-512x512.png',
        'manifest-penguin.webmanifest',
        'manifest-otter.webmanifest',
        'manifest-owl.webmanifest',
        'manifest-rocket.webmanifest',
        'manifest-fox.webmanifest',
        'pwa/penguin-180.png',
        'pwa/penguin-192.png',
        'pwa/penguin-512.png',
        'pwa/otter-180.png',
        'pwa/otter-192.png',
        'pwa/otter-512.png',
        'pwa/owl-180.png',
        'pwa/owl-192.png',
        'pwa/owl-512.png',
        'pwa/rocket-180.png',
        'pwa/rocket-192.png',
        'pwa/rocket-512.png',
        'pwa/fox-180.png',
        'pwa/fox-192.png',
        'pwa/fox-512.png'
      ],
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}'],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true
      },
      manifest: false
    })
  ]
})

