import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  resolve: {
    extensions: ['.ts', '.js'],
  },
  esbuild: {
    include: ['**/*.ts'],
  },
  plugins: [tailwindcss()],
  build: {
    sourcemap: true,
  },
});
