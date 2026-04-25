import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const useVPS = !!env.VITE_API_URL;

  return {
    server: {
      host: "::",
      port: 8080,
    },
    plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
        // When VITE_API_URL is set (VPS build), swap Supabase client with VPS client
        ...(useVPS ? {
          "@/integrations/supabase/client": path.resolve(__dirname, "./src/lib/vpsClient.ts"),
        } : {}),
      },
      dedupe: ["react", "react-dom", "@tanstack/react-query"],
    },
    optimizeDeps: {
      include: ["react", "react-dom", "@tanstack/react-query"],
    },
    build: {
      // Split large vendor libraries into separate chunks for better caching & parallel download
      // IMPORTANT: Bundle React + all UI libs that depend on React together to avoid
      // "Cannot read properties of undefined (reading 'createContext')" errors caused by
      // chunks loading before React is initialized.
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            if (!id.includes("node_modules")) return;
            // Heavy isolated libs that are safe to split (loaded on demand by routes)
            if (id.includes("jspdf") || id.includes("html2canvas") || id.includes("xlsx")) {
              return "doc-vendor";
            }
            if (id.includes("recharts") || id.includes("d3-")) {
              return "chart-vendor";
            }
            // Everything else (React, Radix, Supabase, Tanstack, framer-motion, dnd-kit, etc.)
            // stays in a single vendor chunk so React loads before anything that uses it.
            return "vendor";
          },
        },
      },
      chunkSizeWarningLimit: 1500,
    },
  };
});
