import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../../../components/Icon.jsx'
import Pagination, { usePagination } from '../../../components/Pagination.jsx'
import { getProducts } from '../../products/services/productService.js'
import { toProductViewModel } from '../../products/adapters/productAdapter.js'
import { useShopCart } from '../ShopCartContext.jsx'
import { getUserFacingErrorMessage } from '../../../services/apiClient.js'
import { getPromotions } from '../../promotions/services/promotionService.js'
import { getPromotionProducts } from '../../promotion-products/services/promotionProductService.js'

const currency = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
})

export default function ShopCartPage() {
  const cart = useShopCart()
  const [products, setProducts] = useState([])
  const [promotions, setPromotions] = useState([])
  const [promotionLinks, setPromotionLinks] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    setIsLoading(true)
    setError('')

    // Sản phẩm là dữ liệu bắt buộc; lỗi API khuyến mãi không được làm hỏng giỏ hàng.
    Promise.allSettled([
      getProducts({ signal: controller.signal }),
      getPromotions({ signal: controller.signal }),
      getPromotionProducts({ signal: controller.signal }),
    ]).then(([productsResult, promotionsResult, linksResult]) => {
      if (controller.signal.aborted) return

      if (productsResult.status !== 'fulfilled' || !Array.isArray(productsResult.value)) {
        const loadError = productsResult.status === 'rejected'
          ? productsResult.reason
          : new Error('Chưa thể tải danh sách sản phẩm. Vui lòng thử lại.')
        setError(getUserFacingErrorMessage(loadError, 'Chưa thể tải danh sách sản phẩm. Vui lòng thử lại.'))
        setProducts([])
      } else {
        setProducts(productsResult.value.map(toProductViewModel))
      }

      setPromotions(promotionsResult.status === 'fulfilled' && Array.isArray(promotionsResult.value)
        ? promotionsResult.value
        : [])
      setPromotionLinks(linksResult.status === 'fulfilled' && Array.isArray(linksResult.value)
        ? linksResult.value
        : [])
    }).finally(() => {
      if (!controller.signal.aborted) setIsLoading(false)
    })

    return () => controller.abort()
  }, [])

  const today = new Date()
  const localToday = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  const activePromotions = promotions.filter((promotion) => (
    promotion.status === true
    && (!promotion.startDate || String(promotion.startDate).slice(0, 10) <= localToday)
    && (!promotion.endDate || String(promotion.endDate).slice(0, 10) >= localToday)
    && Number(promotion.discountPercent) > 0
  ))
  const activePromotionById = new Map(activePromotions.map((promotion) => [String(promotion.id), promotion]))
  const promotionByProductId = useMemo(() => {
    const result = new Map()
    promotionLinks.forEach((link) => {
      const promotion = activePromotionById.get(String(link.promotionId))
      if (!promotion) return
      const productId = String(link.productId)
      const current = result.get(productId)
      if (!current || Number(promotion.discountPercent) > Number(current.discountPercent)) {
        result.set(productId, promotion)
      }
    })
    return result
  }, [promotionLinks, promotions])

  const productById = useMemo(
    () => new Map(products.map((product) => [Number(product.id), product])),
    [products],
  )
  const lines = useMemo(() => cart.items.map((item) => {
    const product = productById.get(item.productId)
    const promotion = promotionByProductId.get(String(item.productId)) || null
    const originalPrice = Number(product?.price) || 0
    const discountPercent = Math.min(100, Math.max(0, Number(promotion?.discountPercent) || 0))
    const hasPromotion = Boolean(promotion) && discountPercent > 0
    const finalPrice = hasPromotion
      ? Math.round(originalPrice * (1 - discountPercent / 100))
      : originalPrice
    const issue = !product
      ? 'Sản phẩm không còn tồn tại'
      : product.status !== 'Đang bán'
        ? 'Sản phẩm đã ngừng bán'
        : product.stock <= 0
          ? 'Sản phẩm đã hết hàng'
          : item.quantity > product.stock
            ? `Chỉ còn ${product.stock} sản phẩm`
            : ''
    return { ...item, product, promotion: hasPromotion ? promotion : null, originalPrice, finalPrice, discountPercent, issue }
  }), [cart.items, productById, promotionByProductId])
  const linePagination = usePagination(lines)
  const cartTotal = lines.reduce((sum, line) => (
    line.product ? sum + line.finalPrice * line.quantity : sum
  ), 0)
  const hasInvalidLine = lines.some((line) => line.issue)

  return (
    <section className="mx-auto max-w-5xl px-4 py-8 sm:px-7 sm:py-12 lg:px-10">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#A97668]">Daily Fresh</p>
      <h1 className="font-display mt-2 text-3xl font-medium text-[#4A302B] sm:text-4xl">Giỏ hàng</h1>
      <p className="mt-2 text-sm text-[#806B65]">Giá và tồn kho được tải lại từ hệ thống trước khi đặt hàng.</p>

      {isLoading ? (
        <p role="status" className="mt-7 rounded-2xl bg-white px-5 py-16 text-center text-sm text-[#806B65]">Đang kiểm tra sản phẩm trong giỏ...</p>
      ) : error ? (
        <div role="alert" className="mt-7 rounded-2xl border border-[#E2C5BF] bg-white px-5 py-8 text-sm text-[#914E46]">
          {error}
          <button type="button" onClick={() => window.location.reload()} className="ml-3 font-semibold underline">Tải lại</button>
        </div>
      ) : cart.items.length === 0 ? (
        <div className="mt-7 rounded-2xl border border-dashed border-[#DDCDB8] bg-white px-5 py-14 text-center">
          <Icon name="cart" size={26} className="mx-auto text-[#A97668]" />
          <h2 className="font-display mt-4 text-xl text-[#4A302B]">Giỏ hàng đang trống</h2>
          <p className="mt-2 text-sm text-[#806B65]">Khám phá sản phẩm và thêm những chiếc bánh bạn yêu thích.</p>
          <Link to="/shop/products" className="mt-5 inline-flex rounded-full bg-[#76534D] px-5 py-3 text-xs font-semibold text-white">Xem sản phẩm</Link>
        </div>
      ) : (
        <div className="mt-7 grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="space-y-3">
            {linePagination.pageItems.map((line) => (
              <article key={line.productId} className="rounded-2xl border border-[#EAE3DA] bg-white p-4 sm:p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <h2 className="font-display text-lg text-[#4A302B]">{line.product?.name || `Sản phẩm #${line.productId}`}</h2>
                    {line.product && <div className="mt-1 text-xs text-[#806B65]">{line.promotion ? <><span className="mr-2 text-[#9A7972] line-through">{currency.format(line.originalPrice)}</span><span className="font-semibold text-[#B94F35]">{currency.format(line.finalPrice)}</span><span className="ml-2 rounded-full bg-[#FBE9E2] px-2 py-0.5 text-[10px] font-semibold text-[#B94F35]">-{line.discountPercent}%</span></> : <span>{currency.format(line.originalPrice)}</span>} / {line.product.unit || 'đơn vị'}</div>}
                    {line.issue && <p role="alert" className="mt-2 text-xs font-semibold text-[#914E46]">{line.issue}. Hãy cập nhật số lượng hoặc xóa sản phẩm.</p>}
                  </div>
                  <div className="flex shrink-0 items-center justify-between gap-4 sm:justify-end">
                    <div className="inline-flex items-center rounded-full border border-[#EAE3DA]">
                      <button
                        type="button"
                        aria-label={`Giảm số lượng ${line.product?.name || line.productId}`}
                        onClick={() => cart.setQuantity(line.productId, line.quantity - 1)}
                        className="h-9 w-9 text-[#76534D]"
                      >−</button>
                      <span className="min-w-8 text-center text-xs font-semibold">{line.quantity}</span>
                      <button
                        type="button"
                        aria-label={`Tăng số lượng ${line.product?.name || line.productId}`}
                        onClick={() => cart.setQuantity(line.productId, line.quantity + 1)}
                        disabled={!line.product || line.product.status !== 'Đang bán' || line.quantity >= line.product.stock}
                        className="h-9 w-9 text-[#76534D] disabled:opacity-40"
                      >+</button>
                    </div>
                    <strong className="min-w-24 text-right text-sm text-[#76534D]">
                      {line.product ? currency.format(line.finalPrice * line.quantity) : '—'}
                    </strong>
                    <button type="button" onClick={() => cart.remove(line.productId)} aria-label={`Xóa ${line.product?.name || line.productId}`} className="flex h-9 w-9 items-center justify-center rounded-full text-[#914E46] hover:bg-[#F6E9E6]">
                      <Icon name="trash" size={15} />
                    </button>
                  </div>
                </div>
              </article>
            ))}
            <Pagination
              currentPage={linePagination.currentPage}
              pageSize={linePagination.pageSize}
              totalItems={linePagination.totalItems}
              onPageChange={linePagination.setCurrentPage}
              onPageSizeChange={linePagination.setPageSize}
            />
            <Link to="/shop/products" className="inline-flex items-center gap-2 py-2 text-xs font-semibold text-[#76534D]">
              <Icon name="arrowUpRight" size={14} className="rotate-180" /> Tiếp tục xem bánh
            </Link>
          </div>

          <aside className="rounded-2xl border border-[#EAE3DA] bg-white p-5">
            <h2 className="font-display text-lg text-[#4A302B]">Tạm tính</h2>
            <div className="mt-4 flex justify-between gap-3 border-t border-[#EAE3DA] pt-4 text-sm">
              <span className="text-[#806B65]">Tạm tính</span>
              <strong className="text-[#76534D]">{currency.format(cartTotal)}</strong>
            </div>
            <p className="mt-3 text-[11px] leading-5 text-[#806B65]">Tạm tính đã áp dụng chương trình khuyến mãi đang hoạt động. Giá cuối cùng vẫn được hệ thống xác nhận khi đặt hàng.</p>
            {hasInvalidLine && <p role="alert" className="mt-4 rounded-xl bg-[#F6E9E6] p-3 text-xs leading-5 text-[#914E46]">Giỏ có sản phẩm không hợp lệ hoặc vượt tồn kho. Vui lòng sửa trước khi tiếp tục.</p>}
            <Link
              to="/shop/checkout"
              aria-disabled={hasInvalidLine}
              onClick={(event) => { if (hasInvalidLine) event.preventDefault() }}
              className={`mt-5 flex h-11 items-center justify-center rounded-full bg-[#76534D] px-5 text-xs font-semibold text-white ${hasInvalidLine ? 'pointer-events-none opacity-50' : 'hover:bg-[#4A302B]'}`}
            >
              Tiếp tục đặt hàng
            </Link>
          </aside>
        </div>
      )}
    </section>
  )
}
