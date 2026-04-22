const NICKNAME_STORAGE_KEY = "auth.nickname"

export function getStoredNickname() {
  if (typeof window === "undefined") {
    return null
  }

  const nickname = window.localStorage.getItem(NICKNAME_STORAGE_KEY)
  return nickname && nickname.trim() ? nickname.trim() : null
}

export function setStoredNickname(nickname: string) {
  if (typeof window === "undefined") {
    return
  }

  const trimmed = nickname.trim()

  if (!trimmed) {
    window.localStorage.removeItem(NICKNAME_STORAGE_KEY)
    return
  }

  window.localStorage.setItem(NICKNAME_STORAGE_KEY, trimmed)
}

export function clearStoredNickname() {
  if (typeof window === "undefined") {
    return
  }

  window.localStorage.removeItem(NICKNAME_STORAGE_KEY)
}
