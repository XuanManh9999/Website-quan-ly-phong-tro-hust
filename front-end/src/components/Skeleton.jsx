import { useMemo } from "react";

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

/** Block shimmer skeleton. */
export function SkeletonBlock({
  className = "",
  style,
  radius = "rounded-lg",
  staggerIndex
}) {
  const mergedStyle = useMemo(() => {
    if (staggerIndex == null) return style;
    const delayMs = clamp(Number(staggerIndex) || 0, 0, 30) * 55;
    return { ...(style || {}), animationDelay: `${delayMs}ms` };
  }, [style, staggerIndex]);

  return <div className={`skeleton ${radius} ${className}`} style={mergedStyle} />;
}

export function SkeletonText({ lines = 2, className = "", staggerBase = 0 }) {
  const safeLines = clamp(Number(lines) || 1, 1, 6);
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: safeLines }).map((_, i) => (
        <SkeletonBlock
          key={`sk-t-${i}`}
          className={`h-4 ${i === safeLines - 1 ? "w-2/3" : "w-full"}`}
          staggerIndex={staggerBase + i}
        />
      ))}
    </div>
  );
}

export function SkeletonTableRows({
  rows = 6,
  cells,
  className = "",
  staggerBase = 0
}) {
  const safeRows = clamp(Number(rows) || 1, 1, 12);
  const safeCells =
    Array.isArray(cells) && cells.length > 0
      ? cells
      : [
          { w: "w-10", h: "h-4" },
          { w: "w-44", h: "h-4" },
          { w: "w-28", h: "h-4" },
          { w: "w-24", h: "h-4" },
          { w: "w-20", h: "h-4" },
          { w: "w-14", h: "h-6", radius: "rounded-full" },
          { w: "w-20", h: "h-6", radius: "rounded-full" }
        ];

  return (
    <>
      {Array.from({ length: safeRows }).map((_, rIdx) => (
        <tr key={`sk-row-${rIdx}`} className={className}>
          {safeCells.map((c, cIdx) => (
            <td key={`sk-cell-${rIdx}-${cIdx}`}>
              <SkeletonBlock
                className={`${c.h || "h-4"} ${c.w || "w-full"}`}
                radius={c.radius || "rounded-lg"}
                staggerIndex={staggerBase + rIdx + cIdx}
              />
            </td>
          ))}
          <td>
            <div className="flex justify-end gap-2">
              <SkeletonBlock className="h-8 w-14" radius="rounded-xl" staggerIndex={staggerBase + rIdx + 20} />
              <SkeletonBlock className="h-8 w-14" radius="rounded-xl" staggerIndex={staggerBase + rIdx + 21} />
            </div>
          </td>
        </tr>
      ))}
    </>
  );
}

