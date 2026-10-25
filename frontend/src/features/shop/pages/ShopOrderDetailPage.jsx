import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getCustomerOrderById } from '../services/customerOrderService.js'

const moneyFormat = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
})

export default function ShopOrderDetailPage() {
  const { orderId } = useParams()
  const [order, setOrder] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [reloadVersion, setReloadVersion] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    setIsLoading(true)
    setError('')
    getCustomerOrderById(orderId, { signal: controller.signal })
      .then((result) => setOrder(result))
      .catch((loadError) => {
        if (loadError.name !== 'AbortError') setError(loadError.message)
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false)
      })
    return () => controller.abort()
  }, [orderId, reloadVersion])

  return (
    <section className="mx-auto max-w-4xl px-4 py-8 sm:px-7 sm:py-12 lg:px-10">
      <Link to="/shop/orders" className="text-xs font-semibold text-[#76534D] hover:text-[#4A302B]">← Quay lại đơn hàng</Link>
      <h1 className="font-display mt-4 text-3xl font-medium text-[#4A302B]">Chi tiết đơn hàng</h1>
      {isLoading ? (
        <p role="status" className="mt-6 rounded-2xl bg-white px-5 py-14 text-center text-sm text-[#806B65]">Đang tải chi tiết đơn...</p>
      ) : error ? (
        <div role="alert" className="mt-6 rounded-2xl border border-[#E2C5BF] bg-white px-5 py-8 text-center text-sm text-[#914E46]">
          <p>{error}</p>
          <p className="mt-2 text-xs text-[#806B65]">Đơn không tồn tại hoặc bạn không có quyền truy cập.</p>
          <button type="button" onClick={() => setReloadVersion((version) => version + 1)} className="mt-4 rounded-full bg-[#76534D] px-5 py-2.5 text-xs font-semibold text-white">Thử lại</button>
        </div>
      ) : order ? (
        <article className="mt-6 rounded-2xl border border-[#EAE3DA] bg-white p-5 sm:p-7">
          <div className="flex flex-col justify-between gap-3 border-b border-[#EAE3DA] pb-5 sm:flex-row">
            <div>
              <p className="text-xs text-[#806B65]">Mã đơn</p>
              <h2 className="font-display mt-1 text-xl text-[#4A302B]">{order.orderCode || `#${order.id}`}</h2>
              <p className="mt-1 text-xs text-[#806B65]">{order.orderDate ? new Date(order.orderDate).toLocaleString('vi-VN') : 'Ngày đặt chưa có'}</p>
            </div>
            <div className="sm:text-right">
              <p className="text-xs text-[#806B65]">Trạng thái đơn</p>
              <p className="mt-1 font-semibold text-[#76534D]">{order.status || '—'}</p>
            </div>
          </div>
          <div className="mt-5">
            <h3 className="font-display text-lg text-[#4A302B]">Sản phẩm</h3>
            {Array.isArray(order.items) && order.items.length > 0 ? (
              <ul className="mt-3 divide-y divide-[#EAE3DA]">
                {order.items.map((item) => (
                  <li key={item.id ?? `${item.productId}-${item.productName}`} className="flex flex-col justify-between gap-1 py-3 text-sm sm:flex-row sm:items-center">
                    <span className="text-[#675650]">{item.productName} <span className="text-xs text-[#806B65]">× {item.quantity}</span></span>
                    <span className="text-xs font-semibold text-[#76534D]">{moneyFormat.format(Number(item.lineTotal ?? 0))}</span>
                  </li>
                ))}
              </ul>
            ) : <p className="mt-3 text-sm text-[#806B65]">Đơn hàng không có thông tin dòng sản phẩm.</p>}
          </div>
          <dl className="mt-4 space-y-2 border-t border-[#EAE3DA] pt-4 text-sm">
            <div className="flex justify-between gap-3"><dt className="text-[#806B65]">Tạm tính</dt><dd>{moneyFormat.format(Number(order.totalAmount ?? 0))}</dd></div>
            <div className="flex justify-between gap-3"><dt className="text-[#806B65]">Giảm giá</dt><dd>−{moneyFormat.format(Number(order.discountAmount ?? 0))}</dd></div>
            <div className="flex justify-between gap-3 border-t border-[#EAE3DA] pt-3 font-bold text-[#76534D]"><dt>Cần thanh toán</dt><dd>{moneyFormat.format(Number(order.finalAmount ?? 0))}</dd></div>
          </dl>
          <p className="mt-5 text-xs leading-5 text-[#806B65]"><span className="font-semibold text-[#675650]">Địa chỉ nhận hàng:</span> {order.deliveryAddress || 'Nhận tại cửa hàng'}</p>
          {order.note && <p className="mt-2 text-xs leading-5 text-[#806B65]"><span className="font-semibold text-[#675650]">Ghi chú:</span> {order.note}</p>}
          <p className="mt-4 rounded-xl bg-[#FCF9F3] p-3 text-xs leading-5 text-[#806B65]">Trạng thái đơn hàng không đồng nghĩa với đã thanh toán. Thông tin thanh toán được cập nhật riêng bởi hệ thống.</p>
        </article>
      ) : null}
    </section>
  )
}
