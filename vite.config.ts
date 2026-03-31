import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { ViteImageOptimizer } from 'vite-plugin-image-optimizer';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    ViteImageOptimizer({
      test: /\.(jpe?g|png|gif|tiff|webp|svg|avif)$/i,
      exclude: undefined,
      include: undefined,
      includePublic: true,
      logStats: true,
      svg: {
        multipass: true,
        plugins: [
          {
            name: 'preset-default',
            params: {
              overrides: {
                cleanupNumericValues: false,
                removeViewBox: false,
              },
            },
          },
          'sortAttrs',
          {
            name: 'addAttributesToSVGElement',
            params: {
              attributes: [{ xmlns: 'http://www.w3.org/2000/svg' }],
            },
          },
        ],
      },
      png: { quality: 80 },
      jpeg: { quality: 80 },
      jpg: { quality: 80 },
      webp: { quality: 80 },
      avif: { quality: 70 },
    }),
  ].filter(Boolean),
  resolve: {
    dedupe: ['react', 'react-dom', 'react-router-dom'],
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "firebase/firestore": path.resolve(__dirname, "./src/lib/firebase-mock.ts"),
      "firebase/auth": path.resolve(__dirname, "./src/lib/firebase-mock.ts"),
      "firebase/storage": path.resolve(__dirname, "./src/lib/firebase-mock.ts"),
      "firebase": path.resolve(__dirname, "./src/lib/firebase-mock.ts"),
    },
  },
  build: {
    target: 'esnext',
    minify: 'esbuild', // Faster and built-in
    cssMinify: true,
    cssCodeSplit: true,
    modulePreload: {
      polyfill: true,
    },
    rollupOptions: {
      output: {
        // Removed flawed manualChunks to allow Vite to chunk node_modules safely
      },
    },
    chunkSizeWarningLimit: 800,
    reportCompressedSize: false, // Speed up build
  },
  esbuild: {
    drop: mode === 'production' ? ['console', 'debugger'] : [],
  },
}));
