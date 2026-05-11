import axios from "axios";
import { clearAccessToken, getAccessToken } from "../auth/tokenStorage";

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8080",
  timeout: 15000
});

http.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

http.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error?.response?.status;
    const message = error?.response?.data?.message || "";
    if (
      status === 401 &&
      (message.includes("Thiếu token đăng nhập") || message.includes("Token không hợp lệ") || message.includes("hết hạn"))
    ) {
      clearAccessToken();
      if (typeof window !== "undefined") {
        const current = window.location.pathname + window.location.search;
        const search = new URLSearchParams();
        if (current && current !== "/login") {
          search.set("from", current);
        }
        const target = `/login${search.toString() ? `?${search.toString()}` : ""}`;
        window.location.replace(target);
      }
    }
    return Promise.reject(error);
  }
);

