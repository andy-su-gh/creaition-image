import { defineConfig } from 'vite';
import envCompatible from 'vite-plugin-env-compatible';

export default defineConfig({
  plugins: [
    envCompatible({
      // This plugin automatically converts import.meta.env to process.env
      viteEnvDir: './',
      prefix: 'VITE_',
      mountedPath: 'process.env'
    })
  ],
  server: {
    port: 5173,
    open: true,
    proxy: {
      // Proxy for Hugging Face API
      '/api/huggingface/models': {
        target: 'https://api-inference.huggingface.co/models',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/huggingface\/models/, '')
      },
      // Proxy for Tencent Hunyuan API
      '/api/tencentcloud': {
        target: 'https://aiart.tencentcloudapi.com/',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/tencentcloud/, '')
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false
  }
});
