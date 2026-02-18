import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // ลบส่วน define: { 'process.env': process.env } ออกไปเลยครับ
})
