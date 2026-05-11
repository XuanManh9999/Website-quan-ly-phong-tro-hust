import { http } from "./http.js";

/** Timeout dài — Gemini có thể trả lời chậm khi ngữ cảnh nhiều phòng */
const CHAT_TIMEOUT_MS = 120000;

export const chatApi = {
  async status() {
    const { data } = await http.get("/chat/status");
    return data;
  },

  /**
   * @param {Array<{ role: 'user' | 'assistant', content: string }>} messages
   * @param {string} [clientOrigin]
   */
  async send(messages, clientOrigin) {
    const { data } = await http.post(
      "/chat",
      {
        messages,
        clientOrigin: clientOrigin || (typeof window !== "undefined" ? window.location.origin : undefined)
      },
      { timeout: CHAT_TIMEOUT_MS }
    );
    return data;
  }
};
