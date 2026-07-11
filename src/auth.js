const TOKEN_KEY = 'splitzy_token'
const TEMP_TOKEN_KEY = 'splitzy_temp_token'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
}

export function isLoggedIn() {
  return !!getToken()
}

export function getTempToken() {
  return sessionStorage.getItem(TEMP_TOKEN_KEY)
}

export function setTempToken(token) {
  sessionStorage.setItem(TEMP_TOKEN_KEY, token)
}

export function clearTempToken() {
  sessionStorage.removeItem(TEMP_TOKEN_KEY)
}

// Helper for calling protected API routes with the Authorization header attached
export function authHeaders() {
  return { Authorization: `Bearer ${getToken()}` }
}
