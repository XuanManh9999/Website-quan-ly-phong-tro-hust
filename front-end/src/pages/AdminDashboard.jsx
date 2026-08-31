import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { adminApi } from "../api/adminApi";
import { Icons } from "../ui/icons";
import { notify } from "../ui/toast";
import { roomOrPostStatusLabelVn } from "../utils/labels.js";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { FaCalendarDays, FaChartPie, FaGaugeHigh, FaUsersGear, FaFileExport, FaTriangleExclamation } from "react-icons/fa6";

function toYmd(d) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function defaultMonthRange() {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1);
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { from: toYmd(from), to: toYmd(to) };
}

function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function lastNDaysRange(days) {
  const to = new Date();
  const from = addDays(to, -(days - 1));
  return { from: toYmd(from), to: toYmd(to) };
}

function currentQuarterRange() {
  const now = new Date();
  const q = Math.floor(now.getMonth() / 3);
  const from = new Date(now.getFullYear(), q * 3, 1);
  const to = new Date(now.getFullYear(), q * 3 + 3, 0);
  return { from: toYmd(from), to: toYmd(to) };
}

function currentYearRange() {
  const now = new Date();
  const from = new Date(now.getFullYear(), 0, 1);
  const to = new Date(now.getFullYear(), 11, 31);
  return { from: toYmd(from), to: toYmd(to) };
}

function formatVnd(n) {
  const v = Number(n || 0);
  return v.toLocaleString("vi-VN") + "đ";
}

function formatCompact(n) {
  const v = Number(n || 0);
  return v.toLocaleString("vi-VN", { notation: "compact", maximumFractionDigits: 1 });
}

function percent(numerator, denominator) {
  const a = Number(numerator || 0);
  const b = Number(denominator || 0);
  if (!b) return 0;
  return (a / b) * 100;
}

function severityByThreshold(value, warn = 50, good = 80, inverse = false) {
  const v = Number(value || 0);
  if (inverse) {
    if (v <= warn) return "good";
    if (v <= good) return "warn";
    return "bad";
  }
  if (v >= good) return "good";
  if (v >= warn) return "warn";
  return "bad";
}

function severityClasses(level) {
  if (level === "good") return { text: "text-emerald-700", bg: "bg-emerald-500", chip: "bg-emerald-50 text-emerald-700" };
  if (level === "warn") return { text: "text-amber-700", bg: "bg-amber-500", chip: "bg-amber-50 text-amber-700" };
  return { text: "text-rose-700", bg: "bg-rose-500", chip: "bg-rose-50 text-rose-700" };
}

function downloadTextFile(filename, mimeType, content) {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8;` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function parseYmd(s) {
  const [y, m, d] = String(s || "").split("-").map((x) => Number(x));
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}



function buildDateSeries(fromYmdStr, toYmdStr, items, valueKeys) {
  const from = parseYmd(fromYmdStr);
  const to = parseYmd(toYmdStr);
  if (!from || !to) {
    return Array.isArray(items) ? items : [];
  }
  const safeItems = Array.isArray(items) ? items : [];
  const map = new Map(safeItems.map((r) => [String(r.date), r]));
  const out = [];
  for (let d = from; d <= to; d = addDays(d, 1)) {
    const key = toYmd(d);
    const row = map.get(key) || { date: key };
    const filled = { date: key };
    for (const k of valueKeys) filled[k] = Number(row[k] || 0);
    out.push(filled);
  }
  return out;
}

const CHART_COLORS = ["#0ea5e9", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#64748b"];

export default function AdminDashboardPage() {
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const I = Icons;
  const [range, setRange] = useState(defaultMonthRange());

  const params = useMemo(() => ({ from: range.from, to: range.to }), [range.from, range.to]);

  const revenueSeries = useMemo(
    () => buildDateSeries(range.from, range.to, data?.paymentsInRangeByDay || [], ["revenue", "paid_cnt"]),
    [data?.paymentsInRangeByDay, range.from, range.to]
  );
  const roomsSeries = useMemo(
    () => buildDateSeries(range.from, range.to, data?.roomsInRangeByDay || [], ["created_cnt", "submitted_cnt"]),
    [data?.roomsInRangeByDay, range.from, range.to]
  );
  const usersSeries = useMemo(
    () => buildDateSeries(range.from, range.to, data?.usersInRange || [], ["cnt"]),
    [data?.usersInRange, range.from, range.to]
  );
  const performanceSeries = useMemo(
    () =>
      buildDateSeries(range.from, range.to, data?.paymentsInRangeByDay || [], ["revenue", "paid_cnt"]).map(
        (r, idx) => ({
          ...r,
          users: Number(usersSeries[idx]?.cnt || 0),
          roomCreated: Number(roomsSeries[idx]?.created_cnt || 0)
        })
      ),
    [data?.paymentsInRangeByDay, range.from, range.to, roomsSeries, usersSeries]
  );

  const roomsStatusPie = useMemo(
    () => (data?.roomsByStatus || []).map((r) => ({ name: roomOrPostStatusLabelVn(r.status), value: Number(r.cnt || 0) })),
    [data?.roomsByStatus]
  );
  const postsStatusPie = useMemo(
    () => (data?.postsByStatus || []).map((r) => ({ name: roomOrPostStatusLabelVn(r.status), value: Number(r.cnt || 0) })),
    [data?.postsByStatus]
  );
  const kpi = useMemo(() => {
    const totalUsersInRange = (data?.usersInRange || []).reduce((sum, r) => sum + Number(r.cnt || 0), 0);
    const totalRoomCreatedInRange = (data?.roomsInRangeByDay || []).reduce((sum, r) => sum + Number(r.created_cnt || 0), 0);
    const totalRoomSubmittedInRange = (data?.roomsInRangeByDay || []).reduce((sum, r) => sum + Number(r.submitted_cnt || 0), 0);
    const paidInRange = (data?.paymentsInRangeByDay || []).reduce((sum, r) => sum + Number(r.paid_cnt || 0), 0);
    const approvalRate = percent(totalRoomSubmittedInRange, totalRoomCreatedInRange);
    const avgRevenuePerPayment = paidInRange ? Number(data?.revenueInRange || 0) / paidInRange : 0;
    const pendingRatio = percent(data?.pendingRooms || 0, data?.rooms || 0);
    const postPublishRatio = percent(data?.publishedPosts || 0, data?.posts || 0);
    return {
      totalUsersInRange,
      totalRoomCreatedInRange,
      totalRoomSubmittedInRange,
      paidInRange,
      approvalRate,
      avgRevenuePerPayment,
      pendingRatio,
      postPublishRatio
    };
  }, [data]);
  const kpiSeverity = useMemo(() => {
    const pendingLevel = severityByThreshold(kpi.pendingRatio, 15, 30, true);
    const postPublishLevel = severityByThreshold(kpi.postPublishRatio, 40, 70, false);
    const submitLevel = severityByThreshold(kpi.approvalRate, 50, 80, false);
    return {
      pending: { level: pendingLevel, ...severityClasses(pendingLevel) },
      postPublish: { level: postPublishLevel, ...severityClasses(postPublishLevel) },
      submit: { level: submitLevel, ...severityClasses(submitLevel) }
    };
  }, [kpi]);

  function exportCsv() {
    if (!data) return;
    const rows = [
      ["Tiêu đề", "Giá trị"],
      ["Từ ngày", range.from],
      ["Đến ngày", range.to],
      ["Tổng người dùng", Number(data.users || 0).toLocaleString("vi-VN")],
      ["Tổng phòng", Number(data.rooms || 0).toLocaleString("vi-VN")],
      ["Tổng bài viết", Number(data.posts || 0).toLocaleString("vi-VN")],
      ["Phòng chờ duyệt", Number(data.pendingRooms || 0).toLocaleString("vi-VN")],
      ["Doanh thu trong khoảng", formatVnd(data.revenueInRange)],
      ["Người dùng mới trong khoảng", Number(kpi.totalUsersInRange || 0).toLocaleString("vi-VN")],
      ["Tỉ lệ gửi duyệt phòng (%)", Number(kpi.approvalRate || 0).toFixed(2)],
      ["Tỉ lệ phòng chờ duyệt (%)", Number(kpi.pendingRatio || 0).toFixed(2)],
      ["Tỉ lệ bài viết đã đăng (%)", Number(kpi.postPublishRatio || 0).toFixed(2)],
      ["Doanh thu trung bình/giao dịch", formatVnd(Math.round(kpi.avgRevenuePerPayment || 0))]
    ];
    const csv = rows.map((r) => r.map((x) => `"${String(x).replaceAll('"', '""')}"`).join(",")).join("\n");
    downloadTextFile(`dashboard-report-${range.from}-to-${range.to}.csv`, "text/csv", `\uFEFF${csv}`);
    notify.success("Đã xuất báo cáo CSV");
  }

  function exportExcel() {
    if (!data) return;
    const generatedAt = new Date().toLocaleString("vi-VN");
    const html = `
      <html>
        <head>
          <meta charset="UTF-8" />
          <style>
            body { font-family: "Segoe UI", Arial, sans-serif; }
            table { border-collapse: collapse; width: 680px; }
            th, td { border: 1px solid #d1d5db; padding: 8px 10px; font-size: 13px; }
            .title { background: #0f172a; color: #ffffff; font-size: 16px; font-weight: 700; text-align: left; }
            .subtle { background: #f8fafc; color: #475569; font-weight: 600; }
            .head { background: #e2e8f0; font-weight: 700; }
            .value { text-align: right; font-weight: 600; }
          </style>
        </head>
        <body>
          <table>
            <tr><th class="title" colspan="2">Báo cáo Dashboard quản trị</th></tr>
            <tr><td class="subtle">Khoảng thời gian</td><td>${range.from} → ${range.to}</td></tr>
            <tr><td class="subtle">Thời điểm xuất</td><td>${generatedAt}</td></tr>
            <tr><th class="head">Chỉ số</th><th class="head">Giá trị</th></tr>
            <tr><td>Tổng người dùng</td><td class="value">${Number(data.users || 0).toLocaleString("vi-VN")}</td></tr>
            <tr><td>Tổng phòng</td><td class="value">${Number(data.rooms || 0).toLocaleString("vi-VN")}</td></tr>
            <tr><td>Tổng bài viết</td><td class="value">${Number(data.posts || 0).toLocaleString("vi-VN")}</td></tr>
            <tr><td>Phòng chờ duyệt</td><td class="value">${Number(data.pendingRooms || 0).toLocaleString("vi-VN")}</td></tr>
            <tr><td>Doanh thu trong khoảng</td><td class="value">${formatVnd(data.revenueInRange)}</td></tr>
            <tr><td>Người dùng mới trong khoảng</td><td class="value">${Number(kpi.totalUsersInRange || 0).toLocaleString("vi-VN")}</td></tr>
            <tr><td>Tỉ lệ gửi duyệt phòng (%)</td><td class="value">${Number(kpi.approvalRate || 0).toFixed(2)}%</td></tr>
            <tr><td>Tỉ lệ phòng chờ duyệt (%)</td><td class="value">${Number(kpi.pendingRatio || 0).toFixed(2)}%</td></tr>
            <tr><td>Tỉ lệ bài viết đã đăng (%)</td><td class="value">${Number(kpi.postPublishRatio || 0).toFixed(2)}%</td></tr>
            <tr><td>Doanh thu trung bình/giao dịch</td><td class="value">${formatVnd(Math.round(kpi.avgRevenuePerPayment || 0))}</td></tr>
          </table>
        </body>
      </html>
    `;
    downloadTextFile(`dashboard-report-${range.from}-to-${range.to}.xls`, "application/vnd.ms-excel", `\uFEFF${html}`);
    notify.success("Đã xuất báo cáo Excel");
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setBusy(true);
      setError("");
      try {
        const d = await adminApi.summary(params);
        if (!cancelled) setData(d);
      } catch (err) {
        const message = err?.response?.data?.message || "Không tải được dashboard";
        if (!cancelled) setError(message);
        notify.error(message);
      } finally {
        if (!cancelled) setBusy(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [params]);

  return (
    <div className="mx-auto w-full max-w-6xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-slate-900 text-sm text-white">
              <FaGaugeHigh />
            </span>
            Tổng quan
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Báo cáo theo khoảng thời gian (mặc định: tháng hiện tại).
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="grid gap-1 text-xs text-slate-500">
            <span>Từ ngày</span>
            <input
              type="date"
              value={range.from}
              onChange={(e) => setRange((s) => ({ ...s, from: e.target.value }))}
              className="input-base h-9 px-3 py-1 text-sm"
            />
          </div>
          <div className="grid gap-1 text-xs text-slate-500">
            <span>Đến ngày</span>
            <input
              type="date"
              value={range.to}
              onChange={(e) => setRange((s) => ({ ...s, to: e.target.value }))}
              className="input-base h-9 px-3 py-1 text-sm"
            />
          </div>
          <button
            type="button"
            className="btn-secondary h-9"
            onClick={() => setRange(defaultMonthRange())}
            disabled={busy}
          >
            Tháng hiện tại
          </button>
          <button type="button" className="btn-secondary h-9" onClick={() => setRange(lastNDaysRange(7))} disabled={busy}>
            7 ngày
          </button>
          <button type="button" className="btn-secondary h-9" onClick={() => setRange(lastNDaysRange(30))} disabled={busy}>
            30 ngày
          </button>
          <button type="button" className="btn-secondary h-9" onClick={() => setRange(currentQuarterRange())} disabled={busy}>
            Quý này
          </button>
          <button type="button" className="btn-secondary h-9" onClick={() => setRange(currentYearRange())} disabled={busy}>
            Năm nay
          </button>
          <button type="button" className="btn-primary h-9" onClick={exportCsv} disabled={busy || !data}>
            <FaFileExport className="mr-1 text-xs" />
            Xuất CSV
          </button>
          <button type="button" className="btn-outline h-9" onClick={exportExcel} disabled={busy || !data}>
            <FaFileExport className="mr-1 text-xs" />
            Xuất Excel
          </button>
        </div>
      </div>

      {busy ? (
        <p className="mt-6 text-sm text-slate-500">Đang tải dữ liệu...</p>
      ) : null}
      {error ? (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {data ? (
        <>
          {/* Top stats cards */}
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-center justify-between rounded-2xl bg-gradient-to-br from-sky-50 to-sky-100/60 px-4 py-4 ring-1 ring-sky-100">
              <div>
                <div className="text-xs font-medium uppercase text-sky-700">
                  Tổng người dùng
                </div>
                <div className="mt-2 text-2xl font-semibold text-slate-900">
                  {data.users}
                </div>
              </div>
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white text-sky-600 shadow-sm">
                <I.User className="text-[18px]" />
              </span>
            </div>

            <div className="flex items-center justify-between rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100/60 px-4 py-4 ring-1 ring-emerald-100">
              <div>
                <div className="text-xs font-medium uppercase text-emerald-700">
                  Tổng phòng
                </div>
                <div className="mt-2 text-2xl font-semibold text-slate-900">
                  {data.rooms}
                </div>
              </div>
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-sm">
                <I.Room className="text-[18px]" />
              </span>
            </div>

            <div className="flex items-center justify-between rounded-2xl bg-gradient-to-br from-violet-50 to-violet-100/60 px-4 py-4 ring-1 ring-violet-100">
              <div>
                <div className="text-xs font-medium uppercase text-violet-700">
                  Tổng bài viết
                </div>
                <div className="mt-2 text-2xl font-semibold text-slate-900">
                  {data.posts}
                </div>
              </div>
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white text-violet-600 shadow-sm">
                <I.Newspaper className="text-[18px]" />
              </span>
            </div>

            <div className="flex items-center justify-between rounded-2xl bg-gradient-to-br from-amber-50 to-amber-100/60 px-4 py-4 ring-1 ring-amber-100">
              <div>
                <div className="text-xs font-medium uppercase text-amber-700">
                  Phòng chờ duyệt
                </div>
                <div className="mt-2 text-2xl font-semibold text-slate-900">
                  {data.pendingRooms}
                </div>
              </div>
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white text-amber-500 shadow-sm">
                <I.Clock className="text-[18px]" />
              </span>
            </div>

            <div className="flex items-center justify-between rounded-2xl bg-gradient-to-br from-rose-50 to-rose-100/60 px-4 py-4 ring-1 ring-rose-100">
              <div>
                <div className="text-xs font-medium uppercase text-rose-700">
                  Doanh thu (khoảng chọn)
                </div>
                <div className="mt-2 text-2xl font-semibold text-slate-900">
                  {formatVnd(data.revenueInRange)}
                </div>
              </div>
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white text-rose-600 shadow-sm">
                <I.Money className="text-[18px]" />
              </span>
            </div>

            <div className="flex items-center justify-between rounded-2xl bg-gradient-to-br from-indigo-50 to-indigo-100/60 px-4 py-4 ring-1 ring-indigo-100">
              <div>
                <div className="text-xs font-medium uppercase text-indigo-700">User mới (khoảng chọn)</div>
                <div className="mt-2 text-2xl font-semibold text-slate-900">{kpi.totalUsersInRange.toLocaleString("vi-VN")}</div>
              </div>
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-sm">
                <I.User className="text-[18px]" />
              </span>
            </div>

            <div className="flex items-center justify-between rounded-2xl bg-gradient-to-br from-teal-50 to-teal-100/60 px-4 py-4 ring-1 ring-teal-100">
              <div>
                <div className="text-xs font-medium uppercase text-teal-700">Tỉ lệ gửi duyệt phòng</div>
                <div className="mt-2 text-2xl font-semibold text-slate-900">{kpi.approvalRate.toFixed(1)}%</div>
              </div>
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white text-teal-600 shadow-sm">
                <I.Check className="text-[18px]" />
              </span>
            </div>

            <div className="flex items-center justify-between rounded-2xl bg-gradient-to-br from-fuchsia-50 to-fuchsia-100/60 px-4 py-4 ring-1 ring-fuchsia-100">
              <div>
                <div className="text-xs font-medium uppercase text-fuchsia-700">DT trung bình/giao dịch</div>
                <div className="mt-2 text-2xl font-semibold text-slate-900">{formatVnd(kpi.avgRevenuePerPayment)}</div>
              </div>
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white text-fuchsia-600 shadow-sm">
                <I.Money className="text-[18px]" />
              </span>
            </div>
          </div>

          {/* Middle: quick stats + quick actions */}
          <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.3fr)]">
            <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200/70 sm:p-5">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                  <FaChartPie className="text-xs" />
                </span>
                Thống kê nhanh
              </h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <div>
                  <div className="text-xs text-slate-500">Bài viết đã đăng</div>
                  <div className="mt-1 text-xl font-semibold text-slate-900">
                    {data.publishedPosts}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Phòng đang hoạt động</div>
                  <div className="mt-1 text-xl font-semibold text-slate-900">
                    {data.rooms}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">
                    Người dùng mới (khoảng chọn)
                  </div>
                  <div className="mt-1 text-xl font-semibold text-slate-900">
                    {kpi.totalUsersInRange.toLocaleString("vi-VN")}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Giao dịch đã thanh toán</div>
                  <div className="mt-1 text-xl font-semibold text-slate-900">{data.paidPayments}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Tỉ lệ phòng chờ duyệt</div>
                  <div className={`mt-1 text-xl font-semibold ${kpiSeverity.pending.text}`}>{kpi.pendingRatio.toFixed(1)}%</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Tỉ lệ bài viết đã đăng</div>
                  <div className={`mt-1 text-xl font-semibold ${kpiSeverity.postPublish.text}`}>{kpi.postPublishRatio.toFixed(1)}%</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Phòng tạo mới (khoảng chọn)</div>
                  <div className="mt-1 text-xl font-semibold text-slate-900">{kpi.totalRoomCreatedInRange.toLocaleString("vi-VN")}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Phòng đã gửi duyệt (khoảng chọn)</div>
                  <div className="mt-1 text-xl font-semibold text-slate-900">{kpi.totalRoomSubmittedInRange.toLocaleString("vi-VN")}</div>
                </div>
                <div className="sm:col-span-3">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                    <FaCalendarDays className="text-[11px]" />
                    Hiệu suất vận hành theo ngày (doanh thu, giao dịch, user, phòng mới)
                  </div>
                  <div className="mt-3 h-56 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={performanceSeries} margin={{ left: 8, right: 8, top: 10, bottom: 0 }}>
                        <defs>
                          <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.35} />
                            <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.05} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                        <YAxis yAxisId="left" tick={{ fontSize: 11 }} tickFormatter={(v) => formatCompact(v)} />
                        <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                        <Tooltip
                          formatter={(v, name) => {
                            if (name === "revenue") return [formatVnd(v), "Doanh thu"];
                            if (name === "paid_cnt") return [Number(v).toLocaleString("vi-VN"), "Giao dịch"];
                            if (name === "users") return [Number(v).toLocaleString("vi-VN"), "User mới"];
                            if (name === "roomCreated") return [Number(v).toLocaleString("vi-VN"), "Phòng tạo mới"];
                            return [v, name];
                          }}
                        />
                        <Legend />
                        <Area yAxisId="left" type="monotone" dataKey="revenue" name="Doanh thu" stroke="#0ea5e9" fill="url(#rev)" />
                        <Bar yAxisId="right" dataKey="paid_cnt" name="Giao dịch" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                        <Line yAxisId="right" type="monotone" dataKey="users" name="User mới" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                        <Line yAxisId="right" type="monotone" dataKey="roomCreated" name="Phòng mới" stroke="#22c55e" strokeWidth={2} dot={false} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="sm:col-span-3">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                    <FaCalendarDays className="text-[11px]" />
                    Phòng tạo mới theo ngày (trong khoảng chọn)
                  </div>
                  <div className="mt-3 h-56 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={roomsSeries} margin={{ left: 8, right: 8, top: 10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip
                          formatter={(v, name) => [
                            Number(v).toLocaleString("vi-VN"),
                            name === "created_cnt" ? "Tạo mới" : "Đã gửi"
                          ]}
                        />
                        <Legend />
                        <Bar dataKey="created_cnt" name="Tạo mới" fill="#22c55e" radius={[6, 6, 0, 0]} />
                        <Bar dataKey="submitted_cnt" name="Đã gửi" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200/70 sm:p-5">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                  <FaUsersGear className="text-xs" />
                </span>
                Hành động nhanh
              </h2>
              <div className="mt-4 space-y-3">
                <Link
                  className="flex w-full items-center justify-between rounded-xl bg-sky-50 px-4 py-3 text-sm font-medium text-sky-700 transition hover:bg-sky-100"
                  to="/admin/rooms"
                >
                  <span>Đến danh sách duyệt phòng</span>
                  <I.ArrowRight className="text-[14px]" />
                </Link>
                <Link
                  className="flex w-full items-center justify-between rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 transition hover:bg-emerald-100"
                  to="/admin/posts/new"
                >
                  <span>+ Thêm bài viết mới</span>
                  <I.ArrowRight className="text-[14px]" />
                </Link>
                <Link
                  className="flex w-full items-center justify-between rounded-xl bg-violet-50 px-4 py-3 text-sm font-medium text-violet-700 transition hover:bg-violet-100"
                  to="/admin/categories"
                >
                  <span>+ Thêm chủ đề mới</span>
                  <I.ArrowRight className="text-[14px]" />
                </Link>
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    <FaTriangleExclamation className="text-[11px] text-amber-500" />
                    Cảnh báo vận hành
                  </div>
                  <div className="mt-2 space-y-2 text-sm text-slate-700">
                    <div className="flex items-center justify-between">
                      <span>Phòng chờ duyệt</span>
                      <span className={`rounded-full px-2 py-1 text-xs font-semibold ${kpiSeverity.pending.chip}`}>
                        {Number(data.pendingRooms || 0).toLocaleString("vi-VN")}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                      <div
                        className={`h-full rounded-full ${kpiSeverity.pending.bg}`}
                        style={{ width: `${Math.min(100, kpi.pendingRatio)}%` }}
                      />
                    </div>
                    <p className="text-xs text-slate-500">
                      Tỉ lệ chờ duyệt đang là {kpi.pendingRatio.toFixed(1)}% tổng số phòng.
                    </p>
                    <div className="flex items-center justify-between">
                      <span>Tỉ lệ bài viết đã đăng</span>
                      <span className={`rounded-full px-2 py-1 text-xs font-semibold ${kpiSeverity.postPublish.chip}`}>
                        {kpi.postPublishRatio.toFixed(1)}%
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                      <div
                        className={`h-full rounded-full ${kpiSeverity.postPublish.bg}`}
                        style={{ width: `${Math.min(100, kpi.postPublishRatio)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom detailed tables (giữ lại cho thông tin chi tiết) */}
          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200/70 sm:p-5 lg:col-span-1">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                <I.Room className="text-sky-600" />
                Phòng theo trạng thái
              </h2>
              <div className="mt-3 h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={roomsStatusPie} dataKey="value" nameKey="name" outerRadius={80} innerRadius={48} paddingAngle={2}>
                      {roomsStatusPie.map((_, idx) => (
                        <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => Number(v).toLocaleString("vi-VN")} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <table className="table-base mt-4">
                <thead>
                  <tr>
                    <th>Trạng thái</th>
                    <th>Số lượng</th>
                  </tr>
                </thead>
                <tbody>
                  {(data.roomsByStatus || []).map((r) => (
                    <tr key={r.status}>
                      <td>{roomOrPostStatusLabelVn(r.status)}</td>
                      <td>{Number(r.cnt).toLocaleString("vi-VN")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200/70 sm:p-5 lg:col-span-1">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                <I.Newspaper className="text-violet-600" />
                Bài viết theo trạng thái
              </h2>
              <div className="mt-3 h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={postsStatusPie} dataKey="value" nameKey="name" outerRadius={80} innerRadius={48} paddingAngle={2}>
                      {postsStatusPie.map((_, idx) => (
                        <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => Number(v).toLocaleString("vi-VN")} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <table className="table-base mt-4">
                <thead>
                  <tr>
                    <th>Trạng thái</th>
                    <th>Số lượng</th>
                  </tr>
                </thead>
                <tbody>
                  {(data.postsByStatus || []).map((r) => (
                    <tr key={r.status}>
                      <td>{roomOrPostStatusLabelVn(r.status)}</td>
                      <td>{Number(r.cnt).toLocaleString("vi-VN")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200/70 sm:p-5 lg:col-span-1">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                <I.User className="text-indigo-600" />
                Người dùng theo ngày (khoảng chọn)
              </h2>
              <div className="mt-3 h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={usersSeries} margin={{ left: 8, right: 8, top: 10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="usr" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v) => Number(v).toLocaleString("vi-VN")} />
                    <Area type="monotone" dataKey="cnt" name="Người dùng mới" stroke="#8b5cf6" fill="url(#usr)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <table className="table-base mt-3">
                <thead>
                  <tr>
                    <th>Ngày</th>
                    <th>Số lượng</th>
                  </tr>
                </thead>
                <tbody>
                  {(data.usersInRange || []).map((r) => (
                    <tr key={r.date}>
                      <td>{r.date}</td>
                      <td>{r.cnt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200/70 sm:p-5">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                <I.Money className="text-rose-600" />
                Bán gói (khoảng chọn)
              </h2>
              <div className="mt-3 h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={(data.packageSalesInRange || []).map((r) => ({
                      name: r.name,
                      cnt: Number(r.cnt || 0),
                      revenue: Number(r.revenue || 0)
                    }))}
                    margin={{ left: 8, right: 8, top: 10, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                    <Tooltip
                      formatter={(v, name) => {
                        if (name === "revenue") return [formatVnd(v), "Doanh thu"];
                        if (name === "cnt") return [Number(v).toLocaleString("vi-VN"), "Số lượt"];
                        return [v, name];
                      }}
                    />
                    <Legend />
                    <Bar yAxisId="left" dataKey="cnt" name="Số lượt" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
                    <Bar yAxisId="right" dataKey="revenue" name="Doanh thu" fill="#ef4444" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 overflow-x-auto">
                <table className="table-clean w-full min-w-[520px]">
                  <thead>
                    <tr>
                      <th>Gói</th>
                      <th className="w-28">Số lượt</th>
                      <th className="w-40">Doanh thu</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data.packageSalesInRange || []).map((r) => (
                      <tr key={r.code}>
                        <td className="font-medium text-slate-900">{r.name} ({r.code})</td>
                        <td>{Number(r.cnt).toLocaleString("vi-VN")}</td>
                        <td className="font-semibold text-rose-700">{formatVnd(r.revenue)}</td>
                      </tr>
                    ))}
                    {(data.packageSalesInRange || []).length === 0 ? (
                      <tr>
                        <td colSpan={3} className="py-8 text-center text-sm text-slate-500">
                          Chưa có giao dịch gói trong tháng này.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200/70 sm:p-5">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                <I.User className="text-emerald-600" />
                Top chủ trọ (khoảng chọn)
              </h2>
              <div className="mt-3 overflow-x-auto">
                <table className="table-clean w-full min-w-[520px]">
                  <thead>
                    <tr>
                      <th>Chủ trọ</th>
                      <th className="w-32">Tạo mới</th>
                      <th className="w-32">Đã gửi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data.topLandlordsInRange || []).map((r) => (
                      <tr key={r.id}>
                        <td className="min-w-0">
                          <div className="truncate font-medium text-slate-900">{r.full_name || "-"}</div>
                          <div className="truncate text-xs text-slate-500">{r.email}</div>
                        </td>
                        <td>{Number(r.rooms_created).toLocaleString("vi-VN")}</td>
                        <td className="font-semibold">{Number(r.rooms_submitted).toLocaleString("vi-VN")}</td>
                      </tr>
                    ))}
                    {(data.topLandlordsInRange || []).length === 0 ? (
                      <tr>
                        <td colSpan={3} className="py-8 text-center text-sm text-slate-500">
                          Chưa có dữ liệu trong khoảng chọn.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

