import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  publicDir: 'public',
  server: {
    port: 3002,
    proxy: {
      '/socket.io': {
        target: 'http://127.0.0.1:3001',
        ws: true,
      },
      '/api': {
        target: 'http://127.0.0.1:3001',
      },
    },
  },
  build: {
    outDir: 'dist',
  },
});
