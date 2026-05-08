export const storage = {
  get: (key: string) => localStorage.getItem(key),
  set: (key: string, value: string) =>
    localStorage.setItem(key, value),
  remove: (key: string) => localStorage.removeItem(key),
}

export const AUTH_STORAGE_KEYS = {
  accessToken: "accessToken",
  refreshToken: "refreshToken",
} as const

export function getAccessToken() {
  return storage.get(AUTH_STORAGE_KEYS.accessToken)
}

export function getRefreshToken() {
  return storage.get(AUTH_STORAGE_KEYS.refreshToken)
}

export function setSessionTokens(tokens: {
  accessToken: string
  refreshToken?: string | null
}) {
  storage.set(AUTH_STORAGE_KEYS.accessToken, tokens.accessToken)

  if (tokens.refreshToken) {
    storage.set(AUTH_STORAGE_KEYS.refreshToken, tokens.refreshToken)
    return
  }

  storage.remove(AUTH_STORAGE_KEYS.refreshToken)
}

export function clearSessionTokens() {
  storage.remove(AUTH_STORAGE_KEYS.accessToken)
  storage.remove(AUTH_STORAGE_KEYS.refreshToken)
}
