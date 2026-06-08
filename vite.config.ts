import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      proxy: {
        '/api': {
          target: 'http://localhost:5000',
          changeOrigin: true,
        },
        '/dashscope': {
          target: 'https://dashscope.aliyuncs.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/dashscope/, ''),
          secure: true,
        },
      },
    },
    optimizeDeps: {
      exclude: ['onnxruntime-web'],
    },
    worker: {
      format: 'es',
      optimizeDeps: {
        exclude: ['onnxruntime-web'],
      },
    },
  };
});