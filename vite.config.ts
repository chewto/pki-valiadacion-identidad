import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import mkcert from 'vite-plugin-mkcert';

import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      '@layouts': path.resolve(__dirname, './src/layouts'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@components': path.resolve(__dirname, './src/components'),
      '@styles': path.resolve(__dirname, './src/styles'),
      '@nucleo': path.resolve(__dirname, './src/nucleo'),
      '@assets': path.resolve(__dirname, './src/assets')
    }
  },
  plugins: [react(), mkcert()],
  server: {
    https: false
  },
  build: {
    chunkSizeWarningLimit: 1600, // Adjust as needed
  }
})
