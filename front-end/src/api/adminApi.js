import { http } from "./http";

export const adminApi = {
  async summary(params) {
    const res = await http.get("/admin/summary", { params });
    return res.data;
  }
};

