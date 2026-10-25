import { Link, useLocation } from 'react-router-dom'

const moneyFormat = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
})

export default function ShopOrderResultPage() {
  const { state } = useLocation()
  const order = state?.order

  return (
    <section className="mx-auto max-w-3xl px-4 py-12 sm:px-7 sm:py-16">
      {order ? (
        <div className="rounded-3xl border border-[#EAE3DA] bg-white p-6 text-center shadow-[0_18px_60px_rgba(91,61,53,0.06)] sm:p-10">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#EEF2E8] text-2xl text-[#536B50]" aria-hidden="true">✓</span>
          <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#A97668]">Đã tiếp nhận</p>
          <h1 className="font-display mt-2 text-3xl font-medium text-[#4A302B]">Cảm ơn bạn đã đặt hàng</h1>
          <p className="mt-3 text-sm leading-6 text-[#806B65]">Đơn hàng đã được tạo thành công và đang chờ cửa hàng xử lý. Đây chưa phải xác nhận thanh toán.</p>
          <dl className="mx-auto mt-7 grid max-w-md gap-3 rounded-2xl bg-[#FCF9F3] p-5 text-left text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs text-[#806B65]">Mã đơn</dt>
              <dd className="mt-1 font-semibold text-[#4A302B]">{order.orderCode || `#${order.id}`}</dd>
            </div>
            <div>
              <dt className="text-xs text-[#806B65]">Ngày đặt</dt>
              <dd className="mt-1 font-medium text-[#4A302B]">{order.orderDate ? new Date(order.orderDate).toLocaleString('vi-VN') : '—'}</dd>
            </div>
            <div>
              <dt className="text-xs text-[#806B65]">Trạng thái đơn</dt>
              <dd className="mt-1 font-medium text-[#4A302B]">{order.status || 'Chờ xử lý'}</dd>
            </div>
            <div>
              <dt className="text-xs text-[#806B65]">Tổng cần thanh toán</dt>
              <dd className="mt-1 font-semibold text-[#76534D]">{moneyFormat.format(Number(order.finalAmount ?? 0))}</dd>
            </div>
          </dl>
          {order.deliveryAddress && (
            <p className="mt-4 text-left text-xs text-[#806B65]"><span className="font-semibold text-[#675650]">Địa chỉ nhận hàng:</span> {order.deliveryAddress}</p>
          )}
          {Array.isArray(order.items) && order.items.length > 0 && (
            <div className="mt-5 border-t border-[#EAE3DA] pt-4 text-left">
              <h2 className="font-display text-lg text-[#4A302B]">Sản phẩm</h2>
              <ul className="mt-3 space-y-2">
                {order.items.map((item) => (
                  <li key={item.id ?? `${item.productId}-${item.productName}`} className="flex justify-between gap-3 text-xs">
                    <span className="text-[#806B65]">{item.productName} × {item.quantity}</span>
                    <span className="whitespace-nowrap font-medium text-[#4A302B]">{moneyFormat.format(Number(item.lineTotal ?? 0))}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <Link to="/shop/orders" className="inline-flex h-11 items-center justify-center rounded-full bg-[#76534D] px-6 text-xs font-semibold text-white hover:bg-[#4A302B]">Xem đơn hàng của tôi</Link>
            <Link to="/shop/products" className="inline-flex h-11 items-center justify-center rounded-full border border-[#DDCDB8] px-6 text-xs font-semibold text-[#76534D] hover:bg-[#FCF9F3]">Tiếp tục mua sắm</Link>
          </div>
        </div>
      ) : (
        <div className="rounded-3xl border border-[#EAE3DA] bg-white p-7 text-center sm:p-10">
          <h1 className="font-display text-2xl text-[#4A302B]">Không có thông tin kết quả trong phiên này</h1>
          <p className="mt-3 text-sm leading-6 text-[#806B65]">Để tránh tạo đơn lần nữa khi tải lại trang, chúng tôi không tự gửi lại yêu cầu. Bạn có thể kiểm tra lịch sử đơn hàng.</p>
          <Link to="/shop/orders" className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-[#76534D] px-6 text-xs font-semibold text-white">Mở lịch sử đơn hàng</Link>
        </div>
      )}
    </section>
  )
}
