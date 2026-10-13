export type AppName = "web" | "dashboard" | "backoffice"

type AppRuntimeConfig = {
  devPort: number
  previewPort: number
  strictPort: boolean
}

export const appsConfig: Record<AppName, AppRuntimeConfig> = {
  web: {
    devPort: 5173,
    previewPort: 4173,
    strictPort: true,
  },
  dashboard: {
    devPort: 5174,
    previewPort: 4174,
    strictPort: true,
  },
  backoffice: {
    devPort: 5175,
    previewPort: 4175,
    strictPort: true,
  },
}

const API_DEV_PORT = 8000
const CMS_DEV_PORT = 3000

export const apiProxyConfig = {
  "/api": {
    target: `http://localhost:${API_DEV_PORT}`,
    changeOrigin: true,
    rewrite: (path: string) => path.replace(/^\/api/, ""),
    headers: {
      "X-Forwarded-Prefix": "/api",
    },
  },
  "/media": {
    target: `http://localhost:${API_DEV_PORT}`,
    changeOrigin: true,
  },
}

export const publicDevDefaults = {
  apiOrigin: `http://localhost:${API_DEV_PORT}`,
  apiBaseUrl: "/api",
  webOrigin: `http://localhost:${appsConfig.web.devPort}`,
  dashboardOrigin: `http://localhost:${appsConfig.dashboard.devPort}`,
  backofficeOrigin: `http://localhost:${appsConfig.backoffice.devPort}`,
  cmsOrigin: `http://localhost:${CMS_DEV_PORT}`,
} as const
