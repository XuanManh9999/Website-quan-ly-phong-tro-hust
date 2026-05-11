import { http } from "./http";

export const locationsApi = {
  async provinces() {
    const res = await http.get("/locations/provinces");
    return res.data.provinces || [];
  }
};

