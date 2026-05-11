/** Nhãn hiển thị tiếng Việt — giá trị API/DB vẫn là mã tiếng Anh */

export function roomTypeLabelVn(code) {
  const s = String(code || "").trim();
  const map = {
    phong_tro: "Phòng trọ",
    chung_cu_mini: "Chung cư mini",
    nha_nguyen_can: "Nhà nguyên căn",
    ky_tuc_xa: "Ký túc xá"
  };
  return map[s] || (s ? s : "—");
}

export function roomStatusLabelVn(code) {
  const s = String(code || "").trim();
  const map = {
    draft: "Nháp",
    pending: "Chờ duyệt",
    approved: "Đã duyệt",
    rejected: "Từ chối"
  };
  return map[s] || (s ? s : "—");
}

export function postStatusLabelVn(code) {
  const s = String(code || "").trim();
  const map = {
    draft: "Nháp",
    published: "Đã đăng"
  };
  return map[s] || (s ? s : "—");
}

export function paymentStatusLabelVn(code) {
  const s = String(code || "").trim();
  const map = {
    pending: "Đang chờ thanh toán",
    paid: "Đã thanh toán",
    failed: "Thanh toán thất bại"
  };
  return map[s] || (s ? s : "—");
}

/** Trạng thái tài khoản (users.status) */
export function userAccountStatusLabelVn(code) {
  const s = String(code || "").trim();
  const map = {
    active: "Hoạt động",
    blocked: "Đã khóa"
  };
  return map[s] || (s ? s : "—");
}

/** Vai trò (users.role) */
export function roleLabelVn(code) {
  const s = String(code || "").trim();
  const map = {
    tenant: "Người thuê",
    landlord: "Chủ trọ",
    admin: "Quản trị viên"
  };
  return map[s] || (s ? s : "—");
}

/** Phòng + bài viết (dashboard admin — cùng mã draft, khác published) */
export function roomOrPostStatusLabelVn(code) {
  const s = String(code || "").trim();
  const map = {
    draft: "Nháp",
    pending: "Chờ duyệt",
    approved: "Đã duyệt",
    rejected: "Từ chối",
    published: "Đã đăng"
  };
  return map[s] || (s ? s : "—");
}
