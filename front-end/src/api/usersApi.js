import { http } from "./http";

export const usersApi = {
  async adminList(params) {
    const res = await http.get("/admin/users", { params });
    return res.data;
  },
  async adminDetail(id) {
    const res = await http.get(`/admin/users/${id}`);
    return res.data.user;
  },
  async adminCreate(payload) {
    const res = await http.post("/admin/users", payload);
    return res.data.user;
  },
  async adminUpdate(id, payload) {
    const res = await http.put(`/admin/users/${id}`, payload);
    return res.data.user;
  },
  async adminDelete(id) {
    const res = await http.delete(`/admin/users/${id}`);
    return res.data;
  }
};

