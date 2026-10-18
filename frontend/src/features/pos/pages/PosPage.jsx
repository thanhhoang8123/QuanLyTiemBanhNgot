import { useCallback, useEffect, useMemo, useState } from 'react'
import Button from '../../../components/Button.jsx'
import ErrorState from '../../../components/ErrorState.jsx'
import FormField from '../../../components/FormField.jsx'
import Icon from '../../../components/Icon.jsx'
import LoadingState from '../../../components/LoadingState.jsx'
import Modal from '../../../components/Modal.jsx'
import CartPanel from '../components/CartPanel.jsx'
import ProductCard from '../components/ProductCard.jsx'
import { getCustomers } from '../../customers/services/customerService.js'
import {
  cancelOrder,
  createOrder,
  getEmployees,
  quoteOrder,
} from '../../orders/services/orderService.js'
import { createPayment, getPayments, simulatePayment } from '../../payments/services/paymentService.js'
import { getProducts } from '../../products/services/productService.js'

const inputClass = 'h-10 w-full rounded-xl border border-border bg-white px-3 text-sm text-rosewood outline-none transition focus:border-caramel'
const moneyFormat = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 })
const paymentMethods = [
  { value: 'CASH', label: 'Tiền mặt' },
  { value: 'CARD', label: 'Thẻ' },
  { value: 'EWALLET', label: 'Ví điện tử' },
]

function getErrorMessage(error) {
  return error instanceof Error ? error.message : 'Đã xảy ra lỗi không xác định.'
}

function formatMoney(value) {
  const amount = Number(value)
  return Number.isFinite(amount) ? `${moneyFormat.format(amount)} ₫` : '—'
}

function normalizeProducts(result) {
  if (!Array.isArray(result)) {
    throw new Error('API sản phẩm trả về dữ liệu không đúng định dạng.')
  }
  return result.map((product) => {
    const price = Number(product.price)
    const stock = Number(product.quantity)
    if (!Number.isFinite(Number(product.id))
        || typeof product.name !== 'string'
        || !Number.isFinite(price)
        || !Number.isInteger(stock)
        || stock < 0) {
      throw new Error('API sản phẩm thiếu ID, tên, giá hoặc số lượng tồn kho hợp lệ.')
    }
    return {
      ...product,
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
  promotionCode,
  onPromotionCodeChange,
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
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [customerId, setCustomerId] = useState('')
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
        throw new Error('API khách hàng hoặc nhân viên trả về dữ liệu không đúng định dạng.')
      }
      setProducts(normalizeProducts(productResult))
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

  const activeCustomers = useMemo(
    () => customers.filter((customer) => customer.status === true),
    [customers],
  )
  const activeEmployees = useMemo(
    () => employees.filter((employee) => employee.status === true),
    [employees],
  )
  const activeProducts = useMemo(
    () => products.filter((product) => product.status === true && product.stock > 0),
    [products],
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

  useEffect(() => {
    if (activeCustomers.length && !activeCustomers.some((customer) => String(customer.id) === customerId)) {
      setCustomerId(String(activeCustomers[0].id))
    }
    if (activeEmployees.length && !activeEmployees.some((employee) => String(employee.id) === employeeId)) {
      setEmployeeId(String(activeEmployees[0].id))
    }
  }, [activeCustomers, activeEmployees, customerId, employeeId])

  useEffect(() => {
    if (cart.length === 0 || createdOrder) {
      if (cart.length === 0) setQuote(null)
      setQuoteError('')
      setQuoteLoading(false)
      return undefined
    }

    const controller = new AbortController()
    const timeoutId = window.setTimeout(async () => {
      setQuote(null)
      setQuoteError('')
      setQuoteLoading(true)
      try {
        const result = await quoteOrder({
          items: cart.map((item) => ({
            productId: item.id,
            quantity: item.quantity,
          })),
          promotionCode: promotionCode.trim() || null,
        }, { signal: controller.signal })
        if (typeof result?.finalAmount !== 'string' && typeof result?.finalAmount !== 'number') {
          throw new Error('API báo giá trả về số tiền không hợp lệ.')
        }
        setQuote(result)
      } catch (error) {
        if (!controller.signal.aborted && error.name !== 'AbortError') {
          setQuoteError(getErrorMessage(error))
        }
      } finally {
        if (!controller.signal.aborted) setQuoteLoading(false)
      }
    }, 250)

    return () => {
      window.clearTimeout(timeoutId)
      controller.abort()
    }
  }, [cart, createdOrder, products, promotionCode])

  const addToCart = (product) => {
    const selected = cart.find((item) => item.id === product.id)
    if ((selected?.quantity ?? 0) >= product.stock) {
      onToast(`Không đủ tồn kho cho ${product.name}.`)
      return
    }
    onCartChange((current) => {
      const existing = current.find((item) => item.id === product.id)
      return existing
        ? current.map((item) => item.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item)
        : [...current, { ...product, quantity: 1 }]
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
    onPromotionCodeChange('')
    onNoteChange('')
    setQuote(null)
  }

  const refreshProducts = async () => {
    try {
      const updatedProducts = normalizeProducts(await getProducts())
      const productsById = new Map(updatedProducts.map((product) => [product.id, product]))
      setProducts(updatedProducts)
      onCartChange((current) => {
        let changed = false
        const refreshedCart = current.map((item) => {
          const product = productsById.get(item.id)
          if (!product) return item
          changed = true
          return {
            ...item,
            name: product.name,
            price: product.price,
            stock: product.stock,
            category: product.category,
            unit: product.unit,
          }
        })
        return changed ? refreshedCart : current
      })
    } catch (error) {
      setCatalogError(`Không thể làm mới tồn kho: ${getErrorMessage(error)}`)
    }
  }

  const openCheckout = () => {
    setCheckoutError('')
    setCheckoutOpen(true)
  }

  const createOrFindPayment = async (order) => {
    try {
      return await createPayment({
        orderId: order.id,
        paymentMethod,
      })
    } catch (createError) {
      try {
        const payments = await getPayments()
        const existingPayment = payments.find((payment) => payment.orderId === order.id)
        if (existingPayment) return existingPayment
      } catch {
        throw new Error(
          `Đơn ${order.orderCode} đã được tạo nhưng chưa xác định được trạng thái Payment. `
          + 'Tải lại trang Thanh toán trước khi thử lại.',
        )
      }
      throw createError
    }
  }

  const submitCheckout = async (event) => {
    event.preventDefault()
    if (!createdOrder && (!customerId || !employeeId)) {
      setCheckoutError('Vui lòng chọn khách hàng và nhân viên đang hoạt động.')
      return
    }
    if (!createdOrder && (!quote || quoteLoading || quoteError)) {
      setCheckoutError('Chưa có báo giá hợp lệ từ máy chủ. Hãy kiểm tra giỏ hàng và mã khuyến mãi.')
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
          promotionCode: promotionCode.trim() || null,
          note: note.trim() || null,
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
        clearCart()
        await refreshProducts()
        onToast(`Đơn ${createdOrder.orderCode} đã thanh toán thành công.`)
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
  }

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0)
  const checkoutLocked = Boolean(createdOrder && createdPayment?.status !== 'SUCCESS')

  return (
    <>
      <div className="flex min-h-[calc(100vh-152px)] gap-6">
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
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 2xl:grid-cols-4">
                      {filteredProducts.map((product) => (
                        <ProductCard
                          key={product.id}
                          product={product}
                          onAdd={addToCart}
                          quantityInCart={cart.find((item) => item.id === product.id)?.quantity ?? 0}
                        />
                      ))}
                    </div>
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
          promotionCode={promotionCode}
          onPromotionCodeChange={onPromotionCodeChange}
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
              Máy chủ sẽ xác nhận lại tồn kho, giá và mã khuyến mãi khi tạo đơn.
              Thanh toán trong môi trường này chỉ được mô phỏng.
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
                      {customer.fullName} · {customer.phone}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField id="pos-employee" label="Nhân viên lập đơn" required>
                <select
                  id="pos-employee"
                  required
                  value={employeeId}
                  onChange={(event) => setEmployeeId(event.target.value)}
                  className={inputClass}
                >
                  <option value="">Chọn nhân viên</option>
                  {activeEmployees.map((employee) => (
                    <option key={employee.id} value={employee.id}>{employee.fullName}</option>
                  ))}
                </select>
              </FormField>
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
              <div className="flex justify-between"><span>Tạm tính</span><span>{formatMoney(quote?.totalAmount)}</span></div>
              <div className="mt-2 flex justify-between"><span>Khuyến mãi</span><span>- {formatMoney(quote?.discountAmount)}</span></div>
              <div className="mt-2 flex justify-between border-t border-border pt-2 font-bold text-rosewood">
                <span>Tổng phải thanh toán</span><span>{formatMoney(quote?.finalAmount)}</span>
              </div>
            </div>
            {checkoutError && <p role="alert" className="text-sm text-danger">{checkoutError}</p>}
            <div className="flex justify-end gap-2 border-t border-border pt-4">
              <Button type="button" variant="secondary" disabled={processing} onClick={closeCheckout}>Quay lại</Button>
              <Button
                type="submit"
                disabled={processing || !quote || quoteLoading || Boolean(quoteError)
                  || !activeCustomers.length || !activeEmployees.length
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
              <p className="mt-1 text-xs text-muted">Tổng từ backend: {formatMoney(createdOrder.finalAmount)}</p>
              <p className="mt-1 text-xs text-muted">
                {createdPayment
                  ? `Trạng thái Payment: ${createdPayment.status}`
                  : 'Tồn kho đang được giữ cho đơn này.'}
              </p>
            </div>
            {checkoutError && <p role="alert" className="text-sm text-danger">{checkoutError}</p>}
            {createdPayment?.status !== 'SUCCESS' && (
              <>
                {createdPayment && (
                  <div className="grid grid-cols-2 gap-2">
                    <Button disabled={processing} onClick={() => simulateResult('SUCCESS')}>
                      Mô phỏng thành công
                    </Button>
                    <Button variant="danger" disabled={processing} onClick={() => simulateResult('FAILED')}>
                      Mô phỏng thất bại
                    </Button>
                  </div>
                )}
                {!createdPayment && (
                  <Button disabled={processing} onClick={(event) => submitCheckout(event)}>
                    Thử tạo/khôi phục Payment
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
