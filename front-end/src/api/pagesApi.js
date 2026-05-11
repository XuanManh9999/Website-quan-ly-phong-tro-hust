import { http } from "./http";

export const pagesApi = {
  async getPublic(slug) {
    const res = await http.get(`/pages/${encodeURIComponent(slug)}`);
    return res.data.page;
  },
  async adminList() {
    const res = await http.get("/pages/admin");
    return res.data.items || [];
  },
  async adminDetail(id) {
    const res = await http.get(`/pages/admin/${id}`);
    return res.data.page;
  },
  async adminCreate(payload) {
    const res = await http.post("/pages/admin", payload);
    return res.data.page;
  },
  async adminUpdate(id, payload) {
    const res = await http.put(`/pages/admin/${id}`, payload);
    return res.data.page;
  },
  async adminDelete(id) {
    const res = await http.delete(`/pages/admin/${id}`);
    return res.data;
  }
};

