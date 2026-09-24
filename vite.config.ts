import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

const uploadDir = path.resolve(__dirname, 'public/uploads');

const sanitizeFileName = (name: string) =>
  name
    .replace(/[^\w.-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120) || 'upload';

const readRequestBody = (req: import('http').IncomingMessage) =>
  new Promise<string>((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', chunk => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'local-upload-api',
        configureServer(server) {
          server.middlewares.use('/api/upload', async (req, res) => {
            if (req.method !== 'POST') {
              res.statusCode = 405;
              res.end(JSON.stringify({ error: 'Method not allowed' }));
              return;
            }

            try {
              const body = JSON.parse(await readRequestBody(req)) as {
                fileName?: string;
                data?: string;
              };

              if (!body.fileName || !body.data) {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: 'Missing fileName or data' }));
                return;
              }

              fs.mkdirSync(uploadDir, { recursive: true });
              const ext = path.extname(body.fileName);
              const base = sanitizeFileName(path.basename(body.fileName, ext));
              const fileName = `${Date.now()}-${base}${ext}`;
              const filePath = path.join(uploadDir, fileName);

              fs.writeFileSync(filePath, Buffer.from(body.data, 'base64'));
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ url: `/uploads/${fileName}` }));
            } catch (error) {
              console.error('Upload failed:', error);
              res.statusCode = 500;
              res.end(JSON.stringify({ error: 'Upload failed' }));
            }
          });
        },
      },
    ],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      port: 5200,
      strictPort: true,
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
