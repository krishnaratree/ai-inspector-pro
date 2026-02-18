import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// ไม่ต้อง import path หรือใช้ __dirname เพราะเป็นสาเหตุทำให้ Netlify build พัง
export default defineConfig({
  plugins: [react()],
  // ลบส่วน define: { 'process.env': ... } ออกให้หมด
  // Vite จะดึงค่าจาก VITE_GEMINI_API_KEY ใน Netlify มาให้เองโดยอัตโนมัติผ่าน import.meta.env
})
