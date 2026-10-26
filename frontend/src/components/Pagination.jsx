import { useEffect, useMemo, useState } from 'react'
import Icon from './Icon.jsx'

const pageSizeOptions = [5, 10, 20, 50]
const defaultPageSize = 5

export function usePagination(items, initialPageSize = defaultPageSize) {
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(initialPageSize)
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize))
  const pageItems = useMemo(
    () => items.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [items, currentPage, pageSize],
  )

  useEffect(() => {
    setCurrentPage(1)
  }, [items])

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages))
  }, [totalPages])

  const changePageSize = (size) => {
    setPageSize(size)
    setCurrentPage(1)
  }

  return {
    currentPage,
    pageSize,
    pageItems,
    totalItems: items.length,
    setCurrentPage,
    setPageSize: changePageSize,
  }
}

export default function Pagination({
  currentPage,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const endItem = Math.min(currentPage * pageSize, totalItems)

  if (totalItems <= pageSize && currentPage === 1) return null

  const buttonClass = 'inline-flex h-8 min-w-8 items-center justify-center rounded-lg border border-border px-2 text-[10px] font-semibold text-rosewood transition hover:bg-petal disabled:cursor-not-allowed disabled:opacity-40'

  return (
    <nav aria-label="Phân trang" className="flex flex-col gap-3 border-t border-border px-4 py-3 text-[10px] text-muted sm:flex-row sm:items-center sm:justify-between sm:px-5">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span>Hiển thị {startItem}–{endItem} trên {totalItems} bản ghi</span>
        <label className="flex items-center gap-2">
          <span>Số dòng</span>
          <select
            aria-label="Số bản ghi mỗi trang"
            value={pageSize}
            onChange={(event) => onPageSizeChange(Number(event.target.value))}
            className="h-8 rounded-lg border border-border bg-paper px-2 text-[10px] text-rosewood outline-none focus:border-caramel-hover"
          >
            {pageSizeOptions.map((size) => <option key={size} value={size}>{size}</option>)}
          </select>
        </label>
      </div>
      <div className="flex flex-wrap items-center gap-1">
        <button type="button" className={buttonClass} aria-label="Trang đầu" disabled={currentPage <= 1} onClick={() => onPageChange(1)}>Đầu</button>
        <button type="button" className={buttonClass} aria-label="Trang trước" disabled={currentPage <= 1} onClick={() => onPageChange(currentPage - 1)}>
          <Icon name="chevronRight" size={13} className="rotate-180" />
        </button>
        <span aria-live="polite" className="min-w-20 px-2 text-center text-rosewood">Trang {currentPage} / {totalPages}</span>
        <button type="button" className={buttonClass} aria-label="Trang sau" disabled={currentPage >= totalPages} onClick={() => onPageChange(currentPage + 1)}>
          <Icon name="chevronRight" size={13} />
        </button>
        <button type="button" className={buttonClass} aria-label="Trang cuối" disabled={currentPage >= totalPages} onClick={() => onPageChange(totalPages)}>Cuối</button>
      </div>
    </nav>
  )
}
