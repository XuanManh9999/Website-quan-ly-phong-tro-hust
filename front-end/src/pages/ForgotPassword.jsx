import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { http } from "../api/http";
import { Icons } from "../ui/icons";
import { notify } from "../ui/toast";
import { AuthShell } from "../components/AuthShell.jsx";

export default function ForgotPasswordPage() {
  const nav = useNavigate();
  const I = Icons;
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setBusy(true);
    try {
      const res = await http.post("/auth/forgot-password", { email });
      const message =
        res.data?.message ||
        "Nếu email tồn tại trong hệ thống, mã OTP đặt lại mật khẩu sẽ được gửi. Vui lòng kiểm tra hộp thư đến/spam.";
      setSuccess(message);
      notify.success(message);
      nav(`/reset-password?email=${encodeURIComponent(email)}`, { replace: true });
    } catch (err) {
      const message = err?.response?.data?.message || "Gửi yêu cầu thất bại";
      setError(message);
      notify.error(message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell
      kicker="Bảo mật"
      title="Quên mật khẩu"
      subtitle="Nhập email đã đăng ký — hệ thống gửi mã OTP để bạn đặt lại mật khẩu an toàn."
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-[0.12em] text-teal-800/80">Email</label>
          <input
            className="input-base auth-input-teal"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
          />
        </div>

        {error ? (
          <div className="rounded-xl border border-red-200/80 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</div>
        ) : null}
        {success ? (
          <div className="rounded-xl border border-emerald-200/80 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            {success}
          </div>
        ) : null}

        <button type="submit" className="auth-btn-primary inline-flex items-center justify-center gap-2" disabled={busy}>
          <I.ArrowRightLong className="text-[14px]" />
          {busy ? "Đang gửi..." : "Gửi mã OTP"}
        </button>
      </form>

      <div className="mt-8 flex flex-col gap-2 border-t border-teal-100/80 pt-6 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
        <span>Bạn đã nhớ mật khẩu?</span>
        <Link to="/login" className="auth-link">
          Quay lại đăng nhập
        </Link>
      </div>
    </AuthShell>
  );
}
