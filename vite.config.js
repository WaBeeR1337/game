import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // './' — чтобы сборка работала и на GitHub Pages, и при открытии из папки
  base: './',
});
