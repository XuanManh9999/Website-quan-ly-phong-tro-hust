import { useEffect, useState } from "react";
import { useAuth } from "../auth/useAuth";
import { Link, Navigate } from "react-router-dom";
import {
  FaBuilding,
  FaNewspaper,
  FaUserPen,
  FaShieldHalved,
  FaClipboardList,
  FaGear,
  FaRightFromBracket
} from "react-icons/fa6";
import { Icons } from "../ui/icons";
import { notify } from "../ui/toast";
import { paymentsApi } from "../api/paymentsApi";
import { couponsApi } from "../api/couponsApi";
import { paymentStatusLabelVn, roleLabelVn } from "../utils/labels.js";

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const I = Icons;
  const [pkg, setPkg] = useState(null);
  const [pkgBusy, setPkgBusy] = useState(false);
  const [history, setHistory] = useState([]);
  const [couponCode, setCouponCode] = useState("");
  const [promotions, setPromotions] = useState([]);

  // Admin: chuyển thẳng sang trang quản trị đầy đủ
  if (user?.role === "admin") {
    return <Navigate to="/admin" replace />;
  }

  async function loadLandlordPayments() {
    if (user?.role !== "landlord") return;
    setPkgBusy(true);
    try {
      const [pkgRes, historyRes, promoList] = await Promise.all([
        paymentsApi.myPackage(),
        paymentsApi.myHistory(),
        couponsApi.listPromotions().catch(() => [])
      ]);
      setPkg(pkgRes);
      setHistory(Array.isArray(historyRes?.items) ? historyRes.items : []);
      setPromotions(Array.isArray(promoList) ? promoList : []);
    } catch (err) {
      notify.error(err?.response?.data?.message || "Không tải được thông tin gói");
    } finally {
      setPkgBusy(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (user?.role !== "landlord") return;
      setPkgBusy(true);
      try {
        const [pkgRes, historyRes, promoList] = await Promise.all([
          paymentsApi.myPackage(),
          paymentsApi.myHistory(),
          couponsApi.listPromotions().catch(() => [])
        ]);
        if (!cancelled) {
          setPkg(pkgRes);
          setHistory(Array.isArray(historyRes?.items) ? historyRes.items : []);
          setPromotions(Array.isArray(promoList) ? promoList : []);
        }
      } catch (err) {
        if (!cancelled) notify.error(err?.response?.data?.message || "Không tải được thông tin gói");
      } finally {
        if (!cancelled) setPkgBusy(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.role]);

  async function buyPackage(code) {
    const c = couponCode.trim();
    try {
      setPkgBusy(true);
      if (c) {
        const prev = await paymentsApi.previewPackagePayment(code, c);
        if (prev.couponError) {
          notify.error(prev.couponError);
          setPkgBusy(false);
          return;
        }
      }
      const data = await paymentsApi.createPackagePayment(code, c || undefined);
      if (data.free) {
        notify.success("Đã kích hoạt gói với ưu đãi (không cần thanh toán VNPay).");
        await loadLandlordPayments();
        return;
      }
      if (data.vnp_Url) {
        window.location.href = data.vnp_Url;
        return;
      }
      notify.error("Không nhận được link thanh toán.");
      setPkgBusy(false);
    } catch (err) {
      notify.error(err?.response?.data?.message || "Tạo thanh toán thất bại");
      setPkgBusy(false);
    }
  }

  const currentCode = pkg?.current?.code || "basic";
  const currentRank = Number(pkg?.current?.rank || 1);

  const pkgNameByCode = (() => {
    const m = new Map();
    for (const p of pkg?.packages || []) {
      if (p?.code) m.set(String(p.code).toLowerCase(), p.name || p.code);
    }
    return m;
  })();

  function formatPromoApplicable(codes) {
    if (!codes || codes.length === 0) return "Mọi gói trả phí";
    return codes.map((c) => pkgNameByCode.get(String(c).toLowerCase()) || c).join(", ");
  }

  return (
    <div className="mx-auto w-full max-w-6xl">
      <div className="toolbar">
        <div>
          <div className="page-kicker">Tài khoản</div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Quản lý nhanh các chức năng cá nhân của bạn.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
            {roleLabelVn(user?.role)}
          </span>
          <button
            type="button"
            className="btn-outline"
            onClick={() => {
              logout();
              notify.success("Đã đăng xuất");
            }}
          >
            <FaRightFromBracket className="mr-2" />
            Đăng xuất
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section className="panel panel-pad">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl bg-sky-50 p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">Email</div>
              <div className="mt-2 truncate text-sm font-semibold text-slate-900">{user?.email}</div>
            </div>
            <div className="rounded-2xl bg-emerald-50 p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">Họ tên</div>
              <div className="mt-2 truncate text-sm font-semibold text-slate-900">{user?.full_name || "-"}</div>
            </div>
            <div className="rounded-2xl bg-violet-50 p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-700">Vai trò</div>
              <div className="mt-2 truncate text-sm font-semibold text-slate-900">{roleLabelVn(user?.role)}</div>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Link className="btn-secondary" to="/profile">
              <FaUserPen className="mr-2" />
              Thông tin cá nhân
            </Link>
            <Link className="btn-secondary" to="/change-password">
              <FaShieldHalved className="mr-2" />
              Đổi mật khẩu
            </Link>
            <Link className="btn-secondary" to="/me/bookmarks">
              <I.BookmarkOutline className="mr-2 text-[16px]" />
              Bài viết đã lưu
            </Link>
            <Link className="btn-secondary" to="/me/likes">
              <span className="mr-2 text-[14px]">❤</span>
              Bài viết đã thích
            </Link>
            <Link className="btn-secondary" to="/rooms">
              <FaBuilding className="mr-2" />
              Danh sách phòng
            </Link>
            <Link className="btn-secondary" to="/blog">
              <FaNewspaper className="mr-2" />
              Bài viết
            </Link>
            {user?.role === "landlord" ? (
              <Link className="btn-secondary sm:col-span-2" to="/landlord/rooms">
                <FaClipboardList className="mr-2" />
                Quản lý phòng (chủ trọ)
              </Link>
            ) : null}
            {user?.role === "admin" ? (
              <Link className="btn-secondary sm:col-span-2" to="/admin">
                <FaGear className="mr-2" />
                Trang quản trị viên
              </Link>
            ) : null}
          </div>

          {user?.role === "landlord" ? (
            <div className="mt-6 space-y-6">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Gói đăng tin</div>
                  <div className="mt-1 text-sm font-semibold text-slate-900">
                    {pkgBusy && !pkg ? "Đang tải..." : `Gói hiện tại: ${(pkg?.current?.code || "basic").toUpperCase()}`}
                  </div>
                  {pkg ? (
                    <div className="mt-1 text-xs text-slate-600">
                      Đã dùng <span className="font-semibold">{pkg.used}</span>/<span className="font-semibold">{pkg.current.quota}</span> tin trong tháng • Còn{" "}
                      <span className="font-semibold">{pkg.remaining}</span> tin
                    </div>
                  ) : null}
                </div>
                <div className="text-xs text-slate-500">
                  Vượt quota sẽ không thể <span className="font-semibold">Gửi duyệt</span>.
                </div>
              </div>

              <div className="rounded-2xl border border-emerald-200/90 bg-emerald-50/50 px-4 py-4">
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-800">Ưu đãi và mã giảm giá</div>
                <p className="mt-1 text-xs text-emerald-900/80">
                  Các mã đang trong thời gian hiệu lực (do admin bật). Sao chép mã và dán vào ô bên dưới khi nâng cấp gói.
                </p>
                {pkgBusy && promotions.length === 0 ? (
                  <p className="mt-3 text-sm text-slate-500">Đang tải ưu đãi…</p>
                ) : promotions.length === 0 ? (
                  <p className="mt-3 text-sm text-slate-600">Hiện không có mã giảm giá nào đang áp dụng.</p>
                ) : (
                  <ul className="mt-3 space-y-2">
                    {promotions.map((pr) => (
                      <li
                        key={pr.code}
                        className="flex flex-col gap-1 rounded-xl border border-emerald-100 bg-white/90 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-sm font-bold text-slate-900">{pr.code}</span>
                            {pr.title ? (
                              <span className="truncate text-xs text-slate-600" title={pr.title}>
                                {pr.title}
                              </span>
                            ) : null}
                          </div>
                          <div className="mt-0.5 text-xs text-slate-600">{pr.discountSummary}</div>
                          <div className="mt-0.5 text-[11px] text-slate-500">
                            Áp dụng: {formatPromoApplicable(pr.applicablePackageCodes)}
                            {(pr.validFrom || pr.validUntil) && (
                              <>
                                {" "}
                                · Hạn: {pr.validFrom || "…"} → {pr.validUntil || "…"}
                              </>
                            )}
                          </div>
                        </div>
                        <div className="shrink-0">
                          {pr.youCanUse ? (
                            <span className="inline-flex rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-semibold text-emerald-800">
                              Bạn có thể dùng
                            </span>
                          ) : !pr.globallyAvailable ? (
                            <span className="inline-flex rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-600">
                              Hết lượt
                            </span>
                          ) : (
                            <span className="inline-flex rounded-full bg-amber-100 px-2 py-1 text-[10px] font-semibold text-amber-900">
                              Bạn đã dùng hết lượt
                            </span>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="mt-3 rounded-xl border border-amber-200/70 bg-amber-50/50 px-3 py-3">
                <label className="text-[11px] font-semibold uppercase tracking-wide text-amber-900">
                  Mã giảm giá (tuỳ chọn)
                </label>
                <p className="mt-0.5 text-[11px] text-amber-800/80">Nhập mã admin cấp, sau đó bấm &quot;Nâng cấp&quot; trên gói mong muốn.</p>
                <input
                  className="input-base mt-2 max-w-sm text-sm"
                  placeholder="VD: DEMO10, GIAM20K"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  autoComplete="off"
                />
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-3">
                {(pkg?.packages || []).map((p) => {
                  const current = currentCode === p.code;
                  const targetRank = Number(p.rank || 1);
                  const canBuy = Number(p.price || 0) > 0 && targetRank > currentRank;
                  return (
                    <div
                      key={p.code}
                      className={`rounded-2xl border p-4 ${current ? "border-brand-200 bg-brand-50" : "border-slate-200 bg-white"}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-semibold text-slate-900">{p.name}</div>
                        {current ? (
                          <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700">
                            Đang dùng
                          </span>
                        ) : null}
                      </div>
                      <div className="mt-1 text-xs text-slate-600">Quota: {Number(p.quota).toLocaleString("vi-VN")} tin/tháng</div>
                      <div className="mt-2 text-sm font-bold text-slate-900">
                        {Number(p.price || 0) === 0 ? "Miễn phí" : `${Number(p.price).toLocaleString("vi-VN")}đ/tháng`}
                      </div>
                      {canBuy ? (
                        <button
                          type="button"
                          className="btn-primary mt-3 w-full"
                          disabled={pkgBusy}
                          onClick={() => buyPackage(p.code)}
                        >
                          Nâng cấp
                        </button>
                      ) : (
                        <button type="button" className="btn-secondary mt-3 w-full" disabled>
                          {current
                            ? "Đang dùng"
                            : Number(p.price || 0) === 0
                              ? "Mặc định"
                              : targetRank < currentRank
                                ? "Đã có gói cao hơn"
                                : "Không khả dụng"}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Lịch sử thanh toán</div>
                  <div className="mt-1 text-sm text-slate-600">Các giao dịch mua gói gần đây của bạn.</div>
                </div>
              </div>
              <div className="mt-3 overflow-x-auto">
                <table className="table-clean w-full min-w-[640px] text-sm">
                  <thead>
                    <tr>
                      <th className="w-40">Thời gian</th>
                      <th className="w-28">Gói</th>
                      <th className="w-24">Mã GG</th>
                      <th className="w-28">Giảm</th>
                      <th className="w-32">Số tiền</th>
                      <th className="w-32">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-6 text-center text-sm text-slate-500">
                          Chưa có giao dịch nào.
                        </td>
                      </tr>
                    ) : (
                      history.map((p) => (
                        <tr key={p.id}>
                          <td>
                            {p.createdAt
                              ? new Date(p.createdAt).toLocaleString("vi-VN")
                              : "-"}
                          </td>
                          <td>{p.packageCode ? p.packageCode.toUpperCase() : "-"}</td>
                          <td className="font-mono text-xs">{p.couponCode || "—"}</td>
                          <td className="text-xs">
                            {Number(p.discountAmount || 0) > 0
                              ? `${Number(p.discountAmount).toLocaleString("vi-VN")}đ`
                              : "—"}
                          </td>
                          <td>{Number(p.amount || 0).toLocaleString("vi-VN")}đ</td>
                          <td>
                            <span
                              className={
                                p.status === "paid"
                                  ? "inline-flex rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700"
                                  : p.status === "failed"
                                    ? "inline-flex rounded-full bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-700"
                                    : "inline-flex rounded-full bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700"
                              }
                            >
                              {paymentStatusLabelVn(p.status)}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            </div>
          ) : null}
        </section>

        <aside className="panel panel-pad">
          <div className="text-sm font-semibold text-slate-900">Gợi ý</div>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            <li className="rounded-xl bg-slate-50 px-3 py-2">
              Cập nhật hồ sơ đầy đủ để hiển thị thông tin liên hệ chính xác.
            </li>
            <li className="rounded-xl bg-slate-50 px-3 py-2">
              Đổi mật khẩu định kỳ để tăng bảo mật tài khoản.
            </li>
            {user?.role === "landlord" ? (
              <li className="rounded-xl bg-slate-50 px-3 py-2">
                Tạo phòng mới và gửi duyệt để được hiển thị công khai.
              </li>
            ) : null}
          </ul>
        </aside>
      </div>
    </div>
  );
}

