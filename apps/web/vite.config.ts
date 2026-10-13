import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { VitePWA } from "vite-plugin-pwa"
import { appsConfig, apiProxyConfig } from "../../apps.config"

// https://vite.dev/config/
export default defineConfig({
  envDir: path.resolve(__dirname, "../.."),
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icon.svg"],
      workbox: {
        navigateFallbackDenylist: [/^\/config\.js/, /^\/api\//, /^\/auth\//, /^\/media\//],
        globIgnores: ["**/config.js*"],
      },
      manifest: {
        name: "Checkup360 Web",
        short_name: "Checkup360",
        description: "Checkup360 frontend app",
        theme_color: "#ffffff",
        background_color: "#ffffff",
        display: "standalone",
        icons: [
          {
            src: "icon.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any maskable",
          },
        ],
      },
    }),
  ],
  server: {
    port: appsConfig.web.devPort,
    strictPort: appsConfig.web.strictPort,
    proxy: {
      ...apiProxyConfig,
    },
  },
  preview: {
    port: appsConfig.web.previewPort,
    strictPort: appsConfig.web.strictPort,
    proxy: {
      ...apiProxyConfig,
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@workspace/ui/styles": path.resolve(
        __dirname,
        "../../packages/ui/src/styles"
      ),
      "@workspace/ui": path.resolve(__dirname, "../../packages/ui/src"),
      "@workspace/auth": path.resolve(__dirname, "../../packages/auth/src"),
      "@workspace/components": path.resolve(
        __dirname,
        "../../packages/components/src"
      ),
    },
  },
})
