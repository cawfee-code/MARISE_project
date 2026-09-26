import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const target = env.API_PROXY_TARGET || 'http://127.0.0.1:8000';
  const proxy = { '/api': { target, changeOrigin: true, timeout: 310000, proxyTimeout: 310000 }, '/openapi.json': { target, changeOrigin: true } };
  return { plugins: [react()], server: { proxy }, preview: { proxy } };
});
