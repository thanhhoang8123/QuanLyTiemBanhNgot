import Icon from './Icon.jsx'
import StatusBadge from './StatusBadge.jsx'
import { recentOrders } from '../data/mockData.js'

export default function OrdersTable() {
  return (
    <section className="soft-shadow min-w-0 rounded-2xl border border-border bg-paper">
      <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4 sm:px-6">
        <div>
          <h2 className="font-display text-lg font-semibold text-rosewood">Đơn hàng gần đây</h2>
          <p className="mt-1 text-[11px] text-muted">Những đơn hàng mới nhất trong ngày</p>
        </div>
        <button type="button" className="shrink-0 rounded-lg px-2 py-2 text-[11px] font-bold text-rosewood transition hover:bg-petal">
          Xem tất cả
        </button>
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
            {recentOrders.map((order) => (
              <tr key={order.id} className="border-t border-border text-[11px] text-rosewood transition-colors hover:bg-cream">
                <td className="whitespace-nowrap px-5 py-3.5 font-bold text-rosewood sm:px-6">{order.id}</td>
                <td className="whitespace-nowrap px-4 py-3.5">{order.customer}</td>
                <td className="whitespace-nowrap px-4 py-3.5">{order.time}</td>
                <td className="whitespace-nowrap px-4 py-3.5 font-bold text-rosewood">{order.total}</td>
                <td className="whitespace-nowrap px-5 py-3.5 sm:px-6">
                  <StatusBadge status={order.status} className="text-[9px]" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between border-t border-border px-5 py-3 text-[10px] text-muted sm:px-6">
        <span>Hiển thị 4 trên 128 đơn hàng</span>
        <button type="button" aria-label="Xem danh sách đơn hàng" className="flex h-7 w-7 items-center justify-center rounded-full border border-border text-rosewood transition hover:bg-petal">
          <Icon name="chevronRight" size={14} />
        </button>
      </div>
    </section>
  )
}
