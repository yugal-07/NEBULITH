import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://127.0.0.1:8000',
      '/health': 'http://127.0.0.1:8000',
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('/node_modules/three-stdlib/')) return 'three-extensions'
          if (id.includes('/node_modules/three/')) return 'three-core'
          if (id.includes('/node_modules/@react-three/drei/')) return 'r3f-drei'
          if (id.includes('/node_modules/@react-three/fiber/')) return 'r3f-core'
        },
      },
    },
  },
})
