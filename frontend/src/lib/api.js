const defaultLocalApiUrl = 'http://localhost:3000'
const defaultProductionApiUrl = 'https://my-dj-website.onrender.com'

export const apiBaseUrl = (() => {
  const configuredUrl = import.meta.env.VITE_API_URL

  if (configuredUrl && configuredUrl.trim()) {
    return configuredUrl.trim().replace(/\/$/, '')
  }

  if (import.meta.env.DEV) {
    return defaultLocalApiUrl
  }

  return defaultProductionApiUrl
})()

export function apiUrl(path) {
  return `${apiBaseUrl}${path}`
}
