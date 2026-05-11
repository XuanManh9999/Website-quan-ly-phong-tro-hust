import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { roomsApi } from "../api/roomsApi";
import { Icons } from "../ui/icons";
import { notify } from "../ui/toast";
import { locationsApi } from "../api/locationsApi";
import { Pagination } from "../components/Pagination.jsx";
import { SkeletonBlock, SkeletonText } from "../components/Skeleton.jsx";

const PAGE_SIZE = 12;

function toNum(v) {
  if (v == null || v === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function formatRoomType(t) {
  if (t === "phong_tro") return "Phòng trọ";
  if (t === "chung_cu_mini") return "Chung cư mini";
  if (t === "nha_nguyen_can") return "Nhà nguyên căn";
  if (t === "ky_tuc_xa") return "Ký túc xá";
  return "Loại khác";
}

function RoomsListSkeleton() {
  return (
    <div className="grid gap-4">
      {Array.from({ length: 5 }).map((_, idx) => (
        <div
          key={`room-sk-${idx}`}
          className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-4 sm:grid-cols-[220px_minmax(0,1fr)] sm:p-5"
        >
          <SkeletonBlock className="h-40 w-full" radius="rounded-2xl" staggerIndex={idx} />
          <div className="grid gap-3">
            <SkeletonBlock className="h-5 w-4/5" staggerIndex={idx + 1} />
            <SkeletonBlock className="h-4 w-3/5" staggerIndex={idx + 2} />
            <div className="flex gap-2">
              <SkeletonBlock className="h-6 w-24" radius="rounded-full" staggerIndex={idx + 3} />
              <SkeletonBlock className="h-6 w-28" radius="rounded-full" staggerIndex={idx + 4} />
            </div>
            <SkeletonBlock className="h-4 w-44" staggerIndex={idx + 5} />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function RoomsListPage() {
  const I = Icons;
  const [params, setParams] = useSearchParams();
  const keyword = params.get("keyword") || "";
  const priceMin = params.get("priceMin") || "";
  const priceMax = params.get("priceMax") || "";
  const areaMin = params.get("areaMin") || "";
  const areaMax = params.get("areaMax") || "";
  const roomType = params.get("roomType") || "";
  const province = params.get("province") || "";
  const district = params.get("district") || "";
  const ward = params.get("ward") || "";
  const page = Math.max(1, parseInt(params.get("page") || "1", 10) || 1);
  const sortBy = params.get("sort") || "recommended";

  const [priceMinInput, setPriceMinInput] = useState("");
  const [priceMaxInput, setPriceMaxInput] = useState("");
  const [areaMinInput, setAreaMinInput] = useState("");
  const [areaMaxInput, setAreaMaxInput] = useState("");
  const [provinces, setProvinces] = useState([]);
  const [locationsBusy, setLocationsBusy] = useState(false);

  useEffect(() => {
    setPriceMinInput(priceMin ? Number(priceMin).toLocaleString("vi-VN") : "");
    setPriceMaxInput(priceMax ? Number(priceMax).toLocaleString("vi-VN") : "");
    setAreaMinInput(areaMin ? Number(areaMin).toLocaleString("vi-VN") : "");
    setAreaMaxInput(areaMax ? Number(areaMax).toLocaleString("vi-VN") : "");
  }, [priceMin, priceMax, areaMin, areaMax]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLocationsBusy(true);
      try {
        const list = await locationsApi.provinces();
        if (!cancelled) setProvinces(list || []);
      } catch (err) {
        const message = err?.response?.data?.message || "Không tải được dữ liệu tỉnh/thành";
        if (!cancelled) notify.error(message);
      } finally {
        if (!cancelled) setLocationsBusy(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const query = useMemo(
    () => ({
      keyword: keyword || undefined,
      roomType: roomType || undefined,
      province: province || undefined,
      district: district || undefined,
      ward: ward || undefined,
      priceMin: toNum(priceMin),
      priceMax: toNum(priceMax),
      areaMin: toNum(areaMin),
      areaMax: toNum(areaMax),
      limit: PAGE_SIZE,
      offset: (page - 1) * PAGE_SIZE,
      sort: sortBy
    }),
    [keyword, roomType, province, district, ward, priceMin, priceMax, areaMin, areaMax, page, sortBy]
  );

  const [rooms, setRooms] = useState([]);
  const [total, setTotal] = useState(0);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setBusy(true);
      setError("");
      try {
        const data = await roomsApi.list(query);
        if (!cancelled) {
          setRooms(data.rooms || []);
          setTotal(Number(data.total) || 0);
        }
      } catch (err) {
        const message = err?.response?.data?.message || "Không tải được danh sách phòng";
        if (!cancelled) setError(message);
        notify.error(message);
      } finally {
        if (!cancelled) setBusy(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [query]);

  function onSubmit(e) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const next = {};
    for (const [k, v] of fd.entries()) {
      if (!v) continue;
      let value = String(v);
      if (k === "priceMin" || k === "priceMax" || k === "areaMin" || k === "areaMax") {
        value = value.replace(/\./g, "");
      }
      if (value) next[k] = value;
    }
    next.page = "1";
    setParams(next);
  }

  function setQuickPrice(min, max) {
    const next = Object.fromEntries(params.entries());
    if (min != null) next.priceMin = String(min);
    else delete next.priceMin;
    if (max != null) next.priceMax = String(max);
    else delete next.priceMax;
    next.page = "1";
    setParams(next);
  }

  function setSort(nextSort) {
    const next = Object.fromEntries(params.entries());
    next.sort = nextSort;
    next.page = "1";
    setParams(next);
  }

  function goToPage(nextPage) {
    const next = Object.fromEntries(params.entries());
    next.page = String(nextPage);
    setParams(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function isQuickPrice(min, max) {
    const curMin = toNum(priceMin);
    const curMax = toNum(priceMax);
    const sameMin = (min == null && curMin == null) || (min != null && curMin === min);
    const sameMax = (max == null && curMax == null) || (max != null && curMax === max);
    return sameMin && sameMax;
  }

  function onReset() {
    setParams({});
    setPriceMinInput("");
    setPriceMaxInput("");
    setAreaMinInput("");
    setAreaMaxInput("");
  }

  const selectedProvince = useMemo(
    () => provinces.find((p) => p.name === province) || null,
    [provinces, province]
  );
  const districtOptions = useMemo(() => selectedProvince?.districts || [], [selectedProvince]);
  const selectedDistrict = useMemo(
    () => districtOptions.find((d) => d.name === district) || null,
    [districtOptions, district]
  );
  const wardOptions = useMemo(() => selectedDistrict?.wards || [], [selectedDistrict]);

  function onChangeProvince(e) {
    const value = e.target.value;
    const next = Object.fromEntries(params.entries());
    if (value) next.province = value;
    else delete next.province;
    // reset district & ward khi đổi tỉnh
    delete next.district;
    delete next.ward;
    next.page = "1";
    setParams(next);
  }

  function onChangeDistrict(e) {
    const value = e.target.value;
    const next = Object.fromEntries(params.entries());
    if (value) next.district = value;
    else delete next.district;
    // reset ward khi đổi quận
    delete next.ward;
    next.page = "1";
    setParams(next);
  }

  function onChangeWard(e) {
    const value = e.target.value;
    const next = Object.fromEntries(params.entries());
    if (value) next.ward = value;
    else delete next.ward;
    next.page = "1";
    setParams(next);
  }

  return (
    <div className="mx-auto w-full max-w-6xl">
      <div className="mb-4 flex flex-col gap-2" data-aos="fade-up">
        <div className="text-xs uppercase tracking-[0.25em] text-brand-500">Tìm phòng trọ</div>
        <h1  className="text-3xl font-bold text-slate-900 md:text-4xl">
          Cho thuê phòng trọ, căn hộ, nhà nguyên căn
        </h1>
        {busy ? <SkeletonText className="max-w-2xl" lines={2} staggerBase={1} /> : (
          <p className="max-w-2xl text-sm text-slate-600">
            {`Có ${total.toLocaleString("vi-VN")} phòng phù hợp bộ lọc (đã duyệt).`}{" "}
            Lọc nhanh theo khu vực, giá, diện tích để tìm chỗ ở phù hợp nhất.
          </p>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
        <aside className="space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-white/95 p-4 sm:p-5" data-aos="fade-right">
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Bộ lọc</div>
                <h2 className="mt-1 text-sm font-semibold text-slate-900">Thu hẹp kết quả</h2>
              </div>
              <I.Filters className="text-[16px] text-slate-400" />
            </div>

            <form onSubmit={onSubmit} className="mt-4 grid gap-4">
              <label className="grid gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Từ khoá
                <div className="relative">
                  <I.Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[12px] text-slate-400" />
                  <input
                    name="keyword"
                    defaultValue={keyword}
                    placeholder="Gần đại học, có máy lạnh..."
                    className="input-base pl-9 text-sm"
                  />
                </div>
              </label>

              <label className="grid gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Tỉnh/TP
                <select
                  name="province"
                  value={province}
                  className="input-base text-sm"
                  disabled={locationsBusy}
                  onChange={onChangeProvince}
                >
                  <option value="">{locationsBusy ? "Đang tải..." : "Tất cả"}</option>
                  {provinces.map((p) => (
                    <option key={p.code} value={p.name}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Quận/Huyện
                <select
                  name="district"
                  value={district}
                  className="input-base text-sm"
                  disabled={locationsBusy || !province}
                  onChange={onChangeDistrict}
                >
                  <option value="">{!province ? "Chọn Tỉnh/TP trước" : "Tất cả"}</option>
                  {districtOptions.map((d) => (
                    <option key={d.code} value={d.name}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Phường/Xã
                <select
                  name="ward"
                  value={ward}
                  className="input-base text-sm"
                  disabled={locationsBusy || !province || !district}
                  onChange={onChangeWard}
                >
                  <option value="">
                    {!province || !district ? "Chọn Quận/Huyện trước" : "Tất cả"}
                  </option>
                  {wardOptions.map((w) => (
                    <option key={w.code} value={w.name}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Loại phòng
                <select name="roomType" defaultValue={roomType} className="input-base text-sm">
                  <option value="">Tất cả</option>
                  <option value="phong_tro">Phòng trọ</option>
                  <option value="chung_cu_mini">Chung cư mini</option>
                  <option value="nha_nguyen_can">Nhà nguyên căn</option>
                  <option value="ky_tuc_xa">Ký túc xá</option>
                </select>
              </label>

              <div className="grid gap-3">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Khoảng giá (VND/tháng)</div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    name="priceMin"
                    value={priceMinInput}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/\D/g, "");
                      if (!raw) {
                        setPriceMinInput("");
                        return;
                      }
                      setPriceMinInput(Number(raw).toLocaleString("vi-VN"));
                    }}
                    inputMode="numeric"
                    placeholder="Từ"
                    className="input-base text-sm"
                  />
                  <input
                    name="priceMax"
                    value={priceMaxInput}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/\D/g, "");
                      if (!raw) {
                        setPriceMaxInput("");
                        return;
                      }
                      setPriceMaxInput(Number(raw).toLocaleString("vi-VN"));
                    }}
                    inputMode="numeric"
                    placeholder="Đến"
                    className="input-base text-sm"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className={`badge-filter ${isQuickPrice(0, 3000000) ? "badge-filter-active" : ""}`}
                    onClick={() => setQuickPrice(0, 3000000)}
                  >
                    Dưới 3 triệu
                  </button>
                  <button
                    type="button"
                    className={`badge-filter ${isQuickPrice(3000000, 5000000) ? "badge-filter-active" : ""}`}
                    onClick={() => setQuickPrice(3000000, 5000000)}
                  >
                    3 - 5 triệu
                  </button>
                  <button
                    type="button"
                    className={`badge-filter ${isQuickPrice(5000000, 7000000) ? "badge-filter-active" : ""}`}
                    onClick={() => setQuickPrice(5000000, 7000000)}
                  >
                    5 - 7 triệu
                  </button>
                  <button
                    type="button"
                    className={`badge-filter ${isQuickPrice(7000000, undefined) ? "badge-filter-active" : ""}`}
                    onClick={() => setQuickPrice(7000000, undefined)}
                  >
                    Trên 7 triệu
                  </button>
                </div>
              </div>

              <div className="grid gap-3">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Diện tích (m²)
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    name="areaMin"
                    value={areaMinInput}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/\D/g, "");
                      if (!raw) {
                        setAreaMinInput("");
                        return;
                      }
                      setAreaMinInput(Number(raw).toLocaleString("vi-VN"));
                    }}
                    inputMode="numeric"
                    placeholder="Từ"
                    className="input-base text-sm"
                  />
                  <input
                    name="areaMax"
                    value={areaMaxInput}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/\D/g, "");
                      if (!raw) {
                        setAreaMaxInput("");
                        return;
                      }
                      setAreaMaxInput(Number(raw).toLocaleString("vi-VN"));
                    }}
                    inputMode="numeric"
                    placeholder="Đến"
                    className="input-base text-sm"
                  />
                </div>
              </div>

              <div className="mt-2 flex flex-wrap gap-2">
                <button className="btn-primary flex-1" disabled={busy}>
                  {busy ? "Đang lọc..." : "Áp dụng bộ lọc"}
                </button>
                <button
                  type="button"
                  className="btn-outline flex-1"
                  disabled={busy}
                  onClick={onReset}
                >
                  Xoá bộ lọc
                </button>
              </div>
            </form>
          </div>

          <div
            className="hidden overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 md:block"
            data-aos="zoom-in-up"
            data-aos-delay="120"
          >
            <div className="relative h-52 w-full">
              <img
                src="https://images.pexels.com/photos/439227/pexels-photo-439227.jpeg"
                alt="Bản đồ khu vực"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-x-4 bottom-4 rounded-2xl bg-black/55 px-3 py-2 text-xs text-slate-100">
                <div className="flex items-center gap-2">
                  <I.Map className="text-[14px] text-brand-300" />
                  <div>
                    <div className="font-semibold">Bản đồ khu vực</div>
                    <div className="text-[11px] text-slate-300">
                      Tính năng tìm phòng theo bản đồ sẽ được cập nhật sớm.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </aside>

        <section className="space-y-4">
          <div
            className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white/95 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5"
            data-aos="fade-left"
          >
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Kết quả</div>
              <div className="mt-1 text-sm font-semibold text-slate-900">
                {busy
                  ? "Đang tải danh sách phòng..."
                  : total > 0
                  ? `Tìm thấy ${total.toLocaleString("vi-VN")} phòng phù hợp`
                  : "Chưa có phòng phù hợp với bộ lọc hiện tại"}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Sắp xếp theo</span>
              <div className="inline-flex rounded-full border border-slate-200 bg-slate-50 p-1 text-xs font-medium text-slate-600">
                <button
                  type="button"
                  className={`rounded-full px-3 py-1 ${sortBy === "recommended" ? "bg-white text-slate-900" : ""}`}
                  onClick={() => setSort("recommended")}
                >
                  Phù hợp nhất
                </button>
                <button
                  type="button"
                  className={`rounded-full px-3 py-1 ${sortBy === "priceAsc" ? "bg-white text-slate-900" : ""}`}
                  onClick={() => setSort("priceAsc")}
                >
                  Giá tăng dần
                </button>
                <button
                  type="button"
                  className={`rounded-full px-3 py-1 ${sortBy === "priceDesc" ? "bg-white text-slate-900" : ""}`}
                  onClick={() => setSort("priceDesc")}
                >
                  Giá giảm dần
                </button>
              </div>
            </div>
          </div>

          {error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <div className="grid gap-4">
            {busy ? <RoomsListSkeleton /> : null}
            {!busy && rooms.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                Không tìm thấy phòng nào phù hợp với bộ lọc. Hãy thử nới rộng khoảng giá hoặc diện tích.
              </div>
            ) : null}

            {rooms.map((r, idx) => (
              <Link
                key={r.id}
                to={`/rooms/${r.id}`}
                className="group grid gap-4 rounded-3xl border border-slate-200 bg-white p-4 transition hover:-translate-y-0.5 hover:border-brand-200 sm:grid-cols-[220px_minmax(0,1fr)] sm:p-5"
                data-aos="fade-up"
                data-aos-delay={Math.min(idx * 60, 240)}
              >
                <div className="relative h-40 w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                  {r.cover_image_url ? (
                    <img
                      src={r.cover_image_url}
                      alt={r.title}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="grid h-full w-full place-items-center text-xs text-slate-400">Chưa có ảnh</div>
                  )}
                  <div className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-black/55 px-2 py-1 text-[10px] font-medium text-white backdrop-blur">
                    <I.Verified className="text-[10px] text-emerald-300" />
                    {formatRoomType(r.room_type)}
                  </div>
                </div>
                <div className="grid gap-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="line-clamp-2 text-base font-semibold text-slate-900 group-hover:text-brand-700">
                        {r.title}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-slate-500">
                        <I.Pin className="text-[11px] text-brand-500" />
                        <span>
                          {[r.street, r.ward, r.district, r.province].filter(Boolean).join(", ") || "Chưa cập nhật địa chỉ"}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-brand-600">
                        {Number(r.price_monthly).toLocaleString("vi-VN")}{" "}
                        <span className="text-xs font-semibold text-slate-500">VND/tháng</span>
                      </div>
                      <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-medium text-brand-700">
                        <I.Ruler className="text-[10px]" />
                        {Number(r.area_m2).toLocaleString("vi-VN")} m²
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-600">
                    {r.max_occupants ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-1">
                        <I.User className="text-[10px]" />
                        Tối đa {r.max_occupants} người
                      </span>
                    ) : null}
                    {r.gender_policy && r.gender_policy !== "any" ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-1">
                        <I.User className="text-[10px]" />
                        {r.gender_policy === "male" ? "Ưu tiên nam" : "Ưu tiên nữ"}
                      </span>
                    ) : null}
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-1">
                      <I.Verified className="text-[10px]" />
                      Phòng đã duyệt
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <Pagination
            className="mt-6"
            page={page}
            totalPages={totalPages}
            disabled={busy}
            onPageChange={goToPage}
          />

          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500" data-aos="fade-up">
            <div>
              <I.Info className="mr-1 inline-block text-[12px]" />
              Chỉ hiển thị phòng ở trạng thái đã được quản trị viên duyệt.
            </div>
            <Link
              to="/blog"
              className="inline-flex items-center gap-1 font-medium text-brand-600 hover:text-brand-700"
            >
              <span>Đọc thêm kinh nghiệm thuê trọ</span>
              <I.ArrowRightLong className="text-[10px]" />
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}

