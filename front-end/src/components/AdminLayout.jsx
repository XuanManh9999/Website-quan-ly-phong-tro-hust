import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { FaTag, FaBars, FaXmark } from "react-icons/fa6";
import { useAuth } from "../auth/useAuth";
import { Icons } from "../ui/icons";
import { notify } from "../ui/toast";
import BrandLogo from "./BrandLogo.jsx";

function Item({ to, children, end }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex items-center rounded-xl border px-3 py-2 text-sm font-medium transition ${
          isActive
            ? "border-brand-200 bg-brand-50 text-brand-700"
            : "border-transparent text-slate-600 hover:border-slate-200 hover:bg-white"
        }`
      }
    >
      {children}
    </NavLink>
  );
}

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const I = Icons;
  const [openMobileNav, setOpenMobileNav] = useState(false);

  useEffect(() => {
    setOpenMobileNav(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 lg:grid lg:grid-cols-[260px_minmax(0,1fr)]">
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white/95 px-4 py-3 shadow-sm backdrop-blur lg:hidden">
        <BrandLogo compact />
        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200"
          onClick={() => setOpenMobileNav(true)}
          aria-label="Mở menu quản trị"
        >
          <FaBars />
        </button>
      </div>

      {openMobileNav ? (
        <div className="fixed inset-0 z-40 bg-slate-900/45 lg:hidden" onClick={() => setOpenMobileNav(false)}>
          <aside
            className="absolute left-0 top-0 flex h-full w-[86%] max-w-[290px] flex-col border-r border-slate-200 bg-white px-4 py-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-2 flex items-center justify-between">
              <BrandLogo compact />
              <button
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200"
                onClick={() => setOpenMobileNav(false)}
                aria-label="Đóng menu quản trị"
              >
                <FaXmark />
              </button>
            </div>
            <div className="mt-3 rounded-2xl bg-slate-50 px-3 py-3">
              <div className="text-xs text-slate-500">Quản trị viên</div>
              <div className="mt-1 truncate text-sm font-medium text-slate-800">{user?.email}</div>
            </div>
            <nav className="mt-4 flex-1 space-y-1 overflow-y-auto pr-1">
              <Item to="/admin" end>
                <span className="mr-3 inline-flex h-8 w-8 items-center justify-center rounded-xl bg-sky-50 text-sky-500">
                  <I.Dashboard className="text-[18px]" />
                </span>
                Tổng quan
              </Item>
              <Item to="/admin/rooms">
                <span className="mr-3 inline-flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-500">
                  <I.Room className="text-[18px]" />
                </span>
                Duyệt phòng
              </Item>
              <Item to="/admin/posts">
                <span className="mr-3 inline-flex h-8 w-8 items-center justify-center rounded-xl bg-violet-50 text-violet-500">
                  <I.Post className="text-[18px]" />
                </span>
                Bài viết
              </Item>
              <Item to="/admin/categories">
                <span className="mr-3 inline-flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-500">
                  <I.Category className="text-[18px]" />
                </span>
                Chủ đề bài viết
              </Item>
              <Item to="/admin/packages">
                <span className="mr-3 inline-flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                  <I.Box className="text-[18px]" />
                </span>
                Gói đăng tin
              </Item>
              <Item to="/admin/users">
                <span className="mr-3 inline-flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <I.User className="text-[18px]" />
                </span>
                Người dùng
              </Item>
              <Item to="/admin/coupons">
                <span className="mr-3 inline-flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                  <FaTag className="text-[18px]" />
                </span>
                Mã giảm giá
              </Item>
              <Item to="/admin/pages">
                <span className="mr-3 inline-flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                  <I.Reader className="text-[18px]" />
                </span>
                Trang tĩnh
              </Item>
              <Item to="/admin/faqs">
                <span className="mr-3 inline-flex h-8 w-8 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
                  <I.Info className="text-[18px]" />
                </span>
                FAQ
              </Item>
            </nav>
          </aside>
        </div>
      ) : null}

      {/* Sidebar */}
      <aside className="hidden min-h-screen flex-col border-r border-slate-200 bg-white/95 px-4 py-6 shadow-sm lg:flex">
        {/* Logo + title */}
        <div className="flex items-center gap-3 px-2">
          <BrandLogo compact />
        </div>

        {/* User info */}
        <div className="mt-5 rounded-2xl bg-slate-50 px-3 py-3">
          <div className="text-xs text-slate-500">Quản trị viên</div>
          <div className="mt-1 truncate text-sm font-medium text-slate-800">
            {user?.email}
          </div>
        </div>

        {/* Nav */}
        <nav className="mt-6 flex-1 space-y-1">
          <Item to="/admin" end>
            <span className="mr-3 inline-flex h-8 w-8 items-center justify-center rounded-xl bg-sky-50 text-sky-500">
              <I.Dashboard className="text-[18px]" />
            </span>
            Tổng quan
          </Item>
          <Item to="/admin/rooms">
            <span className="mr-3 inline-flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-500">
              <I.Room className="text-[18px]" />
            </span>
            Duyệt phòng
          </Item>
          <Item to="/admin/posts">
            <span className="mr-3 inline-flex h-8 w-8 items-center justify-center rounded-xl bg-violet-50 text-violet-500">
              <I.Post className="text-[18px]" />
            </span>
            Bài viết
          </Item>
          <Item to="/admin/categories">
            <span className="mr-3 inline-flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-500">
              <I.Category className="text-[18px]" />
            </span>
            Chủ đề bài viết
          </Item>
          <Item to="/admin/packages">
            <span className="mr-3 inline-flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
              <I.Box className="text-[18px]" />
            </span>
            Gói đăng tin
          </Item>
          <Item to="/admin/users">
            <span className="mr-3 inline-flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <I.User className="text-[18px]" />
            </span>
            Người dùng
          </Item>
          <Item to="/admin/coupons">
            <span className="mr-3 inline-flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <FaTag className="text-[18px]" />
            </span>
            Mã giảm giá
          </Item>
          <Item to="/admin/pages">
            <span className="mr-3 inline-flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
              <I.Reader className="text-[18px]" />
            </span>
            Trang tĩnh
          </Item>
          <Item to="/admin/faqs">
            <span className="mr-3 inline-flex h-8 w-8 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
              <I.Info className="text-[18px]" />
            </span>
            FAQ
          </Item>
        </nav>

        {/* Bottom area */}
        <div className="mt-6 border-t border-slate-200 pt-4 space-y-2">
          <button
            type="button"
            onClick={() => {
              logout();
              notify.success("Đã đăng xuất");
            }}
            className="flex w-full items-center justify-between rounded-xl bg-rose-50 px-3 py-3 text-sm font-medium text-rose-700 transition hover:bg-rose-100"
          >
            <span>
              <I.ArrowRight className="mr-2 text-[14px]" />
              Đăng xuất
            </span>
            <I.NextChevron className="text-[12px] text-rose-300" />
          </button>
          <Link
            to="/dashboard"
            className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
          >
            <span>
              <I.Back className="mr-2 text-[14px]" />
              Về trang chủ
            </span>
            <I.NextChevron className="text-[12px] text-slate-400" />
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="bg-slate-50 px-3 py-5 sm:px-4 sm:py-6 lg:px-8 lg:py-8">
        <Outlet />
      </main>
    </div>
  );
}

