import { useEffect, useMemo, useState } from "react";
import { usersApi } from "../api/usersApi";
import { notify } from "../ui/toast";
import { Icons } from "../ui/icons";
import { SkeletonTableRows } from "../components/Skeleton.jsx";

const emptyForm = {
  email: "",
  password: "",
  fullName: "",
  phone: "",
  role: "tenant",
  enabled: true,
  emailVerified: false
};

function roleLabel(role) {
  if (role === "admin") return "Quản trị viên";
  if (role === "landlord") return "Chủ trọ";
  return "Người thuê";
}

export default function AdminUsersPage() {
  const I = Icons;
  const [items, setItems] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [keyword, setKeyword] = useState("");
  const [role, setRole] = useState("all");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [editing, setEditing] = useState(null); // { mode: 'create'|'edit', user?: object }
  const [form, setForm] = useState({ ...emptyForm });

  const pageInfo = useMemo(() => `Trang ${page}/${Math.max(1, totalPages)}`, [page, totalPages]);

  async function load(nextPage = page, nextLimit = limit) {
    setBusy(true);
    setError("");
    try {
      const res = await usersApi.adminList({
        page: nextPage,
        limit: nextLimit,
        keyword: keyword.trim() || undefined,
        role: role === "all" ? undefined : role
      });
      setItems(Array.isArray(res.items) ? res.items : []);
      setTotal(Number(res.total || 0));
      setTotalPages(Math.max(1, Number(res.totalPages || 1)));
      setPage(Number(res.page || nextPage));
      setLimit(Number(res.limit || nextLimit));
    } catch (err) {
      const msg = err?.response?.data?.message || "Không tải được danh sách người dùng";
      setError(msg);
      notify.error(msg);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    load(1, limit);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const timer = setTimeout(() => {
      load(1, limit);
    }, 300);
    return () => clearTimeout(timer);
  }, [keyword, role, limit]); // eslint-disable-line react-hooks/exhaustive-deps

  function openCreate() {
    setForm({ ...emptyForm });
    setEditing({ mode: "create" });
  }

  function openEdit(user) {
    setForm({
      email: user.email || "",
      password: "",
      fullName: user.full_name || "",
      phone: user.phone || "",
      role: user.role || "tenant",
      enabled: Boolean(user.enabled),
      emailVerified: Boolean(user.email_verified)
    });
    setEditing({ mode: "edit", user });
  }

  function closeModal() {
    setEditing(null);
    setForm({ ...emptyForm });
  }

  async function save() {
    setBusy(true);
    setError("");
    try {
      if (editing?.mode === "create") {
        if (!form.password || form.password.length < 8) {
          throw new Error("Mật khẩu tối thiểu 8 ký tự");
        }
        await usersApi.adminCreate({
          email: form.email,
          password: form.password,
          fullName: form.fullName,
          phone: form.phone,
          role: form.role,
          enabled: form.enabled,
          emailVerified: form.emailVerified
        });
        notify.success("Đã tạo người dùng");
      } else if (editing?.mode === "edit") {
        await usersApi.adminUpdate(editing.user.id, {
          email: form.email,
          password: form.password || undefined,
          fullName: form.fullName,
          phone: form.phone,
          role: form.role,
          enabled: form.enabled,
          emailVerified: form.emailVerified
        });
        notify.success("Đã cập nhật người dùng");
      }
      closeModal();
      await load(page, limit);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "Lưu thất bại";
      setError(msg);
      notify.error(msg);
      setBusy(false);
    }
  }

  async function removeUser(user) {
    if (!window.confirm(`Xoá tài khoản "${user.email}"?`)) return;
    setBusy(true);
    setError("");
    try {
      await usersApi.adminDelete(user.id);
      notify.success("Đã xoá người dùng");
      await load(page, limit);
    } catch (err) {
      const msg = err?.response?.data?.message || "Xoá thất bại";
      setError(msg);
      notify.error(msg);
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl">
      <div className="toolbar">
        <div>
          <div className="page-kicker">Quản trị</div>
          <h1 className="page-title">Quản lý người dùng</h1>
          <p className="page-subtitle">Tạo, cập nhật, xoá và phân quyền tài khoản người dùng.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-secondary" onClick={() => load(page, limit)} disabled={busy}>
            <I.Refresh className="mr-2 text-[14px]" />
            Tải lại
          </button>
          <button type="button" className="btn-primary" onClick={openCreate} disabled={busy}>
            <I.Plus className="mr-2 text-[14px]" />
            Thêm người dùng
          </button>
        </div>
      </div>

      {error ? <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

      <section className="panel panel-pad mt-6">
        <div className="mb-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_180px_120px]">
          <input
            className="input-base"
            placeholder="Tìm theo email / họ tên / SĐT..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
          <select className="input-base" value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="all">Tất cả vai trò</option>
            <option value="tenant">Người thuê</option>
            <option value="landlord">Chủ trọ</option>
            <option value="admin">Quản trị viên</option>
          </select>
          <select className="input-base" value={limit} onChange={(e) => setLimit(Number(e.target.value))}>
            <option value={10}>10 / trang</option>
            <option value={20}>20 / trang</option>
            <option value={50}>50 / trang</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="table-clean w-full min-w-[920px]">
            <thead>
              <tr>
                <th className="w-20">ID</th>
                <th>Email</th>
                <th>Họ tên</th>
                <th>SĐT</th>
                <th>Vai trò</th>
                <th className="w-28">Kích hoạt</th>
                <th className="w-32">Xác thực email</th>
                <th className="w-40 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {busy ? <SkeletonTableRows rows={6} staggerBase={2} /> : null}
              {items.map((u) => (
                <tr key={u.id}>
                  <td className="text-xs font-semibold text-slate-600">#{u.id}</td>
                  <td className="font-medium text-slate-900">{u.email}</td>
                  <td>{u.full_name || "—"}</td>
                  <td>{u.phone || "—"}</td>
                  <td>{roleLabel(u.role)}</td>
                  <td>
                    <span className={`inline-flex rounded-full px-2 py-1 text-[10px] font-semibold ${u.enabled ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                      {u.enabled ? "Bật" : "Tắt"}
                    </span>
                  </td>
                  <td>
                    <span className={`inline-flex rounded-full px-2 py-1 text-[10px] font-semibold ${u.email_verified ? "bg-sky-50 text-sky-700" : "bg-slate-100 text-slate-600"}`}>
                      {u.email_verified ? "Đã xác thực" : "Chưa xác thực"}
                    </span>
                  </td>
                  <td>
                    <div className="flex justify-end gap-2">
                      <button type="button" className="btn-secondary px-3 py-1 text-xs" onClick={() => openEdit(u)} disabled={busy}>
                        Sửa
                      </button>
                      <button type="button" className="btn-outline px-3 py-1 text-xs" onClick={() => removeUser(u)} disabled={busy}>
                        Xoá
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!busy && items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-sm text-slate-500">
                    Không có người dùng phù hợp.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 pt-4 text-sm">
          <div className="text-slate-600">
            Tổng <span className="font-semibold text-slate-900">{total}</span> người dùng
          </div>
          <div className="flex items-center gap-2">
            <button type="button" className="btn-secondary px-3 py-1.5 text-xs" disabled={page <= 1 || busy} onClick={() => load(page - 1, limit)}>
              Trước
            </button>
            <span className="text-xs text-slate-500">{pageInfo}</span>
            <button type="button" className="btn-secondary px-3 py-1.5 text-xs" disabled={page >= totalPages || busy} onClick={() => load(page + 1, limit)}>
              Sau
            </button>
          </div>
        </div>
      </section>

      {editing ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4">
          <div className="w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-slate-200/70">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div className="text-sm font-semibold text-slate-900">{editing.mode === "create" ? "Tạo người dùng" : `Cập nhật người dùng #${editing.user.id}`}</div>
              <button type="button" className="btn-secondary px-3 py-1 text-xs" onClick={closeModal} disabled={busy}>
                Đóng
              </button>
            </div>
            <div className="grid gap-4 p-5 sm:grid-cols-2">
              <label className="grid gap-2 text-sm text-slate-600 sm:col-span-2">
                Email
                <input className="input-base" type="email" value={form.email} onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))} />
              </label>
              <label className="grid gap-2 text-sm text-slate-600 sm:col-span-2">
                Mật khẩu {editing.mode === "edit" ? "(để trống nếu không đổi)" : ""}
                <input className="input-base" type="password" value={form.password} onChange={(e) => setForm((s) => ({ ...s, password: e.target.value }))} />
              </label>
              <label className="grid gap-2 text-sm text-slate-600">
                Họ tên
                <input className="input-base" value={form.fullName} onChange={(e) => setForm((s) => ({ ...s, fullName: e.target.value }))} />
              </label>
              <label className="grid gap-2 text-sm text-slate-600">
                Số điện thoại
                <input className="input-base" value={form.phone} onChange={(e) => setForm((s) => ({ ...s, phone: e.target.value }))} />
              </label>
              <label className="grid gap-2 text-sm text-slate-600">
                Vai trò
                <select className="input-base" value={form.role} onChange={(e) => setForm((s) => ({ ...s, role: e.target.value }))}>
                  <option value="tenant">Người thuê</option>
                  <option value="landlord">Chủ trọ</option>
                  <option value="admin">Quản trị viên</option>
                </select>
              </label>
              <label className="inline-flex items-center gap-2 pt-8 text-sm text-slate-600">
                <input type="checkbox" checked={form.enabled} onChange={(e) => setForm((s) => ({ ...s, enabled: e.target.checked }))} />
                Kích hoạt tài khoản
              </label>
              <label className="inline-flex items-center gap-2 text-sm text-slate-600 sm:col-span-2">
                <input type="checkbox" checked={form.emailVerified} onChange={(e) => setForm((s) => ({ ...s, emailVerified: e.target.checked }))} />
                Email đã xác thực
              </label>
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-4">
              <button type="button" className="btn-secondary" onClick={closeModal} disabled={busy}>
                Huỷ
              </button>
              <button type="button" className="btn-primary" onClick={save} disabled={busy}>
                Lưu
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

