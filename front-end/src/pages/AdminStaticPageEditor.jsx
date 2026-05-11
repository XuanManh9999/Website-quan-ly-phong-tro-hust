import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { pagesApi } from "../api/pagesApi";
import { notify } from "../ui/toast";
import { Icons } from "../ui/icons";

export default function AdminStaticPageEditorPage() {
  const I = Icons;
  const nav = useNavigate();
  const { id } = useParams();
  const isNew = useMemo(() => !id, [id]);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(!isNew);

  const [slug, setSlug] = useState("about");
  const [title, setTitle] = useState("Giới thiệu");
  const [published, setPublished] = useState(true);
  const [contentHtml, setContentHtml] = useState("");

  useEffect(() => {
    if (isNew) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const p = await pagesApi.adminDetail(id);
        if (cancelled) return;
        setSlug(p.slug || "");
        setTitle(p.title || "");
        setPublished(Boolean(p.published));
        setContentHtml(p.content_html || "");
      } catch (err) {
        notify.error(err?.response?.data?.message || "Không tải được trang");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, isNew]);

  async function onSave() {
    setBusy(true);
    try {
      const payload = { slug, title, contentHtml, published };
      const res = isNew ? await pagesApi.adminCreate(payload) : await pagesApi.adminUpdate(id, payload);
      notify.success("Đã lưu");
      nav(`/admin/pages/${res.id}/edit`, { replace: true });
    } catch (err) {
      notify.error(err?.response?.data?.message || "Lưu thất bại");
    } finally {
      setBusy(false);
    }
  }

  async function onDelete() {
    if (isNew) return;
    if (!confirm("Xoá trang này?")) return;
    setBusy(true);
    try {
      await pagesApi.adminDelete(id);
      notify.success("Đã xoá");
      nav("/admin/pages", { replace: true });
    } catch (err) {
      notify.error(err?.response?.data?.message || "Xoá thất bại");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl">
      <div className="toolbar">
        <div>
          <div className="page-kicker">Nội dung</div>
          <h1 className="page-title">{isNew ? "Tạo trang tĩnh" : "Sửa trang tĩnh"}</h1>
          <p className="page-subtitle">Nội dung HTML được hiển thị cho người dùng.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link className="btn-outline" to="/admin/pages">
            <I.Back className="mr-2 text-[14px]" />
            Quay lại
          </Link>
          {!isNew ? (
            <button type="button" className="btn-outline" onClick={onDelete} disabled={busy}>
              <I.Trash className="mr-2 text-[14px]" />
              Xoá
            </button>
          ) : null}
          <button type="button" className="btn-primary" onClick={onSave} disabled={busy || loading}>
            <I.Publish className="mr-2 text-[14px]" />
            {busy ? "Đang lưu…" : "Lưu"}
          </button>
        </div>
      </div>

      <div className="panel panel-pad mt-6 space-y-4">
        {loading ? <p className="text-sm text-slate-500">Đang tải…</p> : null}
        <div className="grid gap-4 md:grid-cols-3">
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Slug
            <input className="input-base" value={slug} onChange={(e) => setSlug(e.target.value)} />
          </label>
          <label className="grid gap-2 text-sm font-medium text-slate-700 md:col-span-2">
            Tiêu đề
            <input className="input-base" value={title} onChange={(e) => setTitle(e.target.value)} />
          </label>
        </div>

        <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
          <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} />
          Hiển thị public
        </label>

        <div className="rounded-xl border border-slate-200 bg-white">
          <ReactQuill theme="snow" value={contentHtml} onChange={setContentHtml} />
        </div>
      </div>
    </div>
  );
}

