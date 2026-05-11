import { FaHouseChimney } from "react-icons/fa6";

export default function BrandLogo({ compact = false, inverted = false }) {
  const titleClass = inverted ? "text-white" : "text-slate-900";
  const subtitleClass = inverted ? "text-slate-300" : "text-slate-500";
  const badgeClass = inverted
    ? "bg-white/10 text-white ring-1 ring-white/25"
    : "bg-linear-to-br from-slate-900 to-brand-700 text-white ring-1 ring-brand-200/50";

  return (
    <span className="inline-flex items-center gap-3">
      <span
        className={`grid place-items-center rounded-2xl shadow-sm ${badgeClass} ${
          compact ? "h-9 w-9" : "h-10 w-10"
        }`}
      >
        <FaHouseChimney className={compact ? "text-[14px]" : "text-[15px]"} />
      </span>
      <span className="grid leading-tight">
        <span className={`font-extrabold tracking-tight ${titleClass} ${compact ? "text-[17px]" : "text-lg"}`}>
          QL Phòng Trọ
        </span>
        <span className={`font-medium ${subtitleClass} ${compact ? "text-[12px]" : "text-[13px]"}`}>
          Hệ thống quản lý và cho thuê
        </span>
      </span>
    </span>
  );
}

