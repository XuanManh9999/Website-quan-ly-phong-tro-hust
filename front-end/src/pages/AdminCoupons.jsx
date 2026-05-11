import { useEffect, useMemo, useState } from "react";
import { couponsApi } from "../api/couponsApi.js";
import { packagesApi } from "../api/packagesApi.js";
import { Icons } from "../ui/icons";
import { notify } from "../ui/toast";

function parsePkgCodes(row) {
  const raw = row.applicable_package_codes;
  if (raw == null) return [];
  try {
    const a = typeof raw === "string" ? JSON.parse(raw) : raw;
    return Array.isArray(a) ? a.map((x) => String(x).toLowerCase()) : [];
  } catch {
    return [];
  }
}

function formatPkgFilter(row, nameByCode) {
  const codes = parsePkgCodes(row);
  if (codes.length === 0) return "";
  return codes.map((c) => nameByCode.get(c) || c).join(", ");
}

const empty = {
  code: "",
  discountType: "percent",
  discountValue: 10,
  maxDiscountVnd: "",
  applicablePackageCodes: [],
  maxUses: "",
  perUserLimit: 1,
  validFrom: "",
  validUntil: "",
  isActive: true,
  title: ""
};

export default function AdminCouponsPage() {
  const I = Icons;
  const [items, setItems] = useState([]);
  const [packages, setPackages] = useState([]);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);

  const nameByCode = useMemo(() => {
    const m = new Map();
    for (const p of packages) {
      if (p?.code) m.set(String(p.code).toLowerCase(), p.name || p.code);
    }
    return m;
  }, [packages]);

  async function load() {
    setBusy(true);
    setError("");
    try {
      const list = await couponsApi.adminList();
      setItems(list);
    } catch (err) {
      const msg = err?.response?.data?.message || "Không tải được danh sách mã";
      setError(msg);
      notify.error(msg);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await packagesApi.list();
        if (!cancelled) setPackages(Array.isArray(list) ? list : []);
      } catch {
        if (!cancelled) setPackages([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const sorted = useMemo(() => [...items].sort((a, b) => Number(b.id) - Number(a.id)), [items]);

  function openCreate() {
    setEditing({ mode: "create" });
    setForm({ ...empty });
  }

  function openEdit(c) {
    setEditing({ mode: "edit", id: c.id });
    setForm({
      code: c.code || "",
      discountType: c.discount_type === "fixed" ? "fixed" : "percent",
      discountValue: Number(c.discount_value ?? 0),
      maxDiscountVnd: c.max_discount_vnd != null ? String(c.max_discount_vnd) : "",
      applicablePackageCodes: parsePkgCodes(c),
      maxUses: c.max_uses != null ? String(c.max_uses) : "",
      perUserLimit: Number(c.per_user_limit ?? 1),
      validFrom: c.valid_from ? String(c.valid_from).slice(0, 10) : "",
      validUntil: c.valid_until ? String(c.valid_until).slice(0, 10) : "",
      isActive: Boolean(c.is_active),
      title: c.title || ""
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
        discountType: form.discountType,
        discountValue: Number(form.discountValue),
        maxDiscountVnd: form.discountType === "percent" && form.maxDiscountVnd !== "" ? Number(form.maxDiscountVnd) : null,
        applicablePackageCodes:
          Array.isArray(form.applicablePackageCodes) && form.applicablePackageCodes.length
            ? form.applicablePackageCodes
            : null,
        maxUses: form.maxUses !== "" ? Number(form.maxUses) : null,
        perUserLimit: Number(form.perUserLimit) || 1,
        validFrom: form.validFrom || null,
        validUntil: form.validUntil || null,
        isActive: Boolean(form.isActive),
        title: form.title || null
      };
      if (editing?.mode === "create") {
        await couponsApi.adminCreate(payload);
        notify.success("Đã tạo mã giảm giá");
      } else {
        await couponsApi.adminUpdate(editing.id, payload);
        notify.success("Đã cập nhật mã");
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

  async function remove(c) {
    if (!window.confirm(`Xoá mã "${c.code}"?`)) return;
    setBusy(true);
    setError("");
    try {
      await couponsApi.adminRemove(c.id);
      notify.success("Đã xoá mã");
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
          <h1 className="page-title">Mã giảm giá gói</h1>
          <p className="page-subtitle">
            Tạo mã % hoặc số tiền cố định. Chủ trọ nhập khi nâng cấp gói trên Dashboard. Không chọn gói nào = áp dụng mọi gói trả phí.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-secondary" onClick={load} disabled={busy}>
            <I.Refresh className="mr-2 text-[14px]" />
            Tải lại
          </button>
          <button type="button" className="btn-primary" onClick={openCreate} disabled={busy}>
            + Tạo mã
          </button>
        </div>
      </div>

      {error ? (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      ) : null}

      <div className="mt-6 panel panel-pad">
        {busy ? <div className="text-sm text-slate-500">Đang tải...</div> : null}
        <table className="table-clean w-full min-w-[900px]">
          <thead>
            <tr>
              <th>Mã</th>
              <th>Loại</th>
              <th>Giá trị</th>
              <th>Gói áp dụng</th>
              <th>Lượt</th>
              <th>Hạn</th>
              <th>Trạng thái</th>
              <th className="text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((c) => (
              <tr key={c.id}>
                <td className="font-mono text-xs font-semibold text-slate-900">{c.code}</td>
                <td className="text-xs">{c.discount_type === "fixed" ? "Cố định (đ)" : "Phần trăm"}</td>
                <td className="text-xs">
                  {c.discount_type === "fixed"
                    ? `${Number(c.discount_value).toLocaleString("vi-VN")}đ`
                    : `${c.discount_value}%${c.max_discount_vnd ? ` (tối đa ${Number(c.max_discount_vnd).toLocaleString("vi-VN")}đ)` : ""}`}
                </td>
                <td className="max-w-[200px] truncate text-xs text-slate-600" title={formatPkgFilter(c, nameByCode) || "Tất cả"}>
                  {formatPkgFilter(c, nameByCode) || "Tất cả"}
                </td>
                <td className="text-xs text-slate-600">
                  {c.paid_uses ?? 0} trả tiền / {c.active_uses ?? 0} giữ chỗ
                  {c.max_uses != null ? ` (tối đa ${c.max_uses})` : ""}
                </td>
                <td className="text-[11px] text-slate-500">
                  {c.valid_from ? c.valid_from : "—"} → {c.valid_until ? c.valid_until : "—"}
                </td>
                <td>
                  <span
                    className={`inline-flex rounded-full px-2 py-1 text-[10px] font-semibold ${
                      c.is_active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {c.is_active ? "Bật" : "Tắt"}
                  </span>
                </td>
                <td>
                  <div className="flex justify-end gap-2">
                    <button type="button" className="btn-secondary px-3 py-1 text-xs" onClick={() => openEdit(c)} disabled={busy}>
                      Sửa
                    </button>
                    <button type="button" className="btn-outline px-3 py-1 text-xs" onClick={() => remove(c)} disabled={busy}>
                      Xoá
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!busy && sorted.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-10 text-center text-sm text-slate-500">
                  Chưa có mã giảm giá.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {editing ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4">
          <div className="max-h-[min(90vh,720px)] w-full max-w-xl overflow-y-auto rounded-2xl bg-white shadow-xl ring-1 ring-slate-200/70">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div className="text-sm font-semibold text-slate-900">
                {editing.mode === "create" ? "Tạo mã giảm giá" : "Cập nhật mã"}
              </div>
              <button type="button" className="btn-secondary px-3 py-1 text-xs" onClick={close} disabled={busy}>
                Đóng
              </button>
            </div>
            <div className="p-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2 text-sm text-slate-600 sm:col-span-2">
                  Mã (in hoa, không dấu cách)
                  <input
                    value={form.code}
                    onChange={(e) => setForm((s) => ({ ...s, code: e.target.value.toUpperCase().replace(/\s+/g, "") }))}
                    className="input-base font-mono"
                    placeholder="VD: SUMMER2026"
                  />
                </label>
                <label className="grid gap-2 text-sm text-slate-600">
                  Loại giảm
                  <select
                    value={form.discountType}
                    onChange={(e) => setForm((s) => ({ ...s, discountType: e.target.value }))}
                    className="input-base"
                  >
                    <option value="percent">Phần trăm (%)</option>
                    <option value="fixed">Số tiền cố định (VNĐ)</option>
                  </select>
                </label>
                <label className="grid gap-2 text-sm text-slate-600">
                  {form.discountType === "percent" ? "Phần trăm (1–100)" : "Số tiền giảm (VNĐ)"}
                  <input
                    value={form.discountValue}
                    onChange={(e) => setForm((s) => ({ ...s, discountValue: e.target.value }))}
                    inputMode="numeric"
                    className="input-base"
                  />
                </label>
                {form.discountType === "percent" ? (
                  <label className="grid gap-2 text-sm text-slate-600 sm:col-span-2">
                    Trần giảm (VNĐ, tuỳ chọn)
                    <input
                      value={form.maxDiscountVnd}
                      onChange={(e) => setForm((s) => ({ ...s, maxDiscountVnd: e.target.value }))}
                      inputMode="numeric"
                      className="input-base"
                      placeholder="Để trống = không giới hạn"
                    />
                  </label>
                ) : null}
                <div className="grid gap-2 text-sm text-slate-600 sm:col-span-2">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span>Gói áp dụng</span>
                    <span className="text-[11px] font-normal text-slate-500">Không chọn = mọi gói</span>
                  </div>
                  <div className="max-h-40 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2">
                    {packages.length === 0 ? (
                      <p className="text-xs text-slate-500">Đang tải danh sách gói…</p>
                    ) : (
                      <ul className="space-y-2">
                        {packages.map((p) => {
                          const code = String(p.code || "").toLowerCase();
                          const checked = form.applicablePackageCodes.includes(code);
                          return (
                            <li key={code || p.id}>
                              <label className="flex cursor-pointer items-start gap-2 text-sm text-slate-800">
                                <input
                                  type="checkbox"
                                  className="mt-0.5 rounded border-slate-300"
                                  checked={checked}
                                  onChange={() => {
                                    setForm((s) => {
                                      const set = new Set(s.applicablePackageCodes);
                                      if (set.has(code)) set.delete(code);
                                      else set.add(code);
                                      return { ...s, applicablePackageCodes: [...set] };
                                    });
                                  }}
                                />
                                <span>
                                  <span className="font-medium">{p.name || code}</span>
                                  <span className="ml-1 font-mono text-[11px] text-slate-500">({code})</span>
                                </span>
                              </label>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                </div>
                <label className="grid gap-2 text-sm text-slate-600">
                  Tổng lượt tối đa
                  <input
                    value={form.maxUses}
                    onChange={(e) => setForm((s) => ({ ...s, maxUses: e.target.value }))}
                    inputMode="numeric"
                    className="input-base"
                    placeholder="Trống = không giới hạn"
                  />
                </label>
                <label className="grid gap-2 text-sm text-slate-600">
                  Lượt / người dùng
                  <input
                    value={form.perUserLimit}
                    onChange={(e) => setForm((s) => ({ ...s, perUserLimit: e.target.value }))}
                    inputMode="numeric"
                    className="input-base"
                  />
                </label>
                <label className="grid gap-2 text-sm text-slate-600">
                  Có hiệu từ
                  <input
                    type="date"
                    value={form.validFrom}
                    onChange={(e) => setForm((s) => ({ ...s, validFrom: e.target.value }))}
                    className="input-base"
                  />
                </label>
                <label className="grid gap-2 text-sm text-slate-600">
                  Đến hết
                  <input
                    type="date"
                    value={form.validUntil}
                    onChange={(e) => setForm((s) => ({ ...s, validUntil: e.target.value }))}
                    className="input-base"
                  />
                </label>
                <label className="grid gap-2 text-sm text-slate-600 sm:col-span-2">
                  Ghi chú hiển thị (admin)
                  <input
                    value={form.title}
                    onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))}
                    className="input-base"
                  />
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-600 sm:col-span-2">
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
