const KEY = "accessToken";

export function getAccessToken() {
  return localStorage.getItem(KEY) || "";
}

export function setAccessToken(token) {
  if (!token) localStorage.removeItem(KEY);
  else localStorage.setItem(KEY, token);
}

export function clearAccessToken() {
  localStorage.removeItem(KEY);
}

