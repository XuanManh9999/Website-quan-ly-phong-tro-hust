import { useEffect, useState } from "react";
import { postsApi } from "../api/postsApi";
import { Icons } from "../ui/icons";
import { notify } from "../ui/toast";

const emptyForm = {
  id: null,
  name: "",
  slug: "",
  description: ""
};

export default function AdminCategoriesPage() {
  const I = Icons;
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [keyword, setKeyword] = useState("");

  async function load() {
    setBusy(true);
    setError("");
    try {
      const data = await postsApi.adminCategories();
      setCategories(data);
    } catch (err) {
      const message = err?.response?.data?.message || "Không tải được chủ đề";
      setError(message);
      notify.error(message);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function onEdit(cat) {
    setForm({
      id: cat.id,
      name: cat.name || "",
      slug: cat.slug || "",
      description: cat.description || ""
    });
  }

  function onChange(e) {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  }

  function resetForm() {
    setForm(emptyForm);
  }

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const payload = {
        name: form.name,
        slug: form.slug || undefined,
        description: form.description || undefined
      };
      if (form.id) {
        await postsApi.adminUpdateCategory(form.id, payload);
      } else {
        await postsApi.adminCreateCategory(payload);
      }
      resetForm();
      await load();
      notify.success(form.id ? "Đã cập nhật chủ đề" : "Đã tạo chủ đề");
    } catch (err) {
      const message = err?.response?.data?.message || "Lưu chủ đề thất bại";
      setError(message);
      notify.error(message);
      setBusy(false);
    }
  }

  async function onRemove(id) {
    if (!window.confirm("Xoá chủ đề này?")) return;
    setBusy(true);
    setError("");
    try {
      await postsApi.adminRemoveCategory(id);
      if (form.id === id) resetForm();
      await load();
      notify.success("Đã xoá chủ đề");
    } catch (err) {
      const message = err?.response?.data?.message || "Xoá chủ đề thất bại";
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
          <h1 className="page-title">Chủ đề bài viết</h1>
          <p className="page-subtitle">Quản lý danh mục hiển thị ở trang blog.</p>
        </div>
        <button type="button" className="btn-secondary inline-flex items-center gap-2" onClick={load} disabled={busy}>
          <I.Refresh className="text-[14px]" />
          Tải lại
        </button>
      </div>

      {error ? (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}
      {busy ? <p className="mt-4 text-sm text-slate-500">Đang tải...</p> : null}

      <div className="mt-6 panel panel-pad">
        <div className="toolbar">
          <div className="relative w-full sm:max-w-md">
            <I.Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[12px] text-slate-400" />
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Tìm theo tên/slug..."
              className="input-base w-full pl-9"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Tổng</span>
            <span className="text-xs font-semibold text-slate-700">{categories.length}</span>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
          <div className="overflow-x-auto">
            {!busy && categories.length === 0 ? (
              <div className="rounded-xl bg-slate-50 px-4 py-6 text-sm text-slate-500">
                Chưa có chủ đề nào.
              </div>
            ) : (
              <table className="table-clean w-full min-w-[560px]">
                <thead>
                  <tr>
                    <th className="w-16">ID</th>
                    <th>Tên</th>
                    <th className="w-64">Slug</th>
                    <th className="w-24 text-right">Chọn</th>
                  </tr>
                </thead>
                <tbody>
                  {categories
                    .filter((c) => {
                      if (!keyword.trim()) return true;
                      const q = keyword.trim().toLowerCase();
                      return (
                        (c.name || "").toLowerCase().includes(q) ||
                        (c.slug || "").toLowerCase().includes(q)
                      );
                    })
                    .map((c) => (
                      <tr key={c.id} className={form.id === c.id ? "bg-brand-50/40" : ""}>
                        <td className="text-xs text-slate-500">#{c.id}</td>
                        <td>
                          <div className="text-sm font-medium text-slate-900">{c.name}</div>
                          {c.description ? (
                            <div className="mt-1 line-clamp-1 text-xs text-slate-500">{c.description}</div>
                          ) : null}
                        </td>
                        <td className="text-xs text-slate-500">{c.slug}</td>
                        <td>
                          <div className="flex justify-end">
                            <button
                              type="button"
                              className="btn-secondary px-3 py-1 text-xs"
                              onClick={() => onEdit(c)}
                            >
                              <I.Edit className="mr-2 text-[13px]" />
                              Sửa
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="panel panel-pad">
            <div className="text-sm font-semibold text-slate-900">
              {form.id ? "Sửa chủ đề" : "Tạo chủ đề mới"}
            </div>
            <form onSubmit={onSubmit} className="mt-4 grid gap-4">
              <label className="grid gap-2 text-sm text-slate-600">
                Tên chủ đề
                <input
                  name="name"
                  value={form.name}
                  onChange={onChange}
                  required
                  placeholder="Ví dụ: Kinh nghiệm thuê trọ"
                  className="input-base"
                />
              </label>
              <label className="grid gap-2 text-sm text-slate-600">
                Slug (tuỳ chọn)
                <input
                  name="slug"
                  value={form.slug}
                  onChange={onChange}
                  placeholder="vd: kinh-nghiem-thue-tro"
                  className="input-base"
                />
              </label>
              <label className="grid gap-2 text-sm text-slate-600">
                Mô tả (tuỳ chọn)
                <input
                  name="description"
                  value={form.description}
                  onChange={onChange}
                  placeholder="Mô tả ngắn về chủ đề"
                  className="input-base"
                />
              </label>

              <div className="flex flex-wrap gap-2">
                <button className="btn-primary inline-flex items-center gap-2" disabled={busy} type="submit">
                  <I.Edit className="text-[14px]" />
                  {busy ? "Đang lưu..." : "Lưu"}
                </button>
                {form.id ? (
                  <>
                    <button
                      type="button"
                      className="btn-outline inline-flex items-center gap-2"
                      onClick={() => onRemove(form.id)}
                      disabled={busy}
                    >
                      <I.Trash className="text-[14px]" />
                      Xoá
                    </button>
                    <button type="button" className="btn-secondary" onClick={resetForm} disabled={busy}>
                      + Tạo mới
                    </button>
                  </>
                ) : null}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

