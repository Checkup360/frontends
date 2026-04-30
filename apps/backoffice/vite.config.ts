import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { appsConfig } from "../../apps.config"

// https://vite.dev/config/
export default defineConfig({
  envDir: path.resolve(__dirname, "../.."),
  plugins: [react(), tailwindcss()],
  server: {
    port: appsConfig.backoffice.devPort,
    strictPort: appsConfig.backoffice.strictPort,
  },
  preview: {
    port: appsConfig.backoffice.previewPort,
    strictPort: appsConfig.backoffice.strictPort,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
