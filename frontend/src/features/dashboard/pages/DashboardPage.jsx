import { useCallback, useContext, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../../../components/Icon.jsx'
import StatCard from '../components/StatCard.jsx'
import SalesTrendChart from '../components/SalesTrendChart.jsx'
import CategoryDonut from '../components/CategoryDonut.jsx'
import OrdersTable from '../components/OrdersTable.jsx'
import LowStockPanel from '../components/LowStockPanel.jsx'
import ErrorState from '../../../components/ErrorState.jsx'
import LoadingState from '../../../components/LoadingState.jsx'
import { AuthContext } from '../../auth/AuthContext.js'
import { getDashboardSummary } from '../services/dashboardService.js'

const periodOptions = [
  { value: 'today', label: 'Hôm nay' },
  { value: 'week', label: '7 ngày qua' },
  { value: 'month', label: 'Tháng này' },
]
const moneyFormat = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
})

export default function DashboardPage() {
  const { account } = useContext(AuthContext)
  const [period, setPeriod] = useState('week')
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadSummary = useCallback(async (signal) => {
    setLoading(true)
    setError('')
    try {
      const result = await getDashboardSummary(period, { signal })
      setSummary(result)
    } catch (loadError) {
      if (signal?.aborted || loadError.name === 'AbortError') return
      setError(loadError.message || 'Không thể tải dữ liệu tổng quan.')
    } finally {
      if (!signal?.aborted) setLoading(false)
    }
  }, [period])

  useEffect(() => {
    const controller = new AbortController()
    loadSummary(controller.signal)
    return () => controller.abort()
  }, [loadSummary])

  const stats = summary ? [
    {
      label: 'Doanh thu đã thanh toán',
      value: moneyFormat.format(summary.paidRevenue),
      note: summary.period,
      icon: 'trending-up',
      tone: 'caramel',
    },
    {
      label: 'Đơn đã thanh toán',
      value: String(summary.paidOrderCount),
      note: summary.period,
      icon: 'receipt',
      tone: 'rose',
    },
    {
      label: 'Giá trị đơn TB',
      value: moneyFormat.format(summary.averagePaidOrder),
      note: 'trên đơn đã thanh toán',
      icon: 'credit-card',
      tone: 'sage',
    },
    {
      label: 'Bán chạy nhất',
      value: summary.topProduct || 'Chưa có dữ liệu',
      note: summary.topProduct
        ? `${summary.topProductQuantity} chiếc · ${summary.period}`
        : summary.period,
      icon: 'sparkles',
      tone: 'lavender',
    },
  ] : []
  const canViewInventory = ['ADMIN', 'MANAGER'].includes(
    (account?.roleCode || '').toUpperCase(),
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-[11px] font-semibold tracking-wide text-muted">
            {new Intl.DateTimeFormat('vi-VN', { dateStyle: 'full' }).format(new Date())}
          </p>
          <h2 className="font-display mt-1 text-[28px] leading-tight text-rosewood sm:text-[34px]">
            Tổng quan cửa hàng <span aria-hidden="true">☀️</span>
          </h2>
          <p className="mt-2 text-xs text-muted">Số liệu từ các đơn đã thanh toán thành công.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="sr-only" htmlFor="dashboard-period">Khoảng thời gian</label>
          <select
            id="dashboard-period"
            value={period}
            onChange={(event) => setPeriod(event.target.value)}
            className="h-10 rounded-xl border border-border bg-paper px-3 text-xs font-medium text-rosewood outline-none transition hover:border-caramel-hover focus:border-caramel-hover"
          >
            {periodOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          <Link to="/pos" className="flex h-10 items-center gap-2 rounded-xl bg-caramel px-4 text-xs font-semibold text-action-ink shadow-sm transition hover:bg-caramel-hover">
            <Icon name="plus" size={15} /> Tạo đơn hàng
          </Link>
        </div>
      </div>

      <section aria-label="Chỉ số kinh doanh" className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 xl:grid-cols-4">
        {loading && <div className="col-span-full"><LoadingState label="Đang tải số liệu tổng quan..." /></div>}
        {!loading && error && <div className="col-span-full"><ErrorState description={error} onRetry={() => loadSummary()} /></div>}
        {!loading && !error && stats.map((stat) => <StatCard key={stat.label} stat={stat} />)}
      </section>

      {!loading && !error && summary && (
        <>
          <section className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(260px,0.8fr)]">
            <SalesTrendChart data={summary.salesTrend} period={summary.period} />
            <CategoryDonut data={summary.categorySales} paidOrderCount={summary.paidOrderCount} />
          </section>

          <section className={`grid grid-cols-1 items-start gap-5 ${canViewInventory ? '2xl:grid-cols-[minmax(0,1.7fr)_minmax(285px,0.8fr)]' : ''}`}>
            <OrdersTable orders={summary.recentOrders} />
            {canViewInventory && <LowStockPanel items={summary.lowStockItems} />}
          </section>
        </>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-petal px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-paper text-rosewood"><Icon name="sparkles" size={18} /></span>
          <div>
            <p className="font-display text-[15px] text-rosewood">Cùng tạo nên một ngày thật ngọt ngào</p>
            <p className="mt-1 text-[10px] text-muted">Bắt đầu đơn bán hàng mới ngay tại quầy.</p>
          </div>
        </div>
        <Link to="/pos" className="flex items-center gap-2 rounded-lg px-3 py-2 text-[11px] font-bold text-rosewood transition hover:bg-paper">
          Mở bán hàng <Icon name="arrowUpRight" size={15} />
        </Link>
      </div>
    </div>
  )
}
