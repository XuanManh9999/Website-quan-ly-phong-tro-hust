import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { roomsApi } from "../api/roomsApi";
import { notify } from "../ui/toast";
import { Pagination } from "../components/Pagination.jsx";
import { roomStatusLabelVn } from "../utils/labels.js";

const PAGE_SIZE = 10;

export default function LandlordRoomsPage() {
  const nav = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [keyword, setKeyword] = useState("");
  const [debouncedKeyword, setDebouncedKeyword] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedKeyword(keyword.trim()), 300);
    return () => clearTimeout(t);
  }, [keyword]);

  useEffect(() => {
    setPage(1);
  }, [debouncedKeyword]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setBusy(true);
      setError("");
      try {
        const data = await roomsApi.listMine({
          page,
          limit: PAGE_SIZE,
          keyword: debouncedKeyword || undefined
        });
        if (!cancelled) {
          setRooms(data.rooms || []);
          setTotal(Number(data.total) || 0);
        }
      } catch (err) {
        const message = err?.response?.data?.message || "Không tải được phòng của bạn";
        if (!cancelled) {
          setError(message);
          notify.error(message);
        }
      } finally {
        if (!cancelled) setBusy(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [page, debouncedKeyword]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  async function load() {
    setBusy(true);
    setError("");
    try {
      const data = await roomsApi.listMine({
        page,
        limit: PAGE_SIZE,
        keyword: debouncedKeyword || undefined
      });
      setRooms(data.rooms || []);
      setTotal(Number(data.total) || 0);
    } catch (err) {
      const message = err?.response?.data?.message || "Không tải được phòng của bạn";
      setError(message);
      notify.error(message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl">
      <div className="toolbar">
        <div>
          <div className="page-kicker">Chủ trọ</div>
          <h1 className="page-title">Phòng của tôi</h1>
          <p className="page-subtitle">Tạo, chỉnh sửa và theo dõi trạng thái duyệt phòng.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => {
              if (window.history.length > 1) nav(-1);
              else nav("/dashboard");
            }}
          >
            Quay lại
          </button>
          <Link to="/dashboard" className="btn-secondary">
            Dashboard
          </Link>
          <Link to="/landlord/rooms/new" className="btn-primary">
            + Tạo phòng
          </Link>
          <button type="button" className="btn-secondary" onClick={load} disabled={busy}>
            Tải lại
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
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Tìm theo tiêu đề..."
            className="input-base sm:max-w-md"
          />
          <div className="text-xs text-slate-500">
            Tổng: <span className="font-semibold text-slate-700">{total}</span>
            {totalPages > 1 ? (
              <span className="text-slate-400">
                {" "}
                • Trang {page}/{totalPages}
              </span>
            ) : null}
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          {!busy && rooms.length === 0 ? (
            <div className="rounded-xl bg-slate-50 px-4 py-6 text-sm text-slate-500">
              Chưa có phòng nào. Hãy tạo phòng mới để bắt đầu.
            </div>
          ) : (
            <table className="table-clean w-full min-w-[720px]">
              <thead>
                <tr>
                  <th className="w-16">ID</th>
                  <th>Tiêu đề</th>
                  <th className="w-40">Giá / Diện tích</th>
                  <th className="w-44">Trạng thái</th>
                  <th className="w-40 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {rooms.map((r) => (
                  <tr key={r.id}>
                    <td className="text-xs text-slate-500">#{r.id}</td>
                    <td>
                      <div className="text-sm font-medium text-slate-900">{r.title}</div>
                      {r.status === "rejected" && r.rejection_reason ? (
                        <div className="mt-1 text-xs text-red-600">Lý do: {r.rejection_reason}</div>
                      ) : null}
                    </td>
                    <td className="text-sm text-slate-700">
                      <div className="font-semibold text-brand-700">
                        {Number(r.price_monthly).toLocaleString("vi-VN")} đ
                      </div>
                      <div className="text-xs text-slate-500">{Number(r.area_m2).toLocaleString("vi-VN")} m²</div>
                    </td>
                    <td>
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
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
                    </td>
                    <td>
                      <div className="flex justify-end">
                        <Link to={`/landlord/rooms/${r.id}/edit`} className="btn-secondary px-3 py-1 text-xs">
                          Sửa
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <Pagination
          className="mt-6"
          page={page}
          totalPages={totalPages}
          disabled={busy}
          onPageChange={(p) => {
            setPage(p);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        />
      </div>
    </div>
  );
}
