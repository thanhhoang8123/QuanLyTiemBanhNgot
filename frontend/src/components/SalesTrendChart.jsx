import Icon from './Icon.jsx'
import { salesTrend } from '../data/mockData.js'

const points = salesTrend.map((item, index) => {
  const x = 20 + index * 55
  const y = 125 - item.value
  return `${x},${y}`
}).join(' ')

export default function SalesTrendChart() {
  return (
    <section className="soft-shadow rounded-2xl border border-border bg-paper p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-xl text-rosewood">Tổng quan doanh thu</h2>
          <p className="mt-1 text-[11px] text-muted">Hiệu suất kinh doanh trong tuần này</p>
        </div>
        <button type="button" className="flex items-center gap-2 rounded-lg border border-border bg-paper px-3 py-2 text-[11px] font-semibold text-rosewood transition hover:border-caramel hover:bg-petal">
          Tuần này <Icon name="chevronDown" size={14} />
        </button>
      </div>
      <div className="mt-5 flex items-end gap-2">
        <p className="font-display text-[28px] font-semibold tracking-tight text-rosewood sm:text-[32px]">24.850.000đ</p>
        <span className="mb-1 inline-flex items-center gap-1 rounded-full bg-success-soft px-2 py-1 text-[10px] font-bold text-success">
          <Icon name="arrowUp" size={13} /> 12,8%
        </span>
      </div>
      <div className="relative mt-5 h-44">
        <div className="chart-grid absolute inset-0 rounded-md" />
        <svg className="absolute inset-0 h-full w-full overflow-visible" viewBox="0 0 360 140" preserveAspectRatio="none" role="img" aria-label="Biểu đồ doanh thu tăng nhẹ, cao nhất vào thứ Bảy">
          <defs>
            <linearGradient id="sales-fill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="var(--wa-caramel)" stopOpacity=".32" />
              <stop offset="100%" stopColor="var(--wa-caramel)" stopOpacity=".015" />
            </linearGradient>
          </defs>
          <polygon points={`20,140 ${points} 350,140`} fill="url(#sales-fill)" />
          <polyline points={points} fill="none" stroke="var(--wa-rosewood)" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
          {salesTrend.map((item, index) => (
            <circle key={item.day} cx={20 + index * 55} cy={125 - item.value} r="4" fill="var(--wa-paper)" stroke="var(--wa-rosewood)" strokeWidth="2.5" vectorEffect="non-scaling-stroke">
              <title>{`${item.day}: ${item.value} điểm doanh thu`}</title>
            </circle>
          ))}
        </svg>
      </div>
      <div className="mt-2 flex justify-between px-1 text-[10px] font-medium text-muted">
        {salesTrend.map((item) => <span key={item.day}>{item.day}</span>)}
      </div>
    </section>
  )
}
