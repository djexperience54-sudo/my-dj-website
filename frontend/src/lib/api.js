export const apiBaseUrl = import.meta.env.VITE_API_URL || ''

export function apiUrl(path) {
  return `${apiBaseUrl}${path}`
}
