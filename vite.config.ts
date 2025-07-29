// --- START OF FILE vite.config.ts (النسخة النهائية والمبسطة) ---

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      
      // تأكد من أن هذا الجزء يطابق هذا تماماً
      manifest: {
        name: 'نظام إدارة الرواتب الذكي',
        short_name: 'إدارة الرواتب',
        description: 'تطبيق لإدارة رواتب وحضور الموظفين بكفاءة.',
        theme_color: '#1f2937',
        background_color: '#ffffff',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png', // <-- تأكد من عدم وجود '/' في البداية
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png', // <-- تأكد من عدم وجود '/' في البداية
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },

      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}']
      }
    })
  ],
})