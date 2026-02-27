import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,       // Same as CRA
    strictPort: true  // Prevents changing to another port
  }
})