import { http } from "./http";

export const faqsApi = {
  async listPublic() {
    const res = await http.get("/faqs");
    return res.data.items || [];
  },
  async adminList() {
    const res = await http.get("/faqs/admin");
    return res.data.items || [];
  },
  async adminCreate(payload) {
    const res = await http.post("/faqs/admin", payload);
    return res.data.item;
  },
  async adminUpdate(id, payload) {
    const res = await http.put(`/faqs/admin/${id}`, payload);
    return res.data.item;
  },
  async adminDelete(id) {
    const res = await http.delete(`/faqs/admin/${id}`);
    return res.data;
  }
};

