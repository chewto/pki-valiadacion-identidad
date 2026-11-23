import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import mkcert from 'vite-plugin-mkcert';

import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  base:'./',
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
  plugins: [
    react(),
    mkcert(),
    {
      name: 'configure-wasm-headers',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url) {
            if (req.url.endsWith('.mjs')) {
              res.setHeader('Content-Type', 'application/javascript');
            } else if (req.url.endsWith('.wasm')) {
              res.setHeader('Content-Type', 'application/wasm');
            }
          }
          next();
        });
      },
      configurePreviewServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url) {
            if (req.url.endsWith('.mjs')) {
              res.setHeader('Content-Type', 'application/javascript');
            } else if (req.url.endsWith('.wasm')) {
              res.setHeader('Content-Type', 'application/wasm');
            }
          }
          next();
        });
      }
    }
  ],
  worker: {
    format: 'es'
  },
  optimizeDeps: {
    exclude: ['onnxruntime-web']
  },
  server: {
    https: false,
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp'
    }
  },
  build: {
    chunkSizeWarningLimit: 1600, // Adjust as needed
  }
})
