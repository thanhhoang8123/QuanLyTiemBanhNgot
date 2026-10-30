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
    <div className="overflow-hidden">
      <div className="overflow-x-auto">
        <table aria-label={ariaLabel} className="w-full min-w-[720px] text-left">
          <thead>
            <tr className="border-b border-border bg-petal/70 text-[11px] font-bold uppercase tracking-wider text-rosewood">
              {columns.map((column) => (
                <th key={column.key} className={`whitespace-nowrap px-4 py-3.5 font-bold first:pl-5 last:pr-5 ${column.headerClassName ?? ''}`}>
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
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
                className={`text-xs text-rosewood transition-colors hover:bg-caramel-soft/40 ${onRowClick ? 'cursor-pointer' : ''}`}
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
            descriptionClassName="text-xs"
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
