const currency = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 })

export default function SalesTrendChart({ items, total, period }) {
  const maxValue = Math.max(...items.map((item) => item.value), 0)
  const points = items.map((item, index) => {
    const x = items.length <= 1 ? 180 : 20 + index * (330 / (items.length - 1))
    const y = maxValue > 0 ? 125 - (item.value / maxValue) * 100 : 125
    return { ...item, x, y }
  })
  const pointString = points.map((point) => `${point.x},${point.y}`).join(' ')
  const areaPoints = points.length
    ? `20,140 ${pointString} 350,140`
    : ''

  return (
    <section className="soft-shadow rounded-2xl border border-border bg-paper p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-xl text-rosewood">Tổng quan doanh thu</h2>
          <p className="mt-1 text-[11px] text-muted">Doanh thu đã thanh toán {period}</p>
        </div>
      </div>
      <div className="mt-5 flex items-end gap-2">
        <p className="font-display text-[28px] font-semibold tracking-tight text-rosewood sm:text-[32px]">{currency.format(total)}đ</p>
      </div>
      <div className="relative mt-5 h-44">
        <div className="chart-grid absolute inset-0 rounded-md" />
        <svg className="absolute inset-0 h-full w-full overflow-visible" viewBox="0 0 360 140" preserveAspectRatio="none" role="img" aria-label={`Biểu đồ doanh thu ${period}`}>
          <defs>
            <linearGradient id="sales-fill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="var(--wa-caramel)" stopOpacity=".32" />
              <stop offset="100%" stopColor="var(--wa-caramel)" stopOpacity=".015" />
            </linearGradient>
          </defs>
          {points.length > 1 && <polygon points={areaPoints} fill="url(#sales-fill)" />}
          {points.length > 1 && <polyline points={pointString} fill="none" stroke="var(--wa-rosewood)" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />}
          {points.map((item) => (
            <circle key={item.day} cx={item.x} cy={item.y} r="4" fill="var(--wa-paper)" stroke="var(--wa-rosewood)" strokeWidth="2.5" vectorEffect="non-scaling-stroke">
              <title>{`${item.day}: ${currency.format(item.value)}đ`}</title>
            </circle>
          ))}
        </svg>
      </div>
      <div className="mt-2 flex justify-between px-1 text-[10px] font-medium text-muted">
        {items.map((item) => <span key={item.day}>{item.day}</span>)}
      </div>
    </section>
  )
}
