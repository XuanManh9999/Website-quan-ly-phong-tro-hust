import { http } from "./http";

export const packagesApi = {
  async list() {
    const res = await http.get("/packages");
    return res.data.packages || [];
  },
  async adminList() {
    const res = await http.get("/packages/admin");
    return res.data.packages || [];
  },
  async adminCreate(payload) {
    const res = await http.post("/packages/admin", payload);
    return res.data.package;
  },
  async adminUpdate(id, payload) {
    const res = await http.put(`/packages/admin/${id}`, payload);
    return res.data.package;
  },
  async adminRemove(id) {
    const res = await http.delete(`/packages/admin/${id}`);
    return res.data;
  }
};

