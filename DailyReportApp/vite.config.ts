import { defineConfig } from 'vite';

export default defineConfig({
  root: './src',
  server: {
    port: 3000,
    host: true
  },
  build: {
    outDir: '../dist',
    minify: false,
    emptyOutDir: true,
  },
});
