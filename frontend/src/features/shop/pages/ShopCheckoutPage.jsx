import { useContext, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthContext } from '../../auth/AuthContext.js'
import { toProductViewModel } from '../../products/adapters/productAdapter.js'
import { getProducts } from '../../products/services/productService.js'
import { useShopCart } from '../ShopCartContext.jsx'
import {
  cartMatchesCustomerOrder,
  clearCustomerOrderAttempt,
  createCustomerOrderAttempt,
  createCustomerOrderRequestKey,
  readCustomerOrderAttempt,
  saveCustomerOrderAttempt,
} from '../services/customerOrderAttempt.js'
import { resolveCustomerOrderAttempt } from '../services/customerOrderRecovery.js'
import {
  createCustomerOrder,
  getCustomerOrderByRequestKey,
  quoteCustomerOrder,
} from '../services/customerOrderService.js'

const moneyFormat = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
})

export default function ShopCheckoutPage() {
  const cart = useShopCart()
  const navigate = useNavigate()
  const account = useContext(AuthContext)?.account
  const owner = account?.id == null ? null : String(account.id)
  const submitLock = useRef(false)
  const [attemptState, setAttemptState] = useState(
    () => readCustomerOrderAttempt(window.sessionStorage, owner),
  )
  const pendingAttempt = attemptState.status === 'pending' ? attemptState.attempt : null
  const [deliveryAddress, setDeliveryAddress] = useState(
    () => pendingAttempt?.payload.deliveryAddress || '',
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

  useEffect(() => {
    setAttemptState(readCustomerOrderAttempt(window.sessionStorage, owner))
  }, [owner])

  useEffect(() => {
    const controller = new AbortController()
    getProducts({ signal: controller.signal })
      .then((result) => {
        if (!Array.isArray(result)) throw new Error('API sản phẩm trả về dữ liệu không hợp lệ.')
        setProducts(result.map(toProductViewModel))
      })
      .catch((error) => {
        if (error.name !== 'AbortError') setCatalogError(error.message)
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
    deliveryAddress: deliveryAddress.trim() || null,
    promotionCode: promotionCode.trim() || null,
    note: note.trim() || null,
  }), [deliveryAddress, items, note, pendingAttempt, promotionCode])

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
            throw new Error('API báo giá trả về số tiền không hợp lệ.')
          }
          setQuote(result)
        })
        .catch((error) => {
          if (!controller.signal.aborted && error.name !== 'AbortError') setQuoteError(error.message)
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
        setSubmitError('Chưa có báo giá hợp lệ từ máy chủ. Hãy thử tải lại báo giá.')
        return
      }
    }

    submitLock.current = true
    setIsSubmitting(true)
    setSubmitError('')
    try {
      let attempt = pendingAttempt
      if (!attempt) {
        attempt = createCustomerOrderAttempt(owner, payload, createCustomerOrderRequestKey())
        if (!saveCustomerOrderAttempt(window.sessionStorage, attempt)) {
          setAttemptState({ status: 'unavailable' })
          setSubmitError('Không thể lưu yêu cầu an toàn trong phiên trình duyệt. Đơn chưa được gửi; hãy bật sessionStorage rồi thử lại.')
          return
        }
        setAttemptState({ status: 'pending', attempt })
      }

      const order = await resolveCustomerOrderAttempt(attempt, {
        findByRequestKey: getCustomerOrderByRequestKey,
        createOrder: createCustomerOrder,
      })
      if (clearCustomerOrderAttempt(window.sessionStorage, attempt.key)) {
        setAttemptState({ status: 'none' })
      } else {
        setAttemptState({ status: 'pending', attempt })
        console.warn('Đơn đã được xác nhận nhưng chưa thể xóa yêu cầu đang chờ khỏi phiên trình duyệt.')
      }
      if (cartMatchesCustomerOrder(cart.items, attempt.payload.items)) cart.clear()
      navigate('/shop/order-result', { replace: true, state: { order } })
    } catch (error) {
      setSubmitError(
        `Chưa xác định được kết quả đơn hàng. Hãy thử lại để gửi cùng yêu cầu an toàn; không tạo yêu cầu mới. ${error.message || ''}`.trim(),
      )
    } finally {
      submitLock.current = false
      setIsSubmitting(false)
    }
  }

  if (attemptState.status === 'owner-mismatch') {
    return (
      <section className="mx-auto max-w-3xl px-4 py-12 sm:px-7">
        <div role="alert" className="rounded-2xl border border-[#E2C5BF] bg-white p-6 text-sm leading-6 text-[#914E46]">
          Trình duyệt đang giữ một yêu cầu đặt hàng chưa được xác nhận cho tài khoản khác. Hãy đăng nhập lại đúng tài khoản đó để kiểm tra hoặc tiếp tục yêu cầu; chưa thể bắt đầu đơn mới trong phiên này.
        </div>
      </section>
    )
  }

  if (attemptState.status === 'invalid' || attemptState.status === 'unavailable') {
    return (
      <section className="mx-auto max-w-3xl px-4 py-12 sm:px-7">
        <div role="alert" className="rounded-2xl border border-[#E2C5BF] bg-white p-6 text-sm leading-6 text-[#914E46]">
          {attemptState.status === 'invalid'
            ? 'Không thể đọc an toàn yêu cầu đặt hàng đang lưu. Để tránh tạo đơn trùng, chưa thể gửi một yêu cầu mới từ checkout.'
            : 'Không thể truy cập sessionStorage. Checkout bị tạm dừng để bảo đảm retry không tạo đơn trùng.'}
        </div>
      </section>
    )
  }

  if (pendingAttempt) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-12 sm:px-7">
        <div className="rounded-3xl border border-[#EAE3DA] bg-white p-6 shadow-[0_18px_60px_rgba(91,61,53,0.06)] sm:p-9">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#A97668]">Yêu cầu đang chờ xác nhận</p>
          <h1 className="font-display mt-2 text-2xl font-medium text-[#4A302B]">Chưa rõ lần gửi trước đã hoàn tất chưa</h1>
          <p className="mt-3 text-sm leading-6 text-[#806B65]">
            Bấm nút bên dưới để tra cứu bằng khóa cũ. Nếu chưa có đơn, checkout mới gửi lại đúng payload với cùng khóa; lỗi mạng hoặc phiên hết hạn sẽ không tự tạo yêu cầu khác.
          </p>
          <ul className="mt-5 space-y-2 rounded-2xl bg-[#FCF9F3] p-4 text-sm text-[#675650]">
            {pendingAttempt.payload.items.map((item) => (
              <li key={item.productId}>Sản phẩm #{item.productId} × {item.quantity}</li>
            ))}
            {pendingAttempt.payload.deliveryAddress && <li>Địa chỉ giao hàng đã được lưu trong phiên.</li>}
            {pendingAttempt.payload.promotionCode && <li>Mã khuyến mãi: {pendingAttempt.payload.promotionCode}</li>}
          </ul>
          {submitError && <p role="alert" className="mt-4 rounded-xl bg-[#F6E9E6] p-3 text-xs leading-5 text-[#914E46]">{submitError}</p>}
          <button
            type="button"
            onClick={() => submitOrder()}
            disabled={isSubmitting}
            className="mt-6 flex h-11 w-full items-center justify-center rounded-full bg-[#76534D] px-5 text-xs font-semibold text-white hover:bg-[#4A302B] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? 'Đang kiểm tra yêu cầu...' : 'Kiểm tra kết quả / tiếp tục cùng yêu cầu'}
          </button>
          <Link to="/shop/orders" className="mt-4 block text-center text-xs font-semibold text-[#76534D]">Mở lịch sử đơn hàng</Link>
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
      <p className="mt-2 text-sm text-[#806B65]">Đơn được tạo ở trạng thái chờ xử lý. Bước này chưa thực hiện thanh toán trực tuyến.</p>

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
              <p className="mt-1 text-xs leading-5 text-[#806B65]">Để trống địa chỉ nếu bạn nhận tại cửa hàng.</p>
            </div>
            <label className="grid gap-1.5 text-xs font-semibold text-[#675650]">
              Địa chỉ giao hàng (không bắt buộc)
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
              {cart.items.map((item) => {
                const product = productById.get(item.productId)
                return (
                  <div key={item.productId} className="flex justify-between gap-3 text-xs">
                    <span className="text-[#806B65]">{product?.name || `Sản phẩm #${item.productId}`} × {item.quantity}</span>
                    <strong className="whitespace-nowrap text-[#4A302B]">{product ? moneyFormat.format(product.price * item.quantity) : '—'}</strong>
                  </div>
                )
              })}
            </div>
            {quoteLoading ? (
              <p role="status" className="py-4 text-xs text-[#806B65]">Đang lấy báo giá từ máy chủ...</p>
            ) : quote ? (
              <div className="mt-4 space-y-2 text-xs">
                <div className="flex justify-between gap-3"><span className="text-[#806B65]">Tạm tính</span><span>{moneyFormat.format(Number(quote.totalAmount))}</span></div>
                <div className="flex justify-between gap-3"><span className="text-[#806B65]">Giảm giá</span><span>{moneyFormat.format(Number(quote.discountAmount))}</span></div>
                <div className="flex justify-between gap-3 border-t border-[#EAE3DA] pt-3 text-sm font-bold text-[#76534D]"><span>Cần thanh toán</span><span>{moneyFormat.format(Number(quote.finalAmount))}</span></div>
              </div>
            ) : !quoteError && <p className="mt-4 text-xs text-[#806B65]">Báo giá sẽ hiển thị sau khi máy chủ kiểm tra giỏ hàng.</p>}
            <button
              type="submit"
              disabled={isSubmitting || quoteLoading || !quote || Boolean(quoteError)}
              className="mt-5 flex h-11 w-full items-center justify-center rounded-full bg-[#76534D] px-5 text-xs font-semibold text-white hover:bg-[#4A302B] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? 'Đang gửi đơn...' : 'Xác nhận đặt hàng'}
            </button>
            <Link to="/shop/cart" className="mt-3 block text-center text-xs font-semibold text-[#76534D]">Quay lại giỏ hàng</Link>
          </aside>
        </form>
      )}
    </section>
  )
}
