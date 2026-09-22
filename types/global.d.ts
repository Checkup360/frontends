
declare global {
  interface Window {
    __CONFIG__?: {
      apiOrigin?: string
      apiBaseUrl?: string
      webOrigin?: string
      dashboardOrigin?: string
      backofficeOrigin?: string
      cmsOrigin?: string
    }
  }
}

export {}
