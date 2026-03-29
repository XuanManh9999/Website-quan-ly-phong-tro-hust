import { http } from './http'

export async function sendChat(message: string, sessionId?: string) {
  const { data } = await http.post<{ reply: string; sessionId: string }>('/api/v1/chat', {
    message,
    sessionId,
  })
  return data
}
