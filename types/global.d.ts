
declare global {
  interface Window {
    __CONFIG__?: {
      apiOrigin?: string
      webOrigin?: string
      dashboardOrigin?: string
      backofficeOrigin?: string
      cmsOrigin?: string
    }
  }
}

export {}
