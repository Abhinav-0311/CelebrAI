import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'api-gemini-dev-server',
      configureServer(server) {
        server.middlewares.use('/api/gemini', async (req, res) => {
          try {
            const { default: handler } = await server.ssrLoadModule('./api/gemini.ts');
            let rawBody = '';
            req.on('data', (chunk) => {
              rawBody += chunk;
            });
            req.on('end', async () => {
              try {
                (req as any).body = rawBody ? JSON.parse(rawBody) : {};
              } catch {
                (req as any).body = {};
              }
              // Standard response json helper if not present
              if (!res.status) {
                (res as any).status = function (code: number) {
                  this.statusCode = code;
                  return this;
                };
              }
              if (!res.json) {
                (res as any).json = function (data: any) {
                  this.setHeader('Content-Type', 'application/json');
                  this.end(JSON.stringify(data));
                  return this;
                };
              }
              await handler(req, res);
            });
          } catch (err: any) {
            console.error('Local dev /api/gemini error:', err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err?.message || 'Local serverless error' }));
          }
        });
      },
    },
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    open: false,
  },
  build: {
    target: 'esnext',
    sourcemap: false,
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          utils: ['zod', 'zustand', 'clsx', 'tailwind-merge', 'lucide-react'],
        },
      },
    },
  },
});
