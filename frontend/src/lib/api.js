const defaultLocalApiUrl = 'http://localhost:3000'

export const apiBaseUrl = (() => {
  const configuredUrl = import.meta.env.VITE_API_URL

  if (configuredUrl && configuredUrl.trim()) {
    return configuredUrl.trim().replace(/\/$/, '')
  }

  if (import.meta.env.DEV) {
    return defaultLocalApiUrl
  }

  return ''
})()

export function apiUrl(path) {
  return `${apiBaseUrl}${path}`
}
