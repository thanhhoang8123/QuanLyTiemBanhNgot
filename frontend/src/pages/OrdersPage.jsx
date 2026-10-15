import { useMemo, useState } from 'react'
import Button from '../components/Button.jsx'
import DataTable from '../components/DataTable.jsx'
import Icon from '../components/Icon.jsx'
import Modal from '../components/Modal.jsx'
import StatusBadge from '../components/StatusBadge.jsx'

const currency = new Intl.NumberFormat('vi-VN')
const orderStatuses = ['Chờ xác nhận', 'Đang chuẩn bị', 'Sẵn sàng', 'Hoàn tất', 'Đã hủy']
const paymentMethods = ['Tất cả phương thức', 'Tiền mặt', 'Chuyển khoản']
const today = '2026-10-15'

function toIsoDate(date) {
  const [day, month, year] = date.split('/')
  return `${year}-${month}-${day}`
}

export default function OrdersPage({ onToast, orders, onOrdersChange, onResetOrders }) {
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('Tất cả trạng thái')
  const [paymentFilter, setPaymentFilter] = useState('Tất cả phương thức')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [selected, setSelected] = useState(null)
  const [nextStatus, setNextStatus] = useState('')

  const filteredOrders = useMemo(() => orders.filter((order) => {
    const matchesQuery = `${order.id} ${order.customer}`.toLocaleLowerCase('vi').includes(query.trim().toLocaleLowerCase('vi'))
    const orderDate = toIsoDate(order.date)
    return matchesQuery
      && (statusFilter === 'Tất cả trạng thái' || order.status === statusFilter)
      && (paymentFilter === 'Tất cả phương thức' || order.paymentMethod === paymentFilter)
      && (!dateFrom || orderDate >= dateFrom)
      && (!dateTo || orderDate <= dateTo)
  }), [orders, query, statusFilter, paymentFilter, dateFrom, dateTo])

  const openDetails = (order) => {
    setSelected(order)
    setNextStatus(order.status)
  }

  const updateOrderStatus = (event) => {
    event.preventDefault()
    if (!selected || !orderStatuses.includes(nextStatus)) return
    onOrdersChange((current) => current.map((order) => order.id === selected.id ? { ...order, status: nextStatus } : order))
    setSelected((current) => ({ ...current, status: nextStatus }))
    onToast(`Đã cập nhật trạng thái đơn ${selected.id}.`)
  }

  const columns = [
    {
      key: 'id',
      label: 'Mã đơn',
      render: (order) => <span className="whitespace-nowrap font-bold text-rosewood">{order.id}</span>,
    },
    {
      key: 'customer',
      label: 'Khách hàng',
      render: (order) => (
        <div className="min-w-[145px]">
          <p className="font-semibold text-rosewood">{order.customer}</p>
          <p className="mt-1 text-[10px] text-muted">{order.phone}</p>
        </div>
      ),
    },
    {
      key: 'datetime',
      label: 'Thời gian',
      render: (order) => <span className="whitespace-nowrap">{order.time} · {order.date}</span>,
    },
    {
      key: 'items',
      label: 'Số món',
      render: (order) => <span className="whitespace-nowrap">{order.items.reduce((count, item) => count + item.quantity, 0)} món</span>,
    },
    {
      key: 'total',
      label: 'Tổng tiền',
      render: (order) => <span className="whitespace-nowrap font-bold text-rosewood">{currency.format(order.total)}đ</span>,
    },
    {
      key: 'payment',
      label: 'Thanh toán',
      render: (order) => (
        <div className="space-y-1">
          <p className="whitespace-nowrap text-[10px]">{order.paymentMethod}</p>
          <StatusBadge status={order.paymentStatus} />
        </div>
      ),
    },
    { key: 'status', label: 'Trạng thái đơn', render: (order) => <StatusBadge status={order.status} /> },
    {
      key: 'details',
      label: '',
      headerClassName: 'text-right',
      cellClassName: 'text-right',
      render: (order) => (
        <button
          type="button"
          aria-label={`Xem chi tiết ${order.id}`}
          onClick={(event) => { event.stopPropagation(); openDetails(order) }}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-rosewood transition hover:bg-petal"
        >
          <Icon name="chevronRight" size={15} />
        </button>
      ),
    },
  ]

  const todayOrders = orders.filter((order) => toIsoDate(order.date) === today)
  const activeOrders = todayOrders.filter((order) => ['Chờ xác nhận', 'Đang chuẩn bị', 'Sẵn sàng'].includes(order.status))
  const completedOrders = todayOrders.filter((order) => order.status === 'Hoàn tất')
  const revenue = todayOrders.filter((order) => order.status !== 'Đã hủy').reduce((sum, order) => sum + order.total, 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-[11px] font-semibold tracking-wide text-muted">Theo dõi bán hàng</p>
          <h2 className="font-display mt-1 text-[28px] text-rosewood sm:text-[32px]">Đơn hàng</h2>
          <p className="mt-1 text-xs text-muted">Tra cứu đơn, theo dõi thanh toán và cập nhật tiến độ.</p>
        </div>
        <Button variant="secondary" onClick={() => {
          onResetOrders()
          setQuery('')
          setStatusFilter('Tất cả trạng thái')
          setPaymentFilter('Tất cả phương thức')
          setDateFrom('')
          setDateTo('')
          onToast('Đã khôi phục danh sách đơn hàng mẫu.')
        }}>
          <Icon name="receipt" size={16} /> Đặt lại dữ liệu mẫu
        </Button>
      </div>

      <section aria-label="Tổng quan đơn hàng hôm nay" className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 2xl:grid-cols-4">
        {[
          { label: 'Đơn trong ngày', value: todayOrders.length, icon: 'receipt' },
          { label: 'Đang xử lý', value: activeOrders.length, icon: 'clock' },
          { label: 'Hoàn tất', value: completedOrders.length, icon: 'check' },
          { label: 'Doanh thu đơn hợp lệ', value: `${currency.format(revenue)}đ`, icon: 'trending-up' },
        ].map((stat) => (
          <article key={stat.label} className="soft-shadow flex items-center justify-between rounded-2xl border border-border bg-paper p-4 sm:p-5">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-muted">{stat.label}</p>
              <p className={`font-display mt-2 truncate font-semibold text-rosewood ${stat.label.startsWith('Doanh thu') ? 'text-lg sm:text-xl' : 'text-2xl'}`}>{stat.value}</p>
            </div>
            <span className="ml-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-caramel-soft text-rosewood"><Icon name={stat.icon} size={18} /></span>
          </article>
        ))}
      </section>

      <section className="soft-shadow overflow-hidden rounded-2xl border border-border bg-paper">
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:p-5">
          <div>
            <h3 className="font-display text-lg font-semibold text-rosewood">Danh sách đơn hàng</h3>
            <p className="mt-1 text-[11px] text-muted">{filteredOrders.length} trên {orders.length} đơn hàng mẫu</p>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-[minmax(190px,1.3fr)_minmax(150px,1fr)_minmax(160px,1fr)_minmax(145px,1fr)_minmax(145px,1fr)]">
            <label className="relative">
              <span className="sr-only">Tìm mã đơn hoặc khách hàng</span>
              <Icon name="search" size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-rosewood" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Mã đơn hoặc khách hàng..." className="h-10 w-full rounded-xl border border-border bg-white pl-9 pr-3 text-[11px] text-rosewood outline-none focus:border-caramel-hover" />
            </label>
            <select aria-label="Lọc trạng thái đơn hàng" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-10 rounded-xl border border-border bg-white px-3 text-[11px] text-rosewood outline-none focus:border-caramel-hover">
              <option>Tất cả trạng thái</option>
              {orderStatuses.map((status) => <option key={status}>{status}</option>)}
            </select>
            <select aria-label="Lọc phương thức thanh toán" value={paymentFilter} onChange={(event) => setPaymentFilter(event.target.value)} className="h-10 rounded-xl border border-border bg-white px-3 text-[11px] text-rosewood outline-none focus:border-caramel-hover">
              {paymentMethods.map((method) => <option key={method}>{method}</option>)}
            </select>
            <label className="flex items-center gap-2 rounded-xl border border-border bg-white px-3">
              <span className="whitespace-nowrap text-[10px] font-semibold text-rosewood">Từ</span>
              <input aria-label="Từ ngày" type="date" value={dateFrom} max={dateTo || undefined} onChange={(event) => setDateFrom(event.target.value)} className="min-w-0 flex-1 bg-transparent text-[10px] text-rosewood outline-none" />
            </label>
            <label className="flex items-center gap-2 rounded-xl border border-border bg-white px-3">
              <span className="whitespace-nowrap text-[10px] font-semibold text-rosewood">Đến</span>
              <input aria-label="Đến ngày" type="date" value={dateTo} min={dateFrom || undefined} onChange={(event) => setDateTo(event.target.value)} className="min-w-0 flex-1 bg-transparent text-[10px] text-rosewood outline-none" />
            </label>
          </div>
        </div>
        <DataTable
          columns={columns}
          rows={filteredOrders}
          rowKey={(order) => order.id}
          onRowClick={openDetails}
          emptyTitle="Không tìm thấy đơn hàng"
          emptyDescription="Thử thay đổi khoảng ngày, trạng thái hoặc từ khóa tìm kiếm."
        />
      </section>

      <Modal open={Boolean(selected)} title={selected ? `Chi tiết đơn ${selected.id}` : 'Chi tiết đơn'} onClose={() => setSelected(null)}>
        {selected && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-3 rounded-2xl border border-border bg-petal p-4 sm:grid-cols-2">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">Khách hàng</p>
                <p className="mt-1 text-xs font-bold text-rosewood">{selected.customer}</p>
                <p className="mt-1 text-[10px] text-rosewood">{selected.phone}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">Thời gian</p>
                <p className="mt-1 text-xs font-bold text-rosewood">{selected.date} · {selected.time}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">Thanh toán</p>
                <p className="mt-1 text-xs font-bold text-rosewood">{selected.paymentMethod}</p>
                <StatusBadge className="mt-1" status={selected.paymentStatus} />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">Trạng thái</p>
                <div className="mt-1"><StatusBadge status={selected.status} /></div>
              </div>
            </div>

            <div>
              <h3 className="font-display text-base font-semibold text-rosewood">Sản phẩm trong đơn</h3>
              <div className="mt-2 divide-y divide-border rounded-xl border border-border bg-white px-4">
                {selected.items.map((item) => (
                  <div key={item.name} className="flex items-center justify-between gap-3 py-3 text-[11px]">
                    <div>
                      <p className="font-semibold text-rosewood">{item.name}</p>
                      <p className="mt-1 text-[10px] text-muted">{item.quantity} × {currency.format(item.price)}đ</p>
                    </div>
                    <span className="whitespace-nowrap font-bold text-rosewood">{currency.format(item.quantity * item.price)}đ</span>
                  </div>
                ))}
                <div className="flex justify-between py-3 text-xs font-bold text-rosewood">
                  <span>Tổng thanh toán</span><span>{currency.format(selected.total)}đ</span>
                </div>
              </div>
            </div>

            {selected.note && (
              <div className="rounded-xl border border-border px-4 py-3">
                <p className="text-[10px] font-semibold text-rosewood">Ghi chú</p>
                <p className="mt-1 text-[11px] text-rosewood">{selected.note}</p>
              </div>
            )}

            <form onSubmit={updateOrderStatus} className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-end">
              <label className="flex-1">
                <span className="mb-1.5 block text-[11px] font-semibold text-rosewood">Cập nhật trạng thái đơn</span>
                <select value={nextStatus} onChange={(event) => setNextStatus(event.target.value)} className="h-10 w-full rounded-xl border border-border bg-white px-3 text-xs text-rosewood outline-none focus:border-caramel-hover">
                  {orderStatuses.map((status) => <option key={status}>{status}</option>)}
                </select>
              </label>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => onToast(`Đã mở bản xem trước hóa đơn ${selected.id} (mô phỏng).`)}>
                  <Icon name="receipt" size={15} /> Hóa đơn
                </Button>
                <Button type="submit"><Icon name="check" size={15} /> Cập nhật</Button>
              </div>
            </form>
            <p className="text-[10px] text-muted">Dữ liệu đơn và thao tác hóa đơn chỉ là mô phỏng trong trình duyệt.</p>
          </div>
        )}
      </Modal>
    </div>
  )
}
