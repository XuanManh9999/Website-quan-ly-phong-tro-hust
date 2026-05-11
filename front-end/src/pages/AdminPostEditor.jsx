import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { postsApi } from "../api/postsApi";
import { Icons } from "../ui/icons";
import { notify } from "../ui/toast";
import { postStatusLabelVn } from "../utils/labels.js";

const MAX_COVER_IMAGE_BYTES = 2 * 1024 * 1024; // 2MB
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export default function AdminPostEditorPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const isNew = !id || id === "new";
  const postId = isNew ? null : Number(id);
  const I = Icons;

  const [post, setPost] = useState(null);
  const [busy, setBusy] = useState(!isNew);
  const [error, setError] = useState("");

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [contentHtml, setContentHtml] = useState("");
  const [categories, setCategories] = useState([]);
  const [categoryId, setCategoryId] = useState("");
  const [tags, setTags] = useState([]);
  const [tagIds, setTagIds] = useState([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (isNew) {
        setPost(null);
        setTitle("Bài viết mới");
        setSlug("");
        setExcerpt("");
        setCoverImageUrl("");
        setContentHtml("");
        setCategoryId("");
        setBusy(false);
        return;
      }
      setBusy(true);
      setError("");
      try {
        const p = await postsApi.adminDetail(postId);
        if (cancelled) return;
        setPost(p);
        setTitle(p.title || "");
        setSlug(p.slug || "");
        setExcerpt(p.excerpt || "");
        setCoverImageUrl(p.cover_image_url || "");
        setContentHtml(p.content_html || "");
        setCategoryId(p.category_id ? String(p.category_id) : "");
        setTagIds(Array.isArray(p.tag_ids) ? p.tag_ids : []);
      } catch (err) {
        if (!cancelled) setError(err?.response?.data?.message || "Không tải được bài viết");
      } finally {
        if (!cancelled) setBusy(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [postId, isNew]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const cats = await postsApi.adminCategories();
        if (!cancelled) setCategories(cats);
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const t = await postsApi.adminTags();
        if (!cancelled) setTags(Array.isArray(t) ? t : []);
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const quillModules = useMemo(
    () => ({
      toolbar: [
        [{ header: [1, 2, 3, false] }],
        ["bold", "italic", "underline", "strike"],
        [{ list: "ordered" }, { list: "bullet" }],
        ["blockquote", "code-block"],
        ["link", "image"],
        ["clean"]
      ]
    }),
    []
  );

  function fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error("Không đọc được tệp ảnh"));
      reader.readAsDataURL(file);
    });
  }

  async function onCoverFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      notify.error("Chỉ hỗ trợ ảnh JPG, PNG, WEBP hoặc GIF");
      e.target.value = "";
      return;
    }
    if (file.size > MAX_COVER_IMAGE_BYTES) {
      notify.error("Ảnh quá lớn. Vui lòng chọn ảnh nhỏ hơn 2MB");
      e.target.value = "";
      return;
    }
    try {
      const base64 = await fileToDataUrl(file);
      if (typeof base64 !== "string" || !base64.startsWith("data:image/")) {
        notify.error("Ảnh không hợp lệ");
        e.target.value = "";
        return;
      }
      setCoverImageUrl(base64);
      notify.success("Đã nạp ảnh và chuyển sang base64");
    } catch {
      notify.error("Không thể xử lý ảnh");
    } finally {
      e.target.value = "";
    }
  }

  async function save() {
    setBusy(true);
    setError("");
    try {
      if (isNew) {
        const created = await postsApi.adminCreate({
          title,
          slug: slug || undefined,
          excerpt,
          coverImageUrl: coverImageUrl || undefined,
          categoryId: categoryId ? Number(categoryId) : undefined,
          tagIds: tagIds.length ? tagIds : undefined,
          contentHtml: contentHtml || "<p></p>"
        });
        setPost(created);
        notify.success("Đã tạo bài viết");
        nav(`/admin/posts/${created.id}/edit`, { replace: true });
      } else {
        const updated = await postsApi.adminUpdate(postId, {
          title,
          slug: slug || undefined,
          excerpt,
          coverImageUrl: coverImageUrl || undefined,
          categoryId: categoryId ? Number(categoryId) : undefined,
          tagIds: tagIds.length ? tagIds : undefined,
          contentHtml
        });
        setPost(updated);
        notify.success("Đã lưu bài viết");
      }
    } catch (err) {
      const message = err?.response?.data?.message || "Lưu thất bại";
      setError(message);
      notify.error(message);
    } finally {
      setBusy(false);
    }
  }

  async function publish() {
    if (isNew) {
      notify.error("Vui lòng lưu bài viết trước khi đăng.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await postsApi.adminPublish(postId);
      const p = await postsApi.adminDetail(postId);
      setPost(p);
      notify.success("Đã đăng bài viết");
    } catch (err) {
      const message = err?.response?.data?.message || "Đăng bài thất bại";
      setError(message);
      notify.error(message);
    } finally {
      setBusy(false);
    }
  }

  async function unpublish() {
    if (isNew) return;
    setBusy(true);
    setError("");
    try {
      await postsApi.adminUnpublish(postId);
      const p = await postsApi.adminDetail(postId);
      setPost(p);
      notify.success("Đã ẩn bài viết");
    } catch (err) {
      const message = err?.response?.data?.message || "Ẩn bài thất bại";
      setError(message);
      notify.error(message);
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (isNew) {
      nav("/admin/posts", { replace: true });
      return;
    }
    if (!window.confirm("Xoá bài viết này?")) return;
    setBusy(true);
    setError("");
    try {
      await postsApi.adminRemove(postId);
      notify.success("Đã xoá bài viết");
      nav("/admin/posts", { replace: true });
    } catch (err) {
      const message = err?.response?.data?.message || "Xoá thất bại";
      setError(message);
      notify.error(message);
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-5xl">
      <div className="toolbar">
        <div>
          <div className="page-kicker">Admin</div>
          <h1 className="page-title">Trình soạn thảo bài viết</h1>
          <p className="page-subtitle">
            Trạng thái:{" "}
            <span className="font-semibold text-slate-700">{isNew ? "Mới" : postStatusLabelVn(post?.status)}</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/admin/posts" className="btn-secondary">
            <I.Back className="mr-2 text-[14px]" />
            Danh sách
          </Link>
          <button type="button" className="btn-secondary" onClick={save} disabled={busy}>
            <I.Edit className="mr-2 text-[14px]" />
            Lưu
          </button>
          {!isNew && post?.status === "draft" ? (
            <button type="button" className="btn-primary" onClick={publish} disabled={busy}>
              <I.Publish className="mr-2 text-[14px]" />
              Đăng
            </button>
          ) : (
            !isNew && post?.status ? (
              <button type="button" className="btn-secondary" onClick={unpublish} disabled={busy}>
                <I.Unpublish className="mr-2 text-[14px]" />
                Ẩn
              </button>
            ) : null
          )}
          {!isNew ? (
            <button type="button" className="btn-outline" onClick={remove} disabled={busy}>
              <I.Trash className="mr-2 text-[14px]" />
              Xoá
            </button>
          ) : (
            <button type="button" className="btn-outline" onClick={remove} disabled={busy}>
              Huỷ
            </button>
          )}
        </div>
      </div>

      {busy ? <p className="mt-4 text-sm text-slate-500">Đang tải...</p> : null}
      {error ? (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="mt-6 panel panel-pad">
        <div className="grid gap-5">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm text-slate-600 md:col-span-2">
              Tiêu đề
              <input value={title} onChange={(e) => setTitle(e.target.value)} className="input-base" />
            </label>
            <label className="grid gap-2 text-sm text-slate-600">
              Chủ đề
              <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="input-base">
                <option value="">-- Chưa chọn --</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-sm text-slate-600">
              Tags
              <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
                <div className="flex flex-wrap gap-2">
                  {tags.map((t) => {
                    const checked = tagIds.includes(t.id);
                    return (
                      <button
                        key={t.id}
                        type="button"
                        className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                          checked
                            ? "border-teal-200 bg-teal-50 text-teal-800"
                            : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                        }`}
                        onClick={() => {
                          setTagIds((prev) =>
                            prev.includes(t.id) ? prev.filter((x) => x !== t.id) : [...prev, t.id]
                          );
                        }}
                        disabled={busy}
                      >
                        {t.name}
                      </button>
                    );
                  })}
                  {tags.length === 0 ? <span className="text-xs text-slate-500">Chưa có tag.</span> : null}
                </div>
              </div>
            </label>
            <label className="grid gap-2 text-sm text-slate-600">
              Slug (tuỳ chọn)
              <input value={slug} onChange={(e) => setSlug(e.target.value)} className="input-base" />
            </label>
            <label className="grid gap-2 text-sm text-slate-600 md:col-span-2">
              Tóm tắt
              <input value={excerpt} onChange={(e) => setExcerpt(e.target.value)} className="input-base" />
            </label>
            <div className="grid gap-2 text-sm text-slate-600 md:col-span-2">
              <div className="font-medium">Ảnh bìa (lưu base64 vào DB)</div>
              <div className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={onCoverFileChange}
                  className="input-base bg-white"
                />
                <p className="text-xs text-slate-500">
                  Khuyến nghị: JPG/PNG/WEBP, dung lượng tối đa 2MB. Ảnh sẽ được lưu dạng base64 trong cơ sở dữ liệu.
                </p>
                {coverImageUrl ? (
                  <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                    <img src={coverImageUrl} alt="Preview cover" className="h-52 w-full object-cover" />
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-300 bg-white px-3 py-6 text-center text-xs text-slate-500">
                    Chưa có ảnh bìa
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setCoverImageUrl("")}
                    disabled={!coverImageUrl || busy}
                  >
                    Xoá ảnh bìa
                  </button>
                </div>
              </div>
            </div>
          </div>
          <label className="grid gap-2 text-sm text-slate-600">
            Nội dung
            <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200/70">
              <ReactQuill theme="snow" value={contentHtml} onChange={setContentHtml} modules={quillModules} />
            </div>
          </label>
        </div>
      </div>
    </div>
  );
}

