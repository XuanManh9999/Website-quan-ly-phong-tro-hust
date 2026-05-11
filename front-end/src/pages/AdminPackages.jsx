import { useEffect, useMemo, useState } from "react";
import { packagesApi } from "../api/packagesApi";
import { Icons } from "../ui/icons";
import { notify } from "../ui/toast";

const empty = {
  code: "",
  name: "",
  quotaPostsPerMonth: 5,
  price: 0,
  rank: 1,
  isActive: true
};

export default function AdminPackagesPage() {
  const I = Icons;
  const [items, setItems] = useState([]);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");

  const [editing, setEditing] = useState(null); // null | package obj
  const [form, setForm] = useState(empty);

  async function load() {
    setBusy(true);
    setError("");
    try {
      const list = await packagesApi.adminList();
      setItems(list);
    } catch (err) {
      const msg = err?.response?.data?.message || "Không tải được danh sách gói";
      setError(msg);
      notify.error(msg);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const sorted = useMemo(() => [...items].sort((a, b) => Number(a.rank) - Number(b.rank)), [items]);

  function openCreate() {
    setEditing({ mode: "create" });
    setForm({ ...empty });
  }

  function openEdit(p) {
    setEditing({ mode: "edit", id: p.id });
    setForm({
      code: p.code || "",
      name: p.name || "",
      quotaPostsPerMonth: Number(p.quota_posts_per_month ?? 0),
      price: Number(p.price ?? 0),
      rank: Number(p.package_rank ?? 1),
      isActive: Boolean(p.is_active)
    });
  }

  function close() {
    setEditing(null);
    setForm({ ...empty });
  }

  async function save() {
    setBusy(true);
    setError("");
    try {
      const payload = {
        code: form.code,
        name: form.name,
        quotaPostsPerMonth: Number(form.quotaPostsPerMonth),
        price: Number(form.price),
        rank: Number(form.rank),
        isActive: Boolean(form.isActive)
      };
      if (editing?.mode === "create") {
        await packagesApi.adminCreate(payload);
        notify.success("Đã tạo gói");
      } else {
        await packagesApi.adminUpdate(editing.id, payload);
        notify.success("Đã cập nhật gói");
      }
      await load();
      close();
    } catch (err) {
      const msg = err?.response?.data?.message || "Lưu thất bại";
      setError(msg);
      notify.error(msg);
      setBusy(false);
    }
  }

  async function remove(p) {
    if (!window.confirm(`Xoá gói "${p.name}"?`)) return;
    setBusy(true);
    setError("");
    try {
      await packagesApi.adminRemove(p.id);
      notify.success("Đã xoá gói");
      await load();
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
          <div className="page-kicker">Admin</div>
          <h1 className="page-title">Gói đăng tin</h1>
          <p className="page-subtitle">Tạo/sửa/bật-tắt gói. Chủ trọ sẽ mua gói theo cấu hình này.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-secondary" onClick={load} disabled={busy}>
            <I.Refresh className="mr-2 text-[14px]" />
            Tải lại
          </button>
          <button type="button" className="btn-primary" onClick={openCreate} disabled={busy}>
            + Tạo gói
          </button>
        </div>
      </div>

      {error ? (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      ) : null}

      <div className="mt-6 panel panel-pad">
        {busy ? <div className="text-sm text-slate-500">Đang tải...</div> : null}
        <table className="table-clean w-full min-w-[820px]">
          <thead>
            <tr>
              <th>Code</th>
              <th>Tên</th>
              <th>Quota/tháng</th>
              <th>Giá (VND)</th>
              <th>Rank</th>
              <th>Trạng thái</th>
              <th className="text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((p) => (
              <tr key={p.id}>
                <td className="text-xs text-slate-600">{p.code}</td>
                <td className="font-medium text-slate-900">{p.name}</td>
                <td>{Number(p.quota_posts_per_month).toLocaleString("vi-VN")}</td>
                <td className="font-semibold">{Number(p.price).toLocaleString("vi-VN")}</td>
                <td>{p.package_rank}</td>
                <td>
                  <span
                    className={`inline-flex rounded-full px-2 py-1 text-[10px] font-semibold ${
                      p.is_active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {p.is_active ? "Đang bật" : "Đang tắt"}
                  </span>
                </td>
                <td>
                  <div className="flex justify-end gap-2">
                    <button type="button" className="btn-secondary px-3 py-1 text-xs" onClick={() => openEdit(p)} disabled={busy}>
                      Sửa
                    </button>
                    <button type="button" className="btn-outline px-3 py-1 text-xs" onClick={() => remove(p)} disabled={busy}>
                      Xoá
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!busy && sorted.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-10 text-center text-sm text-slate-500">
                  Chưa có gói nào.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {editing ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4">
          <div className="w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-slate-200/70">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div className="text-sm font-semibold text-slate-900">
                {editing.mode === "create" ? "Tạo gói" : "Cập nhật gói"}
              </div>
              <button type="button" className="btn-secondary px-3 py-1 text-xs" onClick={close} disabled={busy}>
                Đóng
              </button>
            </div>
            <div className="p-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2 text-sm text-slate-600">
                  Code
                  <input value={form.code} onChange={(e) => setForm((s) => ({ ...s, code: e.target.value }))} className="input-base" />
                </label>
                <label className="grid gap-2 text-sm text-slate-600">
                  Tên
                  <input value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} className="input-base" />
                </label>
                <label className="grid gap-2 text-sm text-slate-600">
                  Quota/tháng
                  <input
                    value={form.quotaPostsPerMonth}
                    onChange={(e) => setForm((s) => ({ ...s, quotaPostsPerMonth: e.target.value }))}
                    inputMode="numeric"
                    className="input-base"
                  />
                </label>
                <label className="grid gap-2 text-sm text-slate-600">
                  Giá (VND)
                  <input value={form.price} onChange={(e) => setForm((s) => ({ ...s, price: e.target.value }))} inputMode="numeric" className="input-base" />
                </label>
                <label className="grid gap-2 text-sm text-slate-600">
                  Rank
                  <input value={form.rank} onChange={(e) => setForm((s) => ({ ...s, rank: e.target.value }))} inputMode="numeric" className="input-base" />
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    checked={Boolean(form.isActive)}
                    onChange={(e) => setForm((s) => ({ ...s, isActive: e.target.checked }))}
                  />
                  Đang bật
                </label>
              </div>
              <div className="mt-5 flex justify-end gap-2">
                <button type="button" className="btn-secondary" onClick={close} disabled={busy}>
                  Huỷ
                </button>
                <button type="button" className="btn-primary" onClick={save} disabled={busy}>
                  Lưu
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

