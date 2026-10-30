import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Button from '../../../components/Button.jsx'
import ErrorState from '../../../components/ErrorState.jsx'
import Icon from '../../../components/Icon.jsx'
import LoadingState from '../../../components/LoadingState.jsx'
import Modal from '../../../components/Modal.jsx'
import Pagination, { usePagination } from '../../../components/Pagination.jsx'
import ReceiptModal from '../../../components/ReceiptModal.jsx'
import CartPanel from '../components/CartPanel.jsx'
import ProductCard from '../components/ProductCard.jsx'
import { reconcilePosCartWithCatalog } from '../services/posCatalog.js'
import { getCustomers } from '../../customers/services/customerService.js'
import {
  createOrder,
  getEmployees,
  quotePosOrder,
} from '../../orders/services/orderService.js'
import { createPayment, simulatePayment } from '../../payments/services/paymentService.js'
import { getProducts } from '../../products/services/productService.js'
import { getPromotions } from '../../promotions/services/promotionService.js'
import { getPromotionProducts } from '../../promotion-products/services/promotionProductService.js'
import { getUserFacingErrorMessage } from '../../../services/apiClient.js'

const moneyFormat = new Intl.NumberFormat('vi-VN')
const walkInCustomerEmail = 'pos.walkin@example.invalid'
const paymentMethods = [
  { value: 'CASH', label: 'Tiền mặt', icon: '💵' },
  { value: 'CARD', label: 'Quẹt thẻ ATM/Visa', icon: '💳' },
  { value: 'EWALLET', label: 'Chuyển khoản / Ví QR', icon: '📱' },
]

function getErrorMessage(error) {
  return getUserFacingErrorMessage(error)
}

function formatMoney(value) {
  const amount = Number(value)
  return Number.isFinite(amount) ? `${moneyFormat.format(amount)} ₫` : '—'
}

function normalizeProducts(result) {
  if (!Array.isArray(result)) {
    throw new Error('Chưa thể tải danh sách sản phẩm. Vui lòng thử lại.')
  }
  return result.map((product) => {
    const price = Number(product.price)
    const stock = Number(product.quantity)
    if (
      !Number.isFinite(Number(product.id)) ||
      typeof product.name !== 'string' ||
      !Number.isFinite(price) ||
      !Number.isInteger(stock) ||
      stock < 0
    ) {
      throw new Error('Thông tin sản phẩm chưa đầy đủ. Vui lòng tải lại danh sách.')
    }
    return {
      ...product,
      id: Number(product.id),
      price,
      stock,
      category: product.category?.name ?? product.categoryName ?? 'Khác',
    }
  })
}

export default function PosPage({
  onToast,
  cart,
  onCartChange,
  note,
  onNoteChange,
}) {
  const [products, setProducts] = useState([])
  const [customers, setCustomers] = useState([])
  const [employees, setEmployees] = useState([])
  const [catalogLoading, setCatalogLoading] = useState(true)
  const [catalogError, setCatalogError] = useState('')
  const [category, setCategory] = useState('Tất cả')
  const [search, setSearch] = useState('')
  const [cartOpen, setCartOpen] = useState(false)
  const [quote, setQuote] = useState(null)
  const [quoteLoading, setQuoteLoading] = useState(false)
  const [quoteError, setQuoteError] = useState('')
  const [promotionDetails, setPromotionDetails] = useState({})
  const [catalogPriceLoading, setCatalogPriceLoading] = useState(true)

  // Modal checkout
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [checkoutStep, setCheckoutStep] = useState('input') // 'input' | 'success'
  const [customerId, setCustomerId] = useState('')
  const [useLoyaltyPoints, setUseLoyaltyPoints] = useState(false)
  const [loyaltyPointsToRedeem, setLoyaltyPointsToRedeem] = useState(0)
  const [employeeId, setEmployeeId] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('CASH')
  const [cashGiven, setCashGiven] = useState('')
  const [createdOrder, setCreatedOrder] = useState(null)
  const [createdPayment, setCreatedPayment] = useState(null)
  const [checkoutError, setCheckoutError] = useState('')
  const [processing, setProcessing] = useState(false)
  const [showReceipt, setShowReceipt] = useState(false)

  const catalogRequestRef = useRef(null)

  const loadCatalogs = useCallback(async ({ signal } = {}) => {
    setCatalogLoading(true)
    setCatalogError('')
    try {
      const [productResult, customerResult, employeeResult] = await Promise.all([
        getProducts({ signal }),
        getCustomers({ signal }),
        getEmployees({ signal }),
      ])
      if (!Array.isArray(customerResult) || !Array.isArray(employeeResult)) {
        throw new Error('Chưa thể tải thông tin khách hàng và nhân viên. Vui lòng thử lại.')
      }
      const normalizedProducts = normalizeProducts(productResult)
      setProducts(normalizedProducts)
      setCatalogPriceLoading(true)
      setQuote(null)
      onCartChange((current) => reconcilePosCartWithCatalog(current, normalizedProducts))
      setCustomers(customerResult)
      setEmployees(employeeResult)
    } catch (error) {
      if (signal?.aborted || error?.name === 'AbortError') return
      setCatalogError(getErrorMessage(error))
    } finally {
      if (!signal?.aborted) setCatalogLoading(false)
    }
  }, [onCartChange])

  useEffect(() => {
    const controller = new AbortController()
    catalogRequestRef.current = controller
    void loadCatalogs({ signal: controller.signal })
    return () => {
      controller.abort()
      catalogRequestRef.current = null
    }
  }, [loadCatalogs])

  useEffect(() => {
    let active = true
    async function loadPromotions() {
      try {
        const [promotions, promotionProducts] = await Promise.all([
          getPromotions(),
          getPromotionProducts(),
        ])
        if (!active) return
        const activePromotions = new Map(
          promotions.filter((p) => p.status === 'ACTIVE').map((p) => [p.id, p]),
        )
        const details = {}
        for (const item of promotionProducts) {
          if (!activePromotions.has(item.promotionId)) continue
          const promo = activePromotions.get(item.promotionId)
          details[item.productId] = {
            discountPercent: item.discountPercent,
            promotionName: promo.name,
            promotionCode: promo.code,
          }
        }
        setPromotionDetails(details)
      } catch {
        // Fallback silently if promotion metadata load fails
      }
    }
    void loadPromotions()
    return () => {
      active = false
    }
  }, [])

  const quoteRequestRef = useRef(null)

  useEffect(() => {
    if (cart.length === 0) {
      quoteRequestRef.current?.abort()
      quoteRequestRef.current = null
      setQuote(null)
      setQuoteLoading(false)
      setQuoteError('')
      return
    }

    quoteRequestRef.current?.abort()
    const controller = new AbortController()
    quoteRequestRef.current = controller

    setQuoteLoading(true)
    setQuoteError('')

    const quotePayload = {
      items: cart.map((item) => ({
        productId: item.id,
        quantity: item.quantity,
      })),
    }

    quotePosOrder(quotePayload, { signal: controller.signal })
      .then((data) => {
        if (!controller.signal.aborted) {
          setQuote(data)
          setQuoteLoading(false)
        }
      })
      .catch((error) => {
        if (controller.signal.aborted || error?.name === 'AbortError') return
        setQuoteError(getErrorMessage(error))
        setQuoteLoading(false)
      })

    return () => {
      controller.abort()
    }
  }, [cart])

  const activeCustomers = useMemo(
    () =>
      customers
        .filter((customer) => customer.status === true)
        .sort((a, b) =>
          a.email === walkInCustomerEmail ? -1 : b.email === walkInCustomerEmail ? 1 : 0,
        ),
    [customers],
  )
  const selectedCustomer = activeCustomers.find((customer) => String(customer.id) === customerId)
  const isWalkInCustomer = selectedCustomer?.email === walkInCustomerEmail
  const availableLoyaltyPoints = selectedCustomer ? Number(selectedCustomer.loyaltyPoints ?? 0) : 0

  const activeEmployees = useMemo(
    () => employees.filter((employee) => employee.status === true),
    [employees],
  )
  const currentEmployee = useMemo(
    () => activeEmployees.find((employee) => employee.currentUser === true) || activeEmployees[0],
    [activeEmployees],
  )

  const activeProducts = useMemo(
    () => products.filter((product) => product.status === true && product.stock > 0),
    [products],
  )

  const categories = useMemo(
    () => ['Tất cả', ...new Set(activeProducts.map((product) => product.category))],
    [activeProducts],
  )

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('vi')
    return activeProducts.filter((product) => {
      const matchesCategory = category === 'Tất cả' || product.category === category
      const matchesSearch =
        !query ||
        `${product.name} ${product.category}`.toLocaleLowerCase('vi').includes(query)
      return matchesCategory && matchesSearch
    })
  }, [activeProducts, category, search])

  const productPagination = usePagination(filteredProducts, { initialPageSize: 12 })

  useEffect(() => {
    productPagination.setCurrentPage(1)
  }, [category, search])

  useEffect(() => {
    if (activeCustomers.length && !customerId) {
      const walkIn = activeCustomers.find((c) => c.email === walkInCustomerEmail)
      setCustomerId(String(walkIn?.id ?? activeCustomers[0].id))
    }
    if (currentEmployee && !employeeId) {
      setEmployeeId(String(currentEmployee.id))
    }
  }, [activeCustomers, currentEmployee, customerId, employeeId])

  const addToCart = (product) => {
    const existing = cart.find((item) => item.id === product.id)
    const currentQty = existing ? existing.quantity : 0
    if (currentQty >= product.stock) {
      onToast?.(`Không thể thêm: món "${product.name}" chỉ còn ${product.stock} chiếc trong kho.`)
      return
    }

    onCartChange((current) => {
      const itemIndex = current.findIndex((item) => item.id === product.id)
      if (itemIndex > -1) {
        return current.map((item, index) =>
          index === itemIndex ? { ...item, quantity: item.quantity + 1 } : item,
        )
      }
      return [
        ...current,
        {
          id: product.id,
          name: product.name,
          price: product.price,
          stock: product.stock,
          unit: product.unit || 'chiếc',
          quantity: 1,
          background: product.background,
          imageUrl: product.imageUrl,
        },
      ]
    })
  }

  const updateQuantity = (id, delta) => {
    const product = products.find((p) => p.id === id)
    onCartChange((current) =>
      current
        .map((item) => {
          if (item.id === id) {
            const nextQty = item.quantity + delta
            const maxAllowed = product?.stock ?? item.stock
            if (nextQty > maxAllowed) {
              onToast?.(`Chỉ còn ${maxAllowed} chiếc trong kho.`)
              return item
            }
            return { ...item, quantity: nextQty }
          }
          return item
        })
        .filter((item) => item.quantity > 0),
    )
  }

  const clearCart = () => {
    onCartChange([])
    onNoteChange('')
    setQuote(null)
  }

  const refreshProducts = async () => {
    try {
      const updatedProducts = normalizeProducts(await getProducts())
      setProducts(updatedProducts)
      onCartChange((current) => reconcilePosCartWithCatalog(current, updatedProducts))
    } catch {
      // Background sync, silently handle
    }
  }

  // Mở cửa sổ xác nhận bán hàng
  const openCheckout = () => {
    setCheckoutError('')
    setUseLoyaltyPoints(false)
    setLoyaltyPointsToRedeem(0)
    setCashGiven('')
    setCheckoutStep('input')
    setCheckoutOpen(true)
  }

  // ================= LUỒNG BÁN HÀNG TỐC ĐỘ CAO (1-CLICK COMPLETION) =================
  const submitCheckout = async (event) => {
    if (event) event.preventDefault()
    const targetEmployeeId = currentEmployee?.id || employeeId
    if (!createdOrder && (!customerId || !targetEmployeeId)) {
      setCheckoutError('Vui lòng chọn khách hàng và nhân viên lập đơn.')
      return
    }
    const currentSubtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
    const effectiveTotal = quote?.finalAmount != null ? Number(quote.finalAmount) : currentSubtotal

    if (effectiveTotal <= 0 && cart.length === 0) {
      setCheckoutError('Giỏ hàng chưa có sản phẩm nào.')
      return
    }

    setProcessing(true)
    setCheckoutError('')
    try {
      // 1. Tạo đơn hàng
      const order = await createOrder({
        customerId: Number(customerId),
        employeeId: Number(targetEmployeeId),
        deliveryAddress: null,
        note: note.trim() || null,
        applyProductPromotions: true,
        loyaltyPointsToRedeem: useLoyaltyPoints ? activePointsToRedeem : 0,
        items: cart.map((item) => ({
          productId: item.id,
          quantity: item.quantity,
        })),
      })
      setCreatedOrder(order)

      // 2. Tạo bản ghi thanh toán (nếu đơn 0đ thì phương thức là LOYALTY_POINTS)
      const effectivePaymentMethod = Number(order.finalAmount) <= 0 ? 'LOYALTY_POINTS' : paymentMethod
      const payment = await createPayment({
        orderId: order.id,
        paymentMethod: effectivePaymentMethod,
      })

      // 3. Tự động xác nhận thành công ngay lập tức cho thu ngân
      const confirmedPayment = await simulatePayment(payment.id, 'SUCCESS')
      setCreatedPayment(confirmedPayment)

      // 4. Cập nhật điểm khách hàng trong local state
      const earnedPoints = isWalkInCustomer ? 0 : Math.floor(Number(confirmedPayment.amount) / 10000)
      const redeemedPoints = useLoyaltyPoints ? activePointsToRedeem : Math.round(Number(order.discountAmount ?? 0) / 1000)
      if (earnedPoints > 0 || redeemedPoints > 0) {
        setCustomers((current) =>
          current.map((c) =>
            Number(c.id) === Number(customerId)
              ? {
                  ...c,
                  loyaltyPoints: Math.max(
                    0,
                    Number(c.loyaltyPoints ?? 0) - redeemedPoints + earnedPoints,
                  ),
                }
              : c,
          ),
        )
      }

      // 5. Cập nhật tồn kho local ngay tức thì
      setProducts((current) =>
        current.map((p) => {
          const cartItem = cart.find((item) => item.id === p.id)
          return cartItem ? { ...p, stock: Math.max(0, p.stock - cartItem.quantity) } : p
        }),
      )

      // 6. Xóa giỏ hàng và chuyển sang view thành công
      clearCart()
      setCheckoutStep('success')
      onToast?.(`Đơn ${order.orderCode} đã thanh toán thành công!`)

      // Đồng bộ ngầm tồn kho thực tế từ backend
      void refreshProducts()
    } catch (error) {
      setCheckoutError(getErrorMessage(error))
    } finally {
      setProcessing(false)
    }
  }

  // Đóng modal và reset trạng thái bán hàng
  const closeCheckout = () => {
    if (processing) return
    setCheckoutOpen(false)
    setCreatedOrder(null)
    setCreatedPayment(null)
    setCheckoutError('')
    setUseLoyaltyPoints(false)
    setLoyaltyPointsToRedeem(0)
    setCashGiven('')
    setCheckoutStep('input')
  }

  // Tính số tiền cần thu sau khi trừ khuyến mãi và điểm tích lũy
  const currentSubtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const subtotalBeforePoints = createdOrder
    ? Number(createdOrder.finalAmount)
    : quote?.subtotalAfterPromotions != null
      ? Number(quote.subtotalAfterPromotions)
      : (quote?.finalAmount != null ? Number(quote.finalAmount) : currentSubtotal)

  const maxRedeemableForOrder = Math.min(
    availableLoyaltyPoints,
    Math.floor(subtotalBeforePoints / 1000)
  )

  const activePointsToRedeem = useLoyaltyPoints
    ? Math.min(maxRedeemableForOrder, Math.max(0, Number(loyaltyPointsToRedeem || 0)))
    : 0

  const loyaltyDiscount = activePointsToRedeem * 1000

  const payableAmount = createdOrder
    ? Number(createdOrder.finalAmount)
    : Math.max(0, subtotalBeforePoints - loyaltyDiscount)

  const cashGivenNum = Number(cashGiven) || 0
  const changeDue = Math.max(0, cashGivenNum - payableAmount)

  // Nạp nhanh tiền khách đưa
  const handleQuickCash = (amount) => {
    setCashGiven(String(amount))
  }

  const refreshCatalog = () => {
    catalogRequestRef.current?.abort()
    const controller = new AbortController()
    catalogRequestRef.current = controller
    setPromotionDetails({})
    void loadCatalogs({ signal: controller.signal })
  }

  return (
    <>
      <div className="flex min-h-[calc(100vh-140px)] w-full max-w-full items-start gap-3.5 xl:gap-4 overflow-hidden">
        {/* Khu vực danh mục & lưới sản phẩm */}
        <section className="min-w-0 flex-1 pb-24 lg:pb-0">
          <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h2 className="font-display text-xl font-bold text-rosewood">Menu Bán Tại Quầy (POS)</h2>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative min-w-0 flex-1 sm:w-64 sm:flex-none">
                <Icon
                  name="search"
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-rosewood"
                />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Tìm theo tên bánh..."
                  aria-label="Tìm sản phẩm"
                  className="h-10 w-full rounded-xl border border-border bg-paper pl-9 pr-3 text-[11px] text-rosewood outline-none placeholder:text-muted transition hover:border-caramel-hover focus:border-caramel-hover"
                />
              </div>
              <button
                type="button"
                onClick={refreshCatalog}
                disabled={catalogLoading}
                className="h-10 shrink-0 whitespace-nowrap rounded-xl border border-border bg-paper px-3 text-[11px] font-semibold text-rosewood transition hover:border-caramel-hover disabled:cursor-wait disabled:opacity-60"
              >
                {catalogLoading ? 'Đang đồng bộ…' : '🔄 Đồng bộ'}
              </button>
            </div>
          </div>

          {catalogLoading ? (
            <LoadingState label="Đang tải danh sách bánh và giá bán..." />
          ) : catalogError ? (
            <ErrorState
              title="Không thể tải dữ liệu bán hàng"
              description={catalogError}
              onRetry={() => loadCatalogs()}
            />
          ) : (
            <>
              {/* Danh mục dạng Pills Tabs */}
              <div
                className="hide-scrollbar mb-4 flex gap-1.5 overflow-x-auto overscroll-x-contain pb-1"
                role="tablist"
                aria-label="Danh mục sản phẩm"
              >
                {categories.map((item) => (
                  <button
                    key={item}
                    type="button"
                    role="tab"
                    aria-selected={category === item}
                    onClick={() => setCategory(item)}
                    className={`whitespace-nowrap rounded-xl px-4 py-2 text-xs font-bold transition shadow-xs ${
                      category === item
                        ? 'bg-caramel text-white shadow-sm shadow-caramel/25'
                        : 'border border-border bg-paper text-rosewood/80 hover:border-caramel hover:text-rosewood hover:bg-caramel-soft/40'
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>

              {filteredProducts.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3">
                    {productPagination.pageItems.map((product) => {
                      const promo = promotionDetails[product.id]
                      const salePrice = promo
                        ? Math.round(product.price * (1 - promo.discountPercent / 100))
                        : product.price
                      return (
                        <ProductCard
                          key={product.id}
                          product={{
                            ...product,
                            originalPrice: product.price,
                            salePrice,
                            label: promo?.promotionCode
                              ? `Phiếu ${promo.promotionCode}`
                              : product.label,
                          }}
                          onAdd={addToCart}
                          quantityInCart={cart.find((item) => item.id === product.id)?.quantity ?? 0}
                        />
                      )
                    })}
                  </div>

                  <div className="mt-4">
                    <Pagination
                      currentPage={productPagination.currentPage}
                      pageSize={productPagination.pageSize}
                      totalItems={productPagination.totalItems}
                      onPageChange={productPagination.setCurrentPage}
                      onPageSizeChange={productPagination.setPageSize}
                    />
                  </div>
                </>
              ) : (
                <div className="rounded-2xl border border-dashed border-border bg-paper px-5 py-12 text-center">
                  <p className="font-display text-base text-rosewood">Không tìm thấy món bánh nào</p>
                  <p className="mt-1 text-[11px] text-muted">
                    Thử tìm kiếm từ khóa khác hoặc chọn mục Tất cả.
                  </p>
                </div>
              )}
            </>
          )}
        </section>

        {/* Cột giỏ hàng bên phải */}
        <CartPanel
          cart={cart}
          quote={quote}
          quoteLoading={quoteLoading}
          quoteError={quoteError}
          onQuantityChange={updateQuantity}
          onRemove={(id) => onCartChange((current) => current.filter((item) => item.id !== id))}
          onCheckout={openCheckout}
          onClear={clearCart}
          mobileOpen={cartOpen}
          onClose={() => setCartOpen(false)}
          note={note}
          onNoteChange={onNoteChange}
        />
      </div>

      {/* Nút giỏ hàng trên điện thoại & tablet nhỏ */}
      <button
        type="button"
        onClick={() => setCartOpen(true)}
        className="fixed inset-x-0 bottom-0 z-20 flex justify-center border-t border-border bg-cream/95 px-4 pt-3 shadow-[0_-8px_24px_rgba(74,48,43,0.08)] backdrop-blur-md lg:hidden"
        style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}
      >
        <span className="flex h-12 w-full max-w-[480px] items-center justify-center gap-2 rounded-xl bg-caramel text-xs font-bold text-action-ink shadow-md shadow-caramel/20 transition hover:bg-caramel-hover">
          <Icon name="cart" size={17} /> Giỏ hàng ({formatMoney(payableAmount)})
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-paper px-1 text-[10px] font-bold text-rosewood">
            {cart.reduce((sum, item) => sum + item.quantity, 0)}
          </span>
        </span>
      </button>

      {/* ================= MODAL XÁC NHẬN BÁN HÀNG TỐC ĐỘ CAO ================= */}
      <Modal
        open={checkoutOpen}
        title={checkoutStep === 'success' ? 'Thanh toán thành công' : 'Thu tiền & Hoàn tất đơn hàng'}
        onClose={closeCheckout}
        closeDisabled={processing}
        size="max-w-lg"
      >
        {checkoutStep === 'input' ? (
          <form onSubmit={submitCheckout} className="space-y-4">
            {/* Box tổng tiền to rõ */}
            <div className={`rounded-2xl border p-5 text-center transition-all ${
              payableAmount === 0
                ? 'border-emerald-300 bg-gradient-to-br from-emerald-50/90 via-teal-50/30 to-white shadow-xs'
                : 'border-amber-200/80 bg-gradient-to-br from-amber-50/90 via-orange-50/40 to-white shadow-xs'
            }`}>
              <span className={`text-xs font-bold uppercase tracking-wider ${
                payableAmount === 0 ? 'text-emerald-900' : 'text-amber-900/80'
              }`}>
                {payableAmount === 0 ? 'Số tiền cần thu (Đã trừ điểm thưởng)' : 'Tổng số tiền cần thu'}
              </span>
              <div className={`mt-1 text-3xl sm:text-4xl font-extrabold tracking-tight ${
                payableAmount === 0 ? 'text-emerald-700' : 'text-stone-900'
              }`}>
                {formatMoney(payableAmount)}
              </div>
              <p className="mt-1.5 text-xs text-stone-600 font-medium">
                {cart.reduce((sum, item) => sum + item.quantity, 0)} sản phẩm ({cart.length} món)
                {loyaltyDiscount > 0 && ` · Đã giảm ${formatMoney(loyaltyDiscount)} từ ${activePointsToRedeem} điểm`}
                {Number(quote?.productDiscountAmount ?? 0) > 0 &&
                  ` · Tiết kiệm ${formatMoney(quote.productDiscountAmount)}`}
              </p>
            </div>

            {/* Thông tin khách hàng & Điểm tích lũy */}
            <div className="rounded-xl border border-border bg-white p-3.5 space-y-3 text-xs">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-[11px] font-semibold text-rosewood mb-1">
                    Khách hàng mua bánh
                  </label>
                  <select
                    value={customerId}
                    onChange={(e) => {
                      setCustomerId(e.target.value)
                      setUseLoyaltyPoints(false)
                      setLoyaltyPointsToRedeem(0)
                    }}
                    className="h-9 w-full rounded-xl border border-border bg-paper px-2.5 text-xs font-semibold text-rosewood outline-none focus:border-caramel"
                  >
                    {activeCustomers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.fullName || c.name || c.phone || 'Khách vãng lai'} {c.phone ? `(${c.phone})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-rosewood mb-1">
                    Thu ngân ca trực
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={currentEmployee?.fullName ?? 'Thu ngân quầy'}
                    className="h-9 w-full rounded-xl border border-border bg-stone-50 px-2.5 text-xs font-medium text-stone-700 outline-none"
                  />
                </div>
              </div>

              {/* Sử dụng điểm tích lũy */}
              {!isWalkInCustomer && availableLoyaltyPoints > 0 && (
                <div className="border-t border-dotted border-border pt-2.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-rosewood">Điểm tích lũy hiện có:</span>{' '}
                      <strong className="text-emerald-700 font-bold">{availableLoyaltyPoints} điểm</strong>
                    </div>
                    <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-rosewood">
                      <input
                        type="checkbox"
                        checked={useLoyaltyPoints}
                        onChange={(e) => {
                          const next = e.target.checked
                          setUseLoyaltyPoints(next)
                          setLoyaltyPointsToRedeem(next ? maxRedeemableForOrder : 0)
                        }}
                        className="accent-caramel h-4 w-4 rounded"
                      />
                      <span>Đổi điểm giảm tiền</span>
                    </label>
                  </div>

                  {useLoyaltyPoints && (
                    <div className="mt-2.5 flex items-center gap-2.5">
                      <input
                        type="number"
                        min="0"
                        max={maxRedeemableForOrder}
                        step="1"
                        value={loyaltyPointsToRedeem}
                        onChange={(e) => {
                          const val = Math.max(
                            0,
                            Math.min(maxRedeemableForOrder, Number(e.target.value) || 0),
                          )
                          setLoyaltyPointsToRedeem(val)
                        }}
                        className="h-9 w-24 rounded-xl border border-caramel bg-white px-3 text-xs font-bold text-rosewood outline-none focus:ring-2 focus:ring-caramel/30"
                      />
                      <span className="text-[11px] text-muted font-medium">
                        Giảm: <strong className="text-emerald-700 font-bold">{formatMoney(loyaltyDiscount)}</strong> (1 điểm = 1.000 đ)
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Khối thanh toán: Khi còn tiền phải thu thì hiện chọn phương thức; Khi = 0 thì ẩn đi */}
            {payableAmount === 0 ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-4 text-center">
                <div className="flex items-center justify-center gap-2 text-emerald-800 font-bold text-sm">
                  <span>✨</span>
                  <span>Đã thanh toán 100% bằng điểm tích lũy ({activePointsToRedeem} điểm)</span>
                </div>
                <p className="mt-1 text-xs text-emerald-600">
                  Khách không cần trả thêm tiền mặt hoặc quét thẻ. Bấm hoàn tất để xuất hóa đơn ngay.
                </p>
              </div>
            ) : (
              <div className="rounded-xl border border-border bg-white p-3.5 space-y-3">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-muted">
                  Hình thức thanh toán
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {paymentMethods.map((method) => {
                    const isSelected = paymentMethod === method.value
                    return (
                      <button
                        key={method.value}
                        type="button"
                        onClick={() => setPaymentMethod(method.value)}
                        className={`flex flex-col items-center justify-center rounded-xl border py-2.5 text-center transition ${
                          isSelected
                            ? 'border-caramel bg-caramel-soft/40 font-bold text-rosewood ring-2 ring-caramel/30'
                            : 'border-border bg-white font-medium text-stone-600 hover:border-caramel/60 hover:bg-stone-50'
                        }`}
                      >
                        <span className="text-base mb-0.5">{method.icon}</span>
                        <span className="text-[11px]">{method.label}</span>
                      </button>
                    )
                  })}
                </div>

                {/* Tiền khách đưa khi chọn Tiền mặt */}
                {paymentMethod === 'CASH' && (
                  <div className="space-y-2 border-t border-border pt-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-rosewood">Tiền khách đưa (đ):</span>
                      {cashGivenNum >= payableAmount && payableAmount > 0 && (
                        <span className="text-emerald-700 font-bold">
                          Tiền thừa trả khách: <strong>{formatMoney(changeDue)}</strong>
                        </span>
                      )}
                    </div>
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      value={cashGiven}
                      onChange={(e) => setCashGiven(e.target.value)}
                      placeholder={`Nhập số tiền hoặc bấm nút bên dưới (${formatMoney(payableAmount)})`}
                      className="h-10 w-full rounded-xl border border-border bg-paper px-3 text-sm font-bold text-rosewood outline-none focus:border-caramel"
                    />
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={() => handleQuickCash(payableAmount)}
                        className="rounded-lg border border-caramel/40 bg-caramel-soft px-2.5 py-1 text-[11px] font-bold text-rosewood transition hover:bg-caramel/30"
                      >
                        Đủ tiền
                      </button>
                      {[50000, 100000, 200000, 500000].map((amt) => {
                        if (amt < payableAmount) return null
                        return (
                          <button
                            key={amt}
                            type="button"
                            onClick={() => handleQuickCash(amt)}
                            className="rounded-lg border border-border bg-white px-2.5 py-1 text-[11px] font-medium text-stone-700 transition hover:border-caramel hover:text-caramel"
                          >
                            {formatMoney(amt)}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {checkoutError && (
              <p role="alert" className="rounded-xl border border-danger-line bg-danger-soft p-3 text-xs text-danger font-medium">
                {checkoutError}
              </p>
            )}

            <div className="flex items-center gap-2.5 pt-2">
              <Button type="button" variant="secondary" disabled={processing} onClick={closeCheckout}>
                Hủy bỏ
              </Button>
              <button
                type="submit"
                disabled={processing || (paymentMethod === 'CASH' && payableAmount > 0 && cashGivenNum < payableAmount)}
                className="flex-1 rounded-xl bg-caramel py-3 text-xs font-bold text-action-ink shadow-md shadow-caramel/20 transition hover:bg-caramel-hover active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-rosewood-soft disabled:text-white disabled:shadow-none"
              >
                {processing
                  ? 'Đang xử lý đơn…'
                  : payableAmount === 0
                    ? '✓ Xác nhận hoàn tất đơn (0 ₫)'
                    : `✓ Xác nhận thu tiền ${formatMoney(payableAmount)}`}
              </button>
            </div>
          </form>
        ) : (
          /* View Thành công */
          <div className="text-center py-4 space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 shadow-sm">
              <Icon name="check" size={32} />
            </div>
            <div>
              <h3 className="font-display text-xl font-bold text-rosewood">Thanh toán hoàn tất!</h3>
              <p className="mt-1 text-xs text-muted">
                Đơn hàng <strong className="text-rosewood">{createdOrder?.orderCode}</strong> đã được lưu thành công.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-petal/60 p-4 text-xs space-y-2 text-left">
              <div className="flex justify-between">
                <span className="text-muted">Tổng tiền hóa đơn:</span>
                <strong className="text-rosewood">{formatMoney(createdOrder?.finalAmount)}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Phương thức thanh toán:</span>
                <span className="font-semibold text-rosewood">
                  {createdOrder?.finalAmount === 0
                    ? '✨ Điểm tích lũy (100%)'
                    : paymentMethods.find((p) => p.value === paymentMethod)?.label ?? paymentMethod}
                </span>
              </div>
              {paymentMethod === 'CASH' && cashGivenNum > 0 && (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted">Tiền khách đưa:</span>
                    <span>{formatMoney(cashGivenNum)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-800 font-bold border-t border-border pt-1">
                    <span>Tiền thừa trả khách:</span>
                    <span>{formatMoney(changeDue)}</span>
                  </div>
                </>
              )}
            </div>

            <div className="flex justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowReceipt(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-white px-4 py-2.5 text-xs font-bold text-rosewood shadow-sm transition hover:border-caramel hover:text-caramel"
              >
                🖨️ In hóa đơn
              </button>
              <Button onClick={closeCheckout}>
                Đơn tiếp theo
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal In hóa đơn */}
      <ReceiptModal
        open={showReceipt}
        onClose={() => setShowReceipt(false)}
        order={createdOrder}
        customer={selectedCustomer}
        employee={currentEmployee}
        payment={createdPayment}
        cashGiven={cashGivenNum}
        changeDue={changeDue}
      />
    </>
  )
}
