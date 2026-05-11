import { useEffect, useMemo, useState } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { faqsApi } from "../api/faqsApi";
import { notify } from "../ui/toast";
import { Icons } from "../ui/icons";
import { FaCircleCheck, FaCirclePause, FaWandMagicSparkles } from "react-icons/fa6";

function emptyDraft() {
  return { question: "", answerHtml: "", sortOrder: 0, active: true };
}

export default function AdminFaqsPage() {
  const I = Icons;
  const [items, setItems] = useState([]);
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState(emptyDraft());
  const [editing, setEditing] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const canSave = useMemo(() => String(draft.question || "").trim().length > 0, [draft.question]);
  const filteredItems = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    return items.filter((it) => {
      const byKeyword = !q || String(it.question || "").toLowerCase().includes(q);
      const byStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && Boolean(it.active)) ||
        (statusFilter === "inactive" && !Boolean(it.active));
      return byKeyword && byStatus;
    });
  }, [items, keyword, statusFilter]);
  const totalPages = useMemo(() => Math.max(1, Math.ceil(filteredItems.length / pageSize)), [filteredItems.length, pageSize]);
  const pagedItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, page, pageSize]);
  async function load() {
    setBusy(true);
    try {
      const data = await faqsApi.adminList();
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      notify.error(err?.response?.data?.message || "Không tải được FAQ");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [keyword, statusFilter, pageSize]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  async function onCreate() {
    if (!canSave) return;
    setBusy(true);
    try {
      await faqsApi.adminCreate(draft);
      notify.success("Đã tạo FAQ");
      setDraft(emptyDraft());
      setShowCreateModal(false);
      await load();
    } catch (err) {
      notify.error(err?.response?.data?.message || "Tạo FAQ thất bại");
    } finally {
      setBusy(false);
    }
  }

  async function onUpdate(id, patch) {
    setBusy(true);
    try {
      await faqsApi.adminUpdate(id, patch);
      notify.success("Đã lưu");
      await load();
    } catch (err) {
      notify.error(err?.response?.data?.message || "Lưu thất bại");
    } finally {
      setBusy(false);
    }
  }

  async function onDelete(id) {
    if (!window.confirm("Xoá FAQ này?")) return;
    setBusy(true);
    try {
      await faqsApi.adminDelete(id);
      notify.success("Đã xoá");
      await load();
    } catch (err) {
      notify.error(err?.response?.data?.message || "Xoá thất bại");
    } finally {
      setBusy(false);
    }
  }

  async function onSaveEditing() {
    if (!editing) return;
    await onUpdate(editing.id, {
      question: editing.question,
      answerHtml: editing.answer_html,
      sortOrder: Number(editing.sort_order || 0),
      active: Boolean(editing.active)
    });
    setEditing(null);
  }

  return (
    <div className="mx-auto w-full max-w-6xl">
      <div className="toolbar">
        <div>
          <div className="page-kicker">Trung tâm hỗ trợ</div>
          <h1 className="page-title flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
              <I.Info className="text-[14px]" />
            </span>
            FAQ
          </h1>
          <p className="page-subtitle">Quản lý FAQ theo dạng bảng để đồng nhất với các trang quản trị khác.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600 sm:block">
            Tổng FAQ: {items.length}
          </div>
          <button type="button" className="btn-primary" disabled={busy} onClick={() => setShowCreateModal(true)}>
            <I.Plus className="mr-2 text-[14px]" />
            Thêm FAQ
          </button>
          <button type="button" className="btn-outline" onClick={load} disabled={busy}>
            <I.Refresh className="mr-2 text-[14px]" />
            Làm mới
          </button>
        </div>
      </div>

      <div className="mt-6">
        <section className="panel panel-pad">
          {busy ? <p className="text-sm text-slate-500">Đang tải...</p> : null}
          <div className="mb-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_180px_120px]">
            <input
              className="input-base"
              placeholder="Tìm theo câu hỏi..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
            <select className="input-base" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Đang hiển thị</option>
              <option value="inactive">Tạm ẩn</option>
            </select>
            <select className="input-base" value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))}>
              <option value={5}>5 / trang</option>
              <option value={10}>10 / trang</option>
              <option value={20}>20 / trang</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="table-clean min-w-[760px]">
              <thead>
                <tr>
                  <th className="w-20">ID</th>
                  <th>Câu hỏi</th>
                  <th className="w-24">Sort</th>
                  <th className="w-36">Trạng thái</th>
                  <th className="w-40 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {pagedItems.map((it) => {
                  return (
                    <tr key={it.id}>
                      <td className="text-xs font-semibold text-slate-600">#{it.id}</td>
                      <td>
                        <div className="line-clamp-1 font-medium text-slate-900">{it.question}</div>
                      </td>
                      <td>{Number(it.sort_order || 0)}</td>
                      <td>
                        {it.active ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">
                            <FaCircleCheck className="text-[10px]" />
                            Hiển thị
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
                            <FaCirclePause className="text-[10px]" />
                            Tạm ẩn
                          </span>
                        )}
                      </td>
                      <td>
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            className="btn-secondary px-3 py-1.5 text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditing({ ...it });
                            }}
                          >
                            Sửa
                          </button>
                          <button
                            type="button"
                            className="inline-flex items-center justify-center rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 disabled:opacity-70"
                            disabled={busy}
                            onClick={(e) => {
                              e.stopPropagation();
                              onDelete(it.id);
                            }}
                          >
                            Xoá
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {!busy && pagedItems.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-sm text-slate-500">
                      Không có dữ liệu phù hợp bộ lọc.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 pt-4 text-sm">
            <div className="text-slate-600">
              Hiển thị <span className="font-semibold text-slate-900">{pagedItems.length}</span> /{" "}
              <span className="font-semibold text-slate-900">{filteredItems.length}</span> bản ghi
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="btn-secondary px-3 py-1.5 text-xs"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Trước
              </button>
              <span className="text-xs text-slate-500">
                Trang {page}/{totalPages}
              </span>
              <button
                type="button"
                className="btn-secondary px-3 py-1.5 text-xs"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Sau
              </button>
            </div>
          </div>
        </section>
      </div>

      {editing ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/45 p-4">
          <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <div className="text-sm font-semibold text-slate-900">Chỉnh sửa FAQ #{editing.id}</div>
                <div className="text-xs text-slate-500">Cập nhật nội dung chi tiết và trạng thái</div>
              </div>
              <button type="button" className="btn-secondary px-3 py-1.5 text-xs" onClick={() => setEditing(null)}>
                Đóng
              </button>
            </div>
            <div className="grid gap-3 p-5">
              <label className="grid gap-2 text-sm font-medium text-slate-700">
                Câu hỏi
                <input
                  className="input-base"
                  value={editing.question || ""}
                  onChange={(e) => setEditing((prev) => ({ ...prev, question: e.target.value }))}
                />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="grid gap-2 text-sm font-medium text-slate-700">
                  Thứ tự
                  <input
                    className="input-base"
                    type="number"
                    value={Number(editing.sort_order || 0)}
                    onChange={(e) => setEditing((prev) => ({ ...prev, sort_order: Number(e.target.value || 0) }))}
                  />
                </label>
                <label className="inline-flex items-center gap-2 pt-8 text-sm font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={Boolean(editing.active)}
                    onChange={(e) => setEditing((prev) => ({ ...prev, active: e.target.checked }))}
                  />
                  Active
                </label>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white ring-1 ring-slate-100">
                <ReactQuill
                  theme="snow"
                  value={editing.answer_html || ""}
                  onChange={(v) => setEditing((prev) => ({ ...prev, answer_html: v }))}
                />
              </div>
            </div>
            <div className="flex flex-wrap justify-end gap-2 border-t border-slate-200 px-5 py-4">
              <button type="button" className="btn-secondary" onClick={() => setEditing(null)}>
                Huỷ
              </button>
              <button type="button" className="btn-primary" disabled={busy} onClick={onSaveEditing}>
                <I.Publish className="mr-2 text-[14px]" />
                Lưu thay đổi
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showCreateModal ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/45 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                  <FaWandMagicSparkles className="text-[13px]" />
                </span>
                Thêm FAQ mới
              </div>
              <button type="button" className="btn-secondary px-3 py-1.5 text-xs" onClick={() => setShowCreateModal(false)}>
                Đóng
              </button>
            </div>
            <div className="grid gap-3 p-5">
              <label className="grid gap-2 text-sm font-medium text-slate-700">
                Câu hỏi
                <input
                  className="input-base"
                  value={draft.question}
                  onChange={(e) => setDraft((d) => ({ ...d, question: e.target.value }))}
                />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="grid gap-2 text-sm font-medium text-slate-700">
                  Thứ tự
                  <input
                    className="input-base"
                    type="number"
                    value={draft.sortOrder}
                    onChange={(e) => setDraft((d) => ({ ...d, sortOrder: Number(e.target.value || 0) }))}
                  />
                </label>
                <label className="inline-flex items-center gap-2 pt-8 text-sm font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={draft.active}
                    onChange={(e) => setDraft((d) => ({ ...d, active: e.target.checked }))}
                  />
                  Active
                  {draft.active ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                      <FaCircleCheck className="text-[10px]" />
                      Hiển thị
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                      <FaCirclePause className="text-[10px]" />
                      Tạm ẩn
                    </span>
                  )}
                </label>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white ring-1 ring-slate-100">
                <ReactQuill
                  theme="snow"
                  value={draft.answerHtml}
                  onChange={(v) => setDraft((d) => ({ ...d, answerHtml: v }))}
                />
              </div>
            </div>
            <div className="flex flex-wrap justify-end gap-2 border-t border-slate-200 px-5 py-4">
              <button type="button" className="btn-secondary" onClick={() => setShowCreateModal(false)}>
                Huỷ
              </button>
              <button type="button" className="btn-primary" disabled={busy || !canSave} onClick={onCreate}>
                <I.Plus className="mr-2 text-[14px]" />
                Tạo FAQ
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
