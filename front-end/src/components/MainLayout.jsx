import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import RoomSearchChatbot from "./RoomSearchChatbot.jsx";
import BrandLogo from "./BrandLogo.jsx";
import { roleLabelVn } from "../utils/labels.js";
import AOS from "aos";
import {
  FaBuilding,
  FaNewspaper,
  FaUser,
  FaRightToBracket,
  FaUserPlus,
  FaIdBadge,
  FaCircleInfo,
  FaPhoneVolume,
  FaEnvelopeOpenText,
  FaClock,
  FaShieldHalved,
  FaUserShield,
  FaCircleCheck,
  FaGaugeHigh,
  FaBars,
  FaXmark
} from "react-icons/fa6";
import { FaFacebookF, FaTiktok, FaYoutube, FaInstagram } from "react-icons/fa";

function TopLink({ to, children }) {
  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        `rounded-full border px-4 py-2 text-sm font-semibold transition ${
          isActive
            ? "border-brand-200 bg-brand-50 text-brand-700"
            : "border-transparent text-slate-500 hover:border-slate-200 hover:bg-white"
        }`
      }
    >
      {children}
    </NavLink>
  );
}

export default function MainLayout() {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    AOS.refresh();
  }, [location.pathname]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      <header
        className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/85 backdrop-blur-md transition-shadow shadow-xs"
      >
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <Link to="/" className="transition hover:opacity-90">
            <BrandLogo compact />
          </Link>
          <nav className="ml-4 hidden items-center gap-2 md:flex">
            <TopLink to="/rooms">
              <FaBuilding className="mr-1" />
              Phòng trọ
            </TopLink>
            <TopLink to="/blog">
              <FaNewspaper className="mr-1" />
              Bài viết
            </TopLink>
            <TopLink to="/faqs">
              <FaCircleInfo className="mr-1" />
              FAQ
            </TopLink>
            <TopLink to="/about">
              <FaIdBadge className="mr-1" />
              Giới thiệu
            </TopLink>
          </nav>
          <div className="ml-auto hidden items-center gap-3 md:flex">
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <Link to="/profile" className="btn-secondary">
                  <span className="mr-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                    <FaUser />
                  </span>
                  Hồ sơ
                </Link>
                <Link
                  to="/dashboard"
                  className="flex items-center gap-3 rounded-full border border-ink-200 bg-white px-3 py-1.5"
                >
                  <div className="grid h-9 w-9 place-items-center overflow-hidden rounded-full bg-brand-500/10 text-sm font-bold text-brand-700">
                    {user?.avatar_url ? (
                      <img src={user.avatar_url} alt="avatar" className="h-full w-full object-cover" />
                    ) : (
                      (user?.full_name || user?.email || "?")[0]?.toUpperCase()
                    )}
                  </div>
                  <div className="hidden min-w-0 sm:grid">
                    <div className="truncate text-sm font-semibold text-ink-900">
                      {user?.full_name || user?.email}
                    </div>
                    <div className="flex items-center gap-1 text-[11px] uppercase tracking-wide text-ink-500">
                      <FaIdBadge className="text-[10px]" />
                      {roleLabelVn(user?.role)}
                    </div>
                  </div>
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="btn-secondary">
                  <FaRightToBracket className="mr-1" />
                  Đăng nhập
                </Link>
                <Link to="/register" className="btn-primary">
                  <FaUserPlus className="mr-1" />
                  Đăng ký
                </Link>
              </div>
            )}
          </div>
          <button
            type="button"
            className="ml-auto inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 md:hidden"
            aria-label="Mở menu"
            onClick={() => setMobileMenuOpen(true)}
          >
            <FaBars />
          </button>
        </div>
      </header>

      {mobileMenuOpen ? (
        <div className="fixed inset-0 z-40 bg-slate-900/45 backdrop-blur-[1px] md:hidden" onClick={() => setMobileMenuOpen(false)}>
          <div
            className="absolute right-0 top-0 h-full w-[86%] max-w-sm bg-white p-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <BrandLogo compact />
              <button
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Đóng menu"
              >
                <FaXmark />
              </button>
            </div>
            <div className="mt-4 grid gap-2">
              <TopLink to="/rooms">
                <FaBuilding className="mr-1" />
                Phòng trọ
              </TopLink>
              <TopLink to="/blog">
                <FaNewspaper className="mr-1" />
                Bài viết
              </TopLink>
              <TopLink to="/faqs">
                <FaCircleInfo className="mr-1" />
                FAQ
              </TopLink>
              <TopLink to="/about">
                <FaIdBadge className="mr-1" />
                Giới thiệu
              </TopLink>
            </div>
            <div className="mt-5 border-t border-slate-200 pt-4">
              {isAuthenticated ? (
                <div className="grid gap-2">
                  <Link to="/dashboard" className="btn-primary w-full justify-center">
                    Dashboard
                  </Link>
                  <Link to="/profile" className="btn-secondary w-full justify-center">
                    Hồ sơ
                  </Link>
                </div>
              ) : (
                <div className="grid gap-2">
                  <Link to="/login" className="btn-secondary w-full justify-center">
                    Đăng nhập
                  </Link>
                  <Link to="/register" className="btn-primary w-full justify-center">
                    Đăng ký
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}

      <main className="flex-1 px-3 py-6 sm:px-4 sm:py-8">
        <Outlet />
      </main>

      <footer className="border-t border-slate-200 bg-slate-950 text-slate-200">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10 md:flex-row md:items-start md:justify-between">
          <div className="space-y-3 text-base">
            <BrandLogo compact inverted />
            <p className="max-w-xs text-sm text-slate-400">
              Nền tảng hỗ trợ chủ trọ và người thuê kết nối nhanh chóng, minh bạch với thông tin rõ ràng, dễ so sánh.
            </p>
            <div className="flex items-center gap-3 text-sm text-slate-400">
              <FaFacebookF className="cursor-pointer transition hover:text-white" />
              <FaTiktok className="cursor-pointer transition hover:text-white" />
              <FaYoutube className="cursor-pointer transition hover:text-white" />
              <FaInstagram className="cursor-pointer transition hover:text-white" />
            </div>
          </div>

          <div className="grid flex-1 gap-6 text-sm sm:grid-cols-2 md:grid-cols-3">
            <div className="space-y-2">
              <div className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">
                Điều hướng
              </div>
              <div className="grid gap-1">
                <Link to="/rooms" className="flex items-center gap-2 hover:text-white">
                  <FaBuilding className="text-[11px]" />
                  <span>Danh sách phòng</span>
                </Link>
                <Link to="/blog" className="flex items-center gap-2 hover:text-white">
                  <FaNewspaper className="text-[11px]" />
                  <span>Bài viết kinh nghiệm</span>
                </Link>
                <Link to="/dashboard" className="flex items-center gap-2 hover:text-white">
                  <FaGaugeHigh className="text-[11px]" />
                  <span>Dashboard của bạn</span>
                </Link>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">
                Hỗ trợ
              </div>
              <div className="grid gap-1">
                <div className="flex items-center gap-2">
                  <FaPhoneVolume className="text-[11px]" />
                  <span>Hotline: 0123 456 789</span>
                </div>
                <div className="flex items-center gap-2">
                  <FaEnvelopeOpenText className="text-[11px]" />
                  <span>Email: support@example.com</span>
                </div>
                <div className="flex items-center gap-2">
                  <FaClock className="text-[11px]" />
                  <span>Làm việc: 8:00 - 21:00</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">
                Chính sách
              </div>
              <div className="grid gap-1">
                <span className="flex items-center gap-2">
                  <FaShieldHalved className="text-[11px]" />
                  <span>Điều khoản sử dụng</span>
                </span>
                <span className="flex items-center gap-2">
                  <FaUserShield className="text-[11px]" />
                  <span>Chính sách bảo mật</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-4 text-xs text-slate-500 md:flex-row">
            <div>© {new Date().getFullYear()} QL Phòng Trọ trực tuyến. All rights reserved.</div>
            <div className="flex items-center gap-2">
              <FaCircleCheck className="text-[10px] text-emerald-400" />
              <span>Thông tin phòng đăng tải được kiểm duyệt trước khi hiển thị.</span>
            </div>
          </div>
        </div>
      </footer>

      <RoomSearchChatbot />
    </div>
  );
}

