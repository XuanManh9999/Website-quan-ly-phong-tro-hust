/**
 * Phân trang — Trước / Sau + "Trang x / y"
 * Ẩn khi chỉ có một trang.
 */
export function Pagination({ page, totalPages, disabled, onPageChange, className = "" }) {
  if (totalPages <= 1) return null;
  const p = Math.min(Math.max(1, Number(page) || 1), totalPages);
  return (
    <nav
      className={`flex flex-wrap items-center justify-center gap-3 ${className}`}
      aria-label="Phân trang"
    >
      <button
        type="button"
        className="btn-outline inline-flex min-h-[2.25rem] items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium"
        disabled={disabled || p <= 1}
        onClick={() => onPageChange(p - 1)}
      >
        Trước
      </button>
      <span className="text-sm text-slate-600">
        Trang <span className="font-semibold text-slate-900">{p}</span> / {totalPages}
      </span>
      <button
        type="button"
        className="btn-outline inline-flex min-h-[2.25rem] items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium"
        disabled={disabled || p >= totalPages}
        onClick={() => onPageChange(p + 1)}
      >
        Sau
      </button>
    </nav>
  );
}
