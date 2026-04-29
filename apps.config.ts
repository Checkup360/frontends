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
