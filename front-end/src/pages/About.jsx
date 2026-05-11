import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import DOMPurify from "dompurify";
import { pagesApi } from "../api/pagesApi";
import { notify } from "../ui/toast";
import { Icons } from "../ui/icons";

export default function AboutPage() {
  const I = Icons;
  const [page, setPage] = useState(null);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");

  const features = useMemo(
    () => [
      {
        title: "Tìm phòng nhanh & rõ ràng",
        desc: "Lọc theo khu vực, mức giá, diện tích — ưu tiên thông tin minh bạch để so sánh dễ."
      },
      {
        title: "Chủ trọ quản lý tập trung",
        desc: "Quản lý phòng, tin đăng, gói dịch vụ và lịch sử thanh toán ngay trong dashboard."
      },
      {
        title: "Bài viết & kiến thức",
        desc: "Chia sẻ kinh nghiệm thuê trọ, tránh rủi ro và tối ưu chi phí."
      }
    ],
    []
  );

  const safeContentHtml = useMemo(
    () => DOMPurify.sanitize(page?.content_html || ""),
    [page?.content_html]
  );

  async function loadAbout() {
    setBusy(true);
    setError("");
    try {
      const p = await pagesApi.getPublic("about");
      setPage(p);
    } catch (err) {
      const message = err?.response?.data?.message || "Không tải được trang giới thiệu";
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
        const p = await pagesApi.getPublic("about");
        if (!cancelled) {
          setPage(p);
          setError("");
        }
      } catch (err) {
        if (!cancelled) {
          const message = err?.response?.data?.message || "Không tải được trang giới thiệu";
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
              Thông tin nền tảng
            </div>
            <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-white drop-shadow-sm sm:text-4xl">
              {page?.title || "Giới thiệu"}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-100/90">
              Nơi kết nối chủ trọ và người thuê bằng trải nghiệm hiện đại — dễ dùng, nhanh và minh bạch.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <Link to="/rooms" className="btn-secondary !border-white/20 !bg-white/10 !text-white hover:!bg-white/15">
                <I.Room className="mr-2 text-[14px]" />
                Xem phòng trọ
              </Link>
              <Link to="/faqs" className="btn-secondary !border-white/20 !bg-white/10 !text-white hover:!bg-white/15">
                <I.Check className="mr-2 text-[14px]" />
                Xem FAQ
              </Link>
            </div>

            <div className="mt-7 grid gap-2 sm:grid-cols-3">
              <div className="rounded-2xl bg-white/8 px-4 py-3 ring-1 ring-white/10">
                <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-100/90">Minh bạch</div>
                <div className="mt-1 text-sm font-semibold text-white">Thông tin rõ ràng</div>
              </div>
              <div className="rounded-2xl bg-white/8 px-4 py-3 ring-1 ring-white/10">
                <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-100/90">Nhanh</div>
                <div className="mt-1 text-sm font-semibold text-white">Tìm & quản lý dễ</div>
              </div>
              <div className="rounded-2xl bg-white/8 px-4 py-3 ring-1 ring-white/10">
                <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-100/90">An toàn</div>
                <div className="mt-1 text-sm font-semibold text-white">OTP & phân quyền</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 px-4 py-6 sm:px-6 lg:grid-cols-3">
          {features.map((f, idx) => (
            <div
              key={f.title}
              className="rounded-2xl border border-slate-200 bg-white p-5"
              data-aos="fade-up"
              data-aos-delay={Math.min(idx * 80, 180)}
            >
              <div className="text-sm font-semibold text-slate-900">{f.title}</div>
              <div className="mt-2 text-sm text-slate-600">{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="panel panel-pad mt-6" data-aos="fade-up">
        <div className="page-kicker">Nội dung</div>
        <h2 className="page-title">Chi tiết</h2>
        {error ? (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <div>{error}</div>
            <button type="button" className="mt-2 btn-secondary" onClick={loadAbout}>
              Thử lại
            </button>
          </div>
        ) : null}
        {busy ? (
          <div className="mt-5 space-y-3">
            <div className="h-4 w-2/3 animate-pulse rounded bg-slate-100" />
            <div className="h-4 w-full animate-pulse rounded bg-slate-100" />
            <div className="h-4 w-5/6 animate-pulse rounded bg-slate-100" />
          </div>
        ) : safeContentHtml ? (
          <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <article
              className="prose prose-slate max-w-none"
              dangerouslySetInnerHTML={{ __html: safeContentHtml }}
            />
            <aside className="rounded-2xl border border-slate-200 bg-slate-50 p-5" data-aos="fade-left">
              <div className="text-sm font-semibold text-slate-900">Bạn muốn bắt đầu?</div>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">
                Đi thẳng tới danh sách phòng, hoặc đọc FAQ để biết các bước cơ bản.
              </p>
              <div className="mt-4 grid gap-2">
                <Link to="/rooms" className="btn-secondary w-full justify-between">
                  <span>Danh sách phòng</span>
                  <span className="text-slate-400">→</span>
                </Link>
                <Link to="/faqs" className="btn-secondary w-full justify-between">
                  <span>Câu hỏi thường gặp</span>
                  <span className="text-slate-400">→</span>
                </Link>
                <Link to="/register" className="btn-primary w-full justify-between">
                  <span>Tạo tài khoản</span>
                  <span className="text-white/70">→</span>
                </Link>
              </div>
            </aside>
          </div>
        ) : (
          <p className="mt-4 text-sm text-slate-600">Trang giới thiệu chưa có nội dung.</p>
        )}
      </section>
    </div>
  );
}

