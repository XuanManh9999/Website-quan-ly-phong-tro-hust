import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { notify } from "../ui/toast";
import { AuthShell } from "../components/AuthShell.jsx";

export default function RegisterPage() {
  const { register } = useAuth();
  const nav = useNavigate();

  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("tenant");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function formatRegisterError(err) {
    const data = err?.response?.data;
    const fieldErrors = data?.fieldErrors && typeof data.fieldErrors === "object" ? data.fieldErrors : null;
    if (fieldErrors && Object.keys(fieldErrors).length > 0) {
      const labelMap = {
        email: "Email",
        password: "Mật khẩu",
        fullName: "Họ tên",
        role: "Vai trò"
      };
      const lines = Object.entries(fieldErrors).map(([k, v]) => {
        const label = labelMap[k] || k;
        return `${label}: ${v}`;
      });
      return lines.join("\n");
    }
    return data?.message || "Đăng ký thất bại";
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await register({ fullName, role, email, password });
      notify.success("Tạo tài khoản thành công");
      nav("/dashboard", { replace: true });
    } catch (err) {
      const message = formatRegisterError(err);
      setError(message);
      notify.error(message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell
      wide
      kicker="Bắt đầu"
      title="Đăng ký tài khoản"
      subtitle="Tạo tài khoản để đăng tin hoặc lưu phòng — giao diện tông teal & amber riêng cho QL Phòng Trọ."
    >
      <form onSubmit={onSubmit} className="grid gap-4">
        <label className="grid gap-2 text-sm font-medium text-slate-700">
          Họ tên
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Nguyễn Văn A"
            className="input-base auth-input-teal"
          />
        </label>

        <label className="grid gap-2 text-sm font-medium text-slate-700">
          Vai trò
          <select value={role} onChange={(e) => setRole(e.target.value)} className="input-base auth-input-teal">
            <option value="tenant">Người thuê</option>
            <option value="landlord">Chủ trọ</option>
          </select>
        </label>

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
            autoComplete="new-password"
            className="input-base auth-input-teal"
          />
        </label>

        {error ? (
          <div className="rounded-xl border border-red-200/80 bg-red-50 px-4 py-3 text-sm text-red-800 whitespace-pre-line">
            {error}
          </div>
        ) : null}

        <button type="submit" className="auth-btn-primary" disabled={busy}>
          {busy ? "Đang tạo..." : "Tạo tài khoản"}
        </button>
      </form>

      <div className="mt-8 border-t border-teal-100/80 pt-6 text-sm text-slate-600">
        Đã có tài khoản?{" "}
        <Link to="/login" className="auth-link">
          Đăng nhập
        </Link>
      </div>
    </AuthShell>
  );
}
