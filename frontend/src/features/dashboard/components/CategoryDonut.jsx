export default function CategoryDonut({ rows, orderCount }) {
  let offset = 0
  const gradientStops = rows.map((row) => {
    const start = offset
    offset += row.value * 100
    return `${row.color} ${start}% ${offset}%`
  })
  const background = gradientStops.length
    ? `conic-gradient(${gradientStops.join(', ')})`
    : 'conic-gradient(var(--wa-border) 0% 100%)'

  return (
    <section className="soft-shadow rounded-2xl border border-border bg-paper p-5 sm:p-6">
      <div>
        <h2 className="font-display text-lg font-semibold text-rosewood">Danh mục bán chạy</h2>
        <p className="mt-1 text-[11px] text-muted">Tỷ trọng doanh thu đã thanh toán</p>
      </div>
      <div className="my-5 flex justify-center">
        <div className="relative flex h-36 w-36 items-center justify-center rounded-full shadow-inner" style={{ background }}>
          <div className="flex h-[94px] w-[94px] flex-col items-center justify-center rounded-full bg-paper">
            <span className="font-display text-xl text-rosewood">{orderCount}</span>
            <span className="text-[9px] font-medium text-muted">đơn đã trả</span>
          </div>
        </div>
      </div>
      <div className="space-y-3">
        {rows.length === 0 && <p className="text-[11px] text-muted">Chưa có doanh thu trong kỳ này.</p>}
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between text-[11px]">
            <span className="flex items-center gap-2 font-medium text-rosewood">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: row.color }} />
              {row.label}
            </span>
            <span className="font-bold text-rosewood">{new Intl.NumberFormat('vi-VN', { style: 'percent', maximumFractionDigits: 1 }).format(row.value)}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
