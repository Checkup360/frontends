import { publicDevDefaults } from "../../../apps.config"

export { publicDevDefaults }

export function resolveUrl(configKey: string, defaultValue: string): string {
  if (
    typeof window !== "undefined" &&
    (window as any).__CONFIG__?.[configKey]
  ) {
    return ((window as any).__CONFIG__[configKey] as string).replace(/\/$/, "")
  }
  return defaultValue
}

export function resolveApiBaseUrl(): string {
  return resolveUrl("apiOrigin", publicDevDefaults.apiOrigin)
}

export function resolveMediaUrl(url: string | null | undefined): string | null {
  if (!url) return null
  if (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("data:") ||
    url.startsWith("blob:")
  ) {
    return url
  }
  const cleanPath = url.startsWith("/") ? url : `/${url}`
  return `${resolveApiBaseUrl()}${cleanPath}`
}
