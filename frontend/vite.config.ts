import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // 5175: el backend usa el 3000 y otros proyectos de esta máquina usan 5173 y 5174
    port: 5175,
    // Si el puerto está ocupado, falla en vez de saltar a otro sin avisar
    strictPort: true,
    proxy: {
      // En desarrollo el navegador pide /api/... al mismo origen (5175) y Vite lo
      // reenvía al backend: no hay CORS de por medio y las cookies httpOnly de
      // sesión viajan igual que en producción, donde ambos comparten dominio.
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: false,
      },
    },
  },
})
