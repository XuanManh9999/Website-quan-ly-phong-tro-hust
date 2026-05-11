import { Link } from "react-router-dom";
import { FaHouse, FaShieldHalved, FaKey } from "react-icons/fa6";
import BrandLogo from "./BrandLogo.jsx";

/**
 * Layout dùng chung cho Đăng nhập / Đăng ký / Quên mật khẩu — palette teal + amber, không trùng template đen-trắng generic.
 */
export function AuthShell({ kicker, title, subtitle, children, wide = false }) {
  return (
    <div className="auth-shell relative min-h-[calc(100vh-88px)] overflow-hidden">
      {/* Nền mesh + noise nhẹ */}
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(20,184,166,0.22),transparent)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-32 top-1/4 h-96 w-96 rounded-full bg-amber-400/15 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-24 bottom-0 h-80 w-80 rounded-full bg-teal-500/10 blur-3xl"
        aria-hidden
      />

      <div className="relative mx-auto flex min-h-[calc(100vh-88px)] max-w-6xl flex-col lg:flex-row lg:items-stretch">
        {/* Cột trái — chỉ desktop */}
        <aside className="relative hidden flex-1 flex-col justify-between overflow-hidden rounded-none bg-gradient-to-br from-teal-800 via-emerald-900 to-slate-950 px-10 py-12 text-white lg:flex lg:max-w-[420px] lg:rounded-r-[2rem] lg:shadow-2xl lg:shadow-teal-950/40">
          <div className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:linear-gradient(rgba(255,255,255,0.15)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.15)_1px,transparent_1px)] [background-size:24px_24px]" />
          <div className="relative">
            <Link to="/" className="inline-flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-2.5 ring-1 ring-white/20 backdrop-blur-sm transition hover:bg-white/15">
              <BrandLogo compact inverted />
            </Link>
            <h2 className="mt-10 text-2xl font-bold leading-snug tracking-tight text-white">
              Giao diện riêng cho hệ sinh thái cho thuê phòng trọ
            </h2>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-teal-100/85">
              Màu teal &amp; amber tạo cảm giác ấm, tin cậy — khác hẳn các trang SaaS đen trắng thông thường.
            </p>
          </div>
          <ul className="relative mt-8 space-y-4 text-sm text-teal-50/95">
            <li className="flex gap-3">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/15">
                <FaHouse className="text-lg text-amber-300" />
              </span>
              <span>
                <span className="font-semibold text-white">Danh phòng đã duyệt</span>
                <span className="mt-0.5 block text-teal-200/80">Thông tin minh bạch, dễ so sánh giá.</span>
              </span>
            </li>
            <li className="flex gap-3">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/15">
                <FaShieldHalved className="text-lg text-amber-300" />
              </span>
              <span>
                <span className="font-semibold text-white">Đăng nhập bảo mật</span>
                <span className="mt-0.5 block text-teal-200/80">OTP qua email khi quên mật khẩu.</span>
              </span>
            </li>
            <li className="flex gap-3">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/15">
                <FaKey className="text-lg text-amber-300" />
              </span>
              <span>
                <span className="font-semibold text-white">Chủ trọ &amp; người thuê</span>
                <span className="mt-0.5 block text-teal-200/80">Một tài khoản, nhiều vai trò phù hợp.</span>
              </span>
            </li>
          </ul>
        </aside>

        {/* Form */}
        <div className="flex flex-1 items-center justify-center px-4 py-10 sm:px-8">
          <div
            className={`auth-card w-full ${wide ? "max-w-lg" : "max-w-md"} rounded-3xl border border-teal-200/60 bg-white/90 p-8 shadow-xl shadow-teal-900/5 ring-1 ring-white/80 backdrop-blur-md sm:p-10`}
          >
            <div className="mb-8">
              {kicker ? (
                <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-teal-50 to-amber-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-teal-800 ring-1 ring-teal-200/80">
                  {kicker}
                </div>
              ) : null}
              <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{title}</h1>
              {subtitle ? <p className="mt-2 text-sm leading-relaxed text-slate-600">{subtitle}</p> : null}
            </div>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
