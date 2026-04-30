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

/** Local API origin; production uses `VITE_PUBLIC_API_ORIGIN` in `frontends/.env`. */
const API_DEV_PORT = 8000

/** Defaults aligned with this file and backend `PUBLIC_WEB_ORIGIN` localhost behavior. */
export const publicDevDefaults = {
  apiOrigin: `http://localhost:${API_DEV_PORT}`,
  webOrigin: `http://localhost:${appsConfig.web.devPort}`,
} as const
