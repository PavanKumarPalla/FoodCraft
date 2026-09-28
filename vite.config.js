import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Node.js Express Auth & User Database API
      '/api/auth': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      // FastAPI YOLOv8 Ingredient Detection
      '/api/detect-ingredients': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      // FastAPI SBERT + FAISS Recipe Recommendation & Health
      '/api/recommend-recipes': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/api/recipes': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
