import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    sourcemap: false, // Impide reconstruir tus archivos .vue y .ts en la pestaña Sources[cite: 10]
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remueve todos los console.log de la build final
        drop_debugger: true,
      },
      format: {
        comments: false, // Elimina los comentarios del código
      },
    },
  },
})
