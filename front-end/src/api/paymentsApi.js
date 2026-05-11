import { http } from "./http";

export const paymentsApi = {
  async myPackage() {
    const res = await http.get("/payments/packages/me");
    return res.data;
  },
  async myHistory() {
    const res = await http.get("/payments/me/history");
    return res.data;
  },
  async previewPackagePayment(packageCode, coupon) {
    const res = await http.post("/payments/vnpay/preview-package", {
      package: packageCode,
      coupon: coupon && String(coupon).trim() ? String(coupon).trim() : undefined
    });
    return res.data;
  },

  async createPackagePayment(packageCode, coupon) {
    const returnUrl = `${window.location.origin}/payment/vnpay-return`;
    const body = { package: packageCode, returnUrl };
    if (coupon && String(coupon).trim()) body.coupon = String(coupon).trim();
    const res = await http.post("/payments/vnpay/create", body);
    return res.data;
  },
  async verifyVNPayReturn(params) {
    const res = await http.get("/payments/vnpay/return", { params });
    return res.data;
  }
};

