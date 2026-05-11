import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import DOMPurify from "dompurify";
import { roomsApi } from "../api/roomsApi";
import {
  FaArrowLeft,
  FaList,
  FaImage,
  FaShieldHeart,
  FaCoins,
  FaBuilding,
  FaLocationDot,
  FaRulerCombined,
  FaUpRightAndDownLeftFromCenter,
  FaUsers,
  FaPeopleGroup,
  FaKey,
  FaSackDollar,
  FaVenusMars,
  FaUser,
  FaAlignLeft,
  FaUserShield,
  FaEnvelope,
  FaPhone,
  FaShieldHalved,
  FaBolt,
  FaCheck,
  FaHouseCircleCheck,
  FaArrowRight,
  FaCircleExclamation,
  FaChevronLeft,
  FaChevronRight,
  FaLink
} from "react-icons/fa6";
import { Icons } from "../ui/icons";
import { notify } from "../ui/toast";
import { SkeletonBlock, SkeletonText } from "../components/Skeleton.jsx";

function formatRoomType(t) {
  if (t === "phong_tro") return "Phòng trọ";
  if (t === "chung_cu_mini") return "Chung cư mini";
  if (t === "nha_nguyen_can") return "Nhà nguyên căn";
  if (t === "ky_tuc_xa") return "Ký túc xá";
  return "Loại khác";
}

/** Gallery kiểu listing: viewer lớn + prev/next + đếm ảnh + thumbnail cuộn ngang */
function RoomImageGallery({ images, title, priceMonthly }) {
  const list = useMemo(() => (Array.isArray(images) ? images : []), [images]);
  const n = list.length;
  const [idx, setIdx] = useState(0);
  const thumbBtnRefs = useRef([]);
  const imageIdsKey = useMemo(() => list.map((x) => x.id).join(","), [list]);

  useEffect(() => {
    setIdx(0);
  }, [imageIdsKey]);

  useEffect(() => {
    const el = thumbBtnRefs.current[idx];
    el?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [idx]);

  const goPrev = useCallback(() => {
    if (n <= 1) return;
    setIdx((i) => (i - 1 + n) % n);
  }, [n]);

  const goNext = useCallback(() => {
    if (n <= 1) return;
    setIdx((i) => (i + 1) % n);
  }, [n]);

  useEffect(() => {
    if (n <= 1) return;
    function onKey(e) {
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [n, goPrev, goNext]);

  function copyLink() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (url && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(url).then(() => notify.success("Đã copy link tin đăng"));
    }
  }

  if (n === 0) {
    return (
      <div className="flex aspect-[16/10] min-h-[280px] items-center justify-center bg-slate-100 text-slate-400">
        <div className="text-center">
          <FaImage className="mx-auto text-5xl opacity-50" />
          <p className="mt-2 text-sm">Chưa có ảnh</p>
        </div>
      </div>
    );
  }

  const current = list[idx];

  return (
    <div className="bg-slate-950">
      {/* Viewer chính */}
      <div className="relative">
        <div className="relative flex min-h-[min(70vh,520px)] items-center justify-center bg-black px-2 sm:min-h-[420px]">
          {/* Không dùng w-full: tránh phóng to ảnh nhỏ hết chiều ngang viewer → bị vỡ/răng cưa.
              Giữ nguyên độ nét tối đa: chỉ thu nhỏ khi vượt max, không upscale quá kích thước gốc. */}
          <img
            src={current.url}
            alt={`${title || "Phòng"} — ảnh ${idx + 1}`}
            className="mx-auto block h-auto max-h-[min(70vh,640px)] w-auto max-w-full object-contain"
            decoding="async"
            fetchpriority={idx === 0 ? "high" : "auto"}
          />

          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20" />

          <div className="absolute left-4 top-4 inline-flex items-center gap-1 rounded-full bg-black/55 px-3 py-1.5 text-xs font-medium text-white backdrop-blur pointer-events-auto">
            <FaShieldHeart className="text-emerald-300" />
            Đã kiểm duyệt
          </div>

          <button
            type="button"
            onClick={copyLink}
            className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur transition hover:bg-black/70 pointer-events-auto"
            title="Copy link"
            aria-label="Copy link"
          >
            <FaLink className="text-sm" />
          </button>

          <div className="absolute bottom-4 left-4 inline-flex items-center gap-2 rounded-xl bg-white/95 px-3 py-2 text-lg font-bold text-brand-600 shadow-lg pointer-events-auto">
            <FaCoins className="text-base text-amber-500" />
            <span>{Number(priceMonthly).toLocaleString("vi-VN")} đ/tháng</span>
          </div>

          <div className="absolute bottom-4 right-4 rounded-lg bg-black/65 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur pointer-events-none">
            {idx + 1} / {n}
          </div>

          {n > 1 ? (
            <>
              <button
                type="button"
                onClick={goPrev}
                className="absolute left-2 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur transition hover:bg-black/65 sm:left-4 sm:h-12 sm:w-12"
                aria-label="Ảnh trước"
              >
                <FaChevronLeft className="text-lg" />
              </button>
              <button
                type="button"
                onClick={goNext}
                className="absolute right-2 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur transition hover:bg-black/65 sm:right-4 sm:h-12 sm:w-12"
                aria-label="Ảnh sau"
              >
                <FaChevronRight className="text-lg" />
              </button>
            </>
          ) : null}
        </div>

        {/* Thumbnail strip */}
        {n > 1 ? (
          <div className="border-t border-white/10 bg-slate-900/95 px-3 py-3 sm:px-4">
            <p className="mb-2 text-center text-[11px] font-medium uppercase tracking-wider text-slate-400">
              Xem thêm ảnh ({n})
            </p>
            <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:thin] [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-600">
              {list.map((img, i) => (
                <button
                  key={img.id}
                  type="button"
                  ref={(el) => {
                    thumbBtnRefs.current[i] = el;
                  }}
                  onClick={() => setIdx(i)}
                  className={`relative shrink-0 overflow-hidden rounded-xl border-2 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 ${
                    i === idx
                      ? "border-amber-400 ring-2 ring-amber-400/40"
                      : "border-transparent opacity-75 hover:opacity-100"
                  }`}
                  style={{ width: "4.5rem", height: "4.5rem" }}
                  aria-label={`Ảnh ${i + 1}`}
                  aria-current={i === idx}
                >
                  <img src={img.url} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function RoomCard({ r }) {
  return (
    <Link
      to={`/rooms/${r.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:-translate-y-1 hover:border-brand-200 hover:shadow-lg"
    >
      <div className="relative aspect-4/3 overflow-hidden bg-slate-100">
        {r.cover_image_url ? (
          <img
            src={r.cover_image_url}
            alt={r.title}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="grid h-full w-full place-items-center text-slate-400">
            <FaImage className="text-3xl opacity-50" />
          </div>
        )}
        <div className="absolute left-3 top-3 rounded-full bg-black/60 px-2 py-1 text-[10px] font-medium text-white backdrop-blur">
          {formatRoomType(r.room_type)}
        </div>
        <div className="absolute bottom-3 right-3 rounded-lg bg-white/95 px-2 py-1 text-xs font-bold text-brand-600">
          {Number(r.price_monthly).toLocaleString("vi-VN")} đ/tháng
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="line-clamp-2 text-sm font-semibold text-slate-900 group-hover:text-brand-700">
          {r.title}
        </h3>
        <div className="flex items-center gap-1 text-[11px] text-slate-500">
          <FaLocationDot className="text-brand-500" />
          <span className="line-clamp-1">
            {[r.street, r.ward, r.district].filter(Boolean).join(", ") || "Chưa cập nhật"}
          </span>
        </div>
        <div className="mt-auto flex items-center gap-2 text-[11px] text-slate-500">
          <span className="flex items-center gap-1">
            <FaRulerCombined />
            {Number(r.area_m2).toLocaleString("vi-VN")} m²
          </span>
        </div>
      </div>
    </Link>
  );
}

function RoomDetailSkeleton() {
  return (
    <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <SkeletonBlock className="aspect-[16/10] w-full rounded-none" radius="rounded-none" staggerIndex={0} />
      <div className="space-y-6 p-6 sm:p-8">
        <div className="space-y-3">
          <SkeletonBlock className="h-6 w-36" radius="rounded-full" staggerIndex={1} />
          <SkeletonBlock className="h-8 w-3/4" staggerIndex={2} />
          <SkeletonBlock className="h-4 w-2/3" staggerIndex={3} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={`stat-sk-${idx}`} className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
              <SkeletonBlock className="h-4 w-20" staggerIndex={4 + idx * 2} />
              <SkeletonBlock className="mt-3 h-6 w-24" staggerIndex={5 + idx * 2} />
            </div>
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(260px,1fr)]">
          <div className="space-y-3">
            <SkeletonBlock className="h-6 w-24" staggerIndex={20} />
            <SkeletonText lines={3} staggerBase={21} />
          </div>
          <div className="rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center gap-3">
              <SkeletonBlock className="h-12 w-12" radius="rounded-full" staggerIndex={26} />
              <div className="space-y-2">
                <SkeletonBlock className="h-4 w-28" staggerIndex={27} />
                <SkeletonBlock className="h-3 w-20" staggerIndex={28} />
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <SkeletonBlock className="h-4 w-4/5" staggerIndex={29} />
              <SkeletonBlock className="h-4 w-3/5" staggerIndex={30} />
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

export default function RoomDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const I = Icons;
  const [room, setRoom] = useState(null);
  const [relatedRooms, setRelatedRooms] = useState([]);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const safeDescriptionHtml = useMemo(
    () => DOMPurify.sanitize(room?.description || ""),
    [room?.description]
  );
  const safeMapEmbedHtml = useMemo(
    () =>
      DOMPurify.sanitize(room?.map_embed_html || "", {
        ADD_TAGS: ["iframe"],
        ADD_ATTR: [
          "allow",
          "allowfullscreen",
          "frameborder",
          "scrolling",
          "loading",
          "referrerpolicy",
          "src",
          "width",
          "height"
        ]
      }),
    [room?.map_embed_html]
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setBusy(true);
      setError("");
      try {
        const data = await roomsApi.detail(id);
        if (!cancelled) setRoom(data);
      } catch (err) {
        const message = err?.response?.data?.message || "Không tải được chi tiết phòng";
        if (!cancelled) setError(message);
        notify.error(message);
      } finally {
        if (!cancelled) setBusy(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  useEffect(() => {
    if (!room) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await roomsApi.list({
          roomType: room.room_type,
          excludeId: Number(room.id),
          limit: 4,
          offset: 0
        });
        if (!cancelled) setRelatedRooms(res?.rooms || []);
      } catch {
        if (!cancelled) setRelatedRooms([]);
      }
    })();
    return () => { cancelled = true; };
  }, [room?.id, room?.room_type]);

  return (
    <div className="mx-auto w-full max-w-6xl">
      {/* Breadcrumb & Back */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700"
        >
          <FaArrowLeft />
          Quay lại
        </button>
        <Link
          to="/rooms"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-brand-200 hover:text-brand-700"
        >
          <FaList />
          Xem tất cả phòng
        </Link>
      </div>

      {busy && (
        <RoomDetailSkeleton />
      )}

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-4 text-sm text-red-700">
          <FaCircleExclamation className="mr-2" />
          {error}
        </div>
      )}

      {room && (
        <div className="space-y-8">
          {/* Main card */}
          <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <RoomImageGallery images={room.images} title={room.title} priceMonthly={room.price_monthly} />

            {/* Content */}
            <div className="p-6 sm:p-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
                    <FaBuilding className="text-[11px]" />
                    {formatRoomType(room.room_type)}
                  </div>
                  <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">{room.title}</h1>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-600">
                    <span className="flex items-center gap-1.5">
                      <FaLocationDot className="text-brand-500" />
                      {[room.street, room.ward, room.district, room.province].filter(Boolean).join(", ") || "Chưa cập nhật địa chỉ"}
                    </span>
                    {room.address_detail && (
                      <span className="text-slate-500">— {room.address_detail}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Quick stats */}
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-100 text-brand-600">
                    <FaRulerCombined />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                      <FaUpRightAndDownLeftFromCenter className="text-[10px]" />
                      <span>Diện tích</span>
                    </div>
                    <div className="text-lg font-bold text-slate-900">{Number(room.area_m2).toLocaleString("vi-VN")} m²</div>
                  </div>
                </div>
                <div className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                    <FaUsers />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                      <FaPeopleGroup className="text-[10px]" />
                      <span>Sức chứa</span>
                    </div>
                    <div className="text-lg font-bold text-slate-900">{room.max_occupants ? `Tối đa ${room.max_occupants} người` : "—"}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                    <FaKey />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                      <FaSackDollar className="text-[10px]" />
                      <span>Tiền cọc</span>
                    </div>
                    <div className="text-lg font-bold text-slate-900">
                      {room.deposit ? `${Number(room.deposit).toLocaleString("vi-VN")} đ` : "—"}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-200 text-slate-600">
                    <FaVenusMars />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                      <FaUser className="text-[10px]" />
                      <span>Giới tính</span>
                    </div>
                    <div className="text-lg font-bold text-slate-900">
                      {room.gender_policy === "male" ? "Ưu tiên nam" : room.gender_policy === "female" ? "Ưu tiên nữ" : "Không giới hạn"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Description + Landlord info */}
              <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(260px,1fr)]">
                <div className="space-y-6">
                  <h2 className="mb-3 text-base font-semibold text-slate-900">
                    <FaAlignLeft className="mr-2 text-slate-400" />
                    Mô tả
                  </h2>
                  {safeDescriptionHtml ? (
                    <div className="prose prose-sm max-w-none rounded-2xl border border-slate-100 bg-slate-50/50 p-5 text-slate-700 prose-img:rounded-xl prose-img:border prose-img:border-slate-200">
                      <div
                        dangerouslySetInnerHTML={{ __html: safeDescriptionHtml }}
                      />
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-5 text-sm text-slate-500">
                      Chưa có mô tả chi tiết.
                    </div>
                  )}

                  {safeMapEmbedHtml ? (
                    <div>
                      <h2 className="mb-3 text-base font-semibold text-slate-900">
                        <FaLocationDot className="mr-2 text-slate-400" />
                        Bản đồ vị trí
                      </h2>
                      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                        <div
                          className="room-map-embed"
                          dangerouslySetInnerHTML={{ __html: safeMapEmbedHtml }}
                        />
                      </div>
                    </div>
                  ) : null}
                </div>

                {(room.landlord_full_name || room.landlord_email || room.landlord_phone) && (
                  <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="mb-3 flex items-center gap-3">
                      <div className="relative h-12 w-12 overflow-hidden rounded-full bg-brand-50 text-sm font-bold text-brand-700">
                        {room.landlord_avatar_url ? (
                          <img
                            src={room.landlord_avatar_url}
                            alt={room.landlord_full_name || room.landlord_email}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            {(room.landlord_full_name || room.landlord_email || "?")
                              .toString()
                              .charAt(0)
                              .toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-900">
                          {room.landlord_full_name || "Chủ trọ"}
                        </div>
                        <div className="mt-0.5 inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-[11px] font-medium text-amber-700">
                          <FaUserShield className="text-[10px]" />
                          Người đăng tin
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm text-slate-600">
                      {room.landlord_email && (
                        <div className="flex items-center gap-2">
                          <FaEnvelope className="text-xs text-slate-400" />
                          <span className="truncate">{room.landlord_email}</span>
                        </div>
                      )}
                      {room.landlord_phone && (
                        <div className="flex items-center gap-2">
                          <FaPhone className="text-xs text-slate-400" />
                          <span>{room.landlord_phone}</span>
                        </div>
                      )}
                      <div className="mt-4 rounded-xl bg-slate-50 p-3 text-xs text-slate-500">
                        <div className="mb-1 flex items-center gap-2 font-semibold text-slate-700">
                          <FaShieldHalved className="text-[11px] text-emerald-500" />
                          <span>Lưu ý an toàn</span>
                        </div>
                        Luôn kiểm tra phòng trực tiếp, ký hợp đồng rõ ràng và không chuyển tiền giữ chỗ khi chưa xác
                        thực thông tin chủ trọ.
                      </div>
                    </div>
                  </aside>
                )}
              </div>

              {/* Utilities (if any) */}
              {(() => {
                const u = typeof room.utilities_json === "string" ? (() => { try { return JSON.parse(room.utilities_json); } catch { return {}; } })() : room.utilities_json;
                const items = u && typeof u === "object" ? Object.entries(u).filter(([, v]) => v) : [];
                const labels = {
                  wifi: "Wi-Fi",
                  may_lanh: "Máy lạnh",
                  thang_may: "Thang máy",
                  giu_xe: "Giữ xe",
                  cho_de_xe: "Chỗ để xe",
                  nong_lanh: "Nóng lạnh",
                  tu_lanh: "Tủ lạnh",
                  may_giat: "Máy giặt",
                  bep: "Bếp"
                };
                if (items.length === 0) return null;
                return (
                  <div className="mt-8">
                    <h2 className="mb-3 text-base font-semibold text-slate-900">
                      <FaBolt className="mr-2 text-slate-400" />
                      Tiện ích
                    </h2>
                    <div className="flex flex-wrap gap-2">
                      {items.map(([k]) => (
                        <span
                          key={k}
                          className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-800"
                        >
                          <FaCheck className="text-emerald-500" />
                          {labels[k] || k.replace(/_/g, " ")}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* CTA */}
              <div className="mt-8 flex flex-wrap gap-3 border-t border-slate-200 pt-8">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="btn-secondary"
                >
                  <FaArrowLeft className="mr-2" />
                  Quay lại
                </button>
                <Link to="/rooms" className="btn-secondary">
                  <FaBuilding className="mr-2" />
                  Xem thêm phòng khác
                </Link>
              </div>
            </div>
          </article>

          {/* Related rooms */}
          {relatedRooms.length > 0 && (
            <section>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900">
                  <FaHouseCircleCheck className="mr-2 text-brand-500" />
                  Phòng liên quan
                </h2>
                <Link
                  to="/rooms"
                  className="text-sm font-medium text-brand-600 hover:text-brand-700"
                >
                  Xem tất cả
                  <FaArrowRight className="ml-1" />
                </Link>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {relatedRooms.map((r) => (
                  <RoomCard key={r.id} r={r} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
