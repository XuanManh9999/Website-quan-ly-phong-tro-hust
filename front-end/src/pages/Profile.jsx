import { useEffect, useMemo, useState } from "react";
import { authApi } from "../api/authApi";
import { useAuth } from "../auth/useAuth";
import { Icons } from "../ui/icons";
import { notify } from "../ui/toast";
import { roleLabelVn } from "../utils/labels.js";
import { locationsApi } from "../api/locationsApi";

const emptyProfile = {
  fullName: "",
  phone: "",
  address: "",
  dateOfBirth: "",
  gender: "",
  avatarUrl: "",
  province: "",
  district: "",
  ward: "",
  addressDetail: ""
};

export default function ProfilePage() {
  const { user, refreshMe } = useAuth();
  const I = Icons;
  const [profile, setProfile] = useState(emptyProfile);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [locationsBusy, setLocationsBusy] = useState(true);
  const [provinces, setProvinces] = useState([]);

  const initialProfile = useMemo(() => {
    if (!user) return emptyProfile;
    let province = "";
    let district = "";
    let ward = "";
    let addressDetail = "";
    const addrRaw = user.address || "";
    if (addrRaw) {
      try {
        const parsed = JSON.parse(addrRaw);
        if (parsed && typeof parsed === "object") {
          province = parsed.province || "";
          district = parsed.district || "";
          ward = parsed.ward || "";
          addressDetail = parsed.detail || parsed.addressDetail || "";
        } else {
          addressDetail = addrRaw;
        }
      } catch {
        addressDetail = addrRaw;
      }
    }
    return {
      fullName: user.full_name || "",
      phone: user.phone || "",
      address: addrRaw,
      dateOfBirth: user.date_of_birth ? String(user.date_of_birth).slice(0, 10) : "",
      gender: user.gender || "",
      avatarUrl: user.avatar_url || "",
      province,
      district,
      ward,
      addressDetail
    };
  }, [user]);

  useEffect(() => {
    setProfile(initialProfile);
  }, [initialProfile]);

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

  function onAvatarFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      notify.error("Ảnh avatar tối đa 5MB.");
      e.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setProfile((s) => ({ ...s, avatarUrl: reader.result }));
      }
    };
    reader.onerror = () => {
      notify.error("Không đọc được file ảnh.");
    };
    reader.readAsDataURL(file);
  }

  function clearAvatar() {
    setProfile((s) => ({ ...s, avatarUrl: "" }));
  }

  function onChange(e) {
    const { name, value } = e.target;
    setProfile((s) => ({ ...s, [name]: value }));
  }

  function onChangeProvince(e) {
    const value = e.target.value;
    setProfile((s) => ({ ...s, province: value, district: "", ward: "" }));
  }

  function onChangeDistrict(e) {
    const value = e.target.value;
    setProfile((s) => ({ ...s, district: value, ward: "" }));
  }

  function onChangeWard(e) {
    const value = e.target.value;
    setProfile((s) => ({ ...s, ward: value }));
  }

  const selectedProvince = useMemo(
    () => provinces.find((p) => p?.name === profile.province) || null,
    [provinces, profile.province]
  );
  const districts = useMemo(() => selectedProvince?.districts || [], [selectedProvince]);
  const selectedDistrict = useMemo(
    () => districts.find((d) => d?.name === profile.district) || null,
    [districts, profile.district]
  );
  const wards = useMemo(() => selectedDistrict?.wards || [], [selectedDistrict]);

  async function onSave(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const addrObj = {
        province: profile.province || "",
        district: profile.district || "",
        ward: profile.ward || "",
        detail: profile.addressDetail || ""
      };
      const addressJson =
        addrObj.province || addrObj.district || addrObj.ward || addrObj.detail
          ? JSON.stringify(addrObj)
          : null;
      await authApi.updateProfile({
        fullName: profile.fullName || null,
        phone: profile.phone || null,
        address: addressJson,
        dateOfBirth: profile.dateOfBirth || null,
        gender: profile.gender || null,
        avatarUrl: profile.avatarUrl || null
      });
      await refreshMe();
      const message = "Đã cập nhật hồ sơ.";
      setMessage(message);
      notify.success(message);
    } catch (err) {
      const message = err?.response?.data?.message || "Cập nhật thất bại";
      setError(message);
      notify.error(message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl">
      <div className="toolbar">
        <div>
          <div className="page-kicker">Tài khoản</div>
          <h1 className="page-title">Thông tin cá nhân</h1>
          <p className="page-subtitle">Cập nhật thông tin cá nhân của bạn.</p>
        </div>
        <div className="flex items-center gap-3 rounded-2xl bg-white px-4 py-2 ring-1 ring-slate-200/70">
          <div className="grid h-10 w-10 place-items-center overflow-hidden rounded-full bg-slate-100 text-sm font-bold text-slate-600">
            {profile.avatarUrl ? (
              <img src={profile.avatarUrl} alt="avatar" className="h-full w-full object-cover" />
            ) : (
              (user?.full_name || user?.email || "?")[0]?.toUpperCase()
            )}
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-slate-900">{user?.full_name || user?.email}</div>
            <div className="text-xs uppercase tracking-[0.2em] text-slate-400">{roleLabelVn(user?.role)}</div>
          </div>
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
        <form onSubmit={onSave} className="grid gap-5">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm text-slate-600">
              Họ tên
              <input name="fullName" value={profile.fullName} onChange={onChange} className="input-base" />
            </label>
            <label className="grid gap-2 text-sm text-slate-600">
              Email (không đổi)
              <input value={user?.email || ""} disabled className="input-base bg-slate-100" />
            </label>
            <label className="grid gap-2 text-sm text-slate-600">
              Số điện thoại
              <input name="phone" value={profile.phone} onChange={onChange} className="input-base" />
            </label>
            <label className="grid gap-2 text-sm text-slate-600">
              Tỉnh/TP
              <select
                name="province"
                value={profile.province}
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
            <label className="grid gap-2 text-sm text-slate-600">
              Quận/Huyện
              <select
                name="district"
                value={profile.district}
                onChange={onChangeDistrict}
                className="input-base"
                disabled={!profile.province || locationsBusy}
              >
                <option value="">{!profile.province ? "Chọn Tỉnh/TP trước" : "Chọn Quận/Huyện"}</option>
                {districts.map((d) => (
                  <option key={d.code} value={d.name}>
                    {d.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-sm text-slate-600">
              Phường/Xã
              <select
                name="ward"
                value={profile.ward}
                onChange={onChangeWard}
                className="input-base"
                disabled={!profile.district || locationsBusy}
              >
                <option value="">{!profile.district ? "Chọn Quận/Huyện trước" : "Chọn Phường/Xã"}</option>
                {wards.map((w) => (
                  <option key={w.code} value={w.name}>
                    {w.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-sm text-slate-600">
              Ngày sinh
              <input name="dateOfBirth" type="date" value={profile.dateOfBirth} onChange={onChange} className="input-base" />
            </label>
            <label className="grid gap-2 text-sm text-slate-600">
              Giới tính
              <select name="gender" value={profile.gender} onChange={onChange} className="input-base">
                <option value="">-- Chưa chọn --</option>
                <option value="male">Nam</option>
                <option value="female">Nữ</option>
                <option value="other">Khác</option>
              </select>
            </label>
            <label className="grid gap-2 text-sm text-slate-600 md:col-span-2">
              Địa chỉ chi tiết
              <input
                name="addressDetail"
                value={profile.addressDetail}
                onChange={onChange}
                className="input-base"
                placeholder="Số nhà, tên đường, hẻm..."
              />
            </label>
            <div className="grid gap-2 text-sm text-slate-600 md:col-span-2">
              <span>Ảnh đại diện</span>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="grid h-16 w-16 place-items-center overflow-hidden rounded-full bg-slate-100 text-sm font-bold text-slate-600">
                  {profile.avatarUrl ? (
                    <img src={profile.avatarUrl} alt="avatar" className="h-full w-full object-cover" />
                  ) : (
                    (user?.full_name || user?.email || "?")[0]?.toUpperCase()
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={onAvatarFileChange}
                    className="block w-full text-sm file:mr-3 file:rounded-full file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-slate-800"
                  />
                  <p className="text-xs text-slate-500">Hỗ trợ ảnh tối đa 5MB. Ảnh sẽ được lưu dạng base64.</p>
                  {profile.avatarUrl ? (
                    <button
                      type="button"
                      className="btn-secondary w-fit text-xs"
                      onClick={clearAvatar}
                    >
                      <I.Trash className="mr-1 text-[12px]" />
                      Xóa ảnh hiện tại
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          <button className="btn-primary inline-flex w-full items-center justify-center gap-2 sm:w-fit" disabled={busy}>
            <I.Edit className="text-[14px]" />
            {busy ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
        </form>
      </div>
    </div>
  );
}
