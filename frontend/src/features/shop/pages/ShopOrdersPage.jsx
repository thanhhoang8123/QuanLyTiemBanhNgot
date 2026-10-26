import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getCustomerOrders } from '../services/customerOrderService.js'

const moneyFormat = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
})

export default function ShopOrdersPage() {
  const [orders, setOrders] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [reloadVersion, setReloadVersion] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    setIsLoading(true)
    setError('')
    getCustomerOrders({ signal: controller.signal })
      .then((result) => {
        if (!Array.isArray(result)) throw new Error('API đơn hàng trả về dữ liệu không hợp lệ.')
        setOrders(result)
      })
      .catch((loadError) => {
        if (loadError.name !== 'AbortError') setError(loadError.message)
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false)
      })
    return () => controller.abort()
  }, [reloadVersion])

  return (
    <section className="mx-auto max-w-5xl px-4 py-8 sm:px-7 sm:py-12 lg:px-10">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#A97668]">Tài khoản khách hàng</p>
      <h1 className="font-display mt-2 text-3xl font-medium text-[#4A302B] sm:text-4xl">Đơn hàng của tôi</h1>
      {isLoading ? (
        <p role="status" className="mt-7 rounded-2xl bg-white px-5 py-14 text-center text-sm text-[#806B65]">Đang tải đơn hàng...</p>
      ) : error ? (
        <div role="alert" className="mt-7 rounded-2xl border border-[#E2C5BF] bg-white px-5 py-8 text-center text-sm text-[#914E46]">
          <p>{error}</p>
          <button type="button" onClick={() => setReloadVersion((version) => version + 1)} className="mt-4 rounded-full bg-[#76534D] px-5 py-2.5 text-xs font-semibold text-white">Thử lại</button>
        </div>
      ) : orders.length === 0 ? (
        <div className="mt-7 rounded-2xl border border-dashed border-[#DDCDB8] bg-white px-5 py-14 text-center">
          <h2 className="font-display text-xl text-[#4A302B]">Bạn chưa có đơn hàng</h2>
          <p className="mt-2 text-sm text-[#806B65]">Đơn hàng mới sẽ xuất hiện tại đây sau khi được tạo.</p>
          <Link to="/shop/products" className="mt-5 inline-flex rounded-full bg-[#76534D] px-5 py-3 text-xs font-semibold text-white">Khám phá sản phẩm</Link>
        </div>
      ) : (
        <div className="mt-7 space-y-3">
          {orders.map((order) => (
            <article key={order.id} className="flex flex-col gap-4 rounded-2xl border border-[#EAE3DA] bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[#A97668]">Mã đơn</p>
                <h2 className="font-display mt-1 text-lg text-[#4A302B]">{order.orderCode || `#${order.id}`}</h2>
                <p className="mt-1 text-xs text-[#806B65]">{order.orderDate ? new Date(order.orderDate).toLocaleString('vi-VN') : 'Ngày đặt chưa có'}</p>
              </div>
              <div className="flex items-center justify-between gap-5 sm:justify-end">
                <div className="text-left sm:text-right">
                  <p className="text-xs text-[#806B65]">Trạng thái: <span className="font-semibold text-[#4A302B]">{order.status || '—'}</span></p>
                  <p className="mt-1 text-sm font-bold text-[#76534D]">{moneyFormat.format(Number(order.finalAmount ?? 0))}</p>
                </div>
                <Link to={`/shop/orders/${encodeURIComponent(order.id)}`} className="inline-flex h-10 items-center rounded-full border border-[#DDCDB8] px-4 text-xs font-semibold text-[#76534D] hover:bg-[#FCF9F3]">Chi tiết</Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
