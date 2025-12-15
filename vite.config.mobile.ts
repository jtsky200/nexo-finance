import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    react({
      jsxRuntime: 'automatic',
      jsxImportSource: 'react',
    }), 
    tailwindcss()
  ],
  resolve: {
    dedupe: ['react', 'react-dom'], // Ensure single React instance
    alias: {
      "@": path.resolve(import.meta.dirname, "client-mobile", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  envDir: path.resolve(import.meta.dirname),
  root: path.resolve(import.meta.dirname, "client-mobile"),
  publicDir: path.resolve(import.meta.dirname, "client-mobile", "public"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist-mobile/public"),
    emptyOutDir: true,
    minify: 'esbuild',
    chunkSizeWarningLimit: 1000,
    assetsDir: "", // Put assets in root to avoid Firebase rewrite rule issues
    rollupOptions: {
      external: ['react', 'react-dom', 'react-dom/client'], // Externalize React to use CDN via import maps
      output: {
        format: 'es', // Ensure ES modules
        manualChunks: (id) => {
          // Don't bundle React - it will come from CDN
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('node_modules/scheduler')) {
            return undefined; // External, don't bundle
          }
          // Other vendor chunks
          if (id.includes('node_modules')) {
            // Firebase
            if (id.includes('firebase/')) {
              return 'vendor-firebase';
            }
            // Charts (large library)
            if (id.includes('recharts')) {
              return 'vendor-charts';
            }
            // Radix UI components
            if (id.includes('@radix-ui/')) {
              return 'vendor-ui';
            }
            // Router
            if (id.includes('wouter')) {
              return 'vendor-router';
            }
            // i18n
            if (id.includes('i18next') || id.includes('react-i18next')) {
              return 'vendor-i18n';
            }
            // TRPC & React Query
            if (id.includes('@trpc/') || id.includes('@tanstack/react-query')) {
              return 'vendor-api';
            }
            // Toast notifications
            if (id.includes('sonner')) {
              return 'vendor-toast';
            }
            // Date utilities
            if (id.includes('date-fns')) {
              return 'vendor-dates';
            }
            // Other utilities
            if (id.includes('clsx') || id.includes('tailwind-merge') || id.includes('zod')) {
              return 'vendor-utils';
            }
            // Everything else from node_modules
            return 'vendor-misc';
          }
          // Split large page components for code splitting
          if (id.includes('/pages/')) {
            const pageName = id.split('/pages/')[1]?.split('.')[0];
            if (pageName && ['Shopping', 'AIChat', 'Calendar'].includes(pageName)) {
              return `page-${pageName.toLowerCase()}`;
            }
          }
        },
      },
    },
  },
  server: {
    host: true,
    port: 5174,
    allowedHosts: [
      ".manuspre.computer",
      ".manus.computer",
      ".manus-asia.computer",
      ".manuscomputer.ai",
      ".manusvm.computer",
      "localhost",
      "127.0.0.1",
    ],
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});

