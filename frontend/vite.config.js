import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// During `npm run dev`, requests to /api are proxied to the backend on :5000
// so you don't hit CORS while developing. In production, Nginx does this instead.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});
