import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/dog-nutrition-pwa/',   // <-- 這行很重要
  plugins: [react()],
})
