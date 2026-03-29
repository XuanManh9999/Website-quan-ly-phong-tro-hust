import { http } from './http'

export type UserRole = 'SEEKER' | 'LANDLORD' | 'ADMIN' | 'EDITOR'

export interface AuthResponse {
  accessToken: string
  tokenType: string
  expiresInMs: number
  user: {
    id: number
    email: string
    fullName: string | null
    role: UserRole
    emailVerified: boolean
  }
}

export async function login(email: string, password: string) {
  const { data } = await http.post<AuthResponse>('/api/v1/auth/login', { email, password })
  return data
}

export async function register(payload: {
  email: string
  password: string
  fullName?: string
  phone?: string
  role: UserRole
}) {
  const { data } = await http.post<AuthResponse>('/api/v1/auth/register', payload)
  return data
}
