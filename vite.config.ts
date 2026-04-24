import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [tailwindcss(), react()],
  base: './',
  server: {
    // 开发时请求同源 /api/v1 → 转发到本机 FastAPI，避免未配置环境变量时打到占位域名导致 Failed to fetch
    proxy: {
      '/api/v1': {
        target: 'https://crashcoursebackend-4a4z.onrender.com',
        // target: 'http://localhost:8000/',
        changeOrigin: true,
      },
    },
  },
})
