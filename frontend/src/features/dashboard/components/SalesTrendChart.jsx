import { useMemo } from 'react'

const moneyFormat = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
})

function shortDate(value) {
  const date = new Date(`${value}T00:00:00`)
  return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit' }).format(date)
}

export default function SalesTrendChart({ data = [], period }) {
  const chart = useMemo(() => {
    const maxRevenue = Math.max(...data.map((item) => Number(item.revenue)), 1)
    const points = data.map((item, index) => {
      const x = data.length <= 1 ? 180 : 20 + index * (330 / (data.length - 1))
      const y = 125 - (Number(item.revenue) / maxRevenue) * 100
      return { ...item, x, y }
    })
    return {
      points,
      line: points.map((point) => `${point.x},${point.y}`).join(' '),
      area: points.length ? `20,140 ${points.map((point) => `${point.x},${point.y}`).join(' ')} 350,140` : '',
    }
  }, [data])
  const revenue = data.reduce((total, point) => total + Number(point.revenue || 0), 0)

  return (
    <section className="soft-shadow rounded-2xl border border-border bg-paper p-5 sm:p-6">
      <div>
        <h2 className="font-display text-xl text-rosewood">Doanh thu đã thanh toán</h2>
        <p className="mt-1 text-[11px] text-muted">Theo ngày trong {period?.toLowerCase()}</p>
      </div>
      <p className="font-display mt-5 text-[28px] font-semibold tracking-tight text-rosewood sm:text-[32px]">
        {moneyFormat.format(revenue)}
      </p>
      {data.length ? (
        <>
          <div className="relative mt-5 h-44">
            <div className="chart-grid absolute inset-0 rounded-md" />
            <svg className="absolute inset-0 h-full w-full overflow-visible" viewBox="0 0 360 140" preserveAspectRatio="none" role="img" aria-label={`Biểu đồ doanh thu theo ngày trong ${period}`}>
              <defs>
                <linearGradient id="sales-fill" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="var(--wa-caramel)" stopOpacity=".32" />
                  <stop offset="100%" stopColor="var(--wa-caramel)" stopOpacity=".015" />
                </linearGradient>
              </defs>
              <polygon points={chart.area} fill="url(#sales-fill)" />
              <polyline points={chart.line} fill="none" stroke="var(--wa-rosewood)" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
              {chart.points.map((point) => (
                <circle key={point.date} cx={point.x} cy={point.y} r="4" fill="var(--wa-paper)" stroke="var(--wa-rosewood)" strokeWidth="2.5" vectorEffect="non-scaling-stroke">
                  <title>{`${shortDate(point.date)}: ${moneyFormat.format(point.revenue)}`}</title>
                </circle>
              ))}
            </svg>
          </div>
          <div className="mt-2 flex justify-between px-1 text-[10px] font-medium text-muted">
            {chart.points.map((point) => <span key={point.date}>{shortDate(point.date)}</span>)}
          </div>
        </>
      ) : (
        <div className="mt-5 flex h-44 items-center justify-center rounded-xl bg-cream text-sm text-muted">
          Chưa có giao dịch thanh toán thành công trong khoảng này.
        </div>
      )}
    </section>
  )
}
