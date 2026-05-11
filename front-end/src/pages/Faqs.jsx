import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import DOMPurify from "dompurify";
import { faqsApi } from "../api/faqsApi";
import { notify } from "../ui/toast";
import { Icons } from "../ui/icons";

function FaqItem({ item, delay = 0 }) {
  const [open, setOpen] = useState(false);
  const safeAnswerHtml = useMemo(
    () => DOMPurify.sanitize(item?.answer_html || ""),
    [item?.answer_html]
  );
  return (
    <div
      className="group rounded-2xl border border-slate-200 bg-white shadow-sm ring-1 ring-slate-900/[0.02] transition hover:border-teal-200/80 hover:ring-teal-500/10"
      data-aos="fade-up"
      data-aos-delay={delay}
    >
      <button
        type="button"
        className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left"
        onClick={() => setOpen((o) => !o)}
      >
        <span className="text-sm font-semibold text-slate-900">{item.question}</span>
        <span
          className={`grid h-8 w-8 place-items-center rounded-xl border text-slate-500 transition ${
            open ? "border-teal-200 bg-teal-50 text-teal-700" : "border-slate-200 bg-white group-hover:border-teal-200/70"
          }`}
          aria-hidden
        >
          {open ? "−" : "+"}
        </span>
      </button>
      <div
        className={`grid transition-[grid-template-rows] duration-200 ${
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <div className="border-t border-slate-200 px-4 py-4">
            <div
              className="prose prose-slate max-w-none text-sm"
              dangerouslySetInnerHTML={{ __html: safeAnswerHtml }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FaqsPage() {
  const I = Icons;
  const [items, setItems] = useState([]);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");

  const quick = useMemo(
    () => [
      { label: "Quên mật khẩu", to: "/forgot-password" },
      { label: "Xem phòng", to: "/rooms" },
      { label: "Giới thiệu", to: "/about" }
    ],
    []
  );

  async function loadFaqs() {
    setBusy(true);
    setError("");
    try {
      const data = await faqsApi.listPublic();
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      const message = err?.response?.data?.message || "Không tải được FAQ";
      setError(message);
      notify.error(message);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await faqsApi.listPublic();
        if (!cancelled) {
          setItems(Array.isArray(data) ? data : []);
          setError("");
        }
      } catch (err) {
        if (!cancelled) {
          const message = err?.response?.data?.message || "Không tải được FAQ";
          setError(message);
          notify.error(message);
        }
      } finally {
        if (!cancelled) setBusy(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mx-auto w-full max-w-6xl">
      <section className="panel overflow-hidden">
        <div
          className="relative bg-gradient-to-br from-slate-950 via-teal-950 to-emerald-900 px-5 py-10 text-white sm:px-8"
          data-aos="zoom-out"
        >
          <div className="pointer-events-none absolute -left-16 -top-24 h-56 w-56 rounded-full bg-teal-400/20 blur-3xl" />
          <div className="pointer-events-none absolute -right-14 -bottom-20 h-56 w-56 rounded-full bg-emerald-400/15 blur-3xl" />
          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-100 ring-1 ring-white/15">
              <I.Info className="text-[12px]" />
              Trung tâm trợ giúp
            </div>
            <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-white drop-shadow-sm sm:text-4xl">FAQ</h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-100/90">
              Các câu hỏi thường gặp cho chủ trọ và người thuê. Nếu không thấy nội dung bạn cần, hãy xem phần gợi ý bên dưới.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {quick.map((x) => (
                <Link key={x.to} to={x.to} className="btn-secondary !border-white/20 !bg-white/10 !text-white hover:!bg-white/15">
                  {x.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-4 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div>
            {error ? (
              <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <div>{error}</div>
                <button type="button" className="mt-2 btn-secondary" onClick={loadFaqs}>
                  Thử lại
                </button>
              </div>
            ) : null}
            {busy ? (
              <div className="space-y-3">
                <div className="h-16 animate-pulse rounded-2xl bg-slate-100" />
                <div className="h-16 animate-pulse rounded-2xl bg-slate-100" />
                <div className="h-16 animate-pulse rounded-2xl bg-slate-100" />
              </div>
            ) : items.length === 0 ? (
              <p className="text-sm text-slate-600">Chưa có FAQ.</p>
            ) : (
              <div className="grid gap-3">
                {items.map((it, idx) => (
                  <FaqItem key={it.id} item={it} delay={Math.min(idx * 60, 240)} />
                ))}
              </div>
            )}
          </div>

          <aside className="rounded-2xl border border-slate-200 bg-white p-5" data-aos="fade-left" data-aos-delay="100">
            <div className="text-sm font-semibold text-slate-900">Gợi ý nhanh</div>
            <p className="mt-1 text-sm text-slate-600">Một vài thao tác thường dùng để bắt đầu.</p>
            <div className="mt-4 grid gap-2">
              <Link to="/rooms" className="btn-secondary w-full justify-between">
                <span>Xem danh sách phòng</span>
                <span className="text-slate-400">→</span>
              </Link>
              <Link to="/blog" className="btn-secondary w-full justify-between">
                <span>Đọc bài viết</span>
                <span className="text-slate-400">→</span>
              </Link>
              <Link to="/forgot-password" className="btn-secondary w-full justify-between">
                <span>Quên mật khẩu</span>
                <span className="text-slate-400">→</span>
              </Link>
            </div>
            <div className="mt-4 rounded-xl bg-slate-50 px-3 py-3 text-[12px] text-slate-600">
              Tip: Bạn có thể dùng tính năng tìm kiếm ở trang phòng để lọc theo <b>giá</b> và <b>khu vực</b>.
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}

