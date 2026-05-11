import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { postsApi } from "../api/postsApi";
import { Icons } from "../ui/icons";
import { notify } from "../ui/toast";
import { Pagination } from "../components/Pagination.jsx";
import { SkeletonBlock, SkeletonText } from "../components/Skeleton.jsx";

const PAGE_SIZE = 8;

function BlogListSkeleton() {
  return (
    <div className="mt-8 grid gap-4">
      {Array.from({ length: 6 }).map((_, idx) => (
        <div
          key={`blog-sk-${idx}`}
          className="grid gap-4 rounded-2xl border border-ink-200 bg-white p-4 sm:grid-cols-[220px_minmax(0,1fr)] sm:p-5"
        >
          <SkeletonBlock className="h-36 w-full" radius="rounded-xl" staggerIndex={idx} />
          <div className="grid gap-2">
            <SkeletonBlock className="h-5 w-4/5" staggerIndex={idx + 1} />
            <SkeletonText lines={2} staggerBase={idx + 2} />
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <SkeletonBlock className="h-6 w-28" radius="rounded-full" staggerIndex={idx + 5} />
              <SkeletonBlock className="h-6 w-24" radius="rounded-full" staggerIndex={idx + 6} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function BlogListPage() {
  const I = Icons;
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [categoryId, setCategoryId] = useState("");
  const [keywordInput, setKeywordInput] = useState("");
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const keyword = useMemo(() => keywordInput.trim(), [keywordInput]);

  const [debouncedKeyword, setDebouncedKeyword] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDebouncedKeyword(keyword), 350);
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
        const data = await postsApi.list({
          limit: PAGE_SIZE,
          offset: (page - 1) * PAGE_SIZE,
          categoryId: categoryId || undefined,
          keyword: debouncedKeyword || undefined
        });
        if (!cancelled) {
          setPosts(data.posts || []);
          setTotal(Number(data.total) || 0);
        }
      } catch (err) {
        const message = err?.response?.data?.message || "Không tải được bài viết";
        if (!cancelled) setError(message);
        notify.error(message);
      } finally {
        if (!cancelled) setBusy(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [categoryId, debouncedKeyword, page]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const cats = await postsApi.categories();
        if (!cancelled) setCategories(cats);
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mx-auto w-full max-w-5xl">
      <div className="rounded-3xl border border-ink-200 bg-white/90 p-6 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between" data-aos="fade-up">
          <div>
            <div className="text-xs uppercase tracking-[0.25em] text-brand-500">Blog & Cẩm nang</div>
            <h1 className="mt-2 text-3xl font-bold text-ink-900 md:text-4xl">Kinh nghiệm thuê trọ & quản lý phòng</h1>
            <p className="mt-2 text-sm text-ink-500">
              Tổng hợp bài viết hữu ích giúp bạn tìm và quản lý phòng trọ hiệu quả, an toàn và tiết kiệm.
            </p>
          </div>
          <Link to="/" className="btn-secondary">
            <I.Room className="mr-2 text-[14px]" />
            Về trang chủ
          </Link>
        </div>

        <div className="mt-6 grid gap-3 sm:max-w-2xl sm:grid-cols-2 sm:items-end" data-aos="fade-up" data-aos-delay="80">
          <label className="grid gap-2 text-sm text-ink-600">
            Từ khoá
            <div className="relative">
              <I.Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[12px] text-ink-400" />
              <input
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                placeholder="Nhập tên bài viết..."
                className="input-base pl-9"
              />
              {keywordInput ? (
                <button
                  type="button"
                  onClick={() => setKeywordInput("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-xs text-ink-500 hover:bg-ink-50"
                  aria-label="Xoá từ khoá"
                >
                  ✕
                </button>
              ) : null}
            </div>
          </label>
          <label className="grid gap-2 text-sm text-ink-600">
            Chủ đề
            <div className="relative">
              <I.Category className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[12px] text-ink-400" />
              <select
                value={categoryId}
                onChange={(e) => {
                  setCategoryId(e.target.value);
                  setPage(1);
                }}
                className="input-base pl-8"
              >
                <option value="">Tất cả</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </label>
        </div>

        {busy ? <BlogListSkeleton /> : null}
        {error ? (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {!busy && !error ? (
          <p className="mt-4 text-sm text-ink-600">
            {total > 0 ? (
              <>
                Tìm thấy <span className="font-semibold text-ink-900">{total.toLocaleString("vi-VN")}</span> bài viết
                {totalPages > 1 ? (
                  <span className="text-ink-500">
                    {" "}
                    (trang {page}/{totalPages})
                  </span>
                ) : null}
                .
              </>
            ) : (
              "Chưa có bài viết phù hợp."
            )}
          </p>
        ) : null}

        <div className="mt-8 grid gap-4">
          {!busy && posts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-ink-200 bg-ink-50 px-4 py-6 text-sm text-ink-500">
              Chưa có bài viết nào. Hãy quay lại sau hoặc đọc thêm tin tức khác.
            </div>
          ) : null}
          {!busy && posts.map((p, idx) => (
            <Link
              key={p.id}
              to={`/blog/${p.slug}`}
              className="group grid gap-4 rounded-2xl border border-ink-200 bg-white p-4 transition hover:-translate-y-0.5 hover:border-brand-200 sm:grid-cols-[220px_minmax(0,1fr)] sm:p-5"
              data-aos="fade-up"
              data-aos-delay={Math.min(idx * 70, 280)}
            >
              <div className="relative h-36 w-full overflow-hidden rounded-xl border border-ink-200 bg-ink-50">
                {p.cover_image_url ? (
                  <img
                    src={p.cover_image_url}
                    alt={p.title}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="grid h-full w-full place-items-center text-xs text-ink-400">
                    <I.Newspaper className="mr-1 text-[14px]" />
                    Không có ảnh bìa
                  </div>
                )}
                {p.category_name ? (
                  <div className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-black/55 px-2 py-1 text-[10px] font-medium text-slate-50 backdrop-blur">
                    <I.Tag className="text-[10px] text-amber-300" />
                    {p.category_name}
                  </div>
                ) : null}
              </div>
              <div className="grid gap-2">
                <div className="text-base font-semibold text-ink-900 group-hover:text-brand-700">
                  {p.title}
                </div>
                <div className="text-sm text-ink-500 line-clamp-2">{p.excerpt || "—"}</div>
                <div className="flex flex-wrap items-center gap-3 text-[11px] text-ink-500">
                  <span className="inline-flex items-center gap-1 rounded-full bg-ink-50 px-2 py-1">
                    <I.User className="text-[10px]" />
                    {p.author_full_name || "Admin"}
                  </span>
                  {p.published_at ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-ink-50 px-2 py-1">
                      <I.Clock className="text-[10px]" />
                      {new Date(p.published_at).toLocaleDateString("vi-VN")}
                    </span>
                  ) : null}
                </div>
              </div>
            </Link>
          ))}
        </div>

        <Pagination
          className="mt-8"
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

