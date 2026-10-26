import { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../../../components/Icon.jsx'
import LoadingState from '../../../components/LoadingState.jsx'
import { AuthContext } from '../../auth/AuthContext.js'
import { getCustomers } from '../../customers/services/customerService.js'
import { getIngredients } from '../../inventory/services/ingredientService.js'
import { getOrders } from '../../orders/services/orderService.js'
import { getProducts } from '../../products/services/productService.js'
import StatCard from '../components/StatCard.jsx'
import SalesTrendChart from '../components/SalesTrendChart.jsx'
import CategoryDonut from '../components/CategoryDonut.jsx'
import OrdersTable from '../components/OrdersTable.jsx'
import LowStockPanel from '../components/LowStockPanel.jsx'
import { getUserFacingErrorMessage } from '../../../services/apiClient.js'

const moneyFormat = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 })
const categoryColors = [
  'var(--wa-caramel)',
  'var(--wa-blush)',
  'var(--wa-rosewood)',
  'var(--wa-sand)',
]
const initialData = { orders: [], customers: [], products: [], ingredients: [] }
const periodOptions = [
  { value: 'Hôm nay', label: 'Hôm nay' },
  { value: '7 ngày qua', label: '7 ngày qua' },
  { value: 'Tháng này', label: 'Tháng này' },
]

function getErrorMessage(error) {
  return getUserFacingErrorMessage(error, 'Chưa thể tải số liệu. Vui lòng thử lại.')
}

function parseOrderDate(value) {
  if (typeof value !== 'string' || !value) return null
  const date = new Date(/(?:Z|[+-]\d{2}:\d{2})$/i.test(value) ? value : `${value}Z`)
  return Number.isNaN(date.getTime()) ? null : date
}

function getPeriodStart(period, now) {
  const start = new Date(now)
  start.setHours(0, 0, 0, 0)
  if (period === '7 ngày qua') {
    start.setDate(start.getDate() - 6)
  } else if (period === 'Tháng này') {
    start.setDate(1)
  }
  return start
}

function getDayKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function toArray(result, label) {
  if (!Array.isArray(result)) throw new Error(`Chưa thể tải danh sách ${label}. Vui lòng thử lại.`)
  return result
}

export default function DashboardPage() {
  const { account } = useContext(AuthContext)
  const isManager = ['ADMIN', 'MANAGER'].includes((account?.roleCode ?? '').toUpperCase())
  const [period, setPeriod] = useState('Hôm nay')
  const [data, setData] = useState(initialData)
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const [reloadVersion, setReloadVersion] = useState(0)

  const loadDashboard = useCallback(async (signal) => {
    setIsLoading(true)
    const requests = {
      orders: getOrders({ signal }).then((result) => toArray(result, 'đơn hàng')),
      customers: getCustomers({ signal }).then((result) => toArray(result, 'khách hàng')),
      products: getProducts({ signal }).then((result) => toArray(result, 'sản phẩm')),
    }
    if (isManager) {
      requests.ingredients = getIngredients({ signal }).then((result) => toArray(result, 'nguyên liệu'))
    }

    const results = await Promise.allSettled(
      Object.entries(requests).map(async ([key, request]) => [key, await request]),
    )
    if (signal.aborted) return

    const nextData = { ...initialData }
    const nextErrors = {}
    results.forEach((result, index) => {
      const key = Object.keys(requests)[index]
      if (result.status === 'fulfilled') {
        nextData[key] = result.value[1]
      } else {
        nextErrors[key] = getErrorMessage(result.reason)
      }
    })
    setData(nextData)
    setErrors(nextErrors)
    setIsLoading(false)
  }, [isManager])

  useEffect(() => {
    const controller = new AbortController()
    void loadDashboard(controller.signal)
    return () => controller.abort()
  }, [loadDashboard, reloadVersion])

  const now = new Date()
  const periodStart = getPeriodStart(period, now)
  const periodOrders = useMemo(() => data.orders.filter((order) => {
    const orderDate = parseOrderDate(order.orderDate)
    return orderDate && orderDate >= periodStart && orderDate <= now
  }), [data.orders, periodStart.getTime(), now.getTime()])
  const paidOrders = periodOrders.filter((order) => (
    order.status === 'CONFIRMED' || order.status === 'COMPLETED'
  ))
  const revenue = paidOrders.reduce((sum, order) => sum + Number(order.finalAmount ?? 0), 0)
  const averageOrder = paidOrders.length ? revenue / paidOrders.length : 0

  const customersById = useMemo(
    () => new Map(data.customers.map((customer) => [Number(customer.id), customer])),
    [data.customers],
  )
  const productsById = useMemo(
    () => new Map(data.products.map((product) => [Number(product.id), product])),
    [data.products],
  )

  const bestSeller = useMemo(() => {
    const totals = new Map()
    paidOrders.forEach((order) => {
      ;(order.items ?? []).forEach((item) => {
        const key = Number(item.productId)
        const product = productsById.get(key)
        const current = totals.get(key) ?? { name: product?.name ?? item.productName ?? 'Sản phẩm', quantity: 0 }
        current.quantity += Number(item.quantity ?? 0)
        totals.set(key, current)
      })
    })
    return [...totals.values()].sort((first, second) => second.quantity - first.quantity)[0] ?? null
  }, [paidOrders, productsById])

  const salesTrend = useMemo(() => {
    const totals = new Map()
    const cursor = new Date(periodStart)
    while (cursor <= now) {
      totals.set(getDayKey(cursor), 0)
      cursor.setDate(cursor.getDate() + 1)
    }
    paidOrders.forEach((order) => {
      const date = parseOrderDate(order.orderDate)
      if (!date) return
      const key = getDayKey(date)
      if (totals.has(key)) totals.set(key, totals.get(key) + Number(order.finalAmount ?? 0))
    })
    return [...totals].map(([key, value]) => {
      const date = new Date(`${key}T12:00:00`)
      return {
        day: period === 'Hôm nay'
          ? 'Hôm nay'
          : new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit' }).format(date),
        value,
      }
    })
  }, [paidOrders, period, periodStart.getTime(), now.getTime()])

  const categoryTotals = useMemo(() => {
    const totals = new Map()
    paidOrders.forEach((order) => {
      ;(order.items ?? []).forEach((item) => {
        const product = productsById.get(Number(item.productId))
        const category = product?.category?.name ?? product?.categoryName ?? 'Khác'
        const amount = Number(item.lineTotal ?? 0)
        totals.set(category, (totals.get(category) ?? 0) + amount)
      })
    })
    const rows = [...totals].sort((first, second) => second[1] - first[1])
    const topRows = rows.slice(0, 4)
    const otherAmount = rows.slice(4).reduce((sum, [, amount]) => sum + amount, 0)
    if (otherAmount > 0) topRows.push(['Khác', otherAmount])
    const total = topRows.reduce((sum, [, amount]) => sum + amount, 0)
    return topRows.map(([label, amount], index) => ({
      label,
      value: total > 0 ? amount / total : 0,
      color: categoryColors[index % categoryColors.length],
    }))
  }, [paidOrders, productsById])

  const lowStockItems = useMemo(() => data.ingredients
    .filter((item) => item.status !== false
      && Number(item.minStockLevel ?? 0) > 0
      && Number(item.stockQuantity ?? 0) <= Number(item.minStockLevel))
    .sort((first, second) => Number(first.stockQuantity ?? 0) - Number(second.stockQuantity ?? 0))
    .slice(0, 5), [data.ingredients])

  const stats = [
    {
      label: 'Doanh thu đã thanh toán',
      value: errors.orders ? '—' : `${moneyFormat.format(revenue)}đ`,
      note: period,
      icon: 'trending-up',
      tone: 'caramel',
    },
    {
      label: 'Đơn hàng',
      value: errors.orders ? '—' : periodOrders.length,
      note: period,
      icon: 'receipt',
      tone: 'rose',
    },
    {
      label: 'Giá trị đơn đã thanh toán TB',
      value: errors.orders ? '—' : `${moneyFormat.format(averageOrder)}đ`,
      note: `${paidOrders.length} đơn đã thanh toán`,
      icon: 'credit-card',
      tone: 'sage',
    },
    {
      label: 'Bán chạy nhất',
      value: errors.orders || errors.products ? '—' : bestSeller?.name ?? 'Chưa có dữ liệu',
      note: bestSeller ? `${bestSeller.quantity} sản phẩm đã bán` : period,
      icon: 'sparkles',
      tone: 'lavender',
    },
  ]

  const recentOrders = [...data.orders]
    .sort((first, second) => (parseOrderDate(second.orderDate)?.getTime() ?? 0) - (parseOrderDate(first.orderDate)?.getTime() ?? 0))
    .slice(0, 5)
    .map((order) => ({
      ...order,
      customerName: customersById.get(Number(order.customerId))?.fullName || `Khách hàng #${order.customerId ?? '—'}`,
    }))

  const periodLabels = { 'Hôm nay': 'hôm nay', '7 ngày qua': '7 ngày qua', 'Tháng này': 'tháng này' }
  const loadError = Object.entries(errors)
    .map(([key, message]) => `${key}: ${message}`)
    .join(' · ')

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-[11px] font-semibold tracking-wide text-muted">
            {new Intl.DateTimeFormat('vi-VN', { dateStyle: 'full' }).format(now)}
          </p>
          <h2 className="font-display mt-1 text-[28px] leading-tight text-rosewood sm:text-[34px]">Tổng quan cửa hàng</h2>
          <p className="mt-2 text-xs text-muted">Số liệu được tổng hợp từ dữ liệu đơn hàng và kho hiện tại.</p>
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

      {isLoading ? (
        <LoadingState label="Đang tải số liệu tổng quan..." />
      ) : loadError ? (
        <div role="alert" className="flex flex-col gap-3 rounded-xl border border-danger-line bg-danger-soft px-4 py-3 text-xs text-danger sm:flex-row sm:items-center sm:justify-between">
          <span>Không tải được đầy đủ số liệu: {loadError}</span>
          <button type="button" onClick={() => setReloadVersion((version) => version + 1)} className="shrink-0 font-semibold underline">Thử tải lại</button>
        </div>
      ) : null}

      <section aria-label="Chỉ số kinh doanh" className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => <StatCard key={stat.label} stat={stat} />)}
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(260px,0.8fr)]">
        <SalesTrendChart items={salesTrend} total={revenue} period={periodLabels[period]} />
        <CategoryDonut rows={categoryTotals} orderCount={paidOrders.length} />
      </section>

      <section className="grid grid-cols-1 items-start gap-5 2xl:grid-cols-[minmax(0,1.7fr)_minmax(285px,0.8fr)]">
        <OrdersTable orders={recentOrders} totalOrders={data.orders.length} period={periodLabels[period]} error={errors.orders} />
        {isManager && <LowStockPanel items={lowStockItems} error={errors.ingredients} />}
      </section>

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
