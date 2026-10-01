import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

// `npm run build:fichier-unique` produit un seul fichier HTML autonome (partage, hébergement statique simple).
export default defineConfig(({ mode }) => ({
  base: './',
  plugins: [react(), ...(mode === 'fichier-unique' ? [viteSingleFile()] : [])],
  // Fichier unique non minifié : les messages d'erreur gardent les vrais noms de fonctions.
  build: { outDir: mode === 'fichier-unique' ? 'dist-fichier-unique' : 'dist', minify: mode !== 'fichier-unique' },
}));
