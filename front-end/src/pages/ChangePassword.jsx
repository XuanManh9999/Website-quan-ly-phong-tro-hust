import { useState } from "react";
import { authApi } from "../api/authApi";
import { Icons } from "../ui/icons";
import { notify } from "../ui/toast";

export default function ChangePasswordPage() {
  const I = Icons;
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setMessage("");
    setError("");
    if (newPassword !== confirmPassword) {
      const message = "Mật khẩu mới không khớp";
      setError(message);
      notify.warning(message);
      return;
    }
    setBusy(true);
    try {
      await authApi.changePassword({ currentPassword, newPassword });
      const message = "Đổi mật khẩu thành công";
      setMessage(message);
      notify.success(message);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      const message = err?.response?.data?.message || "Đổi mật khẩu thất bại";
      setError(message);
      notify.error(message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-4xl">
      <div className="toolbar">
        <div>
          <div className="page-kicker">Bảo mật</div>
          <h1 className="page-title">Đổi mật khẩu</h1>
          <p className="page-subtitle">Hãy đặt mật khẩu mạnh để bảo vệ tài khoản.</p>
        </div>
      </div>

      {message ? (
        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {message}
        </div>
      ) : null}
      {error ? (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="mt-6 panel panel-pad">
        <form onSubmit={onSubmit} className="grid gap-4">
          <label className="grid gap-2 text-sm text-slate-600">
            Mật khẩu hiện tại
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="input-base"
            />
          </label>
          <label className="grid gap-2 text-sm text-slate-600">
            Mật khẩu mới
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="input-base"
            />
          </label>
          <label className="grid gap-2 text-sm text-slate-600">
            Nhập lại mật khẩu mới
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="input-base"
            />
          </label>
          <button className="btn-primary inline-flex w-full items-center justify-center gap-2 sm:w-fit" disabled={busy}>
            <I.Edit className="text-[14px]" />
            {busy ? "Đang đổi..." : "Đổi mật khẩu"}
          </button>
        </form>
      </div>
    </div>
  );
}
