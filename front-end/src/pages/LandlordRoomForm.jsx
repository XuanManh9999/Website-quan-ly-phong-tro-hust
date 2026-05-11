import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams, useLocation } from "react-router-dom";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import DOMPurify from "dompurify";
import { locationsApi } from "../api/locationsApi";
import { roomsApi } from "../api/roomsApi";
import { Icons } from "../ui/icons";
import { notify } from "../ui/toast";
import { roomStatusLabelVn } from "../utils/labels.js";

const empty = {
  title: "",
  description: "",
  room_type: "phong_tro",
  province: "",
  district: "",
  ward: "",
  street: "",
  address_detail: "",
  price_monthly: 0,
  area_m2: 0,
  max_occupants: "",
  gender_policy: "any",
  deposit: "",
  map_embed_html: "",
  utilities: {
    wifi: false,
    may_lanh: false,
    thang_may: false,
    giu_xe: false,
    cho_de_xe: false,
    nong_lanh: false,
    tu_lanh: false,
    may_giat: false,
    bep: false
  }
};

export default function LandlordRoomFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const nav = useNavigate();
  const location = useLocation();
  const I = Icons;

  const [form, setForm] = useState(empty);
  const [room, setRoom] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [locationsBusy, setLocationsBusy] = useState(true);
  const [provinces, setProvinces] = useState([]);
  /** Ảnh đã chọn trước khi có phòng — sẽ upload sau khi Lưu thành công */
  const [pendingImages, setPendingImages] = useState([]);
  const safeMapPreviewHtml = useMemo(
    () =>
      DOMPurify.sanitize(form.map_embed_html || "", {
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
          "height",
          "style"
        ]
      }),
    [form.map_embed_html]
  );

  const images = useMemo(() => room?.images || [], [room]);
  const quillRef = useRef(null);
  const roomImagesSectionRef = useRef(null);
  /** Chặn double-submit "Gửi duyệt" trước khi setState busy kịp render */
  const submitApprovalLockRef = useRef(false);

  const handleQuillImage = useCallback(() => {
    const input = document.createElement("input");
    input.setAttribute("type", "file");
    input.setAttribute("accept", "image/*");
    input.onchange = async () => {
      const file = input.files && input.files[0];
      if (!file) return;
      if (file.size > 5 * 1024 * 1024) {
        notify.error("Ảnh quá lớn. Vui lòng chọn ảnh ≤ 5MB.");
        return;
      }
      try {
        const dataUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onerror = () => reject(new Error("FileReader error"));
          reader.onload = () => resolve(String(reader.result || ""));
          reader.readAsDataURL(file);
        });
        const editor = quillRef.current ? quillRef.current.getEditor() : null;
        if (!editor) return;
        const range = editor.getSelection(true);
        const index = range ? range.index : editor.getLength();
        editor.insertEmbed(index, "image", dataUrl, "user");
        editor.setSelection(index + 1);
      } catch (err) {
        notify.error("Không chèn được ảnh vào mô tả.");
      }
    };
    input.click();
  }, []);

  const quillModules = useMemo(
    () => ({
      toolbar: {
        container: [
          [{ header: [2, 3, false] }],
          ["bold", "italic", "underline", "strike"],
          [{ list: "ordered" }, { list: "bullet" }],
          ["blockquote"],
          ["link", "image"],
          ["clean"]
        ],
        handlers: {
          image: handleQuillImage
        }
      }
    }),
    [handleQuillImage]
  );

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

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!isEdit) return;
      setBusy(true);
      setError("");
      try {
        const r = await roomsApi.manageDetail(id);
        if (cancelled) return;
        setRoom(r);
        const u =
          typeof r.utilities_json === "string"
            ? (() => {
                try {
                  return JSON.parse(r.utilities_json);
                } catch {
                  return {};
                }
              })()
            : r.utilities_json;
        const uObj = u && typeof u === "object" ? u : {};
        setForm({
          title: r.title || "",
          description: r.description || "",
          room_type: r.room_type || "phong_tro",
          province: r.province || "",
          district: r.district || "",
          ward: r.ward || "",
          street: r.street || "",
          address_detail: r.address_detail || "",
          price_monthly: r.price_monthly ?? 0,
          area_m2: r.area_m2 ?? 0,
          max_occupants: r.max_occupants ?? "",
          gender_policy: r.gender_policy || "any",
          deposit: r.deposit ?? "",
          map_embed_html: r.map_embed_html || "",
          utilities: {
            wifi: Boolean(uObj.wifi),
            may_lanh: Boolean(uObj.may_lanh),
            thang_may: Boolean(uObj.thang_may),
            giu_xe: Boolean(uObj.giu_xe),
            cho_de_xe: Boolean(uObj.cho_de_xe),
            nong_lanh: Boolean(uObj.nong_lanh),
            tu_lanh: Boolean(uObj.tu_lanh),
            may_giat: Boolean(uObj.may_giat),
            bep: Boolean(uObj.bep)
          }
        });
      } catch (err) {
        const message = err?.response?.data?.message || "Không tải được phòng";
        if (!cancelled) setError(message);
        notify.error(message);
      } finally {
        if (!cancelled) setBusy(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, isEdit]);

  useEffect(() => {
    setPendingImages([]);
  }, [id]);

  /** Sau khi tạo phòng, navigate kèm state — cuộn tới ảnh khi đã load room (ổn cả khi component remount). */
  useEffect(() => {
    if (!room?.id) return;
    if (!location.state?.focusRoomImages) return;
    const t = window.setTimeout(() => {
      roomImagesSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 300);
    return () => window.clearTimeout(t);
  }, [room?.id, location.state?.focusRoomImages]);

  function onChange(e) {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  }

  function onToggleUtility(key) {
    setForm((s) => ({ ...s, utilities: { ...(s.utilities || {}), [key]: !Boolean(s.utilities?.[key]) } }));
  }

  function onChangeProvince(e) {
    const value = e.target.value;
    setForm((s) => ({ ...s, province: value, district: "", ward: "" }));
  }

  function onChangeDistrict(e) {
    const value = e.target.value;
    setForm((s) => ({ ...s, district: value, ward: "" }));
  }

  function onChangeWard(e) {
    const value = e.target.value;
    setForm((s) => ({ ...s, ward: value }));
  }

  const selectedProvince = useMemo(() => provinces.find((p) => p?.name === form.province) || null, [provinces, form.province]);
  const districts = useMemo(() => selectedProvince?.districts || [], [selectedProvince]);
  const selectedDistrict = useMemo(
    () => districts.find((d) => d?.name === form.district) || null,
    [districts, form.district]
  );
  const wards = useMemo(() => selectedDistrict?.wards || [], [selectedDistrict]);

  function fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("FileReader error"));
      reader.onload = () => resolve(String(reader.result || ""));
      reader.readAsDataURL(file);
    });
  }

  function newTempId() {
    return typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `t-${Date.now()}-${Math.random()}`;
  }

  /** Chọn một hoặc nhiều ảnh: chưa có phòng → vào hàng chờ; đã có phòng → upload ngay. */
  async function onPickImages(e) {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (files.length === 0) return;

    const valid = [];
    for (const file of files) {
      if (!(file instanceof File) || !file.size) continue;
      if (file.size > 5 * 1024 * 1024) {
        notify.error(`${file.name}: ảnh quá lớn (tối đa 5MB).`);
        continue;
      }
      valid.push(file);
    }
    if (valid.length === 0) return;

    if (!room?.id) {
      try {
        const rows = await Promise.all(
          valid.map(async (file) => ({
            tempId: newTempId(),
            dataUrl: await fileToDataUrl(file),
            name: file.name
          }))
        );
        setPendingImages((p) => [...p, ...rows]);
        notify.success(`Đã thêm ${rows.length} ảnh (sẽ tải lên khi bấm Lưu)`);
      } catch {
        notify.error("Không đọc được file ảnh.");
      }
      return;
    }

    setBusy(true);
    setError("");
    try {
      let updated = room;
      for (const file of valid) {
        const dataUrl = await fileToDataUrl(file);
        const sortOrder = (updated.images || []).length;
        updated = await roomsApi.addImage(room.id, { url: dataUrl, sortOrder });
      }
      setRoom(updated);
      notify.success(`Đã thêm ${valid.length} ảnh`);
    } catch (err) {
      const message = err?.response?.data?.message || "Thêm ảnh thất bại";
      setError(message);
      notify.error(message);
    } finally {
      setBusy(false);
    }
  }

  function removePendingImage(tempId) {
    setPendingImages((p) => p.filter((x) => x.tempId !== tempId));
  }

  async function onSave(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const pendingCount = pendingImages.length;
    try {
      const payload = {
        ...form,
        price_monthly: Number(form.price_monthly),
        area_m2: Number(form.area_m2),
        max_occupants: form.max_occupants === "" ? undefined : Number(form.max_occupants),
        deposit: form.deposit === "" ? undefined : Number(form.deposit),
        utilities_json: form.utilities || {}
      };
      let r = isEdit ? await roomsApi.update(id, payload) : await roomsApi.create(payload);
      const queue = [...pendingImages];
      let uploaded = r;

      if (queue.length > 0) {
        for (let i = 0; i < queue.length; i++) {
          try {
            uploaded = await roomsApi.addImage(r.id, {
              url: queue[i].dataUrl,
              sortOrder: (uploaded.images || []).length
            });
          } catch (uploadErr) {
            setRoom(uploaded);
            setPendingImages(queue.slice(i));
            const msg =
              uploadErr?.response?.data?.message ||
              "Phòng đã lưu nhưng một số ảnh chưa tải được. Bạn có thể thêm lại bên dưới.";
            setError(msg);
            notify.error(msg);
            if (!isEdit) nav(`/landlord/rooms/${r.id}/edit`, { replace: true, state: { focusRoomImages: true } });
            return;
          }
        }
        setPendingImages([]);
        notify.success(
          isEdit
            ? `Đã cập nhật phòng và tải lên ${pendingCount} ảnh`
            : `Đã tạo phòng và tải lên ${pendingCount} ảnh`
        );
      } else {
        notify.success(isEdit ? "Đã cập nhật phòng" : "Đã tạo phòng mới");
      }

      setRoom(uploaded);
      if (!isEdit) {
        nav(`/landlord/rooms/${r.id}/edit`, { replace: true, state: { focusRoomImages: true } });
      }
    } catch (err) {
      const message = err?.response?.data?.message || "Lưu thất bại";
      setError(message);
      notify.error(message);
    } finally {
      setBusy(false);
    }
  }

  async function onRemoveImage(imageId) {
    if (!room?.id) return;
    setBusy(true);
    setError("");
    try {
      const updated = await roomsApi.removeImage(room.id, imageId);
      setRoom(updated);
      notify.success("Đã xoá ảnh");
    } catch (err) {
      const message = err?.response?.data?.message || "Xoá ảnh thất bại";
      setError(message);
      notify.error(message);
    } finally {
      setBusy(false);
    }
  }

  async function onSubmitForApproval() {
    if (!room?.id) return;
    if (submitApprovalLockRef.current) return;
    const rs = String(room.status || "");
    if (rs === "pending" || rs === "approved") return;

    submitApprovalLockRef.current = true;
    setBusy(true);
    setError("");
    try {
      const updated = await roomsApi.submit(room.id);
      setRoom(updated);
      notify.success("Đã gửi phòng để duyệt");
    } catch (err) {
      const message = err?.response?.data?.message || "Gửi duyệt thất bại";
      setError(message);
      notify.error(message);
    } finally {
      submitApprovalLockRef.current = false;
      setBusy(false);
    }
  }

  async function onDelete() {
    if (!room?.id) return;
    setBusy(true);
    setError("");
    try {
      await roomsApi.remove(room.id);
      notify.success("Đã xoá phòng");
      nav("/landlord/rooms", { replace: true });
    } catch (err) {
      const message = err?.response?.data?.message || "Xoá thất bại";
      setError(message);
      notify.error(message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-5xl">
      <div className="toolbar">
        <div>
          <div className="page-kicker">Chủ trọ</div>
          <h1 className="page-title">{isEdit ? "Sửa phòng" : "Tạo phòng"}</h1>
          <p className="page-subtitle">Điền đầy đủ thông tin để tăng tỷ lệ duyệt và hiển thị tốt hơn.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => {
              if (window.history.length > 1) nav(-1);
              else nav("/landlord/rooms");
            }}
          >
            Quay lại
          </button>
          <Link to="/landlord/rooms" className="btn-secondary">
            Phòng của tôi
          </Link>
          <Link to="/dashboard" className="btn-secondary">
            Dashboard
          </Link>
        </div>
      </div>

      {error ? (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {room?.status ? (
        <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
          <I.Clock className="text-[12px]" />
          Trạng thái: {roomStatusLabelVn(room.status)}
        </div>
      ) : null}

      {/* Ảnh phòng: chọn ngay từ đầu (hàng chờ) hoặc upload trực tiếp khi đã có phòng */}
      <section
        id="room-images-section"
        ref={roomImagesSectionRef}
        className="mt-6 scroll-mt-24 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm ring-1 ring-slate-200/60 sm:p-6"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-slate-900">Ảnh phòng (ảnh bìa)</div>
            <p className="mt-1 text-xs text-slate-500">
              Ảnh đầu tiên (hoặc ảnh đầu trong danh sách đã lưu) dùng làm ảnh bìa. JPG/PNG, tối đa 5MB mỗi ảnh. Có thể chọn
              nhiều ảnh cùng lúc.
            </p>
            {!room?.id ? (
              <p className="mt-2 rounded-xl border border-teal-200/80 bg-teal-50/80 px-3 py-2 text-xs text-teal-900">
                <span className="font-semibold">Phòng mới:</span> chọn ảnh ngay tại đây — ảnh sẽ được tải lên server khi bạn bấm{" "}
                <span className="font-semibold">Lưu</span> ở phần thông tin phòng bên dưới.
              </p>
            ) : (
              <p className="mt-2 text-xs text-slate-500">
                Ảnh mới chọn sẽ được tải lên <span className="font-semibold">ngay lập tức</span>.
              </p>
            )}
          </div>
        </div>

        <div className="mt-4">
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Chọn ảnh từ máy
            <input
              type="file"
              accept="image/*"
              multiple
              disabled={busy}
              className="block w-full cursor-pointer rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-sm file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-brand-600 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-white hover:border-brand-300 disabled:opacity-50"
              onChange={onPickImages}
            />
          </label>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pendingImages.map((p, idx) => (
            <div key={p.tempId} className="relative overflow-hidden rounded-2xl ring-2 ring-amber-300/80 ring-offset-2">
              <img src={p.dataUrl} alt="" className="h-44 w-full object-cover" />
              <div className="absolute left-3 top-3 rounded-full bg-amber-600 px-2 py-1 text-[10px] font-semibold text-white">
                {idx === 0 && images.length === 0 ? "Sẽ là ảnh bìa" : "Chờ Lưu"}
              </div>
              <button
                type="button"
                className="absolute bottom-3 right-3 rounded-full bg-black/55 px-3 py-1 text-xs font-semibold text-white"
                onClick={() => removePendingImage(p.tempId)}
                disabled={busy}
              >
                Bỏ
              </button>
            </div>
          ))}
          {images.map((img, idx) => (
            <div key={img.id} className="relative overflow-hidden rounded-2xl ring-1 ring-slate-200/70">
              <img src={img.url} alt="" className="h-44 w-full object-cover" />
              {idx === 0 ? (
                <div className="absolute left-3 top-3 rounded-full bg-black/55 px-2 py-1 text-[10px] font-semibold text-white">
                  Ảnh bìa
                </div>
              ) : null}
              <button
                type="button"
                className="absolute bottom-3 right-3 rounded-full bg-black/55 px-3 py-1 text-xs font-semibold text-white"
                onClick={() => onRemoveImage(img.id)}
                disabled={busy}
              >
                Xoá
              </button>
            </div>
          ))}
        </div>

        {!busy && pendingImages.length === 0 && images.length === 0 ? (
          <div className="mt-4 rounded-xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
            Chưa có ảnh — chọn file phía trên (có thể trước khi điền form).
          </div>
        ) : null}
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="panel panel-pad">
          <div className="mb-4 text-sm font-semibold text-slate-900">Thông tin phòng</div>

          <form onSubmit={onSave} className="grid gap-6">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm text-ink-600">
              Tiêu đề
              <input name="title" value={form.title} onChange={onChange} required className="input-base" />
            </label>
            <label className="grid gap-2 text-sm text-ink-600">
              Loại phòng
              <select name="room_type" value={form.room_type} onChange={onChange} className="input-base">
                <option value="phong_tro">Phòng trọ</option>
                <option value="chung_cu_mini">Chung cư mini</option>
                <option value="nha_nguyen_can">Nhà nguyên căn</option>
                <option value="ky_tuc_xa">Ký túc xá</option>
              </select>
            </label>
            <label className="grid gap-2 text-sm text-ink-600">
              Giá/tháng (VND)
              <input
                name="price_monthly"
                value={form.price_monthly}
                onChange={onChange}
                inputMode="numeric"
                required
                className="input-base"
              />
            </label>
            <label className="grid gap-2 text-sm text-ink-600">
              Diện tích (m²)
              <input
                name="area_m2"
                value={form.area_m2}
                onChange={onChange}
                inputMode="numeric"
                required
                className="input-base"
              />
            </label>
            <label className="grid gap-2 text-sm text-ink-600">
              Số người tối đa
              <input
                name="max_occupants"
                value={form.max_occupants}
                onChange={onChange}
                inputMode="numeric"
                className="input-base"
              />
            </label>
            <label className="grid gap-2 text-sm text-ink-600">
              Giới tính
              <select name="gender_policy" value={form.gender_policy} onChange={onChange} className="input-base">
                <option value="any">Không yêu cầu</option>
                <option value="male">Nam</option>
                <option value="female">Nữ</option>
              </select>
            </label>
            <label className="grid gap-2 text-sm text-ink-600">
              Tiền cọc
              <input name="deposit" value={form.deposit} onChange={onChange} inputMode="numeric" className="input-base" />
            </label>
            <div className="grid gap-2 text-sm text-ink-600 md:col-span-2">
              <div className="flex items-center justify-between">
                <span>Tiện ích</span>
                <span className="text-xs text-slate-500">Tick để hiển thị rõ trên trang chi tiết</span>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  ["wifi", "Wi‑Fi"],
                  ["may_lanh", "Máy lạnh"],
                  ["thang_may", "Thang máy"],
                  ["giu_xe", "Giữ xe"],
                  ["cho_de_xe", "Chỗ để xe"],
                  ["nong_lanh", "Nóng lạnh"],
                  ["tu_lanh", "Tủ lạnh"],
                  ["may_giat", "Máy giặt"],
                  ["bep", "Bếp"]
                ].map(([k, label]) => (
                  <label key={k} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-sm">
                    <input
                      type="checkbox"
                      checked={Boolean(form.utilities?.[k])}
                      onChange={() => onToggleUtility(k)}
                      disabled={busy}
                    />
                    <span className="font-medium text-slate-700">{label}</span>
                  </label>
                ))}
              </div>
            </div>
            <label className="grid gap-2 text-sm text-ink-600">
              Tỉnh/TP
              <select
                name="province"
                value={form.province}
                onChange={onChangeProvince}
                className="input-base"
                disabled={locationsBusy}
              >
                <option value="">{locationsBusy ? "Đang tải..." : "Chọn Tỉnh/TP"}</option>
                {provinces.map((p) => (
                  <option key={p.code} value={p.name}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-sm text-ink-600">
              Quận/Huyện
              <select
                name="district"
                value={form.district}
                onChange={onChangeDistrict}
                className="input-base"
                disabled={!form.province || locationsBusy}
              >
                <option value="">{!form.province ? "Chọn Tỉnh/TP trước" : "Chọn Quận/Huyện"}</option>
                {districts.map((d) => (
                  <option key={d.code} value={d.name}>
                    {d.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-sm text-ink-600">
              Phường/Xã
              <select
                name="ward"
                value={form.ward}
                onChange={onChangeWard}
                className="input-base"
                disabled={!form.district || locationsBusy}
              >
                <option value="">{!form.district ? "Chọn Quận/Huyện trước" : "Chọn Phường/Xã"}</option>
                {wards.map((w) => (
                  <option key={w.code} value={w.name}>
                    {w.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-sm text-ink-600">
              Đường
              <input name="street" value={form.street} onChange={onChange} className="input-base" />
            </label>
            <label className="grid gap-2 text-sm text-ink-600 md:col-span-2">
              Địa chỉ chi tiết
              <input name="address_detail" value={form.address_detail} onChange={onChange} className="input-base" />
            </label>
            <label className="grid gap-2 text-sm text-ink-600 md:col-span-2">
              Mô tả
              <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200/70">
                <ReactQuill
                  ref={quillRef}
                  theme="snow"
                  value={form.description || ""}
                  onChange={(v) => setForm((s) => ({ ...s, description: v }))}
                  modules={quillModules}
                />
              </div>
            </label>
            <label className="grid gap-2 text-sm text-ink-600 md:col-span-2">
              Google Maps (iframe)
              <textarea
                name="map_embed_html"
                value={form.map_embed_html}
                onChange={onChange}
                rows={4}
                className="input-base min-h-[120px]"
                placeholder='<iframe src="https://www.google.com/maps/embed?pb=..." ...></iframe>'
              />
              <span className="text-xs text-slate-500">
                Vào Google Maps &rarr; chia sẻ &rarr; nhúng bản đồ &rarr; sao chép thẻ{" "}
                <code>&lt;iframe ...&gt;&lt;/iframe&gt;</code> rồi dán vào đây. Nếu để trống, trang chi tiết sẽ không hiển thị bản đồ.
              </span>
              {safeMapPreviewHtml ? (
                <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                  <div className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Preview bản đồ
                  </div>
                  <div
                    className="room-map-embed border-t border-slate-200"
                    dangerouslySetInnerHTML={{ __html: safeMapPreviewHtml }}
                  />
                </div>
              ) : null}
            </label>
          </div>

          <button className="btn-primary w-full sm:w-fit" disabled={busy}>
            {busy
              ? pendingImages.length > 0
                ? "Đang lưu & tải ảnh..."
                : "Đang lưu..."
              : pendingImages.length > 0
                ? `Lưu (${pendingImages.length} ảnh chờ)`
                : "Lưu"}
          </button>
        </form>
        </div>

        <aside className="space-y-4">
          <div className="panel panel-pad">
            <div className="text-sm font-semibold text-slate-900">Hành động</div>
            {room?.id ? (
              <div className="mt-3 grid gap-2">
                {String(room.status) === "pending" ? (
                  <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                    Phòng đang <span className="font-semibold">chờ quản trị viên duyệt</span>. Bạn không cần gửi lại.
                  </p>
                ) : String(room.status) === "approved" ? (
                  <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-900">
                    Phòng đã <span className="font-semibold">được duyệt</span> và hiển thị công khai.
                  </p>
                ) : (
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={onSubmitForApproval}
                    disabled={busy}
                  >
                    Gửi duyệt
                  </button>
                )}
                <button
                  type="button"
                  className="btn-outline"
                  onClick={onDelete}
                  disabled={busy}
                >
                  Xoá phòng
                </button>
              </div>
            ) : (
              <div className="mt-3 text-xs text-slate-500">
                Bạn có thể chọn ảnh ở khối <span className="font-semibold">Ảnh phòng</span> phía trên trước hoặc sau khi điền form.
                Bấm <span className="font-semibold">Lưu</span> để tạo phòng và tải ảnh lên — sau đó gửi duyệt / xoá tại đây.
              </div>
            )}
          </div>
        </aside>
      </div>

    </div>
  );
}

