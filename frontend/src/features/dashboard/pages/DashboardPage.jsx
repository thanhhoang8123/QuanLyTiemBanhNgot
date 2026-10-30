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
import ExpiringProductsPanel from '../components/ExpiringProductsPanel.jsx'
import { isExpiringWithinDays } from '../../products/services/productExpiry.js'
import { getUserFacingErrorMessage } from '../../../services/apiClient.js'
import { exportToExcel } from '../../../utils/excelExport.js'

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

  const top5BestSellers = useMemo(() => {
    const totals = new Map()
    paidOrders.forEach((order) => {
      ;(order.items ?? []).forEach((item) => {
        const key = Number(item.productId)
        const product = productsById.get(key)
        const current = totals.get(key) ?? {
          id: key,
          name: product?.name ?? item.productName ?? 'Sản phẩm',
          quantity: 0,
          revenue: 0,
        }
        current.quantity += Number(item.quantity ?? 0)
        current.revenue += Number(item.lineTotal ?? (Number(item.quantity ?? 0) * Number(product?.price ?? 0)))
        totals.set(key, current)
      })
    })
    return [...totals.values()]
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5)
  }, [paidOrders, productsById])

  const paymentMethodStats = useMemo(() => {
    let cashCount = 0
    let cashAmount = 0
    let vnpayCount = 0
    let vnpayAmount = 0
    let pointsCount = 0
    let pointsAmount = 0

    paidOrders.forEach((order) => {
      const method = (order.paymentMethod || '').toUpperCase()
      const amount = Number(order.finalAmount ?? 0)
      if (method.includes('VNPAY') || method === 'CARD' || method === 'EWALLET') {
        vnpayCount += 1
        vnpayAmount += amount
      } else if (method === 'LOYALTY_POINTS' || amount === 0) {
        pointsCount += 1
        pointsAmount += amount
      } else {
        cashCount += 1
        cashAmount += amount
      }
    })

    const totalAmount = revenue || 1
    return {
      cash: { count: cashCount, amount: cashAmount, percent: Math.round((cashAmount / totalAmount) * 100) },
      vnpay: { count: vnpayCount, amount: vnpayAmount, percent: Math.round((vnpayAmount / totalAmount) * 100) },
      points: { count: pointsCount, amount: pointsAmount, percent: Math.round((pointsAmount / totalAmount) * 100) },
    }
  }, [paidOrders, revenue])

  const handleExportRevenueReport = () => {
    const headers = [
      'Mã đơn hàng',
      'Ngày giờ đặt',
      'Số tiền gốc (đ)',
      'Giảm giá voucher (đ)',
      'Doanh thu thực thu (đ)',
      'Phương thức thanh toán',
      'Trạng thái đơn',
    ]
    const rows = paidOrders.map((order) => [
      order.orderCode || `DH-${order.id}`,
      order.orderDate || '',
      order.totalAmount ?? 0,
      order.discountAmount ?? 0,
      order.finalAmount ?? 0,
      order.paymentMethod || 'CASH',
      order.status || 'CONFIRMED',
    ])
    exportToExcel({
      filename: `BaoCao_DoanhThu_${period.replace(/\s+/g, '_')}`,
      headers,
      rows,
    })
  }

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

  const expiringProducts = useMemo(() => data.products
    .filter((item) => item.status !== false && isExpiringWithinDays(item.expiryDate, 1))
    .sort((a, b) => (a.expiryDate || '').localeCompare(b.expiryDate || ''))
    .slice(0, 5), [data.products])

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
      tone: 'sand',
    },
  ]

  const periodLabels = {
    'Hôm nay': 'Hôm nay',
    '7 ngày qua': '7 ngày qua',
    'Tháng này': 'Tháng này',
  }

  const recentOrders = useMemo(() => [...data.orders]
    .sort((first, second) => {
      const firstDate = parseOrderDate(first.orderDate)?.getTime() ?? 0
      const secondDate = parseOrderDate(second.orderDate)?.getTime() ?? 0
      return secondDate - firstDate
    })
    .slice(0, 5), [data.orders])

  if (isLoading) {
    return <LoadingState message="Đang tải dữ liệu tổng quan..." />
  }

  const loadError = Object.values(errors).filter(Boolean)[0]

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="font-display mt-1 text-[28px] text-rosewood sm:text-[32px]">Bảng điều khiển</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportRevenueReport}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-paper px-3 py-2 text-xs font-semibold text-rosewood shadow-xs transition hover:border-caramel hover:text-caramel"
          >
            <Icon name="download" size={14} /> Xuất báo cáo doanh thu ({period})
          </button>
          <div className="flex rounded-xl border border-border bg-paper p-1 shadow-xs">
            {periodOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setPeriod(option.value)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  period === option.value ? 'bg-caramel text-white shadow-xs' : 'text-muted hover:text-rosewood'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loadError ? (
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

      {/* Biểu đồ Top 5 bánh bán chạy nhất & Tỷ lệ thanh toán (Thesis Feature 6) */}
      <section className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Top 5 Bánh Bán Chạy Nhất */}
        <div className="soft-shadow rounded-2xl border border-border bg-paper p-5">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div>
              <h3 className="font-display text-base font-bold text-rosewood">Top 5 Bánh Bán Chạy ({period})</h3>
              <p className="text-[11px] text-muted">Xếp hạng theo sản lượng bán ra thực tế</p>
            </div>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600 font-bold text-sm">
              🏆
            </span>
          </div>
          <div className="mt-4 space-y-3.5">
            {top5BestSellers.length === 0 ? (
              <p className="py-6 text-center text-xs text-muted">Chưa có dữ liệu bán hàng trong kỳ này.</p>
            ) : (
              top5BestSellers.map((item, idx) => {
                const maxQty = top5BestSellers[0].quantity || 1
                const percent = Math.round((item.quantity / maxQty) * 100)
                return (
                  <div key={item.id} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-rosewood">
                        <strong className="text-caramel mr-1.5 font-bold">#{idx + 1}</strong> {item.name}
                      </span>
                      <span className="text-stone-600 font-medium">
                        <strong className="text-rosewood">{item.quantity}</strong> cái · {moneyFormat.format(item.revenue)}đ
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-stone-100">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-caramel to-amber-500 transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Tỷ lệ thanh toán (Tiền mặt vs VNPay / Chuyển khoản) */}
        <div className="soft-shadow rounded-2xl border border-border bg-paper p-5">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div>
              <h3 className="font-display text-base font-bold text-rosewood">Tỷ Lệ Phương Thức Thanh Toán</h3>
              <p className="text-[11px] text-muted">Cơ cấu doanh thu theo cổng thanh toán ({period})</p>
            </div>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-600 font-bold text-sm">
              💳
            </span>
          </div>
          <div className="mt-4 space-y-4">
            {/* Tiền mặt */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 font-semibold text-stone-700">
                  <span>💵</span> Tiền mặt tại quầy ({paymentMethodStats.cash.count} đơn)
                </span>
                <span className="font-bold text-rosewood">
                  {moneyFormat.format(paymentMethodStats.cash.amount)}đ ({paymentMethodStats.cash.percent}%)
                </span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-stone-100">
                <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${paymentMethodStats.cash.percent}%` }} />
              </div>
            </div>

            {/* VNPay / Thẻ / Chuyển khoản */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 font-semibold text-stone-700">
                  <span>📱</span> VNPay / Chuyển khoản / Thẻ ({paymentMethodStats.vnpay.count} đơn)
                </span>
                <span className="font-bold text-rosewood">
                  {moneyFormat.format(paymentMethodStats.vnpay.amount)}đ ({paymentMethodStats.vnpay.percent}%)
                </span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-stone-100">
                <div className="h-full rounded-full bg-sky-500 transition-all" style={{ width: `${paymentMethodStats.vnpay.percent}%` }} />
              </div>
            </div>

            {/* Điểm tích lũy */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 font-semibold text-stone-700">
                  <span>✨</span> Điểm tích lũy thành viên ({paymentMethodStats.points.count} đơn)
                </span>
                <span className="font-bold text-rosewood">
                  {paymentMethodStats.points.count} lượt ({paymentMethodStats.points.percent}%)
                </span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-stone-100">
                <div className="h-full rounded-full bg-amber-400 transition-all" style={{ width: `${paymentMethodStats.points.percent}%` }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 items-start gap-5 2xl:grid-cols-[minmax(0,1.7fr)_minmax(285px,0.8fr)]">
        <OrdersTable orders={recentOrders} totalOrders={data.orders.length} period={periodLabels[period]} error={errors.orders} />
        <div className="space-y-5">
          {isManager && <LowStockPanel items={lowStockItems} error={errors.ingredients} />}
          <ExpiringProductsPanel items={expiringProducts} error={errors.products} />
        </div>
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
