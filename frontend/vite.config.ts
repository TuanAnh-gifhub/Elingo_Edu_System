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

        if (id.includes('node_modules') && id.endsWith('.css')) {
          return null;
        }
      },
    },
  ],
  define: {
    global: 'window',
  },
  resolve: {
    alias: {},
  },
  css: {
    postcss: './postcss.config.js',
  },
  optimizeDeps: {
    include: ['antd', '@ant-design/icons', 'sockjs-client', 'stompjs'],
  },
})
