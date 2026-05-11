import { http } from "./http";

export const authApi = {
  async updateProfile(payload) {
    const res = await http.put("/auth/me", payload);
    return res.data.user;
  },
  async changePassword(payload) {
    const res = await http.put("/auth/change-password", payload);
    return res.data.user;
  }
};
