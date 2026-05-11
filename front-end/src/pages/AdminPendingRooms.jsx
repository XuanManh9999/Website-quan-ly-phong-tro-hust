import { useEffect, useState } from "react";
import DOMPurify from "dompurify";
import { roomsApi } from "../api/roomsApi";
import { Icons } from "../ui/icons";
import { notify } from "../ui/toast";
import { roomStatusLabelVn } from "../utils/labels.js";
import { Pagination } from "../components/Pagination.jsx";

export default function AdminPendingRoomsPage() {
  const I = Icons;
  const [rooms, setRooms] = useState([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("pending");
  const [search, setSearch] = useState("");

  async function load() {
    setBusy(true);
    setError("");
    try {
      const data = await roomsApi.adminList({
        status,
        search: search || undefined,
        page,
        limit
      });
      setRooms(data.items || []);
      setTotal(data.total || 0);
      setTotalPages(Number(data.totalPages) || Math.ceil((data.total || 0) / limit) || 1);
      if (!selectedId && data.items?.[0]?.id) setSelectedId(data.items[0].id);
    } catch (err) {
      const message = err?.response?.data?.message || "Không tải được danh sách chờ duyệt";
      setError(message);
      notify.error(message);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, status]);

  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      load();
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!selectedId) {
        setDetail(null);
        return;
      }
      setError("");
      try {
        const d = await roomsApi.adminDetail(selectedId);
        if (!cancelled) setDetail(d);
      } catch (err) {
        const message = err?.response?.data?.message || "Không tải được chi tiết phòng";
        if (!cancelled) setError(message);
        notify.error(message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  async function approve(id) {
    setBusy(true);
    setError("");
    try {
      await roomsApi.adminApprove(id);
      await load();
      setSelectedId(null);
      notify.success("Đã duyệt phòng");
    } catch (err) {
      const message = err?.response?.data?.message || "Duyệt thất bại";
      setError(message);
      notify.error(message);
      setBusy(false);
    }
  }

  async function reject(id) {
    const reason = window.prompt("Nhập lý do từ chối (tuỳ chọn):", "");
    if (reason === null) return;
    setBusy(true);
    setError("");
    try {
      await roomsApi.adminReject(id, reason || undefined);
      await load();
      setSelectedId(null);
      notify.success("Đã từ chối phòng");
    } catch (err) {
      const message = err?.response?.data?.message || "Từ chối thất bại";
      setError(message);
      notify.error(message);
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl">
      <div className="toolbar">
        <div>
          <div className="page-kicker">Admin</div>
          <h1 className="page-title">Duyệt phòng</h1>
          <p className="page-subtitle">Lọc, xem chi tiết và duyệt/từ chối phòng đăng.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className="btn-secondary inline-flex items-center gap-2" onClick={load} disabled={busy}>
            <I.Refresh className="text-[14px]" />
            <span>Tải lại</span>
          </button>
        </div>
      </div>

      {error ? (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}
      {busy ? <p className="mt-4 text-sm text-slate-500">Đang tải...</p> : null}

      <div className="mt-6 panel panel-pad">
        <div className="toolbar">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative w-full sm:max-w-md">
              <I.Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[12px] text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm theo tiêu đề, email chủ trọ..."
                className="input-base w-full pl-9"
              />
            </div>
            <div className="inline-flex flex-wrap gap-2">
              {[
                ["pending", "Chờ duyệt"],
                ["approved", "Đã duyệt"],
                ["rejected", "Từ chối"],
                ["draft", "Nháp"]
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => {
                    setSelectedId(null);
                    setDetail(null);
                    setPage(1);
                    setStatus(value);
                  }}
                  className={`rounded-full border px-3 py-1 text-[11px] font-semibold transition ${
                    status === value
                      ? "border-brand-200 bg-brand-50 text-brand-700"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="text-xs text-slate-500">
            Tổng cộng <span className="font-semibold text-slate-700">{total}</span> phòng • Trang{" "}
            <span className="font-semibold text-slate-700">
              {page}/{totalPages}
            </span>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[360px_1fr]">
          <div className="space-y-3">
            {!busy && rooms.length === 0 ? (
              <div className="rounded-xl bg-slate-50 px-4 py-6 text-sm text-slate-500">
                Không có dữ liệu phù hợp.
              </div>
            ) : null}
            {rooms.map((r) => (
              <button
                key={r.id}
                className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                  Number(selectedId) === Number(r.id)
                    ? "border-brand-200 bg-brand-50"
                    : "border-slate-200 bg-white hover:border-brand-200"
                }`}
                onClick={() => setSelectedId(r.id)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-slate-900">{r.title}</div>
                    <div className="mt-1 text-xs text-slate-500">
                      {Number(r.price_monthly).toLocaleString("vi-VN")} đ/tháng •{" "}
                      {Number(r.area_m2).toLocaleString("vi-VN")} m²
                    </div>
                    <div className="mt-2 truncate text-xs text-slate-500">
                      Chủ trọ: {r.landlord_full_name || "-"} ({r.landlord_email})
                    </div>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold ${
                      r.status === "approved"
                        ? "bg-emerald-50 text-emerald-700"
                        : r.status === "pending"
                        ? "bg-amber-50 text-amber-700"
                        : r.status === "rejected"
                        ? "bg-red-50 text-red-700"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {roomStatusLabelVn(r.status)}
                  </span>
                </div>
              </button>
            ))}
          </div>

          <div className="panel panel-pad">
            {!detail ? (
              <div className="text-sm text-slate-500">Chọn 1 phòng để xem chi tiết.</div>
            ) : (
              <>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="text-xl font-semibold text-slate-900">{detail.title}</div>
                    <div className="mt-1 text-sm text-slate-500">Trạng thái: {roomStatusLabelVn(detail.status)}</div>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" className="btn-secondary" onClick={() => approve(detail.id)} disabled={busy || detail.status !== "pending"}>
                      Duyệt
                    </button>
                    <button type="button" className="btn-outline" onClick={() => reject(detail.id)} disabled={busy || detail.status !== "pending"}>
                      Từ chối
                    </button>
                  </div>
                </div>

                <div className="mt-4 text-sm text-slate-500">
                  Chủ trọ: {detail.landlord_full_name || "-"} ({detail.landlord_email})
                </div>

                <div className="mt-4 grid gap-3 rounded-2xl bg-slate-50 p-4 text-sm ring-1 ring-slate-200/70">
                  <div>
                    <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Giá/tháng</div>
                    <div className="font-semibold text-slate-900">
                      {Number(detail.price_monthly).toLocaleString("vi-VN")} đ
                    </div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Diện tích</div>
                    <div className="font-semibold text-slate-900">
                      {Number(detail.area_m2).toLocaleString("vi-VN")} m²
                    </div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Địa chỉ</div>
                    <div className="font-semibold text-slate-900">
                      {[detail.street, detail.ward, detail.district, detail.province].filter(Boolean).join(", ") || "-"}
                    </div>
                  </div>
                </div>

                {detail.description ? (
                  <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-700 ring-1 ring-slate-200/70">
                    <div
                      className="prose prose-sm max-w-none prose-img:mt-2 prose-img:rounded-xl prose-img:border prose-img:border-slate-200"
                      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(detail.description || "") }}
                    />
                  </div>
                ) : (
                  <div className="mt-4 text-sm text-slate-500">Chưa có mô tả</div>
                )}

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {(detail.images || []).length ? (
                    detail.images.map((img) => (
                      <img
                        key={img.id}
                        src={img.url}
                        alt=""
                        className="h-36 w-full rounded-2xl object-cover ring-1 ring-slate-200/70"
                      />
                    ))
                  ) : (
                    <div className="text-sm text-slate-500">Chưa có ảnh</div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      <Pagination
        className="mt-4 !justify-end"
        page={page}
        totalPages={totalPages}
        disabled={busy}
        onPageChange={(p) => setPage(p)}
      />
    </div>
  );
}

