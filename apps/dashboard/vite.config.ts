import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { appsConfig, apiProxyConfig } from "../../apps.config"

// https://vite.dev/config/
export default defineConfig({
  envDir: path.resolve(__dirname, "../.."),
  plugins: [react(), tailwindcss()],
  server: {
    port: appsConfig.dashboard.devPort,
    strictPort: appsConfig.dashboard.strictPort,
    proxy: {
      ...apiProxyConfig,
    },
  },
  preview: {
    port: appsConfig.dashboard.previewPort,
    strictPort: appsConfig.dashboard.strictPort,
    proxy: {
      ...apiProxyConfig,
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@workspace/components": path.resolve(
        __dirname,
        "../../packages/components/src"
      ),
    },
  },
})
