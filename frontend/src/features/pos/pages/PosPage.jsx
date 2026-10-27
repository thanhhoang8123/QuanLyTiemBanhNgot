import { useCallback, useEffect, useMemo, useState } from 'react'
import Button from '../../../components/Button.jsx'
import ErrorState from '../../../components/ErrorState.jsx'
import FormField from '../../../components/FormField.jsx'
import Icon from '../../../components/Icon.jsx'
import LoadingState from '../../../components/LoadingState.jsx'
import Modal from '../../../components/Modal.jsx'
import Pagination, { usePagination } from '../../../components/Pagination.jsx'
import CartPanel from '../components/CartPanel.jsx'
import ProductCard from '../components/ProductCard.jsx'
import { reconcilePosCartWithCatalog } from '../services/posCatalog.js'
import { getCustomers } from '../../customers/services/customerService.js'
import {
  cancelOrder,
  createOrder,
  getEmployees,
  quotePosOrder,
} from '../../orders/services/orderService.js'
import { createPayment, getPayments, simulatePayment } from '../../payments/services/paymentService.js'
import { getProducts } from '../../products/services/productService.js'
import { getPromotions } from '../../promotions/services/promotionService.js'
import { getPromotionProducts } from '../../promotion-products/services/promotionProductService.js'
import { getUserFacingErrorMessage } from '../../../services/apiClient.js'

const inputClass = 'h-10 w-full rounded-xl border border-border bg-white px-3 text-sm text-rosewood outline-none transition focus:border-caramel'
const moneyFormat = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 })
const walkInCustomerEmail = 'pos.walkin@example.invalid'
const paymentMethods = [
  { value: 'CASH', label: 'Tiền mặt' },
  { value: 'CARD', label: 'Thẻ' },
  { value: 'EWALLET', label: 'Ví điện tử' },
]
const paymentStatusLabels = {
  PENDING: 'Chờ thanh toán',
  SUCCESS: 'Thành công',
  FAILED: 'Chưa thành công',
}

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
    if (!Number.isFinite(Number(product.id))
        || typeof product.name !== 'string'
        || !Number.isFinite(price)
        || !Number.isInteger(stock)
        || stock < 0) {
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
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [customerId, setCustomerId] = useState('')
  const [useLoyaltyPoints, setUseLoyaltyPoints] = useState(false)
  const [loyaltyPointsToRedeem, setLoyaltyPointsToRedeem] = useState(0)
  const [employeeId, setEmployeeId] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('CASH')
  const [createdOrder, setCreatedOrder] = useState(null)
  const [createdPayment, setCreatedPayment] = useState(null)
  const [checkoutError, setCheckoutError] = useState('')
  const [processing, setProcessing] = useState(false)

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
      if (signal?.aborted || error.name === 'AbortError') return
      setCatalogError(getErrorMessage(error))
    } finally {
      if (!signal?.aborted) setCatalogLoading(false)
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    loadCatalogs({ signal: controller.signal })
    return () => controller.abort()
  }, [loadCatalogs])

  // Dùng cùng API khuyến mãi với website. Nếu API khuyến mãi lỗi thì POS vẫn tải sản phẩm bình thường.
  useEffect(() => {
    const controller = new AbortController()
    Promise.all([
      getPromotions({ signal: controller.signal }),
      getPromotionProducts({ signal: controller.signal }),
    ]).then(([promotionResult, linkResult]) => {
      if (controller.signal.aborted) return
      const today = new Date().toISOString().slice(0, 10)
      const activePromotions = (Array.isArray(promotionResult) ? promotionResult : []).filter((promotion) => (
        promotion.status === true
        && (!promotion.startDate || String(promotion.startDate).slice(0, 10) <= today)
        && (!promotion.endDate || String(promotion.endDate).slice(0, 10) >= today)
        && Number(promotion.discountPercent) > 0
      ))
      const activeById = new Map(activePromotions.map((promotion) => [String(promotion.id), promotion]))
      const nextDetails = {}
      for (const link of (Array.isArray(linkResult) ? linkResult : [])) {
        const promotion = activeById.get(String(link.promotionId))
        const productId = Number(link.productId)
        if (!promotion || !Number.isFinite(productId) || nextDetails[productId]) continue
        nextDetails[productId] = promotion
      }
      setPromotionDetails(nextDetails)
    }).catch((error) => {
      if (!controller.signal.aborted && error.name !== 'AbortError') {
        setPromotionDetails({})
      }
    })
    return () => controller.abort()
  }, [])

  // Tính giá trưng bày theo cùng công thức với thẻ sản phẩm trên website.
  const getPosPromotionPrice = useCallback((product) => {
    const promotion = promotionDetails[product.id]
    const percent = Math.min(100, Math.max(0, Number(promotion?.discountPercent) || 0))
    return promotion && percent > 0
      ? Math.round(Number(product.price) * (1 - percent / 100))
      : Number(product.price)
  }, [promotionDetails])

  const activeCustomers = useMemo(
    () => customers
      .filter((customer) => customer.status === true)
      .sort((first, second) => Number(second.email === walkInCustomerEmail) - Number(first.email === walkInCustomerEmail)),
    [customers],
  )
  const selectedCustomer = activeCustomers.find((customer) => String(customer.id) === customerId)
  const isWalkInCustomer = selectedCustomer?.email === walkInCustomerEmail
  const activeEmployees = useMemo(
    () => employees.filter((employee) => employee.status === true),
    [employees],
  )
  const currentEmployee = useMemo(
    () => activeEmployees.find((employee) => employee.currentUser === true),
    [activeEmployees],
  )
  const activeProducts = useMemo(
    () => products.filter((product) => product.status === true && product.stock > 0),
    [products],
  )
  const activeProductIds = useMemo(
    () => activeProducts.map((product) => product.id),
    [activeProducts],
  )
  const categories = useMemo(
    () => ['Tất cả', ...new Set(activeProducts.map((product) => product.category))],
    [activeProducts],
  )
  const filteredProducts = useMemo(() => activeProducts.filter((product) => {
    const matchesCategory = category === 'Tất cả' || product.category === category
    const matchesSearch = `${product.name} ${product.category}`
      .toLocaleLowerCase('vi')
      .includes(search.trim().toLocaleLowerCase('vi'))
    return matchesCategory && matchesSearch
  }), [activeProducts, category, search])
  const productPagination = usePagination(filteredProducts)
  const availableLoyaltyPoints = Number(selectedCustomer?.loyaltyPoints ?? 0)

  useEffect(() => {
    if (isWalkInCustomer) {
      setUseLoyaltyPoints(false)
      setLoyaltyPointsToRedeem(0)
    } else if (loyaltyPointsToRedeem > availableLoyaltyPoints) {
      setLoyaltyPointsToRedeem(availableLoyaltyPoints)
    }
  }, [availableLoyaltyPoints, isWalkInCustomer, loyaltyPointsToRedeem])

  useEffect(() => {
    if (activeCustomers.length && !activeCustomers.some((customer) => String(customer.id) === customerId)) {
      setCustomerId(String(activeCustomers[0].id))
    }
    if (String(currentEmployee?.id ?? '') !== employeeId) {
      setEmployeeId(currentEmployee ? String(currentEmployee.id) : '')
    }
  }, [activeCustomers, activeEmployees, currentEmployee, customerId, employeeId])

  useEffect(() => {
    if (createdOrder) {
      setQuoteError('')
      setQuoteLoading(false)
      setCatalogPriceLoading(false)
      return undefined
    }

    const controller = new AbortController()
    setQuote(null)
    setQuoteError('')
    setQuoteLoading(true)
    setCatalogPriceLoading(true)
    const timeoutId = window.setTimeout(async () => {
      try {
        const result = await quotePosOrder({
          items: cart.map((item) => ({
            productId: item.id,
            quantity: item.quantity,
          })),
          productIds: activeProductIds,
          customerId: customerId ? Number(customerId) : null,
          loyaltyPointsToRedeem: useLoyaltyPoints
            ? Number(loyaltyPointsToRedeem)
            : 0,
        }, { signal: controller.signal })
        if (typeof result?.finalAmount !== 'string' && typeof result?.finalAmount !== 'number') {
          throw new Error('Chưa thể xác nhận báo giá. Vui lòng kiểm tra giỏ hàng và thử lại.')
        }
        const totalAmount = Number(result.totalAmount)
        const productDiscountAmount = Number(result.productDiscountAmount)
        const subtotalAfterPromotions = Number(result.subtotalAfterPromotions)
        const loyaltyDiscountAmount = Number(result.loyaltyDiscountAmount)
        const finalAmount = Number(result.finalAmount)
        if (
          !Number.isFinite(totalAmount)
          || !Number.isFinite(productDiscountAmount)
          || !Number.isFinite(subtotalAfterPromotions)
          || !Number.isFinite(loyaltyDiscountAmount)
          || !Number.isFinite(finalAmount)
          || totalAmount < 0
          || productDiscountAmount < 0
          || productDiscountAmount > totalAmount
          || loyaltyDiscountAmount < 0
          || loyaltyDiscountAmount > subtotalAfterPromotions
          || Math.abs(totalAmount - productDiscountAmount - subtotalAfterPromotions) >= 0.005
          || Math.abs(subtotalAfterPromotions - loyaltyDiscountAmount - finalAmount) >= 0.005
          || !Array.isArray(result.catalogPrices)
          || !Array.isArray(result.items)
        ) {
          throw new Error('Báo giá chưa khớp với sản phẩm trong giỏ hàng. Vui lòng kiểm tra lại.')
        }
        const quotedItemsById = new Map(result.items.map((item) => [
          Number(item.productId),
          Number(item.effectiveUnitPrice),
        ]))
        onCartChange((current) => {
          let changed = false
          const updated = current.map((item) => {
            const price = quotedItemsById.get(Number(item.id))
            if (!Number.isFinite(price)) return item
            const originalPrice = Number(item.originalPrice ?? products.find((product) => Number(product.id) === Number(item.id))?.price ?? item.price)
            if (Math.abs(item.price - price) < 0.005 && item.originalPrice != null) return item
            changed = true
            return { ...item, originalPrice, price }
          })
          return changed ? updated : current
        })
        setQuote(result)
      } catch (error) {
        if (!controller.signal.aborted && error.name !== 'AbortError') {
          setQuoteError(getErrorMessage(error))
        }
      } finally {
        if (!controller.signal.aborted) {
          setQuoteLoading(false)
          setCatalogPriceLoading(false)
        }
      }
    }, 250)

    return () => {
      window.clearTimeout(timeoutId)
      controller.abort()
    }
  }, [
    activeProductIds,
    cart,
    createdOrder,
    customerId,
    loyaltyPointsToRedeem,
    onCartChange,
    products,
    useLoyaltyPoints,
  ])

  const addToCart = (product) => {
    const selected = cart.find((item) => item.id === product.id)
    if ((selected?.quantity ?? 0) >= product.stock) {
      onToast(`Không đủ tồn kho cho ${product.name}.`)
      return
    }
    const salePrice = getPosPromotionPrice(product)
    onCartChange((current) => {
      const existing = current.find((item) => item.id === product.id)
      return existing
        ? current.map((item) => item.id === product.id
          ? { ...item, originalPrice: Number(item.originalPrice ?? product.price), price: salePrice, quantity: item.quantity + 1 }
          : item)
        : [...current, { ...product, originalPrice: Number(product.price), price: salePrice, quantity: 1 }]
    })
    onToast(`${product.name} đã được thêm vào đơn.`)
  }

  const updateQuantity = (id, delta) => {
    const product = products.find((item) => item.id === id)
    onCartChange((current) => current
      .map((item) => item.id === id
        ? { ...item, quantity: Math.min(item.quantity + delta, product?.stock ?? item.stock) }
        : item)
      .filter((item) => item.quantity > 0))
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
      setCatalogPriceLoading(true)
      setQuote(null)
      onCartChange((current) => reconcilePosCartWithCatalog(current, updatedProducts))
    } catch (error) {
      setCatalogError(`Không thể làm mới tồn kho: ${getErrorMessage(error)}`)
    }
  }

  const openCheckout = () => {
    setCheckoutError('')
    setUseLoyaltyPoints(false)
    setLoyaltyPointsToRedeem(0)
    setCheckoutOpen(true)
  }

  const createOrFindPayment = async (order) => {
    const verifyPaymentAmount = (payment) => {
      const paymentAmount = Number(payment?.amount)
      const expectedAmount = Number(order.finalAmount)
      if (
        Number(payment?.orderId) !== Number(order.id)
        || !Number.isFinite(paymentAmount)
        || !Number.isFinite(expectedAmount)
        || Math.round(paymentAmount * 100) !== Math.round(expectedAmount * 100)
      ) {
        throw new Error('Số tiền thanh toán chưa khớp với đơn hàng. Vui lòng kiểm tra lại trước khi tiếp tục.')
      }
      return payment
    }
    let payment
    try {
      payment = await createPayment({
        orderId: order.id,
        paymentMethod,
      })
    } catch (createError) {
      let existingPayment
      try {
        const payments = await getPayments()
        if (!Array.isArray(payments)) {
          throw new Error('Chưa thể kiểm tra trạng thái thanh toán. Vui lòng tải lại trang.')
        }
        existingPayment = payments.find(
          (payment) => Number(payment.orderId) === Number(order.id),
        )
      } catch (lookupError) {
        throw new Error(
          `Đơn ${order.orderCode} đã được lưu nhưng chưa xác nhận được trạng thái thanh toán. `
          + 'Vui lòng kiểm tra đơn hàng trước khi thử lại.',
          { cause: lookupError },
        )
      }
      if (!existingPayment) throw createError
      payment = existingPayment
    }
    return verifyPaymentAmount(payment)
  }

  const submitCheckout = async (event) => {
    event.preventDefault()
    if (!createdOrder && (!customerId || !employeeId)) {
      setCheckoutError('Vui lòng chọn khách hàng và nhân viên đang hoạt động.')
      return
    }
    if (!createdOrder && (!quote || quoteLoading || quoteError)) {
      setCheckoutError('Chưa thể xác nhận báo giá. Vui lòng kiểm tra giỏ hàng.')
      return
    }

    setProcessing(true)
    setCheckoutError('')
    let orderForPayment = createdOrder
    try {
      if (!orderForPayment) {
        orderForPayment = await createOrder({
          customerId: Number(customerId),
          employeeId: Number(employeeId),
          deliveryAddress: null,
          note: note.trim() || null,
          applyProductPromotions: true,
          loyaltyPointsToRedeem: useLoyaltyPoints
            ? Number(loyaltyPointsToRedeem)
            : 0,
          items: cart.map((item) => ({
            productId: item.id,
            quantity: item.quantity,
          })),
        })
        setCreatedOrder(orderForPayment)
      }
      const payment = await createOrFindPayment(orderForPayment)
      setCreatedPayment(payment)
      await refreshProducts()
    } catch (error) {
      setCheckoutError(getErrorMessage(error))
      if (orderForPayment) await refreshProducts()
    } finally {
      setProcessing(false)
    }
  }

  const simulateResult = async (result) => {
    if (!createdPayment) return
    setProcessing(true)
    setCheckoutError('')
    try {
      const payment = await simulatePayment(createdPayment.id, result)
      setCreatedPayment(payment)
      if (result === 'SUCCESS') {
        const earnedPoints = isWalkInCustomer
          ? 0
          : Math.floor(Number(payment.amount) / 10000)
        const redeemedPoints = Math.round(Number(createdOrder?.discountAmount ?? 0) / 1000)
        if (earnedPoints > 0 || redeemedPoints > 0) {
          setCustomers((current) => current.map((customer) => (
            Number(customer.id) === Number(customerId)
              ? {
                  ...customer,
                  loyaltyPoints: Math.max(
                    0,
                    Number(customer.loyaltyPoints ?? 0) - redeemedPoints + earnedPoints,
                  ),
                }
              : customer
          )))
        }
        clearCart()
        await refreshProducts()
        onToast(earnedPoints > 0 || redeemedPoints > 0
          ? `Giao dịch thử nghiệm của đơn ${createdOrder.orderCode} đã được ghi nhận; sử dụng ${redeemedPoints} điểm${earnedPoints > 0 ? `, cộng ${earnedPoints} điểm` : ''}.`
          : `Giao dịch thử nghiệm của đơn ${createdOrder.orderCode} đã được ghi nhận thành công.`)
      } else {
        onToast(`Giao dịch thử nghiệm của đơn ${createdOrder.orderCode} chưa thành công. Bạn có thể thử lại hoặc hủy đơn.`)
      }
    } catch (error) {
      setCheckoutError(getErrorMessage(error))
    } finally {
      setProcessing(false)
    }
  }

  const cancelCurrentOrder = async () => {
    if (!createdOrder) return
    setProcessing(true)
    setCheckoutError('')
    try {
      await cancelOrder(createdOrder.id)
      setCreatedOrder(null)
      setCreatedPayment(null)
      await refreshProducts()
      onToast(`Đơn ${createdOrder.orderCode} đã hủy; tồn kho được hoàn lại.`)
    } catch (error) {
      setCheckoutError(getErrorMessage(error))
    } finally {
      setProcessing(false)
    }
  }

  const closeCheckout = () => {
    if (processing || (createdOrder && createdPayment?.status !== 'SUCCESS')) return
    setCheckoutOpen(false)
    setCreatedOrder(null)
    setCreatedPayment(null)
    setCheckoutError('')
    setUseLoyaltyPoints(false)
    setLoyaltyPointsToRedeem(0)
  }

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0)
  const checkoutLocked = Boolean(createdOrder && createdPayment?.status !== 'SUCCESS')

  return (
    <>
      <div className="flex min-h-[calc(100vh-152px)] gap-4">
        <section className="min-w-0 flex-1 pb-28 xl:pb-0">
          <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h2 className="font-display text-xl text-rosewood">Chọn món bánh</h2>
              <p className="mt-1 text-xs text-muted">Bánh tươi mỗi ngày, chọn nhanh cho đơn hàng của bạn.</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative min-w-0 flex-1 sm:w-64 sm:flex-none">
                <Icon name="search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-rosewood" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Tìm tên bánh..."
                  aria-label="Tìm sản phẩm"
                  className="h-10 w-full rounded-xl border border-border bg-paper pl-9 pr-3 text-[11px] text-rosewood outline-none placeholder:text-muted transition hover:border-caramel-hover focus:border-caramel-hover"
                />
              </div>
              <span className="hidden h-10 items-center gap-2 rounded-xl border border-border bg-paper px-3 text-[10px] font-semibold text-rosewood md:flex">
                <Icon name="clock" size={14} /> Đơn tại quầy
              </span>
            </div>
          </div>

          {catalogLoading
            ? <LoadingState label="Đang tải sản phẩm và dữ liệu bán hàng..." />
            : catalogError
              ? <ErrorState
                  title="Không thể tải dữ liệu bán hàng"
                  description={catalogError}
                  onRetry={() => loadCatalogs()}
                />
              : (
                <>
                  <div className="hide-scrollbar mb-5 flex gap-2 overflow-x-auto overscroll-x-contain pb-1" role="tablist" aria-label="Danh mục sản phẩm">
                    {categories.map((item) => (
                      <button
                        key={item}
                        type="button"
                        role="tab"
                        aria-selected={category === item}
                        onClick={() => setCategory(item)}
                        className={`whitespace-nowrap rounded-full px-4 py-2 text-[11px] font-medium transition ${
                          category === item ? 'bg-rosewood font-semibold text-white shadow-sm' : 'border border-border bg-paper text-rosewood hover:border-caramel-hover hover:bg-petal'
                        }`}
                      >
                        {item}
                      </button>
                    ))}
                  </div>

                  <div className="mb-3 flex items-center justify-between">
                    <h2 className="font-display text-lg text-rosewood">{category === 'Tất cả' ? 'Sản phẩm đang bán' : category}</h2>
                    <span className="text-[11px] font-medium text-muted">{filteredProducts.length} sản phẩm còn hàng</span>
                  </div>

                  {filteredProducts.length > 0 ? (
                    <>
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 2xl:grid-cols-4">
                        {productPagination.pageItems.map((product) => (
                          <ProductCard
                            key={product.id}
                            product={{
                              ...product,
                              originalPrice: product.price,
                              salePrice: getPosPromotionPrice(product),
                              label: promotionDetails[product.id]?.discountPercent
                                ? `-${Number(promotionDetails[product.id].discountPercent)}% · ${promotionDetails[product.id].promotionCode ?? 'Khuyến mãi'}`
                                : product.label,
                            }}
                            onAdd={addToCart}
                            pricingLoading={catalogPriceLoading || Boolean(quoteError)}
                            quantityInCart={cart.find((item) => item.id === product.id)?.quantity ?? 0}
                          />
                        ))}
                      </div>
                      <Pagination
                        currentPage={productPagination.currentPage}
                        pageSize={productPagination.pageSize}
                        totalItems={productPagination.totalItems}
                        onPageChange={productPagination.setCurrentPage}
                        onPageSizeChange={productPagination.setPageSize}
                      />
                    </>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-border bg-paper px-5 py-12 text-center">
                      <p className="font-display text-base text-rosewood">Không tìm thấy sản phẩm</p>
                      <p className="mt-1 text-[11px] text-muted">Thử từ khóa/danh mục khác hoặc kiểm tra tồn kho.</p>
                    </div>
                  )}
                </>
              )}
        </section>

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

      <button
        type="button"
        onClick={() => setCartOpen(true)}
        className="fixed inset-x-0 bottom-0 z-20 flex justify-center border-t border-border bg-cream/95 px-4 pt-3 shadow-[0_-8px_24px_rgba(74,48,43,0.08)] backdrop-blur-md xl:hidden"
        style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}
      >
        <span className="flex h-12 w-full max-w-[480px] items-center justify-center gap-2 rounded-xl bg-caramel text-xs font-bold text-action-ink shadow-md shadow-caramel/20 transition hover:bg-caramel-hover">
          <Icon name="cart" size={17} /> Giỏ hàng
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-paper px-1 text-[10px] font-bold text-rosewood">{cartCount}</span>
        </span>
      </button>

      <Modal
        open={checkoutOpen}
        title={createdOrder ? `Đơn ${createdOrder.orderCode}` : 'Xác nhận bán hàng'}
        onClose={closeCheckout}
        closeDisabled={processing || checkoutLocked}
      >
        {!createdOrder ? (
          <form onSubmit={submitCheckout} className="space-y-4">
            <p className="text-xs leading-5 text-muted">
              Giá bán và tồn kho sẽ được xác nhận khi tạo đơn.
              Đây là thanh toán thử nghiệm, không phát sinh giao dịch thật.
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField id="pos-customer" label="Khách hàng" required>
                <select
                  id="pos-customer"
                  required
                  value={customerId}
                  onChange={(event) => setCustomerId(event.target.value)}
                  className={inputClass}
                >
                  <option value="">Chọn khách hàng</option>
                  {activeCustomers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.email === walkInCustomerEmail
                        ? 'Khách vãng lai'
                        : `${customer.fullName} · ${customer.phone} · ${customer.loyaltyPoints ?? 0} điểm`}
                    </option>
                  ))}
                </select>
              </FormField>
              <p className="text-[11px] leading-5 text-muted sm:col-span-2">
                {selectedCustomer
                  ? isWalkInCustomer
                    ? 'Khách vãng lai không cần cung cấp thông tin và không tích điểm.'
                    : `Khách hiện có ${selectedCustomer.loyaltyPoints ?? 0} điểm; cứ đủ 10.000đ thanh toán thành công được cộng 1 điểm.`
                  : 'Chọn Khách vãng lai hoặc hồ sơ khách hàng có sẵn.'}
              </p>
              <div className="space-y-3 sm:col-span-2">
                <p className="text-xs font-semibold text-rosewood">
                  Điểm tích lũy: {availableLoyaltyPoints} điểm
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  <label className="flex items-center gap-2 rounded-xl border border-border bg-white px-3 py-2.5 text-xs text-rosewood">
                    <input
                      type="radio"
                      name="pos-loyalty-choice"
                      checked={!useLoyaltyPoints}
                      onChange={() => {
                        setUseLoyaltyPoints(false)
                        setLoyaltyPointsToRedeem(0)
                      }}
                      className="accent-rosewood"
                    />
                    Không sử dụng điểm
                  </label>
                  <label className={`flex items-center gap-2 rounded-xl border border-border bg-white px-3 py-2.5 text-xs ${
                    isWalkInCustomer || availableLoyaltyPoints === 0
                      ? 'cursor-not-allowed text-muted'
                      : 'text-rosewood'
                  }`}>
                    <input
                      type="radio"
                      name="pos-loyalty-choice"
                      checked={useLoyaltyPoints}
                      disabled={isWalkInCustomer || availableLoyaltyPoints === 0}
                      onChange={() => setUseLoyaltyPoints(true)}
                      className="accent-rosewood"
                    />
                    Sử dụng điểm để giảm giá
                  </label>
                </div>
                {useLoyaltyPoints && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <FormField id="pos-loyalty-points" label="Số điểm muốn sử dụng">
                      <input
                        id="pos-loyalty-points"
                        type="number"
                        min="0"
                        max={availableLoyaltyPoints}
                        step="1"
                        value={loyaltyPointsToRedeem}
                        onChange={(event) => {
                          const nextPoints = event.target.value === ''
                            ? 0
                            : Number.parseInt(event.target.value, 10)
                          setLoyaltyPointsToRedeem(
                            Number.isFinite(nextPoints)
                              ? Math.min(availableLoyaltyPoints, Math.max(0, nextPoints))
                              : 0,
                          )
                        }}
                        className={inputClass}
                      />
                    </FormField>
                    <div className="self-end text-xs leading-5 text-muted">
                      1 điểm = 1.000 ₫
                      <br />
                      Giảm: {formatMoney(quote?.loyaltyDiscountAmount ?? 0)}
                    </div>
                  </div>
                )}
              </div>
              <FormField id="pos-employee" label="Nhân viên lập đơn" required>
                <input
                  id="pos-employee"
                  type="text"
                  readOnly
                  value={currentEmployee?.fullName ?? ''}
                  placeholder="Tài khoản chưa có hồ sơ nhân viên"
                  disabled={!currentEmployee}
                  className={inputClass}
                />
              </FormField>
              {!currentEmployee && (
                <p role="alert" className="text-xs text-danger sm:col-span-2">
                  Đây là hồ sơ người bán, không phải hồ sơ khách hàng. Khách vãng lai vẫn có thể mua, nhưng tài khoản đang đăng nhập cần được liên kết với hồ sơ nhân viên trước khi lập đơn. Vui lòng nhờ quản trị viên liên kết tài khoản.
                </p>
              )}
            </div>
            <FormField id="pos-payment-method" label="Phương thức thanh toán" required>
              <select
                id="pos-payment-method"
                required
                value={paymentMethod}
                onChange={(event) => setPaymentMethod(event.target.value)}
                className={inputClass}
              >
                {paymentMethods.map((method) => (
                  <option key={method.value} value={method.value}>{method.label}</option>
                ))}
              </select>
            </FormField>
            <div className="rounded-xl border border-border bg-petal px-4 py-3 text-xs">
              <div className="flex justify-between"><span>Tiền hàng</span><span>{formatMoney(quote?.subtotalAfterPromotions)}</span></div>
              {useLoyaltyPoints && (
                <div className="mt-2 flex justify-between">
                  <span>Giảm từ điểm</span>
                  <span>- {formatMoney(quote?.loyaltyDiscountAmount)}</span>
                </div>
              )}
              <div className="mt-2 flex justify-between border-t border-border pt-2 font-bold text-rosewood">
                <span>Tổng phải thanh toán</span><span>{formatMoney(quote?.finalAmount)}</span>
              </div>
            </div>
            {quoteLoading && <p className="text-xs text-muted">Đang tính lại tổng tiền...</p>}
            {quoteError && <p role="alert" className="text-xs text-danger">{quoteError}</p>}
            {checkoutError && <p role="alert" className="text-sm text-danger">{checkoutError}</p>}
            <div className="flex justify-end gap-2 border-t border-border pt-4">
              <Button type="button" variant="secondary" disabled={processing} onClick={closeCheckout}>Quay lại</Button>
              <Button
                type="submit"
                disabled={processing || !quote || quoteLoading || Boolean(quoteError)
                  || !activeCustomers.length || !currentEmployee
                  || Number(quote?.finalAmount) <= 0}
              >
                {processing ? 'Đang tạo đơn...' : 'Tạo đơn và thanh toán'}
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-petal px-4 py-3 text-sm">
              <p className="font-semibold text-rosewood">Đơn đã lưu: {createdOrder.orderCode}</p>
              <p className="mt-1 text-xs text-muted">Tổng đơn hàng: {formatMoney(createdOrder.finalAmount)}</p>
              <p className="mt-1 text-xs text-muted">
                {createdPayment
                  ? `Trạng thái thanh toán: ${paymentStatusLabels[createdPayment.status] ?? 'Đang cập nhật'}`
                  : 'Tồn kho đang được giữ cho đơn này.'}
              </p>
            </div>
            {checkoutError && <p role="alert" className="text-sm text-danger">{checkoutError}</p>}
            {createdPayment?.status !== 'SUCCESS' && (
              <>
                {createdPayment && createdPayment.status !== 'SUCCESS' && (
                  <div className="grid grid-cols-2 gap-2">
                    <Button disabled={processing} onClick={() => simulateResult('SUCCESS')}>
                      Ghi nhận thành công
                    </Button>
                    <Button variant="danger" disabled={processing} onClick={() => simulateResult('FAILED')}>
                      Ghi nhận chưa thành công
                    </Button>
                  </div>
                )}
                {!createdPayment && (
                  <Button disabled={processing} onClick={(event) => submitCheckout(event)}>
                    Tiếp tục thanh toán
                  </Button>
                )}
                <p className="text-[11px] leading-5 text-muted">
                  Nếu thanh toán thất bại, có thể thử lại hoặc hủy đơn để hoàn tồn kho.
                </p>
                <div className="flex justify-end border-t border-border pt-4">
                  <Button variant="secondary" disabled={processing} onClick={cancelCurrentOrder}>
                    Hủy đơn và hoàn tồn kho
                  </Button>
                </div>
              </>
            )}
            {createdPayment?.status === 'SUCCESS' && (
              <div className="flex justify-end border-t border-border pt-4">
                <Button onClick={closeCheckout}>Hoàn tất</Button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  )
}
