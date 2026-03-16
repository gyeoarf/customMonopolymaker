import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  base: '/customMonopolymaker/',
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist',
    target: 'esnext',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        board: resolve(__dirname, 'board.html')
      }
    }
  }
});
