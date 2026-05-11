import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { postsApi } from "../api/postsApi";
import { Icons } from "../ui/icons";
import { notify } from "../ui/toast";
import { Pagination } from "../components/Pagination.jsx";

const PAGE_SIZE = 10;

export default function MyBookmarksPage() {
  const I = Icons;
  const location = useLocation();
  const mode = location.pathname.includes("/likes") ? "likes" : "bookmarks";
  const isLikes = mode === "likes";
  const [items, setItems] = useState([]);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  async function load() {
    setBusy(true);
    setError("");
    try {
      const data = isLikes
        ? await postsApi.myLikes({ page, limit: PAGE_SIZE })
        : await postsApi.myBookmarks({ page, limit: PAGE_SIZE });
      setItems((isLikes ? data.likes : data.bookmarks) || data.items || []);
      setTotal(Number(data.total) || 0);
      setTotalPages(Math.max(1, Number(data.totalPages) || Math.ceil((Number(data.total) || 0) / PAGE_SIZE)));
    } catch (err) {
      const message = err?.response?.data?.message || `Không tải được danh sách ${isLikes ? "đã thích" : "đã lưu"}`;
      setError(message);
      notify.error(message);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, isLikes]);

  async function onRemove(postId) {
    setError("");
    try {
      if (isLikes) {
        await postsApi.likeRemove(postId);
        notify.success("Đã bỏ thích bài viết");
      } else {
        await postsApi.bookmarkRemove(postId);
        notify.success("Đã bỏ lưu bài viết");
      }
      await load();
    } catch (err) {
      const message = err?.response?.data?.message || "Bỏ lưu thất bại";
      setError(message);
      notify.error(message);
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl">
      <div className="toolbar">
        <div>
          <div className="page-kicker">Tài khoản</div>
          <h1 className="page-title">{isLikes ? "Bài viết đã thích" : "Bài viết đã lưu"}</h1>
          <p className="page-subtitle">
            {isLikes ? "Danh sách bài viết bạn đã thích." : "Danh sách bài viết bạn đã bookmark."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/dashboard" className="btn-secondary">
            <I.Back className="mr-2 text-[14px]" />
            Dashboard
          </Link>
          <button type="button" className="btn-secondary inline-flex items-center gap-2" onClick={load} disabled={busy}>
            <I.Refresh className="text-[14px]" />
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
        <div className="mb-4 inline-flex rounded-xl bg-slate-100 p-1 text-xs font-semibold">
          <Link
            to="/me/bookmarks"
            className={`rounded-lg px-3 py-1.5 ${!isLikes ? "bg-white text-slate-900 shadow-sm" : "text-slate-600"}`}
          >
            Đã lưu
          </Link>
          <Link
            to="/me/likes"
            className={`rounded-lg px-3 py-1.5 ${isLikes ? "bg-white text-slate-900 shadow-sm" : "text-slate-600"}`}
          >
            Đã thích
          </Link>
        </div>
        {!busy && items.length === 0 ? (
          <div className="rounded-xl bg-slate-50 px-4 py-6 text-sm text-slate-500">
            {isLikes
              ? "Bạn chưa thích bài viết nào. Hãy vào trang blog để thả tim bài viết yêu thích."
              : "Bạn chưa lưu bài viết nào. Hãy vào trang blog để lưu bài viết hữu ích."}
          </div>
        ) : (
          <div className="grid gap-3">
            {items.map((p) => {
              const slug = p.slug || p.post_slug;
              const postId = p.post_id || p.id;
              return (
                <div
                  key={postId}
                  className="flex flex-col gap-3 rounded-2xl bg-white px-4 py-3 ring-1 ring-slate-200/70 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-slate-900">{p.title || "—"}</div>
                    {p.excerpt ? <div className="mt-1 line-clamp-1 text-xs text-slate-500">{p.excerpt}</div> : null}
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                      {p.category_name ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-1">
                          <I.Tag className="text-[10px]" />
                          {p.category_name}
                        </span>
                      ) : null}
                      {p.published_at ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-1">
                          <I.Clock className="text-[10px]" />
                          {new Date(p.published_at).toLocaleDateString("vi-VN")}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center justify-end gap-2">
                    {slug ? (
                      <Link to={`/blog/${slug}`} className="btn-secondary px-3 py-1 text-xs">
                        Xem
                      </Link>
                    ) : null}
                    <button
                      type="button"
                      className="btn-outline inline-flex items-center gap-2 px-3 py-1 text-xs"
                      onClick={() => onRemove(postId)}
                      disabled={busy}
                    >
                      <I.Bookmark className="text-[12px]" />
                      {isLikes ? "Bỏ thích" : "Bỏ lưu"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

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
