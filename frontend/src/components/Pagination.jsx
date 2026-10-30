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
  pageSizeOptions: availablePageSizes = pageSizeOptions,
  itemLabel = 'bản ghi',
  pageSizeLabel = 'Số dòng',
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const endItem = Math.min(currentPage * pageSize, totalItems)
  const firstVisiblePage = Math.max(1, Math.min(currentPage - 2, totalPages - 4))
  const visiblePages = Array.from(
    { length: Math.min(totalPages, 5) },
    (_, index) => firstVisiblePage + index,
  )

  const canChooseSmallerPageSize = availablePageSizes.some((size) => size < totalItems)
  if (totalItems <= pageSize && currentPage === 1 && !canChooseSmallerPageSize) return null

  const buttonClass = 'inline-flex h-9 min-w-9 items-center justify-center rounded-xl border border-[#DDCDB8] bg-white px-2.5 text-xs font-semibold text-[#76534D] shadow-sm transition hover:border-[#B7835E] hover:bg-[#FCF4EA] disabled:cursor-not-allowed disabled:opacity-40'
  const pageButtonClass = (page) => `inline-flex h-9 min-w-9 items-center justify-center rounded-xl border px-2.5 text-xs font-semibold shadow-sm transition ${
    page === currentPage
      ? 'border-[#76534D] bg-[#76534D] text-white'
      : 'border-[#DDCDB8] bg-white text-[#76534D] hover:border-[#B7835E] hover:bg-[#FCF4EA]'
  }`

  return (
    <nav aria-label="Phân trang" className="mt-6 flex flex-col gap-3 rounded-2xl border border-[#EAE3DA] bg-white px-3 py-3 text-xs text-[#806B65] shadow-sm sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:py-4">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="font-medium">Hiển thị <strong className="text-[#4A302B]">{startItem}–{endItem}</strong> trên <strong className="text-[#4A302B]">{totalItems}</strong> {itemLabel}</span>
        <label className="flex items-center gap-2">
          <span>{pageSizeLabel}</span>
          <select
            aria-label={pageSizeLabel}
            value={pageSize}
            onChange={(event) => onPageSizeChange(Number(event.target.value))}
            className="h-9 rounded-xl border border-[#DDCDB8] bg-[#FCF9F3] px-3 text-xs font-semibold text-[#76534D] outline-none focus:border-[#B7835E]"
          >
            {availablePageSizes.map((size) => <option key={size} value={size}>{size}</option>)}
          </select>
        </label>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1.5" aria-label={`Trang ${currentPage} trên ${totalPages}`}>
          <button type="button" className={buttonClass} aria-label="Trang trước" disabled={currentPage <= 1} onClick={() => onPageChange(currentPage - 1)}>
          <Icon name="chevronRight" size={13} className="rotate-180" />
          </button>
          {visiblePages.map((page) => (
            <button
              key={page}
              type="button"
              className={pageButtonClass(page)}
              aria-label={`Trang ${page}`}
              aria-current={page === currentPage ? 'page' : undefined}
              onClick={() => onPageChange(page)}
            >
              {page}
            </button>
          ))}
          <button type="button" className={buttonClass} aria-label="Trang sau" disabled={currentPage >= totalPages} onClick={() => onPageChange(currentPage + 1)}>
            <Icon name="chevronRight" size={13} />
          </button>
          <span aria-live="polite" className="sr-only">Trang {currentPage} trên {totalPages}</span>
        </div>
      )}
    </nav>
  )
}
