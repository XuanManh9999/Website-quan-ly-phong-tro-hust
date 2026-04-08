import type { AuthResponse, UserRole } from '../api/authApi'

const ACCESS_TOKEN_KEY = 'accessToken'
const CURRENT_USER_KEY = 'currentUser'

type CurrentUser = {
  id: number
  email: string
  fullName: string | null
  role: UserRole
  emailVerified: boolean
}

export function setSession(auth: AuthResponse) {
  localStorage.setItem(ACCESS_TOKEN_KEY, auth.accessToken)
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(auth.user))
}

export function clearSession() {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(CURRENT_USER_KEY)
}

export function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY)
}

export function getCurrentUser(): CurrentUser | null {
  const raw = localStorage.getItem(CURRENT_USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as CurrentUser
  } catch {
    return null
  }
}
