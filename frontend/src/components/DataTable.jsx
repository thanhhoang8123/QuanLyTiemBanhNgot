import Icon from './Icon.jsx'

export default function DataTable({
  columns,
  rows,
  rowKey,
  emptyTitle = 'Chưa có dữ liệu',
  emptyDescription = 'Thử thay đổi điều kiện lọc hoặc tìm kiếm.',
  onRowClick,
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-left">
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
          {rows.map((row) => (
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
        <div className="flex flex-col items-center px-5 py-12 text-center">
          <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-caramel-soft text-rosewood">
            <Icon name="search" size={19} />
          </span>
          <p className="font-display text-base font-semibold text-rosewood">{emptyTitle}</p>
          <p className="mt-1 text-[11px] text-muted">{emptyDescription}</p>
        </div>
      )}
    </div>
  )
}
