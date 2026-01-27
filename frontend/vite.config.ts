import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'exclude-node-modules-css',
      enforce: 'pre',
      transform(_code, id) {
        // Bỏ qua các file CSS từ node_modules khỏi PostCSS processing
        if (id.includes('node_modules') && id.endsWith('.css')) {
          return null;
        }
      },
    },
  ],
  resolve: {
    alias: {},
  },
  css: {
    postcss: './postcss.config.js',
  },
  optimizeDeps: {
    include: ['antd', '@ant-design/icons'],
  },
})
