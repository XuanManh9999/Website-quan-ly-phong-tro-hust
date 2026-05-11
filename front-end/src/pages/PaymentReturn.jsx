import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { paymentsApi } from "../api/paymentsApi";
import { Icons } from "../ui/icons";

function useQueryParams() {
  const { search } = useLocation();
  return useMemo(() => Object.fromEntries(new URLSearchParams(search)), [search]);
}

export default function PaymentReturnPage() {
  const I = Icons;
  const params = useQueryParams();

  const [busy, setBusy] = useState(true);
  const [status, setStatus] = useState("processing"); // processing | success | pending | failed
  const [message, setMessage] = useState("Đang xác minh thanh toán...");
  const [paymentId, setPaymentId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setBusy(true);
      setStatus("processing");
      setMessage("Đang xác minh thanh toán...");

      try {
        // VNPay sẽ trả về nhiều tham số, ta forward nguyên query về backend để verify chữ ký
        const data = await paymentsApi.verifyVNPayReturn(params);
        if (cancelled) return;
        setPaymentId(data?.paymentId ?? null);
        if (data?.ok) {
          setStatus("success");
          setMessage("Thanh toán thành công. Gói của bạn đã được kích hoạt cho tháng hiện tại.");
        } else if (data?.status === "pending") {
          setStatus("pending");
          setMessage(data?.message || "Đã ghi nhận giao dịch, đang chờ hệ thống xác nhận tự động.");
        } else {
          setStatus("failed");
          setMessage(data?.message || "Thanh toán không thành công hoặc không thể xác minh.");
        }
      } catch (err) {
        if (cancelled) return;
        const apiMsg = err?.response?.data?.message;
        setStatus("failed");
        setMessage(apiMsg || "Thanh toán không thành công hoặc không thể xác minh. Vui lòng thử lại hoặc liên hệ hỗ trợ.");
      } finally {
        if (!cancelled) setBusy(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [params]);

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="toolbar">
        <div>
          <div className="page-kicker">Thanh toán</div>
          <h1 className="page-title">Kết quả VNPay</h1>
          <p className="page-subtitle">Trang này sẽ tự động xác minh giao dịch và cập nhật gói của bạn.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/dashboard" className="btn-secondary">
            Về Dashboard
          </Link>
          <Link to="/landlord/rooms" className="btn-secondary">
            Quản lý phòng
          </Link>
        </div>
      </div>

      <div className="mt-6 panel panel-pad">
        <div className="flex items-start gap-3">
          {busy ? (
            <div className="mt-1 h-5 w-5 animate-spin rounded-full border-2 border-brand-200 border-t-brand-700" />
          ) : status === "success" ? (
            <div className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
              <I.Check className="text-[14px]" />
            </div>
          ) : status === "pending" ? (
            <div className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-amber-50 text-amber-700">
              <I.Clock className="text-[14px]" />
            </div>
          ) : (
            <div className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-red-50 text-red-700">
              <I.Alert className="text-[14px]" />
            </div>
          )}

          <div className="min-w-0">
            <div
              className={`text-sm font-semibold ${
                status === "success"
                  ? "text-emerald-700"
                  : status === "pending"
                  ? "text-amber-700"
                  : status === "failed"
                  ? "text-red-700"
                  : "text-slate-700"
              }`}
            >
              {status === "success"
                ? "Thành công"
                : status === "pending"
                ? "Đang chờ xác nhận"
                : status === "failed"
                ? "Thất bại"
                : "Đang xử lý"}
            </div>
            <div className="mt-1 text-sm text-slate-700">{message}</div>

            <div className="mt-4 grid gap-2 rounded-xl bg-slate-50 p-3 text-xs text-slate-600 ring-1 ring-slate-200/70">
              <div>
                <span className="font-semibold">Mã giao dịch (TxnRef): </span>
                <span className="break-all">{params.vnp_TxnRef || "—"}</span>
              </div>
              {paymentId ? (
                <div>
                  <span className="font-semibold">Payment ID: </span>
                  <span>{paymentId}</span>
                </div>
              ) : null}
              <div>
                <span className="font-semibold">Mã phản hồi: </span>
                <span>{params.vnp_ResponseCode || "—"}</span>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Link to="/dashboard" className="btn-primary">
                Về Dashboard (xem gói)
              </Link>
              <Link to="/landlord/rooms/new" className="btn-secondary">
                Tạo phòng mới
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 text-xs text-slate-500">
        Nếu bạn đã thanh toán nhưng gói chưa cập nhật, hãy thử tải lại Dashboard sau vài giây.
      </div>
    </div>
  );
}

