"use client";

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

type Props = {
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
}

export function Pagination({ page, pageSize, total, onPageChange, onPageSizeChange }: Props) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  const btnBase = "px-2 py-1 text-sm rounded border border-gray-300 transition-colors";
  const btnActive = `${btnBase} hover:bg-gray-100 text-gray-700`;
  const btnDisabled = `${btnBase} text-gray-300 cursor-not-allowed`;

  return (
    <div className="flex items-center justify-between mt-3 text-sm text-gray-600">
      <div className="flex items-center gap-2">
        <span>Rows per page:</span>
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="border border-gray-300 rounded px-1.5 py-0.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {PAGE_SIZE_OPTIONS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-gray-500">{from}–{to} of {total}</span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onPageChange(1)}
            disabled={page === 1}
            className={page === 1 ? btnDisabled : btnActive}
            title="First page"
          >«</button>
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page === 1}
            className={page === 1 ? btnDisabled : btnActive}
            title="Previous page"
          >‹</button>
          <span className="px-2">{page} / {totalPages}</span>
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className={page >= totalPages ? btnDisabled : btnActive}
            title="Next page"
          >›</button>
          <button
            onClick={() => onPageChange(totalPages)}
            disabled={page >= totalPages}
            className={page >= totalPages ? btnDisabled : btnActive}
            title="Last page"
          >»</button>
        </div>
      </div>
    </div>
  )
}
