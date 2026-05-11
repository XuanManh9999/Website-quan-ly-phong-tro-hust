import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { notify } from "../ui/toast";
import { AuthShell } from "../components/AuthShell.jsx";

export default function LoginPage() {
  const { login } = useAuth();
  const nav = useNavigate();
  const location = useLocation();
  const from = useMemo(() => location.state?.from?.pathname || "/dashboard", [location.state]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const u = await login({ email, password });
      notify.success("Đăng nhập thành công");
      const safeRedirect = (() => {
        const role = u?.role;
        const target = typeof from === "string" && from.startsWith("/") ? from : "/dashboard";

        if (target.startsWith("/admin") && role !== "admin") return "/dashboard";
        if (target.startsWith("/landlord") && role !== "landlord" && role !== "admin") return "/dashboard";

        if (role === "admin") return target.startsWith("/admin") ? target : "/admin";
        return target || "/dashboard";
      })();

      nav(safeRedirect, { replace: true });
    } catch (err) {
      const message = err?.response?.data?.message || "Đăng nhập thất bại";
      setError(message);
      notify.error(message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell
      kicker="Chào mừng quay lại"
      title="Đăng nhập"
      subtitle="Đăng nhập để quản lý phòng, bài viết và gói dịch vụ của bạn."
    >
      <form onSubmit={onSubmit} className="grid gap-4">
        <label className="grid gap-2 text-sm font-medium text-slate-700">
          Email
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            required
            autoComplete="email"
            className="input-base auth-input-teal"
          />
        </label>
        <label className="grid gap-2 text-sm font-medium text-slate-700">
          Mật khẩu
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            required
            autoComplete="current-password"
            className="input-base auth-input-teal"
          />
        </label>

        {error ? (
          <div className="rounded-xl border border-red-200/80 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        ) : null}

        <button type="submit" className="auth-btn-primary" disabled={busy}>
          {busy ? "Đang đăng nhập..." : "Đăng nhập"}
        </button>
      </form>

      <div className="mt-8 flex flex-col gap-2 border-t border-teal-100/80 pt-6 text-sm text-slate-600">
        <div>
          Chưa có tài khoản?{" "}
          <Link to="/register" className="auth-link">
            Đăng ký
          </Link>
        </div>
        <div>
          Quên mật khẩu?{" "}
          <Link to="/forgot-password" className="auth-link">
            Lấy lại mật khẩu
          </Link>
        </div>
      </div>
    </AuthShell>
  );
}
