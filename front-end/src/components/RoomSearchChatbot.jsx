import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { FaBuilding, FaImage, FaLocationDot, FaPaperPlane, FaRobot, FaRulerCombined, FaXmark } from "react-icons/fa6";
import { chatApi } from "../api/chatApi.js";
import { notify } from "../ui/toast";
import { roomTypeLabelVn } from "../utils/labels.js";

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Văn bản trợ lý: không in URL thô. URL trang phòng (/rooms/số) → nút "Xem phòng";
 * các URL khác bị ẩn (server đã lọc hầu hết).
 */
function AssistantRichText({ text, className }) {
  const raw = String(text || "")
    .replace(/\bhttps?:\/\/[^\s<]*\/rooms\/\{id\}\b/gi, "")
    .replace(/\B\/rooms\/\{id\}\b/gi, "");
  const re = /(https?:\/\/[^\s<]+)/gi;
  const pieces = raw.split(re);
  return (
    <span className={className}>
      {pieces.map((piece, i) => {
        if (!/^https?:\/\//i.test(piece)) {
          return <span key={i}>{piece}</span>;
        }
        const room = piece.match(/\/rooms\/(\d+)(?:\/|\?|#|$)/);
        if (room) {
          return (
            <Link
              key={i}
              to={`/rooms/${room[1]}`}
              className="mx-0.5 inline-flex items-center rounded-md bg-teal-600 px-2 py-0.5 align-baseline text-[11px] font-semibold text-white no-underline ring-1 ring-teal-700/20 hover:bg-teal-700"
            >
              Xem phòng
            </Link>
          );
        }
        return null;
      })}
    </span>
  );
}

function formatPriceVnd(n) {
  if (n == null || Number.isNaN(Number(n))) return "—";
  return `${Number(n).toLocaleString("vi-VN")} đ/tháng`;
}

function locationLine(room) {
  const parts = [room.district, room.ward, room.province].filter(Boolean);
  return parts.length ? parts.join(" · ") : null;
}

/** Thẻ phòng trong khung chat */
function ChatRoomCard({ room }) {
  const loc = locationLine(room);
  const area = room.areaM2 != null && !Number.isNaN(Number(room.areaM2)) ? `${Number(room.areaM2)} m²` : null;

  return (
    <article className="group overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-sm ring-1 ring-slate-900/[0.04] transition duration-200 hover:border-teal-200/90 hover:shadow-md hover:ring-teal-500/10">
      <Link to={`/rooms/${room.id}`} className="block outline-none focus-visible:ring-2 focus-visible:ring-teal-500/40">
        <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-slate-100 via-slate-50 to-slate-200">
          {room.coverImageUrl ? (
            <img
              src={room.coverImageUrl}
              alt=""
              className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-slate-400">
              <FaImage className="text-2xl opacity-60" />
              <span className="text-[10px] font-medium">Chưa có ảnh</span>
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-900/75 via-slate-900/25 to-transparent pt-10" />
          <div className="absolute bottom-2 left-2 right-2 flex flex-wrap items-end justify-between gap-2">
            <span className="inline-flex items-center rounded-lg bg-white/95 px-2.5 py-1 text-[11px] font-bold tabular-nums text-teal-900 shadow-md backdrop-blur-sm ring-1 ring-white/60">
              {formatPriceVnd(room.priceMonthly)}
            </span>
            <span className="rounded-md bg-emerald-600/90 px-2 py-0.5 text-[10px] font-semibold text-white shadow-sm">
              {roomTypeLabelVn(room.roomType)}
            </span>
          </div>
        </div>
        <div className="space-y-2 p-3">
          <h4 className="line-clamp-2 min-h-[2.5rem] text-[13px] font-semibold leading-snug tracking-tight text-slate-900">
            {room.title}
          </h4>
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-500">
            {loc ? (
              <span className="inline-flex items-center gap-1">
                <FaLocationDot className="shrink-0 text-teal-500" />
                <span className="line-clamp-1">{loc}</span>
              </span>
            ) : null}
            {area ? (
              <span className="inline-flex items-center gap-1">
                <FaRulerCombined className="shrink-0 text-slate-400" />
                {area}
              </span>
            ) : null}
          </div>
          <span className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-slate-900 py-2 text-xs font-semibold text-white transition group-hover:bg-teal-700">
            Xem chi tiết
            <span className="text-[10px] opacity-80">→</span>
          </span>
        </div>
      </Link>
    </article>
  );
}

/** label = hiển thị; gửi API dạng __q:id để tiết kiệm token (server mở thành prompt đầy đủ) */
const SUGGESTIONS = [
  { id: 0, label: "Gợi ý phòng giá dưới 3 triệu/tháng" },
  { id: 1, label: "Tôi cần phòng ở Hà Nội, ưu tiên quận có nhiều sinh viên" },
  { id: 2, label: "So sánh phòng trọ và chung cư mini trên hệ thống" },
  { id: 3, label: "Làm sao để xem số liên hệ chủ trọ?" }
];

function toApiPayload(messages) {
  return messages.map((m) => ({
    role: m.role,
    content: m.role === "user" && m.quickId != null ? `__q:${m.quickId}` : m.content
  }));
}

export default function RoomSearchChatbot() {
  const [open, setOpen] = useState(false);
  const [enabled, setEnabled] = useState(true);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const listRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const s = await chatApi.status();
        if (!cancelled) setEnabled(Boolean(s?.enabled));
      } catch {
        if (!cancelled) setEnabled(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, open, busy]);

  useEffect(() => {
    if (open && inputRef.current) {
      const t = setTimeout(() => inputRef.current?.focus(), 200);
      return () => clearTimeout(t);
    }
  }, [open]);

  const send = useCallback(
    async (raw, quickId) => {
      const text = String(raw ?? input).trim();
      if (!text || busy) return;
      if (!enabled) {
        notify.error("Trợ lý chưa được bật trên server (thiếu GEMINI_API_KEY).");
        return;
      }

      const userMsg =
        quickId != null && Number.isInteger(Number(quickId))
          ? { id: uid(), role: "user", content: text, quickId: Number(quickId) }
          : { id: uid(), role: "user", content: text };
      setMessages((m) => [...m, userMsg]);
      setInput("");
      setBusy(true);

      const thread = toApiPayload([...messages, userMsg]);

      try {
        const data = await chatApi.send(
          thread,
          typeof window !== "undefined" ? window.location.origin : undefined
        );
        setMessages((m) => [
          ...m,
          {
            id: uid(),
            role: "assistant",
            content: data.reply || "",
            rooms: Array.isArray(data.rooms) ? data.rooms : []
          }
        ]);
      } catch (err) {
        const msg = err?.response?.data?.message || err?.message || "Không gửi được tin nhắn.";
        setMessages((m) => [
          ...m,
          {
            id: uid(),
            role: "assistant",
            content: `Không nhận được phản hồi từ trợ lý (${msg}). Bạn thử lại sau hoặc mở danh sách phòng bên dưới để xem trực tiếp.`,
            rooms: []
          }
        ]);
      } finally {
        setBusy(false);
      }
    },
    [busy, enabled, input, messages]
  );

  return (
    <div className="pointer-events-none fixed bottom-0 right-0 z-[60] flex flex-col items-end p-3 sm:p-5">
      {open ? (
        <div
          className="pointer-events-auto mb-3 flex max-h-[min(640px,calc(100dvh-5rem))] w-[min(100vw-1.25rem,440px)] flex-col overflow-hidden rounded-[1.25rem] border border-slate-200/80 bg-white shadow-[0_25px_50px_-12px_rgba(15,23,42,0.28)] ring-1 ring-slate-900/[0.06]"
          role="dialog"
          aria-label="Trợ lý tìm phòng"
        >
          <header className="relative shrink-0 overflow-hidden border-b border-white/10 bg-gradient-to-br from-slate-900 via-teal-900 to-emerald-900 px-4 pb-3 pt-3.5 text-white">
            <div className="pointer-events-none absolute -left-8 -top-12 h-40 w-40 rounded-full bg-teal-400/20 blur-3xl" />
            <div className="pointer-events-none absolute -right-4 bottom-0 h-28 w-28 rounded-full bg-emerald-400/15 blur-2xl" />
            <div className="relative flex items-start justify-between gap-2">
              <div className="flex min-w-0 items-center gap-3">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/10 ring-1 ring-white/20 backdrop-blur-sm">
                  <FaRobot className="text-xl text-emerald-200" />
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[15px] font-bold tracking-tight">Trợ lý tìm phòng</span>
                    <span className="rounded-md bg-white/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-100/90 ring-1 ring-white/15">
                      AI
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] font-medium text-teal-100/80">Hỗ trợ tìm phòng đã duyệt</p>
                </div>
              </div>
              <button
                type="button"
                className="rounded-xl p-2 text-white/90 transition hover:bg-white/10"
                onClick={() => setOpen(false)}
                aria-label="Đóng"
              >
                <FaXmark className="text-lg" />
              </button>
            </div>
            {!enabled ? (
              <p className="relative mt-2.5 rounded-lg bg-amber-500/20 px-3 py-2 text-[11px] leading-relaxed text-amber-50 ring-1 ring-amber-400/25">
                Trợ lý đang tắt: thêm <code className="rounded bg-black/25 px-1">GEMINI_API_KEY</code> vào{" "}
                <code className="rounded bg-black/25 px-1">back-end/.env</code> rồi khởi động lại API.
              </p>
            ) : (
              <p className="relative mt-2.5 text-[11px] leading-relaxed text-slate-200/90">
                Gợi ý phòng theo ngân sách & khu vực — kèm ảnh, giá và link xem ngay.
              </p>
            )}
          </header>

          <div
            ref={listRef}
            className="min-h-[220px] flex-1 space-y-4 overflow-y-auto bg-[linear-gradient(180deg,#f8fafc_0%,#f1f5f9_100%)] px-3 py-4"
          >
            {messages.length === 0 ? (
              <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-sm ring-1 ring-slate-900/[0.03] backdrop-blur-sm">
                <p className="text-sm font-semibold text-slate-900">Xin chào!</p>
                <p className="mt-1.5 text-[13px] leading-relaxed text-slate-600">
                  Đặt câu hỏi hoặc chọn gợi ý — tôi lọc phòng đã duyệt và hiển thị thẻ có ảnh & giá để bạn so sánh nhanh.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      disabled={busy || !enabled}
                      onClick={() => send(s.label, s.id)}
                      className="rounded-full border border-teal-200/90 bg-white px-3.5 py-2 text-left text-[11px] font-semibold leading-snug text-teal-900 shadow-sm transition hover:border-teal-300 hover:bg-teal-50/80 disabled:opacity-50"
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {messages.map((m) =>
              m.role === "user" ? (
                <div key={m.id} className="flex justify-end">
                  <div className="max-w-[90%] rounded-2xl rounded-br-md bg-gradient-to-br from-teal-600 to-emerald-700 px-4 py-2.5 text-[13px] leading-relaxed text-white shadow-md shadow-teal-900/15">
                    <span className="whitespace-pre-wrap break-words">{m.content}</span>
                  </div>
                </div>
              ) : (
                <div key={m.id} className="flex gap-2.5">
                  <div
                    className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center self-start rounded-xl bg-white shadow-sm ring-1 ring-slate-200/80"
                    aria-hidden
                  >
                    <FaRobot className="text-sm text-teal-600" />
                  </div>
                  <div className="min-w-0 flex-1 space-y-3">
                    <div className="rounded-2xl rounded-tl-md border border-slate-200/90 bg-white px-4 py-3 text-[13px] leading-relaxed text-slate-800 shadow-sm ring-1 ring-slate-900/[0.04]">
                      <AssistantRichText text={m.content} className="whitespace-pre-wrap break-words" />
                    </div>
                    {m.rooms && m.rooms.length > 0 ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 px-0.5">
                          <FaBuilding className="text-xs text-slate-400" />
                          <span className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                            Phòng gợi ý ({m.rooms.length})
                          </span>
                        </div>
                        <div className="grid gap-3">
                          {m.rooms.map((room) => (
                            <ChatRoomCard key={room.id} room={room} />
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              )
            )}

            {busy ? (
              <div className="flex gap-2.5">
                <div className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-white shadow-sm ring-1 ring-slate-200/80">
                  <FaRobot className="text-sm text-teal-600" />
                </div>
                <div className="rounded-2xl rounded-tl-md border border-slate-200/90 bg-white px-4 py-3 shadow-sm">
                  <span className="inline-flex items-center gap-2.5 text-xs font-medium text-slate-500">
                    <span className="flex gap-1">
                      <span className="h-2 w-2 animate-bounce rounded-full bg-teal-500 [animation-delay:-0.2s]" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-teal-500 [animation-delay:-0.1s]" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-teal-500" />
                    </span>
                    Đang phân tích phòng phù hợp…
                  </span>
                </div>
              </div>
            ) : null}
          </div>

          <footer className="shrink-0 border-t border-slate-200/90 bg-white/95 p-3 backdrop-blur-md">
            <div className="flex gap-2">
              <textarea
                ref={inputRef}
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                placeholder={enabled ? "Hỏi theo giá, khu vực, loại phòng…" : "Trợ lý đang tắt"}
                disabled={busy || !enabled}
                className="input-base max-h-28 min-h-[46px] flex-1 resize-y border-slate-200/90 bg-slate-50/80 text-sm transition focus:bg-white disabled:bg-slate-100"
              />
              <button
                type="button"
                onClick={() => send()}
                disabled={busy || !enabled || !input.trim()}
                className="inline-flex h-[46px] w-[46px] shrink-0 items-center justify-center self-end rounded-xl bg-gradient-to-br from-teal-600 to-emerald-700 text-white shadow-md shadow-teal-900/20 transition hover:from-teal-500 hover:to-emerald-600 disabled:opacity-45"
                aria-label="Gửi"
              >
                <FaPaperPlane className="text-sm" />
              </button>
            </div>
            <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-2 text-[10px] text-slate-500">
              <Link
                to="/rooms"
                className="font-semibold text-teal-700 hover:text-teal-800 hover:underline"
                onClick={() => setOpen(false)}
              >
                Danh sách phòng
              </Link>
              {messages.length > 0 ? (
                <button
                  type="button"
                  className="font-semibold text-slate-600 hover:text-slate-900"
                  onClick={() => setMessages([])}
                >
                  Xoá hội thoại
                </button>
              ) : null}
            </div>
          </footer>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="pointer-events-auto relative flex h-[3.75rem] w-[3.75rem] items-center justify-center rounded-full bg-gradient-to-br from-slate-900 via-teal-800 to-emerald-800 text-white shadow-[0_12px_40px_-8px_rgba(15,118,110,0.55)] ring-2 ring-white transition hover:scale-[1.04] hover:shadow-[0_16px_44px_-8px_rgba(15,118,110,0.6)] focus:outline-none focus-visible:ring-4 focus-visible:ring-teal-400/45"
        aria-label={open ? "Đóng trợ lý tìm phòng" : "Mở trợ lý tìm phòng"}
        aria-expanded={open}
      >
        {!open ? (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-500 px-1 text-[9px] font-bold uppercase tracking-tight text-white ring-2 ring-white">
            AI
          </span>
        ) : null}
        {open ? <FaXmark className="text-xl" /> : <FaRobot className="text-2xl" />}
      </button>
    </div>
  );
}
