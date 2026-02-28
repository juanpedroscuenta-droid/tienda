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
      webp: { lossy: true, quality: 80 },
      avif: { lossy: true, quality: 70 },
    }),
  ].filter(Boolean),
  resolve: {
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
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            if (id.includes('react')) return 'vendor-react';
            if (id.includes('firebase')) return 'vendor-firebase';
            if (id.includes('supabase')) return 'vendor-supabase';
            if (id.includes('lucide-react')) return 'vendor-icons';
            if (id.includes('framer-motion')) return 'vendor-animation';
            if (id.includes('@radix-ui')) return 'vendor-ui-radix';
            if (id.includes('recharts')) return 'vendor-charts';
            return 'vendor';
          }
        },
      },
    },
    chunkSizeWarningLimit: 800,
    reportCompressedSize: false, // Speed up build
  },
  esbuild: {
    drop: mode === 'production' ? ['console', 'debugger'] : [],
  },
}));
