import axios from 'axios'

/** Dev: để trống + proxy Vite (`/api` → backend). Production: set `VITE_API_URL`. */
const baseURL = import.meta.env.VITE_API_URL ?? ''

export const http = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
})

http.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})
