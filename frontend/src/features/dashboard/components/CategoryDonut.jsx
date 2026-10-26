const colors = [
  'var(--wa-caramel)',
  'var(--wa-blush)',
  'var(--wa-rosewood)',
  'var(--wa-sand)',
  'var(--wa-success)',
]
const moneyFormat = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
})

export default function CategoryDonut({ data = [], paidOrderCount = 0 }) {
  const totalRevenue = data.reduce((total, item) => total + Number(item.revenue || 0), 0)
  let accumulated = 0
  const rows = data.map((item, index) => {
    const percentage = totalRevenue > 0 ? (Number(item.revenue) / totalRevenue) * 100 : 0
    const row = {
      ...item,
      percentage,
      color: colors[index % colors.length],
      start: accumulated,
    }
    accumulated += percentage
    return row
  })
  const gradient = rows.length
    ? `conic-gradient(${rows.map((row) => `${row.color} ${row.start}% ${row.start + row.percentage}%`).join(', ')})`
    : 'conic-gradient(var(--wa-border) 0% 100%)'

  return (
    <section className="soft-shadow rounded-2xl border border-border bg-paper p-5 sm:p-6">
      <div>
        <h2 className="font-display text-lg font-semibold text-rosewood">Doanh thu theo danh mục</h2>
        <p className="mt-1 text-[11px] text-muted">Chỉ tính đơn đã thanh toán</p>
      </div>
      <div className="my-5 flex justify-center">
        <div className="relative flex h-36 w-36 items-center justify-center rounded-full shadow-inner" style={{ background: gradient }}>
          <div className="flex h-[94px] w-[94px] flex-col items-center justify-center rounded-full bg-paper">
            <span className="font-display text-xl text-rosewood">{paidOrderCount}</span>
            <span className="text-[9px] font-medium text-muted">đơn đã trả</span>
          </div>
        </div>
      </div>
      {rows.length ? (
        <div className="space-y-3">
          {rows.map((row) => (
            <div key={row.category} className="flex items-center justify-between gap-2 text-[11px]">
              <span className="flex min-w-0 items-center gap-2 font-medium text-rosewood">
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: row.color }} />
                <span className="truncate">{row.category}</span>
              </span>
              <span className="shrink-0 text-right font-bold text-rosewood">
                {row.percentage.toFixed(0)}% · {moneyFormat.format(row.revenue)}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-xs text-muted">Chưa có doanh thu theo danh mục.</p>
      )}
    </section>
  )
}
