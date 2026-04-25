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
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            if (!id.includes("node_modules")) return;
            if (id.includes("react-dom") || id.includes("react/") || id.includes("react-router")) {
              return "react-vendor";
            }
            if (id.includes("@radix-ui") || id.includes("lucide-react") || id.includes("cmdk")) {
              return "ui-vendor";
            }
            if (id.includes("@supabase") || id.includes("@tanstack")) {
              return "data-vendor";
            }
            if (id.includes("framer-motion")) {
              return "motion-vendor";
            }
            if (id.includes("recharts") || id.includes("d3-")) {
              return "chart-vendor";
            }
            if (id.includes("jspdf") || id.includes("html2canvas") || id.includes("xlsx")) {
              return "doc-vendor";
            }
            if (id.includes("@dnd-kit")) {
              return "dnd-vendor";
            }
            return "vendor";
          },
        },
      },
      chunkSizeWarningLimit: 1000,
    },
  };
});
