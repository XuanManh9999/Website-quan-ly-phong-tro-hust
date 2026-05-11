import { http } from "./http";

export const roomsApi = {
  /** @returns {{ rooms: any[], total: number, limit: number, offset: number }} */
  async list(params) {
    const res = await http.get("/rooms", { params });
    return {
      rooms: res.data.rooms,
      total: res.data.total ?? 0,
      limit: res.data.limit,
      offset: res.data.offset
    };
  },
  async detail(id) {
    const res = await http.get(`/rooms/${id}`);
    return res.data.room;
  },
  async manageDetail(id) {
    const res = await http.get(`/rooms/${id}/manage`);
    return res.data.room;
  },
  /** @param {{ page?: number, limit?: number, keyword?: string }} [params] */
  async listMine(params) {
    const res = await http.get("/rooms/me/list", { params });
    return res.data;
  },
  async create(payload) {
    const res = await http.post("/rooms", payload);
    return res.data.room;
  },
  async update(id, payload) {
    const res = await http.put(`/rooms/${id}`, payload);
    return res.data.room;
  },
  async remove(id) {
    const res = await http.delete(`/rooms/${id}`);
    return res.data;
  },
  async addImage(id, payload) {
    const res = await http.post(`/rooms/${id}/images`, payload);
    return res.data.room;
  },
  async removeImage(id, imageId) {
    const res = await http.delete(`/rooms/${id}/images/${imageId}`);
    return res.data.room;
  },
  async submit(id) {
    const res = await http.post(`/rooms/${id}/submit`);
    return res.data.room;
  },
  async adminPending(params) {
    const res = await http.get("/rooms/admin/list", {
      params: { status: "pending", ...(params || {}) }
    });
    return res.data;
  },
  async adminList(params) {
    const res = await http.get("/rooms/admin/list", { params });
    return res.data;
  },
  async adminDetail(id) {
    const res = await http.get(`/rooms/admin/${id}`);
    return res.data.room;
  },
  async adminApprove(id) {
    const res = await http.patch(`/rooms/admin/${id}/approve`);
    return res.data;
  },
  async adminReject(id, reason) {
    const res = await http.patch(`/rooms/admin/${id}/reject`, { reason });
    return res.data;
  }
};

