import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { pagesApi } from "../api/pagesApi";
import { notify } from "../ui/toast";
import { Icons } from "../ui/icons";

export default function AdminStaticPagesPage() {
  const I = Icons;
  const [items, setItems] = useState([]);
  const [busy, setBusy] = useState(true);

  async function load() {
    setBusy(true);
    try {
      const data = await pagesApi.adminList();
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      notify.error(err?.response?.data?.message || "Không tải được danh sách trang tĩnh");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="mx-auto w-full max-w-6xl">
      <div className="toolbar">
        <div>
          <div className="page-kicker">Nội dung</div>
          <h1 className="page-title">Trang tĩnh</h1>
          <p className="page-subtitle">Quản lý trang Giới thiệu, Điều khoản, Chính sách, v.v.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link className="btn-primary" to="/admin/pages/new">
            <I.Plus className="mr-2 text-[14px]" />
            Tạo trang
          </Link>
          <button type="button" className="btn-outline" onClick={load} disabled={busy}>
            <I.Refresh className="mr-2 text-[14px]" />
            Làm mới
          </button>
        </div>
      </div>

      <div className="panel panel-pad mt-6">
        {busy ? <p className="text-sm text-slate-500">Đang tải…</p> : null}
        {!busy && items.length === 0 ? <p className="text-sm text-slate-600">Chưa có trang.</p> : null}
        {!busy && items.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="table-clean w-full min-w-[760px] text-sm">
              <thead>
                <tr>
                  <th className="w-48">Slug</th>
                  <th>Tiêu đề</th>
                  <th className="w-28">Hiển thị</th>
                  <th className="w-40">Cập nhật</th>
                  <th className="w-32" />
                </tr>
              </thead>
              <tbody>
                {items.map((p) => (
                  <tr key={p.id}>
                    <td className="font-mono text-xs">{p.slug}</td>
                    <td className="font-medium text-slate-900">{p.title}</td>
                    <td>
                      <span
                        className={
                          p.published
                            ? "inline-flex rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700"
                            : "inline-flex rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600"
                        }
                      >
                        {p.published ? "Public" : "Ẩn"}
                      </span>
                    </td>
                    <td className="text-xs text-slate-500">
                      {p.updated_at ? new Date(p.updated_at).toLocaleString("vi-VN") : "—"}
                    </td>
                    <td className="text-right">
                      <Link className="btn-secondary" to={`/admin/pages/${p.id}/edit`}>
                        <I.Edit className="mr-2 text-[14px]" />
                        Sửa
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </div>
  );
}

