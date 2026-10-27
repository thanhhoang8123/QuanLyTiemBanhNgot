import { useContext, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthContext } from '../../auth/AuthContext.js'
import { toProductViewModel } from '../../products/adapters/productAdapter.js'
import { getProducts } from '../../products/services/productService.js'
import Pagination, { usePagination } from '../../../components/Pagination.jsx'
import { useShopCart } from '../ShopCartContext.jsx'
import { getUserFacingErrorMessage } from '../../../services/apiClient.js'
import {
  cartMatchesCustomerOrder,
  clearCustomerOrderAttempt,
  createCustomerOrderAttempt,
  createCustomerOrderRequestKey,
  readCustomerOrderAttempt,
  saveCustomerOrderAttempt,
  updateCustomerOrderAttempt,
} from '../services/customerOrderAttempt.js'
import {
  getVnPayInitiationErrorMessage,
  requireVnPayPaymentUrl,
} from '../services/customerVnPayPayment.js'
import { resolveCustomerOrderAttempt } from '../services/customerOrderRecovery.js'
import {
  createCustomerOrder,
  createCustomerVnPayPayment,
  getCustomerOrderByRequestKey,
  getCustomerVnPayPaymentStatusByOrderId,
  quoteCustomerOrder,
} from '../services/customerOrderService.js'
import { normalizeVietnamesePhone } from '../services/vietnamesePhone.js'

const moneyFormat = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
})
const paymentStatusLabels = {
  PENDING: 'Đang chờ xác nhận',
  SUCCESS: 'Đã xác nhận',
  FAILED: 'Chưa thành công',
}
const orderStatusLabels = {
  PENDING: 'Chờ xác nhận',
  CONFIRMED: 'Đã xác nhận',
  COMPLETED: 'Hoàn tất',
  CANCELLED: 'Đã hủy',
}

export default function ShopCheckoutPage() {
  const cart = useShopCart()
  const cartPagination = usePagination(cart.items)
  const navigate = useNavigate()
  const account = useContext(AuthContext)?.account
  const owner = account?.id == null ? null : String(account.id)
  const submitLock = useRef(false)
  const paymentRetryLock = useRef(false)
  const [attemptState, setAttemptState] = useState(
    () => readCustomerOrderAttempt(window.sessionStorage, owner),
  )
  const pendingAttempt = attemptState.status === 'pending' ? attemptState.attempt : null
  const [deliveryAddress, setDeliveryAddress] = useState(
    () => pendingAttempt?.payload.deliveryAddress || '',
  )
  const [phone, setPhone] = useState(() => pendingAttempt?.payload.phone || '')
  const [paymentMethod, setPaymentMethod] = useState(
    () => pendingAttempt?.paymentMethod || 'CASH',
  )
  const [promotionCode, setPromotionCode] = useState(
    () => pendingAttempt?.payload.promotionCode || '',
  )
  const [note, setNote] = useState(() => pendingAttempt?.payload.note || '')
  const [products, setProducts] = useState([])
  const [catalogLoading, setCatalogLoading] = useState(true)
  const [catalogError, setCatalogError] = useState('')
  const [quote, setQuote] = useState(null)
  const [quoteLoading, setQuoteLoading] = useState(false)
  const [quoteError, setQuoteError] = useState('')
  const [quoteVersion, setQuoteVersion] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [isCheckingPaymentStatus, setIsCheckingPaymentStatus] = useState(false)
  const [isRetryingPayment, setIsRetryingPayment] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState(null)
  const [paymentStatusError, setPaymentStatusError] = useState('')

  useEffect(() => {
    setAttemptState(readCustomerOrderAttempt(window.sessionStorage, owner))
  }, [owner])

  useEffect(() => {
    const controller = new AbortController()
    getProducts({ signal: controller.signal })
      .then((result) => {
        if (!Array.isArray(result)) throw new Error('Chưa thể tải danh sách sản phẩm. Vui lòng thử lại.')
        setProducts(result.map(toProductViewModel))
      })
      .catch((error) => {
        if (error.name !== 'AbortError') {
          setCatalogError(getUserFacingErrorMessage(error, 'Chưa thể tải danh sách sản phẩm. Vui lòng thử lại.'))
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setCatalogLoading(false)
      })
    return () => controller.abort()
  }, [])

  const productById = useMemo(
    () => new Map(products.map((product) => [Number(product.id), product])),
    [products],
  )
  const items = useMemo(
    () => pendingAttempt
      ? pendingAttempt.payload.items
      : cart.items.map(({ productId, quantity }) => ({ productId, quantity })),
    [cart.items, pendingAttempt],
  )
  const invalidCart = !pendingAttempt && cart.items.some((item) => {
    const product = productById.get(item.productId)
    return !product || product.status !== 'Đang bán' || product.stock < item.quantity
  })
  const activePromotionCode = pendingAttempt
    ? pendingAttempt.payload.promotionCode || ''
    : promotionCode
  const payload = useMemo(() => pendingAttempt?.payload || ({
    items,
    phone: normalizeVietnamesePhone(phone),
    deliveryAddress: deliveryAddress.trim() || null,
    promotionCode: promotionCode.trim() || null,
    note: note.trim() || null,
  }), [deliveryAddress, items, note, pendingAttempt, phone, promotionCode])

  useEffect(() => {
    if (pendingAttempt || catalogLoading || catalogError || invalidCart || items.length === 0) {
      setQuote(null)
      setQuoteLoading(false)
      return undefined
    }

    const controller = new AbortController()
    const timeoutId = window.setTimeout(() => {
      quoteCustomerOrder({
        items,
        promotionCode: activePromotionCode.trim() || null,
      }, { signal: controller.signal })
        .then((result) => {
          const amounts = [result?.totalAmount, result?.discountAmount, result?.finalAmount]
          if (amounts.some((amount) => !Number.isFinite(Number(amount)))) {
            throw new Error('Chưa thể xác nhận báo giá. Vui lòng kiểm tra giỏ hàng và thử lại.')
          }
          setQuote(result)
        })
        .catch((error) => {
          if (!controller.signal.aborted && error.name !== 'AbortError') {
            setQuoteError(getUserFacingErrorMessage(error, 'Chưa thể xác nhận báo giá. Vui lòng thử lại.'))
          }
        })
        .finally(() => {
          if (!controller.signal.aborted) setQuoteLoading(false)
        })
    }, 250)
    setQuote(null)
    setQuoteError('')
    setQuoteLoading(true)
    return () => {
      window.clearTimeout(timeoutId)
      controller.abort()
    }
  }, [activePromotionCode, catalogError, catalogLoading, invalidCart, items, pendingAttempt, quoteVersion])

  const submitOrder = async (event) => {
    event?.preventDefault()
    if (submitLock.current || isSubmitting) return
    if (!owner) {
      setSubmitError('Không thể xác nhận tài khoản khách hàng hiện tại. Hãy đăng nhập lại.')
      return
    }
    if (!pendingAttempt && !normalizeVietnamesePhone(phone)) {
      setSubmitError('Vui lòng nhập số di động Việt Nam hợp lệ (10 số, đầu số 03, 05, 07, 08 hoặc 09).')
      return
    }
    if (!pendingAttempt) {
      if (cart.items.length === 0) {
        setSubmitError('Giỏ hàng đang trống.')
        return
      }
      if (invalidCart) {
        setSubmitError('Sản phẩm trong giỏ đã thay đổi hoặc không đủ tồn kho. Hãy quay lại cập nhật giỏ hàng.')
        return
      }
      if (!quote || quoteLoading || quoteError) {
        setSubmitError('Chưa thể xác nhận báo giá. Vui lòng tải lại báo giá rồi thử lại.')
        return
      }
    }

    submitLock.current = true
    setIsSubmitting(true)
    setSubmitError('')
    let order
    let activeAttempt = pendingAttempt
    const isNewAttempt = activeAttempt == null
    let vnpayInitiationStarted = false
    try {
      if (!activeAttempt) {
        activeAttempt = createCustomerOrderAttempt(
          owner,
          payload,
          createCustomerOrderRequestKey(),
          paymentMethod,
        )
        if (!saveCustomerOrderAttempt(window.sessionStorage, activeAttempt)) {
          setAttemptState({ status: 'unavailable' })
          setSubmitError('Chưa thể lưu yêu cầu đặt hàng trên thiết bị. Đơn chưa được gửi; vui lòng tải lại trang và thử lại.')
          return
        }
        setAttemptState({ status: 'pending', attempt: activeAttempt })
      }

      order = isNewAttempt
        ? await createCustomerOrder(activeAttempt.payload, activeAttempt.key)
        : await resolveCustomerOrderAttempt(activeAttempt, {
          findByRequestKey: getCustomerOrderByRequestKey,
          createOrder: createCustomerOrder,
        })
      if (cartMatchesCustomerOrder(cart.items, activeAttempt.payload.items)) cart.clear()

      if ((activeAttempt.paymentMethod || 'CASH') === 'VNPAY') {
        activeAttempt = {
          ...activeAttempt,
          orderId: Number(order.id),
          stage: 'PAYMENT_INITIATING',
        }
        if (!updateCustomerOrderAttempt(window.sessionStorage, activeAttempt)) {
          setAttemptState({ status: 'unavailable' })
          setSubmitError(
            'Đơn đã được tạo nhưng chưa thể lưu trạng thái thanh toán an toàn. Chưa gửi yêu cầu thanh toán; vui lòng kiểm tra đơn hàng trước khi tiếp tục.',
          )
          return
        }
        setAttemptState({ status: 'pending', attempt: activeAttempt })
        vnpayInitiationStarted = true
        const payment = await createCustomerVnPayPayment(order.id)
        const paymentUrl = requireVnPayPaymentUrl(payment)
        const redirectedAttempt = { ...activeAttempt, stage: 'PAYMENT_REDIRECTED' }
        if (updateCustomerOrderAttempt(window.sessionStorage, redirectedAttempt)) {
          setAttemptState({ status: 'pending', attempt: redirectedAttempt })
        }
        window.location.assign(paymentUrl)
        return
      }

      if (clearCustomerOrderAttempt(window.sessionStorage, activeAttempt.key)) {
        setAttemptState({ status: 'none' })
      } else {
        setAttemptState({ status: 'pending', attempt: activeAttempt })
        console.warn('Đơn đã được xác nhận nhưng chưa thể xóa yêu cầu đang chờ khỏi phiên trình duyệt.')
      }
      navigate('/shop/order-result', { replace: true, state: { order } })
    } catch (error) {
      if (vnpayInitiationStarted && activeAttempt && order) {
        const uncertainAttempt = {
          ...activeAttempt,
          orderId: Number(order.id),
          stage: 'PAYMENT_UNCERTAIN',
        }
        if (updateCustomerOrderAttempt(window.sessionStorage, uncertainAttempt)) {
          setAttemptState({ status: 'pending', attempt: uncertainAttempt })
        }
        setSubmitError(getVnPayInitiationErrorMessage(error))
      } else {
        if (error.status === 401 || error.status === 403) {
          setSubmitError(
            `Không thể tiếp tục với phiên đăng nhập hiện tại. Đơn hàng vẫn được giữ; vui lòng đăng nhập lại rồi kiểm tra đơn hàng. ${getUserFacingErrorMessage(error)}`.trim(),
          )
        } else if (error.status === 409) {
          setSubmitError(
            `Đơn hàng đã được gửi trước đó. Để tránh tạo đơn trùng, vui lòng kiểm tra lịch sử đơn hàng. ${getUserFacingErrorMessage(error)}`.trim(),
          )
        } else {
          setSubmitError(
            `Chưa xác định được kết quả đơn hàng. Vui lòng kiểm tra lịch sử đơn hàng trước khi thử lại. ${getUserFacingErrorMessage(error)}`.trim(),
          )
        }
      }
    } finally {
      submitLock.current = false
      setIsSubmitting(false)
    }
  }

  const checkVnPayStatus = async () => {
    if (!pendingAttempt?.orderId || isCheckingPaymentStatus) return

    setIsCheckingPaymentStatus(true)
    setSubmitError('')
    setPaymentStatusError('')
    try {
      const result = await getCustomerVnPayPaymentStatusByOrderId(pendingAttempt.orderId)
      setPaymentStatus(result)
      if (result?.paymentStatus === 'SUCCESS' && result?.attemptStatus === 'SUCCESS') {
        if (clearCustomerOrderAttempt(window.sessionStorage, pendingAttempt.key)) {
          setAttemptState({ status: 'none' })
        } else {
          setPaymentStatusError('Thanh toán đã được xác nhận nhưng chưa thể cập nhật trạng thái trên thiết bị. Vui lòng kiểm tra lịch sử đơn hàng và không thanh toán lại.')
        }
      }
    } catch (error) {
      setPaymentStatus(null)
      if (error.status === 401) {
        setPaymentStatusError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.')
      } else if (error.status === 403) {
        setPaymentStatusError('Bạn chưa thể xem giao dịch này. Vui lòng liên hệ cửa hàng.')
      } else if (error.status === 404) {
        setPaymentStatusError('Chưa tìm thấy thông tin giao dịch của đơn này. Kết quả lần thanh toán trước chưa được xác định; vui lòng kiểm tra lại sau hoặc liên hệ cửa hàng. Không gửi lại yêu cầu thanh toán lúc này.')
      } else {
        setPaymentStatusError(getUserFacingErrorMessage(
          error,
          'Chưa thể tra cứu trạng thái thanh toán. Không gửi lại yêu cầu thanh toán.',
        ))
      }
    } finally {
      setIsCheckingPaymentStatus(false)
    }
  }

  const retryVnPayForExistingOrder = async () => {
    if (
      paymentRetryLock.current
      || !pendingAttempt?.orderId
      || paymentStatus?.paymentStatus !== 'FAILED'
      || paymentStatus?.attemptStatus !== 'FAILED'
    ) return

    paymentRetryLock.current = true
    setIsRetryingPayment(true)
    setPaymentStatus(null)
    setPaymentStatusError('')
    try {
      const payment = await createCustomerVnPayPayment(pendingAttempt.orderId)
      const paymentUrl = requireVnPayPaymentUrl(payment)
      const redirectedAttempt = {
        ...pendingAttempt,
        stage: 'PAYMENT_REDIRECTED',
      }
      if (updateCustomerOrderAttempt(window.sessionStorage, redirectedAttempt)) {
        setAttemptState({ status: 'pending', attempt: redirectedAttempt })
      }
      window.location.assign(paymentUrl)
    } catch (error) {
      setPaymentStatusError(
        `${getVnPayInitiationErrorMessage(error)} Hãy kiểm tra trạng thái đơn trước khi thử lại.`,
      )
    } finally {
      paymentRetryLock.current = false
      setIsRetryingPayment(false)
    }
  }

  if (attemptState.status === 'owner-mismatch') {
    return (
      <section className="mx-auto max-w-3xl px-4 py-12 sm:px-7">
        <div role="alert" className="rounded-2xl border border-[#E2C5BF] bg-white p-6 text-sm leading-6 text-[#914E46]">
          Có đơn hàng chưa hoàn tất trên trình duyệt này. Vui lòng đăng nhập tài khoản đã dùng để đặt đơn và kiểm tra trạng thái trước khi tạo đơn mới.
        </div>
      </section>
    )
  }

  if (attemptState.status === 'invalid' || attemptState.status === 'unavailable') {
    return (
      <section className="mx-auto max-w-3xl px-4 py-12 sm:px-7">
        <div role="alert" className="rounded-2xl border border-[#E2C5BF] bg-white p-6 text-sm leading-6 text-[#914E46]">
          {attemptState.status === 'invalid'
            ? 'Không thể xác nhận yêu cầu đặt hàng đã lưu. Để tránh tạo đơn trùng, vui lòng kiểm tra lịch sử đơn hàng trước khi đặt lại.'
            : 'Chưa thể lưu yêu cầu đặt hàng trên thiết bị. Để tránh tạo đơn trùng, vui lòng thử lại sau hoặc dùng trình duyệt khác.'}
        </div>
      </section>
    )
  }

  if (pendingAttempt) {
    const isVnPayAttempt = (pendingAttempt.paymentMethod || 'CASH') === 'VNPAY'
    const paymentInitiationUncertain = isVnPayAttempt
      && pendingAttempt.stage !== 'ORDER_PENDING'
    return (
      <section className="mx-auto max-w-3xl px-4 py-12 sm:px-7">
        <div className="rounded-3xl border border-[#EAE3DA] bg-white p-6 shadow-[0_18px_60px_rgba(91,61,53,0.06)] sm:p-9">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#A97668]">Đơn hàng cần được xác nhận</p>
          <h1 className="font-display mt-2 text-2xl font-medium text-[#4A302B]">Chưa rõ lần gửi trước đã hoàn tất chưa</h1>
          <p className="mt-3 text-sm leading-6 text-[#806B65]">
            {paymentInitiationUncertain
              ? 'Đơn hàng đã được tạo và yêu cầu thanh toán đã bắt đầu. Vui lòng kiểm tra trạng thái đơn; không gửi lại yêu cầu thanh toán khi kết quả lần trước chưa rõ.'
              : 'Chọn nút bên dưới để kiểm tra kết quả. Nếu đơn chưa được tạo, yêu cầu sẽ được gửi lại an toàn để tránh tạo đơn trùng.'}
          </p>
          {isVnPayAttempt && pendingAttempt.orderId && (
            <p className="mt-3 rounded-xl bg-[#FCF9F3] p-3 text-xs text-[#675650]">
              Mã đơn: #{pendingAttempt.orderId}
            </p>
          )}
          {paymentInitiationUncertain && (
            <>
              <button
                type="button"
                onClick={checkVnPayStatus}
                disabled={isCheckingPaymentStatus}
                className="mt-5 flex h-11 w-full items-center justify-center rounded-full border border-[#DDCDB8] px-5 text-xs font-semibold text-[#76534D] hover:bg-[#FCF9F3] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isCheckingPaymentStatus ? 'Đang kiểm tra...' : 'Kiểm tra trạng thái thanh toán'}
              </button>
              {paymentStatus && (
                <p role="status" className="mt-3 rounded-xl bg-[#FCF9F3] p-3 text-xs leading-5 text-[#675650]">
                  Thanh toán: {paymentStatusLabels[paymentStatus.paymentStatus] ?? 'Đang cập nhật'} · Đơn hàng: {orderStatusLabels[paymentStatus.orderStatus] ?? 'Đang cập nhật'}.
                  {paymentStatus.paymentStatus === 'SUCCESS' && paymentStatus.attemptStatus === 'SUCCESS'
                    ? ' Giao dịch đã được xác nhận.'
                    : ' Chưa có xác nhận thanh toán thành công.'}
                </p>
              )}
              {paymentStatus?.paymentStatus === 'FAILED'
                && paymentStatus?.attemptStatus === 'FAILED' && (
                  <button
                    type="button"
                    onClick={retryVnPayForExistingOrder}
                    disabled={isRetryingPayment}
                    className="mt-3 flex h-11 w-full items-center justify-center rounded-full bg-[#76534D] px-5 text-xs font-semibold text-white hover:bg-[#4A302B] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isRetryingPayment ? 'Đang khởi tạo lại...' : 'Thử thanh toán lại cho đơn này'}
                  </button>
                )}
              {paymentStatusError && (
                <p role="alert" className="mt-3 rounded-xl bg-[#F6E9E6] p-3 text-xs leading-5 text-[#914E46]">
                  {paymentStatusError}
                </p>
              )}
            </>
          )}
          {submitError && <p role="alert" className="mt-4 rounded-xl bg-[#F6E9E6] p-3 text-xs leading-5 text-[#914E46]">{submitError}</p>}
          {!paymentInitiationUncertain && (
            <button
              type="button"
              onClick={() => submitOrder()}
              disabled={isSubmitting}
              className="mt-6 flex h-11 w-full items-center justify-center rounded-full bg-[#76534D] px-5 text-xs font-semibold text-white hover:bg-[#4A302B] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting
                ? 'Đang kiểm tra đơn hàng...'
                : isVnPayAttempt
                  ? 'Kiểm tra đơn và tiếp tục thanh toán'
                  : 'Kiểm tra kết quả đơn hàng'}
            </button>
          )}
          <Link to="/shop/orders" className="mt-4 block text-center text-xs font-semibold text-[#76534D]">Mở lịch sử đơn hàng</Link>
        </div>
      </section>
    )
  }

  if (
    attemptState.status === 'none'
    && paymentStatus?.paymentStatus === 'SUCCESS'
    && paymentStatus?.attemptStatus === 'SUCCESS'
  ) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-12 sm:px-7">
        <div role="status" className="rounded-3xl border border-[#EAE3DA] bg-white p-7 text-center shadow-[0_18px_60px_rgba(91,61,53,0.06)] sm:p-10">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#A97668]">Thanh toán thử nghiệm VNPay</p>
          <h1 className="font-display mt-2 text-3xl font-medium text-[#4A302B]">Giao dịch thử nghiệm đã được xác nhận</h1>
          <p className="mt-3 text-sm leading-6 text-[#806B65]">
            Kết quả thử nghiệm của đơn #{paymentStatus.orderId} đã được xác nhận. Giao dịch này không phát sinh thanh toán thật.
          </p>
          <Link to="/shop/orders" className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-[#76534D] px-6 text-xs font-semibold text-white hover:bg-[#4A302B]">
            Mở lịch sử đơn hàng
          </Link>
        </div>
      </section>
    )
  }

  if (cart.items.length === 0) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-14 text-center sm:px-7">
        <h1 className="font-display text-3xl text-[#4A302B]">Không có sản phẩm để đặt</h1>
        <Link to="/shop/products" className="mt-5 inline-flex rounded-full bg-[#76534D] px-5 py-3 text-xs font-semibold text-white">Quay lại cửa hàng</Link>
      </section>
    )
  }

  return (
    <section className="mx-auto max-w-5xl px-4 py-8 sm:px-7 sm:py-12 lg:px-10">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#A97668]">Hoàn tất thông tin</p>
      <h1 className="font-display mt-2 text-3xl font-medium text-[#4A302B] sm:text-4xl">Đặt hàng</h1>
      <p className="mt-2 text-sm text-[#806B65]">Đơn sẽ được tạo ở trạng thái chờ xác nhận. Bạn có thể thanh toán theo hướng dẫn của cửa hàng hoặc chọn VNPay trong môi trường thử nghiệm.</p>

      {catalogLoading ? (
        <p role="status" className="mt-6 rounded-2xl bg-white px-5 py-12 text-center text-sm text-[#806B65]">Đang kiểm tra tồn kho...</p>
      ) : catalogError ? (
        <p role="alert" className="mt-6 rounded-xl bg-[#F6E9E6] p-4 text-sm text-[#914E46]">{catalogError}</p>
      ) : invalidCart ? (
        <div role="alert" className="mt-6 rounded-xl bg-[#F6E9E6] p-4 text-sm leading-6 text-[#914E46]">
          Có sản phẩm đã ngừng bán, bị xóa hoặc không đủ tồn kho. <Link to="/shop/cart" className="font-semibold underline">Quay lại giỏ hàng</Link> để cập nhật.
        </div>
      ) : (
        <form onSubmit={submitOrder} className="mt-7 grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-5 rounded-2xl border border-[#EAE3DA] bg-white p-5 sm:p-7">
            <div>
              <h2 className="font-display text-xl text-[#4A302B]">Thông tin nhận hàng</h2>
              <p className="mt-1 text-xs leading-5 text-[#806B65]">Áp dụng cho khu vực Việt Nam. Để trống địa chỉ nếu bạn nhận tại cửa hàng.</p>
            </div>
            <label className="grid gap-1.5 text-xs font-semibold text-[#675650]">
              Số điện thoại người nhận *
              <input
                type="tel"
                required
                maxLength={20}
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                autoComplete="tel"
                inputMode="tel"
                className="h-11 rounded-xl border border-[#EAE3DA] px-3 text-sm font-normal outline-none focus:border-[#D0A263]"
                placeholder="09xx xxx xxx hoặc +84 9xx xxx xxx"
              />
              <span className="font-normal text-[#806B65]">Nhập số di động Việt Nam gồm 10 số; có thể dùng đầu số +84.</span>
            </label>
            <label className="grid gap-1.5 text-xs font-semibold text-[#675650]">
              Địa chỉ giao hàng tại Việt Nam (không bắt buộc)
              <input
                maxLength={255}
                value={deliveryAddress}
                onChange={(event) => setDeliveryAddress(event.target.value)}
                className="h-11 rounded-xl border border-[#EAE3DA] px-3 text-sm font-normal outline-none focus:border-[#D0A263]"
                placeholder="Số nhà, đường, quận/huyện"
              />
            </label>
            <label className="grid gap-1.5 text-xs font-semibold text-[#675650]">
              Mã khuyến mãi (không bắt buộc)
              <input
                maxLength={30}
                value={promotionCode}
                onChange={(event) => setPromotionCode(event.target.value)}
                className="h-11 rounded-xl border border-[#EAE3DA] px-3 text-sm font-normal outline-none focus:border-[#D0A263]"
                placeholder="Nhập mã nếu có"
              />
            </label>
            <label className="grid gap-1.5 text-xs font-semibold text-[#675650]">
              Ghi chú (không bắt buộc)
              <textarea
                maxLength={500}
                value={note}
                onChange={(event) => setNote(event.target.value)}
                rows={3}
                className="rounded-xl border border-[#EAE3DA] px-3 py-2 text-sm font-normal outline-none focus:border-[#D0A263]"
                placeholder="Ghi chú cho cửa hàng"
              />
            </label>
            <fieldset className="grid gap-3 border-t border-[#EAE3DA] pt-5">
              <legend className="font-display text-xl text-[#4A302B]">Phương thức thanh toán</legend>
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[#EAE3DA] p-3 text-xs text-[#675650]">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="CASH"
                  checked={paymentMethod === 'CASH'}
                  onChange={() => setPaymentMethod('CASH')}
                  className="mt-0.5 accent-[#76534D]"
                />
                <span><strong className="block text-[#4A302B]">Thanh toán theo hướng dẫn của cửa hàng</strong>Giữ nguyên luồng đặt hàng hiện tại.</span>
              </label>
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[#EAE3DA] p-3 text-xs text-[#675650]">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="VNPAY"
                  checked={paymentMethod === 'VNPAY'}
                  onChange={() => setPaymentMethod('VNPAY')}
                  className="mt-0.5 accent-[#76534D]"
                />
                <span><strong className="block text-[#4A302B]">VNPay QR (thử nghiệm)</strong>Chuyển đến trang thanh toán thử nghiệm của VNPay; giao dịch không phát sinh thanh toán thật.</span>
              </label>
            </fieldset>
            {quoteError && (
              <div role="alert" className="rounded-xl bg-[#F6E9E6] p-3 text-xs leading-5 text-[#914E46]">
                <p>{quoteError}</p>
                <button type="button" onClick={() => setQuoteVersion((version) => version + 1)} className="mt-2 font-semibold underline">Thử tải lại báo giá</button>
              </div>
            )}
            {submitError && <p role="alert" className="rounded-xl bg-[#F6E9E6] p-3 text-xs leading-5 text-[#914E46]">{submitError}</p>}
          </div>

          <aside className="rounded-2xl border border-[#EAE3DA] bg-white p-5">
            <h2 className="font-display text-lg text-[#4A302B]">Đơn hàng của bạn</h2>
            <div className="mt-4 space-y-3 border-b border-[#EAE3DA] pb-4">
              {cartPagination.pageItems.map((item) => {
                const product = productById.get(item.productId)
                return (
                  <div key={item.productId} className="flex justify-between gap-3 text-xs">
                    <span className="text-[#806B65]">{product?.name || `Sản phẩm #${item.productId}`} × {item.quantity}</span>
                    <strong className="whitespace-nowrap text-[#4A302B]">{product ? moneyFormat.format(product.price * item.quantity) : '—'}</strong>
                  </div>
                )
              })}
            </div>
            <Pagination
              currentPage={cartPagination.currentPage}
              pageSize={cartPagination.pageSize}
              totalItems={cartPagination.totalItems}
              onPageChange={cartPagination.setCurrentPage}
              onPageSizeChange={cartPagination.setPageSize}
            />
            {quoteLoading ? (
              <p role="status" className="py-4 text-xs text-[#806B65]">Đang tính tổng đơn hàng...</p>
            ) : quote ? (
              <div className="mt-4 space-y-2 text-xs">
                <div className="flex justify-between gap-3"><span className="text-[#806B65]">Tạm tính</span><span>{moneyFormat.format(Number(quote.totalAmount))}</span></div>
                <div className="flex justify-between gap-3"><span className="text-[#806B65]">Giảm giá</span><span>{moneyFormat.format(Number(quote.discountAmount))}</span></div>
                <div className="flex justify-between gap-3 border-t border-[#EAE3DA] pt-3 text-sm font-bold text-[#76534D]"><span>Cần thanh toán</span><span>{moneyFormat.format(Number(quote.finalAmount))}</span></div>
              </div>
            ) : !quoteError && <p className="mt-4 text-xs text-[#806B65]">Tổng tiền và ưu đãi sẽ được xác nhận khi đặt hàng.</p>}
            <button
              type="submit"
              disabled={isSubmitting || quoteLoading || !quote || Boolean(quoteError)}
              className="mt-5 flex h-11 w-full items-center justify-center rounded-full bg-[#76534D] px-5 text-xs font-semibold text-white hover:bg-[#4A302B] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting
                ? paymentMethod === 'VNPAY' ? 'Đang chuyển tới VNPay...' : 'Đang đặt hàng...'
                : paymentMethod === 'VNPAY' ? 'Đặt hàng và thanh toán' : 'Đặt hàng'}
            </button>
            <Link to="/shop/cart" className="mt-3 block text-center text-xs font-semibold text-[#76534D]">Quay lại giỏ hàng</Link>
          </aside>
        </form>
      )}
    </section>
  )
}
