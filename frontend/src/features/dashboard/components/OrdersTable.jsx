import { Link } from 'react-router-dom'
import StatusBadge from '../../../components/StatusBadge.jsx'

const currency = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 })
const statuses = {
  PENDING: 'Chờ xử lý',
  CONFIRMED: 'Đã xác nhận',
  COMPLETED: 'Hoàn tất',
  CANCELLED: 'Đã hủy',
}

function formatDate(value) {
  if (!value) return '—'
  const date = new Date(/(?:Z|[+-]\d{2}:\d{2})$/i.test(value) ? value : `${value}Z`)
  return Number.isNaN(date.getTime()) ? '—' : new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(date)
}

export default function OrdersTable({ orders, totalOrders, period, error }) {
  return (
    <section className="soft-shadow min-w-0 rounded-2xl border border-border bg-paper">
      <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4 sm:px-6">
        <div>
          <h2 className="font-display text-lg font-semibold text-rosewood">Đơn hàng gần đây</h2>
          <p className="mt-1 text-[11px] text-muted">{error ? 'Không tải được đơn hàng' : `Đơn hàng mới nhất · ${period}`}</p>
        </div>
        <Link to="/admin/orders" className="shrink-0 rounded-lg px-2 py-2 text-[11px] font-bold text-rosewood transition hover:bg-petal">Xem tất cả</Link>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[590px] text-left">
          <thead>
            <tr className="bg-petal text-[10px] font-bold uppercase tracking-wide text-rosewood">
              <th className="px-5 py-3 font-medium sm:px-6">Mã đơn</th>
              <th className="px-4 py-3 font-medium">Khách hàng</th>
              <th className="px-4 py-3 font-medium">Thời gian</th>
              <th className="px-4 py-3 font-medium">Tổng tiền</th>
              <th className="px-5 py-3 font-medium sm:px-6">Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-t border-border text-[11px] text-rosewood transition-colors hover:bg-cream">
                <td className="whitespace-nowrap px-5 py-3.5 font-bold text-rosewood sm:px-6">{order.orderCode || `#${order.id}`}</td>
                <td className="whitespace-nowrap px-4 py-3.5">{order.customerName}</td>
                <td className="whitespace-nowrap px-4 py-3.5">{formatDate(order.orderDate)}</td>
                <td className="whitespace-nowrap px-4 py-3.5 font-bold text-rosewood">{currency.format(Number(order.finalAmount ?? 0))}đ</td>
                <td className="whitespace-nowrap px-5 py-3.5 sm:px-6">
                  <StatusBadge status={statuses[order.status] ?? 'Đang cập nhật'} className="text-[9px]" />
                </td>
              </tr>
            ))}
            {!orders.length && (
              <tr><td colSpan="5" className="px-5 py-8 text-center text-xs text-muted">{error ? 'Dữ liệu đơn hàng hiện không khả dụng.' : 'Chưa có đơn hàng.'}</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between border-t border-border px-5 py-3 text-[10px] text-muted sm:px-6">
        <span>Hiển thị {orders.length} trên {totalOrders} đơn hàng</span>
        <Link to="/admin/orders" aria-label="Xem danh sách đơn hàng" className="rounded-lg px-2 py-1 font-semibold text-rosewood hover:bg-petal">Mở danh sách</Link>
      </div>
    </section>
  )
}
