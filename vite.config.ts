import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

// `npm run build:fichier-unique` produit un seul fichier HTML autonome (partage, hébergement statique simple).
export default defineConfig(({ mode }) => ({
  base: './',
  plugins: [react(), ...(mode === 'fichier-unique' ? [viteSingleFile()] : [])],
  build: { outDir: mode === 'fichier-unique' ? 'dist-fichier-unique' : 'dist' },
}));
