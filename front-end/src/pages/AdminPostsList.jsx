import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaNewspaper, FaArrowRotateRight, FaPlus } from "react-icons/fa6";
import { postsApi } from "../api/postsApi";
import { Icons } from "../ui/icons";
import { notify } from "../ui/toast";
import { Pagination } from "../components/Pagination.jsx";
import { postStatusLabelVn } from "../utils/labels.js";

export default function AdminPostsListPage() {
  const nav = useNavigate();
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [keyword, setKeyword] = useState("");
  const I = Icons;
  const [status, setStatus] = useState("");

  async function load() {
    setBusy(true);
    setError("");
    try {
      const data = await postsApi.adminList({
        page,
        limit,
        search: keyword || undefined,
        status: status || undefined
      });
      setPosts(data.items || []);
      setTotal(data.total || 0);
      setTotalPages(Number(data.totalPages) || Math.ceil((data.total || 0) / limit) || 1);
    } catch (err) {
      const message = err?.response?.data?.message || "Không tải được bài viết";
      setError(message);
      notify.error(message);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    load();
  }, [page]);

  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      load();
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyword, status]);

  function onCreate() {
    // Chỉ điều hướng tới trang tạo mới, không tạo bản ghi ngay
    nav("/admin/posts/new");
  }

  async function publish(id) {
    setBusy(true);
    setError("");
    try {
      await postsApi.adminPublish(id);
      await load();
      notify.success("Đã đăng bài viết");
    } catch (err) {
      const message = err?.response?.data?.message || "Đăng bài thất bại";
      setError(message);
      notify.error(message);
      setBusy(false);
    }
  }

  async function unpublish(id) {
    setBusy(true);
    setError("");
    try {
      await postsApi.adminUnpublish(id);
      await load();
      notify.success("Đã ẩn bài viết");
    } catch (err) {
      const message = err?.response?.data?.message || "Ẩn bài thất bại";
      setError(message);
      notify.error(message);
      setBusy(false);
    }
  }

  async function remove(id) {
    if (!window.confirm("Xoá bài viết này?")) return;
    setBusy(true);
    setError("");
    try {
      await postsApi.adminRemove(id);
      await load();
      notify.success("Đã xoá bài viết");
    } catch (err) {
      const message = err?.response?.data?.message || "Xoá thất bại";
      setError(message);
      notify.error(message);
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
            <FaNewspaper />
          </span>
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Quản lý bài viết</h1>
            <p className="mt-1 text-sm text-slate-500">
              Tạo, chỉnh sửa và đăng/ẩn bài viết trên hệ thống.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="btn-secondary inline-flex items-center gap-2"
            onClick={load}
            disabled={busy}
          >
            <FaArrowRotateRight className="text-xs" />
            <span>Tải lại</span>
          </button>
          <button
            type="button"
            className="btn-primary inline-flex items-center gap-2"
            onClick={onCreate}
            disabled={busy}
          >
            <FaPlus className="text-xs" />
            <span>Thêm bài viết</span>
          </button>
        </div>
      </div>

      {error ? (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}
      {busy ? (
        <p className="mt-4 text-sm text-slate-500">Đang tải...</p>
      ) : null}

      {/* Search + table */}
      <div className="mt-6 rounded-2xl bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1">
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Tìm theo tiêu đề, slug..."
              className="input-base w-full"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Trạng thái</span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="input-base w-full sm:w-[180px]"
            >
              <option value="">Tất cả</option>
              <option value="draft">Nháp</option>
              <option value="published">Đã đăng</option>
            </select>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          {!busy && posts.length === 0 ? (
            <div className="text-sm text-slate-500">Chưa có bài viết.</div>
          ) : (
            <table className="table-base w-full min-w-[640px]">
              <thead>
                <tr>
                  <th className="w-12 text-left">ID</th>
                  <th className="text-left">Tiêu đề</th>
                  <th className="w-40 text-left">Trạng thái</th>
                  <th className="w-56 text-left">Slug</th>
                  <th className="w-40 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {posts.map((p) => (
                    <tr key={p.id}>
                      <td className="text-xs text-slate-500">#{p.id}</td>
                      <td>
                        <div className="text-sm font-medium text-slate-900">{p.title}</div>
                        {p.excerpt ? (
                          <div className="mt-1 line-clamp-1 text-xs text-slate-500">
                            {p.excerpt}
                          </div>
                        ) : null}
                      </td>
                      <td className="text-sm">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                            p.status === "published"
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {postStatusLabelVn(p.status)}
                        </span>
                      </td>
                      <td className="text-xs text-slate-500">{p.slug}</td>
                      <td>
                        <div className="flex justify-end gap-2">
                          <Link
                            to={`/admin/posts/${p.id}/edit`}
                            className="btn-secondary inline-flex items-center justify-center gap-1 px-3 py-1 text-xs"
                          >
                            <I.Edit className="text-[14px]" />
                            <span>Sửa</span>
                          </Link>
                          {p.status === "draft" ? (
                            <button
                              type="button"
                              className="btn-secondary inline-flex items-center justify-center gap-1 px-3 py-1 text-xs"
                              onClick={() => publish(p.id)}
                              disabled={busy}
                            >
                              <I.Publish className="text-[14px]" />
                              <span>Đăng</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="btn-secondary inline-flex items-center justify-center gap-1 px-3 py-1 text-xs"
                              onClick={() => unpublish(p.id)}
                              disabled={busy}
                            >
                              <I.Unpublish className="text-[14px]" />
                              <span>Ẩn</span>
                            </button>
                          )}
                          <button
                            type="button"
                            className="btn-outline inline-flex items-center justify-center gap-1 px-3 py-1 text-xs"
                            onClick={() => remove(p.id)}
                            disabled={busy}
                          >
                            <I.Trash className="text-[14px]" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="mt-4 flex flex-col gap-3 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <div>
            Tổng cộng {total} bài viết • Trang {page}/{totalPages}
          </div>
          <Pagination
            className="!justify-end"
            page={page}
            totalPages={totalPages}
            disabled={busy}
            onPageChange={(p) => setPage(p)}
          />
        </div>
      </div>
    </div>
  );
}

