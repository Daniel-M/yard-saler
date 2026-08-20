import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
  // Use vite-tsconfig-paths to automatically resolve paths from tsconfig.json
  plugins: [
    react(),
    tailwindcss(),
    tsconfigPaths(), // reads your tsconfig.json "compilerOptions.paths"
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "apple-touch-icon.png", "masked-icon.svg"],
      manifest: {
        name: "PWA Application",
        short_name: "PWAApp",
        description:
          "High-performance responsive PWA built with Vite and Tailwind",
        theme_color: "#0f172a",
        background_color: "#ffffff",
        display: "standalone",
        icons: [
          { src: "/pwa-192x192.png", sizes: "192x192", type: "image/png" },
          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
    }),
  ],

  // Optional: build optimizations
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"],
        },
      },
    },
  },

  test: {
    globals: true, // enables global `describe`, `it`, etc.
    environment: "jsdom",
    setupFiles: "./src/setupTests.ts",
  },
});
