import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./useAuth";

export function RequireRole({ roles, children }) {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();

  if (loading) return <div className="page">Đang tải...</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location }} />;
  // Token đã có nhưng user chưa kịp load -> tránh báo Forbidden sai
  if (!user) return <div className="page">Đang tải...</div>;
  if (!roles?.includes(user?.role)) {
    const to = user?.role === "admin" ? "/admin" : "/dashboard";
    return <Navigate to={to} replace state={{ from: location }} />;
  }
  return children;
}

