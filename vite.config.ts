import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // ลบส่วน define เดิมทิ้งไปเลยครับ Vite จะจัดการ VITE_ ตัวแปรให้เองอัตโนมัติ
})
