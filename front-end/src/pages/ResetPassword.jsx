import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { http } from "../api/http";
import { Icons } from "../ui/icons";
import { notify } from "../ui/toast";
import { AuthShell } from "../components/AuthShell.jsx";

export default function ResetPasswordPage() {
  const nav = useNavigate();
  const [sp] = useSearchParams();
  const I = Icons;
  const initialEmail = useMemo(() => sp.get("email") || "", [sp]);
  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [step, setStep] = useState("otp");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    setEmail(initialEmail);
  }, [initialEmail]);

  async function resendOtp() {
    setError("");
    setSuccess("");
    setBusy(true);
    try {
      await http.post("/auth/forgot-password", { email });
      const msg = "Đã gửi lại mã OTP. Vui lòng kiểm tra email (cả spam).";
      setSuccess(msg);
      notify.success(msg);
    } catch (err) {
      const message = err?.response?.data?.message || "Gửi lại OTP thất bại";
      setError(message);
      notify.error(message);
    } finally {
      setBusy(false);
    }
  }

  async function verifyOtp(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setBusy(true);
    try {
      await http.post("/auth/verify-reset-otp", { email, otp });
      const msg = "Xác thực OTP thành công. Vui lòng đặt mật khẩu mới.";
      setSuccess(msg);
      notify.success(msg);
      setStep("reset");
    } catch (err) {
      const message = err?.response?.data?.message || "OTP không đúng hoặc đã hết hạn";
      setError(message);
      notify.error(message);
    } finally {
      setBusy(false);
    }
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (newPassword !== confirmPassword) {
      const message = "Mật khẩu xác nhận không khớp";
      setError(message);
      notify.error(message);
      return;
    }
    setBusy(true);
    try {
      await http.post("/auth/reset-password", { email, otp, newPassword });
      const message = "Đặt lại mật khẩu thành công. Bạn có thể đăng nhập với mật khẩu mới.";
      setSuccess(message);
      notify.success(message);
      setTimeout(() => {
        nav("/login", { replace: true });
      }, 1200);
    } catch (err) {
      const message = err?.response?.data?.message || "Đặt lại mật khẩu thất bại";
      setError(message);
      notify.error(message);
    } finally {
      setBusy(false);
    }
  }

  const subtitle =
    step === "otp"
      ? "Nhập email và mã OTP đã nhận để xác thực."
      : "OTP hợp lệ. Đặt mật khẩu mới để hoàn tất.";

  return (
    <AuthShell kicker="Bảo mật" title="Đặt lại mật khẩu" subtitle={subtitle}>
      <form onSubmit={step === "otp" ? verifyOtp : onSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-[0.12em] text-teal-800/80">Email</label>
          <input
            className="input-base auth-input-teal"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            disabled={busy || Boolean(initialEmail)}
            autoComplete="email"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-[0.12em] text-teal-800/80">Mã OTP</label>
          <input
            className="input-base auth-input-teal"
            required
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder="Nhập mã trong email"
            disabled={step === "reset"}
          />
        </div>

        {step === "reset" ? (
          <>
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-[0.12em] text-teal-800/80">Mật khẩu mới</label>
              <input
                className="input-base auth-input-teal"
                type="password"
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-[0.12em] text-teal-800/80">Xác nhận mật khẩu</label>
              <input
                className="input-base auth-input-teal"
                type="password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>
          </>
        ) : (
          <button
            type="button"
            className="w-full rounded-xl border border-teal-200 bg-teal-50/80 py-2.5 text-sm font-semibold text-teal-900 transition hover:bg-teal-100 disabled:opacity-50"
            disabled={busy || !email}
            onClick={resendOtp}
          >
            Gửi lại mã OTP
          </button>
        )}

        {error ? (
          <div className="rounded-xl border border-red-200/80 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</div>
        ) : null}
        {success ? (
          <div className="rounded-xl border border-emerald-200/80 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{success}</div>
        ) : null}

        <button type="submit" className="auth-btn-primary inline-flex items-center justify-center gap-2" disabled={busy}>
          {step === "otp" ? <I.Check className="text-[14px]" /> : <I.Edit className="text-[14px]" />}
          {busy ? "Đang xử lý..." : step === "otp" ? "Xác thực OTP" : "Đổi mật khẩu"}
        </button>
      </form>

      <div className="mt-8 flex flex-col gap-2 border-t border-teal-100/80 pt-6 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
        <span>Đã nhớ mật khẩu?</span>
        <Link to="/login" className="auth-link">
          Quay lại đăng nhập
        </Link>
      </div>
    </AuthShell>
  );
}
