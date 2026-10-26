import EmptyState from './EmptyState.jsx'
import Pagination, { usePagination } from './Pagination.jsx'

export default function DataTable({
  columns,
  rows,
  rowKey,
  emptyTitle = 'Chưa có dữ liệu',
  emptyDescription = 'Thử thay đổi điều kiện lọc hoặc tìm kiếm.',
  ariaLabel = 'Bảng dữ liệu',
  onRowClick,
}) {
  const pagination = usePagination(rows)

  return (
    <div>
      <div className="overflow-x-auto">
        <table aria-label={ariaLabel} className="w-full min-w-[720px] text-left">
          <thead>
            <tr className="bg-petal text-[10px] font-bold uppercase tracking-wide text-rosewood">
              {columns.map((column) => (
                <th key={column.key} className={`whitespace-nowrap px-4 py-3 font-semibold first:pl-5 last:pr-5 ${column.headerClassName ?? ''}`}>
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pagination.pageItems.map((row) => (
              <tr
                key={rowKey(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                onKeyDown={onRowClick ? (event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    onRowClick(row)
                  }
                } : undefined}
                tabIndex={onRowClick ? 0 : undefined}
                className={`border-t border-border text-[11px] text-rosewood transition-colors hover:bg-cream ${onRowClick ? 'cursor-pointer' : ''}`}
              >
                {columns.map((column) => (
                  <td key={column.key} className={`px-4 py-3.5 first:pl-5 last:pr-5 ${column.cellClassName ?? ''}`}>
                    {column.render ? column.render(row) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && (
          <EmptyState
            title={emptyTitle}
            description={emptyDescription}
            descriptionClassName="text-[11px]"
          />
        )}
      </div>
      <Pagination
        currentPage={pagination.currentPage}
        pageSize={pagination.pageSize}
        totalItems={pagination.totalItems}
        onPageChange={pagination.setCurrentPage}
        onPageSizeChange={pagination.setPageSize}
      />
    </div>
  )
}
