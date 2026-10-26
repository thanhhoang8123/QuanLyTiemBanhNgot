import { Link } from 'react-router-dom'
import Icon from '../../../components/Icon.jsx'
import StatusBadge from '../../../components/StatusBadge.jsx'

const moneyFormat = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
})
const paymentLabels = {
  SUCCESS: 'Đã thanh toán',
  PENDING: 'Chờ thanh toán',
  FAILED: 'Thanh toán lỗi',
}

function formatDateTime(value) {
  if (!value) return '—'
  const date = new Date(`${value}Z`)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date)
}

export default function OrdersTable({ orders = [] }) {
  return (
    <section className="soft-shadow min-w-0 rounded-2xl border border-border bg-paper">
      <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4 sm:px-6">
        <div>
          <h2 className="font-display text-lg font-semibold text-rosewood">Đơn hàng gần đây</h2>
          <p className="mt-1 text-[11px] text-muted">5 đơn mới nhất từ hệ thống</p>
        </div>
        <Link to="/admin/orders" className="shrink-0 rounded-lg px-2 py-2 text-[11px] font-bold text-rosewood transition hover:bg-petal">
          Xem tất cả
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[650px] text-left">
          <thead>
            <tr className="bg-petal text-[10px] font-bold uppercase tracking-wide text-rosewood">
              <th className="px-5 py-3 font-medium sm:px-6">Mã đơn</th>
              <th className="px-4 py-3 font-medium">Khách hàng</th>
              <th className="px-4 py-3 font-medium">Thời gian</th>
              <th className="px-4 py-3 font-medium">Thành tiền</th>
              <th className="px-5 py-3 font-medium sm:px-6">Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => {
              const amount = Number(order.totalAmount || 0) - Number(order.discountAmount || 0)
              const status = order.paymentStatus
                ? paymentLabels[order.paymentStatus] || order.paymentStatus
                : order.status
              return (
                <tr key={order.id} className="border-t border-border text-[11px] text-rosewood transition-colors hover:bg-cream">
                  <td className="whitespace-nowrap px-5 py-3.5 font-bold text-rosewood sm:px-6">{order.orderCode || `#${order.id}`}</td>
                  <td className="whitespace-nowrap px-4 py-3.5">{order.customerName || 'Khách mua tại quầy'}</td>
                  <td className="whitespace-nowrap px-4 py-3.5">{formatDateTime(order.orderDate)}</td>
                  <td className="whitespace-nowrap px-4 py-3.5 font-bold text-rosewood">{moneyFormat.format(amount)}</td>
                  <td className="whitespace-nowrap px-5 py-3.5 sm:px-6">
                    <StatusBadge status={status} className="text-[9px]" />
                  </td>
                </tr>
              )
            })}
            {!orders.length && (
              <tr>
                <td colSpan="5" className="px-5 py-10 text-center text-xs text-muted">
                  Chưa có đơn hàng nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between border-t border-border px-5 py-3 text-[10px] text-muted sm:px-6">
        <span>{orders.length ? `Hiển thị ${orders.length} đơn gần nhất` : 'Danh sách trống'}</span>
        <Link to="/admin/orders" aria-label="Mở danh sách đơn hàng" className="flex h-7 w-7 items-center justify-center rounded-full border border-border text-rosewood transition hover:bg-petal">
          <Icon name="chevronRight" size={14} />
        </Link>
      </div>
    </section>
  )
}
