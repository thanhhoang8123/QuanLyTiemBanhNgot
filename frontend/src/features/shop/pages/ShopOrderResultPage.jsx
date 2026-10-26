import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  getVnPayReturnTransactionReference,
  isVnPayReturn,
} from '../services/customerVnPayPayment.js'
import {
  getCustomerVnPayPaymentStatus,
  reconcileCustomerVnPayPayment,
} from '../services/customerOrderService.js'

const moneyFormat = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
})
const statusPollDelays = [1000, 2000, 4000]

function getOrderStatusLabel(status) {
  const labels = {
    PENDING: 'Đang xử lý',
    CONFIRMED: 'Đã xác nhận',
    PROCESSING: 'Đang chuẩn bị',
    PREPARING: 'Đang chuẩn bị',
    READY: 'Sẵn sàng nhận',
    COMPLETED: 'Hoàn tất',
    DELIVERED: 'Đã giao',
    CANCELLED: 'Đã hủy',
    CANCELED: 'Đã hủy',
  }
  return labels[status] || 'Đang cập nhật'
}

export default function ShopOrderResultPage() {
  const location = useLocation()
  const { state, search } = location
  const order = state?.order
  const hasVnPayReturn = isVnPayReturn(search)
  const transactionReference = getVnPayReturnTransactionReference(search)
  const [paymentStatus, setPaymentStatus] = useState(null)
  const [statusError, setStatusError] = useState('')
  const [statusLoading, setStatusLoading] = useState(false)
  const [reconciliationLoading, setReconciliationLoading] = useState(false)
  const [reconciliationMessage, setReconciliationMessage] = useState('')
  const [reconciliationError, setReconciliationError] = useState('')
  const [refreshVersion, setRefreshVersion] = useState(0)

  useEffect(() => {
    if (!hasVnPayReturn || !transactionReference) return undefined

    const controller = new AbortController()
    let timerId
    let pollCount = 0
    let active = true

    const loadStatus = async () => {
      setStatusLoading(true)
      setStatusError('')
      try {
        const result = await getCustomerVnPayPaymentStatus(
          transactionReference,
          { signal: controller.signal },
        )
        if (!active) return
        setPaymentStatus(result)
        const terminal = result?.paymentStatus === 'SUCCESS'
          || result?.paymentStatus === 'FAILED'
          || result?.attemptStatus === 'RECONCILIATION_REQUIRED'
        if (!terminal && pollCount < statusPollDelays.length) {
          const delay = statusPollDelays[pollCount]
          pollCount += 1
          timerId = window.setTimeout(loadStatus, delay)
        }
      } catch (error) {
        if (!active || error.name === 'AbortError') return
        if (error.status === 401) {
          setStatusError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại để xem kết quả.')
        } else if (error.status === 404) {
          setStatusError('Không tìm thấy giao dịch. Vui lòng kiểm tra lịch sử đơn hàng.')
        } else {
          setStatusError('Chưa thể kiểm tra thanh toán lúc này. Vui lòng thử lại sau.')
        }
      } finally {
        if (active) setStatusLoading(false)
      }
    }

    loadStatus()
    return () => {
      active = false
      controller.abort()
      window.clearTimeout(timerId)
    }
  }, [hasVnPayReturn, refreshVersion, transactionReference])

  const verifiedSuccess = paymentStatus?.paymentStatus === 'SUCCESS'
    && paymentStatus?.attemptStatus === 'SUCCESS'
  const verifiedFailure = paymentStatus?.paymentStatus === 'FAILED'
    && paymentStatus?.attemptStatus === 'FAILED'
  const reconciliationRequired = paymentStatus?.attemptStatus === 'RECONCILIATION_REQUIRED'

  const reconcilePayment = async () => {
    if (!transactionReference || reconciliationLoading) return

    setReconciliationLoading(true)
    setReconciliationMessage('')
    setReconciliationError('')
    try {
      const result = await reconcileCustomerVnPayPayment(transactionReference)
      if (result?.payment) setPaymentStatus(result.payment)
      setReconciliationMessage(
        result?.message || 'Đã kiểm tra giao dịch với VNPay.',
      )
    } catch (error) {
      if (error.status === 401) {
        setReconciliationError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.')
      } else if (error.status === 403) {
        setReconciliationError('Bạn chưa thể kiểm tra giao dịch này. Vui lòng liên hệ cửa hàng.')
      } else if (error.status === 404) {
        setReconciliationError('Không tìm thấy giao dịch. Vui lòng kiểm tra lịch sử đơn hàng.')
      } else {
        setReconciliationError('Chưa thể kiểm tra giao dịch lúc này. Trạng thái đơn chưa thay đổi; vui lòng thử lại sau.')
      }
    } finally {
      setReconciliationLoading(false)
    }
  }

  return (
    <section className="mx-auto max-w-3xl px-4 py-12 sm:px-7 sm:py-16">
      {hasVnPayReturn ? (
        <div role="status" className="rounded-3xl border border-[#EAE3DA] bg-white p-7 text-center shadow-[0_18px_60px_rgba(91,61,53,0.06)] sm:p-10">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#A97668]">VNPay Sandbox</p>
          <h1 className="font-display mt-2 text-3xl font-medium text-[#4A302B]">
            {verifiedSuccess
              ? 'Thanh toán thành công'
              : verifiedFailure
                ? 'Thanh toán chưa thành công'
                : reconciliationRequired
                  ? 'Giao dịch cần được đối soát'
                  : 'Đang xác minh thanh toán'}
          </h1>
          <p className="mt-3 text-sm leading-6 text-[#806B65]">
            {verifiedSuccess
                ? 'Thanh toán đã được xác nhận. Cảm ơn bạn đã đặt hàng.'
              : verifiedFailure
                  ? 'Giao dịch chưa thành công. Vui lòng kiểm tra đơn hàng trước khi thanh toán lại.'
                : reconciliationRequired
                  ? 'Giao dịch đang được cửa hàng kiểm tra. Đơn hàng chưa được xác nhận thanh toán.'
                      : 'Đang kiểm tra kết quả thanh toán. Vui lòng không thanh toán lại trong lúc này.'}
          </p>
          {paymentStatus && (
            <dl className="mx-auto mt-5 grid max-w-md gap-2 rounded-2xl bg-[#FCF9F3] p-4 text-left text-xs text-[#675650]">
              <div className="flex justify-between gap-3"><dt>Mã đơn</dt><dd className="font-semibold">#{paymentStatus.orderId}</dd></div>
              <div className="flex justify-between gap-3"><dt>Đơn hàng</dt><dd className="font-semibold">{getOrderStatusLabel(paymentStatus.orderStatus)}</dd></div>
              <div className="flex justify-between gap-3"><dt>Thanh toán</dt><dd className="font-semibold">{paymentStatus.paymentStatus === 'SUCCESS' ? 'Đã thanh toán' : paymentStatus.paymentStatus === 'FAILED' ? 'Chưa thành công' : 'Đang xử lý'}</dd></div>
              {paymentStatus.paidAt && <div className="flex justify-between gap-3"><dt>Thời điểm thanh toán</dt><dd>{new Date(paymentStatus.paidAt).toLocaleString('vi-VN')}</dd></div>}
            </dl>
          )}
          {statusError && (
            <p role="alert" className="mt-4 text-xs leading-5 text-[#914E46]">
              {statusError}
              {statusError.includes('Phiên đăng nhập') && (
                <> <Link to="/shop/login" state={{ from: location }} className="font-semibold underline">Đăng nhập lại</Link>.</>
              )}
            </p>
          )}
          {reconciliationMessage && (
            <p role="status" className="mt-4 text-xs leading-5 text-[#536B50]">
              {reconciliationMessage}
            </p>
          )}
          {reconciliationError && (
            <p role="alert" className="mt-4 text-xs leading-5 text-[#914E46]">
              {reconciliationError}
            </p>
          )}
          {transactionReference && (
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={() => setRefreshVersion((version) => version + 1)}
                disabled={statusLoading || reconciliationLoading}
                className="inline-flex h-10 items-center justify-center rounded-full border border-[#DDCDB8] px-5 text-xs font-semibold text-[#76534D] disabled:opacity-50"
              >
                {statusLoading ? 'Đang kiểm tra...' : 'Cập nhật trạng thái'}
              </button>
              {!verifiedSuccess && !verifiedFailure && !reconciliationRequired && (
                <button
                  type="button"
                  onClick={reconcilePayment}
                  disabled={statusLoading || reconciliationLoading}
                  className="inline-flex h-10 items-center justify-center rounded-full bg-[#76534D] px-5 text-xs font-semibold text-white hover:bg-[#4A302B] disabled:opacity-50"
                >
                  {reconciliationLoading ? 'Đang kiểm tra...' : 'Kiểm tra thanh toán'}
                </button>
              )}
            </div>
          )}
          <Link to="/shop/orders" className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-[#76534D] px-6 text-xs font-semibold text-white hover:bg-[#4A302B]">Xem đơn hàng</Link>
        </div>
      ) : order ? (
        <div className="rounded-3xl border border-[#EAE3DA] bg-white p-6 text-center shadow-[0_18px_60px_rgba(91,61,53,0.06)] sm:p-10">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#EEF2E8] text-2xl text-[#536B50]" aria-hidden="true">✓</span>
          <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#A97668]">Đã tiếp nhận</p>
          <h1 className="font-display mt-2 text-3xl font-medium text-[#4A302B]">Cảm ơn bạn đã đặt hàng</h1>
          <p className="mt-3 text-sm leading-6 text-[#806B65]">Đơn hàng của bạn đã được gửi đến cửa hàng.</p>
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
          <h1 className="font-display text-2xl text-[#4A302B]">Không tìm thấy kết quả đơn hàng</h1>
          <p className="mt-3 text-sm leading-6 text-[#806B65]">Vui lòng xem lịch sử đơn hàng để kiểm tra.</p>
          <Link to="/shop/orders" className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-[#76534D] px-6 text-xs font-semibold text-white">Xem đơn hàng</Link>
        </div>
      )}
    </section>
  )
}
