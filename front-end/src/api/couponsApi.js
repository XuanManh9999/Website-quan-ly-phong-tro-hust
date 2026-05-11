import { http } from "./http.js";

export const couponsApi = {
  /** Chủ trọ: mã giảm giá đang hiệu lực (đăng nhập). */
  async listPromotions() {
    const { data } = await http.get("/coupons/promotions");
    return data.promotions || [];
  },
  async adminList() {
    const { data } = await http.get("/coupons/admin");
    return data.coupons || [];
  },
  async adminCreate(payload) {
    const { data } = await http.post("/coupons/admin", payload);
    return data;
  },
  async adminUpdate(id, payload) {
    const { data } = await http.put(`/coupons/admin/${id}`, payload);
    return data;
  },
  async adminRemove(id) {
    const { data } = await http.delete(`/coupons/admin/${id}`);
    return data;
  }
};
