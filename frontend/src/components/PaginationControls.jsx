export default function PaginationControls({
  page = 0,
  size = 20,
  totalElements = 0,
  totalPages = 0,
  onPageChange,
  onSizeChange,
  className = '',
}) {
  const currentPage = totalPages === 0 ? 0 : Math.min(page, totalPages - 1)

  return (
    <nav
      aria-label="Phân trang danh sách"
      className={`flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3 text-xs text-muted ${className}`}
    >
      <div className="flex items-center gap-2">
        <span>
          {totalElements
            ? `Trang ${currentPage + 1}/${totalPages} · ${totalElements} bản ghi`
            : 'Không có bản ghi'}
        </span>
        {onSizeChange && (
          <label className="flex items-center gap-1.5">
            <span className="sr-only">Số bản ghi mỗi trang</span>
            <select
              value={size}
              onChange={(event) => onSizeChange(Number(event.target.value))}
              className="h-8 rounded-lg border border-border bg-white px-2 text-xs text-rosewood"
            >
              {[10, 20, 50, 100].map((option) => (
                <option key={option} value={option}>{option}/trang</option>
              ))}
            </select>
          </label>
        )}
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={currentPage <= 0 || totalPages === 0}
          onClick={() => onPageChange?.(currentPage - 1)}
          className="h-8 rounded-lg border border-border px-3 font-semibold text-rosewood transition hover:bg-petal disabled:cursor-not-allowed disabled:opacity-50"
        >
          Trước
        </button>
        <button
          type="button"
          disabled={totalPages === 0 || currentPage >= totalPages - 1}
          onClick={() => onPageChange?.(currentPage + 1)}
          className="h-8 rounded-lg border border-border px-3 font-semibold text-rosewood transition hover:bg-petal disabled:cursor-not-allowed disabled:opacity-50"
        >
          Sau
        </button>
      </div>
    </nav>
  )
}
