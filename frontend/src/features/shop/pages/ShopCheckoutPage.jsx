import { useContext, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthContext } from '../../auth/AuthContext.js'
import { toProductViewModel } from '../../products/adapters/productAdapter.js'
import { getProducts } from '../../products/services/productService.js'
import Pagination, { usePagination } from '../../../components/Pagination.jsx'
import { useShopCart } from '../ShopCartContext.jsx'
import { apiRequest, getUserFacingErrorMessage } from '../../../services/apiClient.js'
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
  cancelCustomerOrder,
  createCustomerOrder,
  createCustomerVnPayPayment,
  getCustomerOrderByRequestKey,
  reconcileCustomerVnPayPaymentByOrderId,
  quoteCustomerOrder,
} from '../services/customerOrderService.js'
import { normalizeVietnamesePhone } from '../services/vietnamesePhone.js'

const moneyFormat = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
})
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
  const [buyerProfile, setBuyerProfile] = useState(null)
  const [paymentMethod, setPaymentMethod] = useState(
    () => pendingAttempt?.paymentMethod || 'CASH',
  )
  const [promotionCode, setPromotionCode] = useState(
    () => pendingAttempt?.payload.promotionCode || '',
  )
  const [note, setNote] = useState(() => pendingAttempt?.payload.note || '')
  const [useLoyaltyPoints, setUseLoyaltyPoints] = useState(false)
  const [loyaltyPointsToRedeem, setLoyaltyPointsToRedeem] = useState(0)
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
  const [isCancellingOrder, setIsCancellingOrder] = useState(false)
  const [orderCancellationNotice, setOrderCancellationNotice] = useState('')
  const [paymentStatus, setPaymentStatus] = useState(null)
  const [paymentStatusNotice, setPaymentStatusNotice] = useState('')
  const [paymentStatusError, setPaymentStatusError] = useState('')

  useEffect(() => {
    setAttemptState(readCustomerOrderAttempt(window.sessionStorage, owner))
  }, [owner])

  // Pre-fill buyer information from customer profile
  useEffect(() => {
    let active = true
    const controller = new AbortController()

    apiRequest('/customer/profile', { signal: controller.signal })
      .then((profile) => {
        if (!active || !profile) return
        setBuyerProfile(profile)
        // If not recovering a pending attempt, prefill phone and address
        if (!pendingAttempt) {
          if (profile.phone) {
            setPhone((current) => current || profile.phone)
          }
          if (profile.address) {
            setDeliveryAddress((current) => current || profile.address)
          }
        }
      })
      .catch(() => {
        // Silently catch if profile fetch fails
      })

    return () => {
      active = false
      controller.abort()
    }
  }, [pendingAttempt])

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
  const availableLoyaltyPoints = Number(buyerProfile?.loyaltyPoints || 0)
  const subtotalBeforePoints = quote ? Number(quote.finalAmount) : cart.subtotal
  const maxRedeemablePoints = Math.min(availableLoyaltyPoints, Math.floor(subtotalBeforePoints / 1000))
  const activeLoyaltyPoints = useLoyaltyPoints
    ? Math.min(maxRedeemablePoints, Math.max(0, Number(loyaltyPointsToRedeem) || 0))
    : 0
  const loyaltyDiscount = activeLoyaltyPoints * 1000
  const payableAmount = Math.max(0, subtotalBeforePoints - loyaltyDiscount)

  const payload = useMemo(() => pendingAttempt?.payload || ({
    items,
    phone: normalizeVietnamesePhone(phone),
    deliveryAddress: deliveryAddress.trim() || null,
    promotionCode: promotionCode.trim() || null,
    note: note.trim() || null,
    loyaltyPointsToRedeem: activeLoyaltyPoints,
  }), [activeLoyaltyPoints, deliveryAddress, items, note, pendingAttempt, phone, promotionCode])

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
      if (vnpayInitiationStarted) {
        setSubmitError(
          `${getVnPayInitiationErrorMessage(error)} Đơn đã được ghi nhận; hãy kiểm tra trạng thái thanh toán trước khi thử lại.`,
        )
        return
      }
      if ((activeAttempt?.paymentMethod || paymentMethod) === 'VNPAY' && error.status == null) {
        setSubmitError(
          'Chưa kết nối được máy chủ để xác nhận đơn. Đơn có thể đã được ghi nhận; hãy thử lại an toàn, hệ thống sẽ kiểm tra mã yêu cầu trước để tránh tạo đơn trùng.',
        )
        return
      }
      setSubmitError(getUserFacingErrorMessage(error, 'Chưa thể đặt hàng. Vui lòng kiểm tra lại thông tin.'))
    } finally {
      submitLock.current = false
      setIsSubmitting(false)
    }
  }

  const checkVnPayStatus = async () => {
    if (!pendingAttempt?.orderId || isCheckingPaymentStatus) return
    setIsCheckingPaymentStatus(true)
    setPaymentStatusError('')
    setPaymentStatusNotice('')
    try {
      const reconciliation = await reconcileCustomerVnPayPaymentByOrderId(pendingAttempt.orderId)
      const status = reconciliation?.payment
      if (!status) throw new Error('Chưa nhận được kết quả đối soát thanh toán.')
      setPaymentStatus(status)
      setPaymentStatusNotice(reconciliation.message || '')
      if (status.orderStatus === 'CANCELLED') {
        if (clearCustomerOrderAttempt(window.sessionStorage, pendingAttempt.key)) {
          setAttemptState({ status: 'none' })
          setOrderCancellationNotice(
            `Đơn #${pendingAttempt.orderId} đã hủy. Tồn kho đã được hoàn lại; bạn có thể đặt đơn mới.`,
          )
        } else {
          setPaymentStatusError('Đơn đã được hủy nhưng trình duyệt chưa thể xóa yêu cầu đang lưu. Tải lại trang để đồng bộ trạng thái.')
        }
        return
      }
      if (status.paymentStatus === 'SUCCESS' && status.attemptStatus === 'SUCCESS') {
        clearCustomerOrderAttempt(window.sessionStorage, pendingAttempt.key)
        setAttemptState({ status: 'none' })
      }
    } catch (error) {
      setPaymentStatusError(getUserFacingErrorMessage(error, 'Chưa thể tra cứu trạng thái thanh toán.'))
    } finally {
      setIsCheckingPaymentStatus(false)
    }
  }

  const retryVnPayForExistingOrder = async () => {
    if (!pendingAttempt?.orderId || paymentRetryLock.current || isRetryingPayment) return
    paymentRetryLock.current = true
    setIsRetryingPayment(true)
    setPaymentStatusError('')
    try {
      const reconciliation = await reconcileCustomerVnPayPaymentByOrderId(pendingAttempt.orderId)
      const refreshedStatus = reconciliation?.payment
      if (!refreshedStatus) throw new Error('Chưa nhận được kết quả đối soát thanh toán.')
      setPaymentStatus(refreshedStatus)
      if (refreshedStatus.orderStatus === 'CANCELLED') {
        if (clearCustomerOrderAttempt(window.sessionStorage, pendingAttempt.key)) {
          setAttemptState({ status: 'none' })
          setOrderCancellationNotice(
            `Đơn #${pendingAttempt.orderId} đã hủy. Tồn kho đã được hoàn lại; bạn có thể đặt đơn mới.`,
          )
        } else {
          setPaymentStatusError('Đơn đã được hủy nhưng trình duyệt chưa thể xóa yêu cầu đang lưu. Tải lại trang để đồng bộ trạng thái.')
        }
        return
      }
      if (refreshedStatus.paymentStatus === 'SUCCESS' && refreshedStatus.attemptStatus === 'SUCCESS') {
        clearCustomerOrderAttempt(window.sessionStorage, pendingAttempt.key)
        setAttemptState({ status: 'none' })
        return
      }
      if (refreshedStatus.paymentStatus !== 'FAILED'
          || refreshedStatus.attemptStatus !== 'FAILED') {
        setPaymentStatusError(
          'VNPay chưa xác nhận giao dịch trước đó thất bại. Chưa thể thanh toán lại; vui lòng kiểm tra sau.',
        )
        return
      }
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

  const cancelPendingOrder = async () => {
    if (!pendingAttempt?.orderId || isCancellingOrder) return
    setIsCancellingOrder(true)
    setPaymentStatusError('')
    try {
      await cancelCustomerOrder(pendingAttempt.orderId)
      if (!clearCustomerOrderAttempt(window.sessionStorage, pendingAttempt.key)) {
        setPaymentStatusError(
          'Đơn đã được hủy nhưng trình duyệt chưa thể xóa yêu cầu đang lưu. Tải lại trang để đồng bộ trạng thái.',
        )
        return
      }
      setAttemptState({ status: 'none' })
      setOrderCancellationNotice(
        `Đơn #${pendingAttempt.orderId} đã hủy. Tồn kho đã được hoàn lại; bạn có thể đặt đơn mới.`,
      )
    } catch (error) {
      setPaymentStatusError(getUserFacingErrorMessage(
        error,
        'Chưa thể hủy đơn. Nếu giao dịch vẫn đang được VNPay xác minh, vui lòng kiểm tra trạng thái trước.',
      ))
    } finally {
      setIsCancellingOrder(false)
    }
  }

  const startNewOrder = () => {
    if (!pendingAttempt?.orderId) return
    const confirmed = window.confirm(
      `Đơn #${pendingAttempt.orderId} vẫn chưa có kết quả thanh toán và sẽ không bị hủy. ` +
      'Nếu ngân hàng xác nhận giao dịch sau đó, bạn vẫn có thể bị trừ tiền cho đơn cũ. ' +
      'Bạn chỉ nên tiếp tục nếu chắc chắn không thanh toán đơn cũ. Tạo đơn mới?',
    )
    if (!confirmed) return
    if (!clearCustomerOrderAttempt(window.sessionStorage, pendingAttempt.key)) {
      setPaymentStatusError(
        'Chưa thể mở phiên đặt hàng mới trên trình duyệt. Vui lòng tải lại trang rồi thử lại.',
      )
      return
    }
    setAttemptState({ status: 'none' })
    navigate('/shop/products')
  }

  if (attemptState.status === 'owner-mismatch') {
    return (
      <section className="mx-auto max-w-3xl px-4 py-12 sm:px-7">
        <div role="alert" className="rounded-2xl border border-[#E2C5BF] bg-white p-6 text-sm leading-6 text-[#914E46]">
          <p>
            Có yêu cầu đặt hàng chưa hoàn tất được lưu trên trình duyệt này. Để tránh tạo đơn trùng, vui lòng đăng nhập tài khoản đã dùng để đặt đơn và kiểm tra trạng thái trước khi tạo đơn mới.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              to="/shop/login"
              state={{ from: { pathname: '/shop/checkout' } }}
              className="inline-flex h-10 items-center justify-center rounded-full bg-[#76534D] px-5 text-xs font-semibold text-white transition hover:bg-[#4A302B]"
            >
              Đăng nhập tài khoản đã dùng
            </Link>
            <Link
              to="/shop/orders"
              className="inline-flex h-10 items-center justify-center rounded-full border border-[#DDCDB8] px-5 text-xs font-semibold text-[#76534D] transition hover:bg-[#FCF9F3]"
            >
              Xem lịch sử đơn hàng
            </Link>
          </div>
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
          <h1 className="font-display mt-2 text-2xl font-medium text-[#4A302B]">
            {isVnPayAttempt && pendingAttempt.orderId
              ? `Đơn hàng #${pendingAttempt.orderId} đang chờ thanh toán`
              : 'Đang xác nhận đơn hàng'}
          </h1>
          <p className="mt-3 text-sm leading-6 text-[#806B65]">
            {paymentInitiationUncertain
              ? 'Đơn hàng này chưa có kết quả thanh toán. Bạn có thể kiểm tra lại hoặc chọn tạo đơn mới.'
              : 'Đang kiểm tra đơn hàng. Bạn có thể tiếp tục xem thêm bánh trong lúc chờ.'}
          </p>
          {paymentInitiationUncertain && (
            <>
              <button
                type="button"
                onClick={checkVnPayStatus}
                disabled={isCheckingPaymentStatus}
                className="mt-5 flex h-11 w-full items-center justify-center rounded-full bg-[#76534D] px-5 text-xs font-semibold text-white hover:bg-[#4A302B] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isCheckingPaymentStatus ? 'Đang kiểm tra...' : 'Kiểm tra thanh toán'}
              </button>
              {paymentStatus && (
                <p role="status" className="mt-3 rounded-xl bg-[#FCF9F3] p-3 text-xs leading-5 text-[#675650]">
                  {paymentStatus.paymentStatus === 'SUCCESS' && paymentStatus.attemptStatus === 'SUCCESS'
                    ? 'Thanh toán thành công.'
                    : paymentStatus.paymentStatus === 'FAILED' && paymentStatus.attemptStatus === 'FAILED'
                      ? 'Thanh toán chưa thành công.'
                      : 'Chưa có xác nhận thanh toán thành công.'}
                  {paymentStatusNotice && (
                    <span className="mt-1 block">{paymentStatusNotice}</span>
                  )}
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
          {isVnPayAttempt && pendingAttempt.orderId && (
            <button
              type="button"
              onClick={cancelPendingOrder}
              disabled={isCancellingOrder || isCheckingPaymentStatus || isRetryingPayment}
              className="mt-3 flex h-11 w-full items-center justify-center rounded-full border border-[#E2C5BF] px-5 text-xs font-semibold text-[#914E46] hover:bg-[#FDF6F4] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isCancellingOrder ? 'Đang hủy đơn...' : 'Hủy đơn hàng'}
            </button>
          )}
          {isVnPayAttempt && pendingAttempt.orderId && (
            <div className="mt-4 rounded-xl bg-[#FCF9F3] p-3 text-xs leading-5 text-[#675650]">
              Đơn cũ sẽ không bị hủy. Nếu ngân hàng xác nhận giao dịch sau đó, đơn cũ vẫn có thể được thanh toán.
              <button
                type="button"
                onClick={startNewOrder}
                disabled={isCancellingOrder || isCheckingPaymentStatus || isRetryingPayment}
                className="mt-3 flex h-11 w-full items-center justify-center rounded-full border border-[#DDCDB8] px-5 text-xs font-semibold text-[#76534D] hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                Tạo đơn mới
              </button>
            </div>
          )}
          {!paymentInitiationUncertain && (
            <button
              type="button"
              onClick={() => submitOrder()}
              disabled={isSubmitting}
              className="mt-6 flex h-11 w-full items-center justify-center rounded-full bg-[#76534D] px-5 text-xs font-semibold text-white hover:bg-[#4A302B] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting
                ? 'Đang kiểm tra...'
                : isVnPayAttempt
                  ? 'Tiếp tục thanh toán'
                  : 'Kiểm tra đơn hàng'}
            </button>
          )}
          <div className="mt-4 flex flex-col items-center gap-3">
            {!(isVnPayAttempt && pendingAttempt.orderId) && (
              <Link
                to="/shop/products"
                className="inline-flex h-11 w-full items-center justify-center rounded-full border border-[#DDCDB8] px-5 text-xs font-semibold text-[#76534D] transition hover:bg-[#FCF9F3]"
              >
                Tiếp tục mua sắm
              </Link>
            )}
          </div>
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

  if (orderCancellationNotice) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-12 sm:px-7">
        <div role="status" className="rounded-3xl border border-[#EAE3DA] bg-white p-7 text-center shadow-[0_18px_60px_rgba(91,61,53,0.06)] sm:p-10">
          <h1 className="font-display text-2xl font-medium text-[#4A302B]">Đơn hàng đã được hủy</h1>
          <p className="mt-3 text-sm leading-6 text-[#806B65]">{orderCancellationNotice}</p>
          <Link to="/shop/products" className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-[#76534D] px-6 text-xs font-semibold text-white hover:bg-[#4A302B]">
            Quay lại cửa hàng
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
      <h1 className="font-display mt-2 text-3xl font-medium text-[#4A302B] sm:text-4xl">Đặt hàng & Thanh toán</h1>

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
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-display text-xl text-[#4A302B]">Thông tin người mua & nhận hàng</h2>
                <span className="rounded-full bg-[#EBF3E8] px-2.5 py-1 text-[11px] font-semibold text-[#456B3E]">
                  ✓ Thông tin đã được điền sẵn
                </span>
              </div>
              <p className="mt-1 text-xs leading-5 text-[#806B65]">
                Dữ liệu được lấy tự động từ tài khoản của bạn. Bạn có thể thay đổi số điện thoại hoặc địa chỉ nhận hàng nếu cần.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="grid gap-1.5 text-xs font-semibold text-[#675650]">
                Họ và tên người mua
                <input
                  type="text"
                  readOnly
                  value={buyerProfile?.fullName || account?.username || ''}
                  className="h-11 rounded-xl border border-[#EAE3DA] bg-[#F7F4F0] px-3 text-sm font-normal text-[#675650] outline-none cursor-not-allowed"
                />
              </label>

              <label className="grid gap-1.5 text-xs font-semibold text-[#675650]">
                Email liên hệ
                <input
                  type="email"
                  readOnly
                  value={buyerProfile?.email || account?.email || ''}
                  className="h-11 rounded-xl border border-[#EAE3DA] bg-[#F7F4F0] px-3 text-sm font-normal text-[#675650] outline-none cursor-not-allowed"
                />
              </label>
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
              Địa chỉ giao hàng tại Việt Nam
              <input
                maxLength={255}
                value={deliveryAddress}
                onChange={(event) => setDeliveryAddress(event.target.value)}
                className="h-11 rounded-xl border border-[#EAE3DA] px-3 text-sm font-normal outline-none focus:border-[#D0A263]"
                placeholder="Số nhà, đường, quận/huyện (để trống nếu nhận tại cửa hàng)"
              />
            </label>

            <label className="grid gap-1.5 text-xs font-semibold text-[#675650]">
              Mã khuyến mãi
              <input
                maxLength={30}
                value={promotionCode}
                onChange={(event) => setPromotionCode(event.target.value)}
                className="h-11 rounded-xl border border-[#EAE3DA] px-3 text-sm font-normal outline-none focus:border-[#D0A263]"
                placeholder="Nhập mã nếu có"
              />
            </label>

            <label className="grid gap-1.5 text-xs font-semibold text-[#675650]">
              Ghi chú
              <textarea
                maxLength={500}
                value={note}
                onChange={(event) => setNote(event.target.value)}
                rows={3}
                className="rounded-xl border border-[#EAE3DA] px-3 py-2 text-sm font-normal outline-none focus:border-[#D0A263]"
                placeholder="Ghi chú cho cửa hàng"
              />
            </label>

            {availableLoyaltyPoints > 0 && (
              <div className="rounded-2xl border border-dashed border-[#DDCDB8] bg-[#FAF6F0] p-4 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#4A302B]">
                    Điểm tích lũy hiện có: <strong className="text-emerald-700 font-bold">{availableLoyaltyPoints} điểm</strong>
                  </span>
                  <label className="flex items-center gap-1.5 cursor-pointer font-bold text-[#4A302B]">
                    <input
                      type="checkbox"
                      checked={useLoyaltyPoints}
                      onChange={(e) => {
                        const next = e.target.checked
                        setUseLoyaltyPoints(next)
                        setLoyaltyPointsToRedeem(next ? maxRedeemablePoints : 0)
                      }}
                      className="accent-[#B47B68] h-4 w-4 rounded"
                    />
                    <span>Đổi điểm giảm giá</span>
                  </label>
                </div>
                {useLoyaltyPoints && (
                  <div className="mt-2.5 flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      max={maxRedeemablePoints}
                      value={loyaltyPointsToRedeem}
                      onChange={(e) => setLoyaltyPointsToRedeem(Math.min(maxRedeemablePoints, Math.max(0, Number(e.target.value) || 0)))}
                      className="h-8 w-24 rounded-lg border border-[#B47B68] bg-white px-2.5 font-bold text-[#4A302B] outline-none"
                    />
                    <span className="text-[#806B65]">
                      Giảm: <strong className="text-emerald-700 font-bold">{moneyFormat.format(loyaltyDiscount)}</strong> (1 điểm = 1.000 ₫)
                    </span>
                  </div>
                )}
              </div>
            )}

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
                const quoteItem = quote?.items?.find(
                  (line) => Number(line.productId) === Number(item.productId),
                )
                const originalLineTotal = product ? product.price * item.quantity : null
                const lineDiscount = Number(quoteItem?.discountAmount ?? 0)
                return (
                  <div key={item.productId} className="flex justify-between gap-3 text-xs">
                    <span className="text-[#806B65]">{product?.name || `Sản phẩm #${item.productId}`} × {item.quantity}</span>
                    <span className="flex shrink-0 items-center gap-2 whitespace-nowrap">
                      {lineDiscount > 0 && <span className="text-[#9A7972] line-through">{moneyFormat.format(originalLineTotal)}</span>}
                      <strong className={lineDiscount > 0 ? 'text-[#B94F35]' : 'text-[#4A302B]'}>
                        {quoteItem
                          ? moneyFormat.format(Number(quoteItem.lineTotal))
                          : originalLineTotal == null ? '—' : moneyFormat.format(originalLineTotal)}
                      </strong>
                    </span>
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
                <div className="flex justify-between gap-3"><span className="text-[#806B65]">Giảm giá voucher</span><span>{moneyFormat.format(Number(quote.discountAmount))}</span></div>
                {loyaltyDiscount > 0 && (
                  <div className="flex justify-between gap-3 text-emerald-700 font-semibold">
                    <span>Đổi {activeLoyaltyPoints} điểm tích lũy</span>
                    <span>-{moneyFormat.format(loyaltyDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between gap-3 border-t border-[#EAE3DA] pt-3 text-sm font-bold text-[#76534D]">
                  <span>Cần thanh toán</span>
                  <span>{moneyFormat.format(payableAmount)}</span>
                </div>
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
