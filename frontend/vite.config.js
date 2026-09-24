import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

const apiProxy = {
  '/api': {
    target: 'http://localhost:5000',
    changeOrigin: true,
  }
};

/**
 * Copia o index.html para 404.html: no GitHub Pages isso permite abrir
 * diretamente rotas como /noticias ou /app (SPA).
 */
const spaFallback = () => ({
  name: 'spa-fallback-404',
  apply: 'build',
  closeBundle() {
    const outDir = path.resolve(__dirname, 'dist');
    const index = path.join(outDir, 'index.html');
    if (fs.existsSync(index)) {
      fs.copyFileSync(index, path.join(outDir, '404.html'));
    }
  }
});

export default defineConfig({
  // Subpasta de publicação (ex: /bitcoin-analysis-site/ no GitHub Pages)
  base: process.env.VITE_BASE_PATH || '/',
  plugins: [react(), spaFallback()],
  server: {
    port: 3000,
    proxy: apiProxy
  },
  preview: {
    port: 4173,
    proxy: apiProxy
  },
  build: {
    target: 'es2020',
    sourcemap: false,
    rollupOptions: {
      output: {
        // Bibliotecas em arquivos separados: ficam em cache entre deploys
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (/node_modules\/(chart\.js|react-chartjs-2|@kurkle)\//.test(id)) return 'charts';
          if (/node_modules\/(react|react-dom|react-router|react-router-dom|scheduler|@remix-run)\//.test(id)) return 'react';
          return undefined;
        }
      }
    }
  }
});
