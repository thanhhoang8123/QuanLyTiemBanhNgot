import { useEffect, useState } from 'react'
import { Link, useNavigate, useOutletContext, useParams } from 'react-router-dom'
import Icon from '../../../components/Icon.jsx'
import { ProductArtwork } from '../../products/components/ProductArtwork.jsx'
import { getProductById } from '../../products/services/productService.js'
import { getPromotions } from '../../promotions/services/promotionService.js'
import { getPromotionProducts } from '../../promotion-products/services/promotionProductService.js'
import { toProductViewModel } from '../../products/adapters/productAdapter.js'
import { formatDate } from '../../products/services/productExpiry.js'
import { getUserFacingErrorMessage } from '../../../services/apiClient.js'
import {
  findBestShopPromotion,
  getActiveShopPromotions,
} from '../services/shopPromotions.js'

const currency = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
})

export default function ShopProductDetailPage() {
  const { productId } = useParams()
  const { addToCart } = useOutletContext()
  const navigate = useNavigate()
  const [product, setProduct] = useState(null)
  const [quantity, setQuantity] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState('')
  const [activePromotions, setActivePromotions] = useState([])

  useEffect(() => {
    const controller = new AbortController()
    setIsLoading(true)
    setError('')

    Promise.all([
      getProductById(productId, { signal: controller.signal }),
      getPromotions({ signal: controller.signal }),
      getPromotionProducts({ signal: controller.signal }),
    ])
      .then(([productResult, promotionsResult, mappingsResult]) => {
        if (!productResult || typeof productResult !== 'object') {
          throw new Error('Sản phẩm không tồn tại.')
        }
        if (!Array.isArray(promotionsResult) || !Array.isArray(mappingsResult)) {
          throw new Error('Chưa thể tải khuyến mãi. Vui lòng thử lại.')
        }

        const normalizedProduct = toProductViewModel(productResult)
        const relevantPromotionIds = new Set(
          mappingsResult
            .filter((mapping) => Number(mapping.productId) === Number(productId))
            .map((mapping) => Number(mapping.promotionId)),
        )
        const applicablePromotions = promotionsResult.filter((promo) => (
          relevantPromotionIds.has(Number(promo.id))
        ))

        setProduct(normalizedProduct)
        setActivePromotions(getActiveShopPromotions(applicablePromotions))
      })
      .catch((requestError) => {
        if (requestError.name !== 'AbortError') {
          setError(getUserFacingErrorMessage(requestError, 'Không thể tải chi tiết sản phẩm.'))
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false)
      })

    return () => controller.abort()
  }, [productId])

  const originalPrice = Number(product?.price ?? 0)
  const unitPromotion = findBestShopPromotion(activePromotions, originalPrice)
  const selectedQuantity = Number.isInteger(quantity) && quantity > 0 ? quantity : 1
  const selectedQuantityPromotion = findBestShopPromotion(
    activePromotions,
    originalPrice * selectedQuantity,
  )
  const hasPromotion = Boolean(unitPromotion)
  const discountedPrice = originalPrice - (unitPromotion?.discountAmount ?? 0)
  const isInStock = (product?.stock ?? 0) > 0
  const canBuy = isInStock && product?.status === 'Đang bán'

  return (
    <section className="mx-auto max-w-5xl px-4 py-8 sm:px-7 sm:py-12 lg:px-10">
      <Link to="/shop/products" className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#76534D] transition hover:text-[#4A302B]">
        ← Quay lại danh mục sản phẩm
      </Link>

      {isLoading ? (
        <div role="status" className="mt-8 rounded-2xl border border-[#EAE3DA] bg-white p-12 text-center text-sm text-[#806B65]">
          Đang tải chi tiết sản phẩm...
        </div>
      ) : error ? (
        <div role="alert" className="mt-8 rounded-2xl border border-[#F0D5CF] bg-[#FFF2EF] p-8 text-center">
          <p className="text-sm font-semibold text-[#914E46]">{error}</p>
          <Link to="/shop/products" className="mt-4 inline-flex rounded-full bg-[#76534D] px-5 py-2.5 text-xs font-semibold text-white">
            Xem sản phẩm khác
          </Link>
        </div>
      ) : product ? (
        <div className="mt-7 grid gap-8 rounded-3xl border border-[#EAE3DA] bg-white p-4 shadow-[0_18px_60px_rgba(91,61,53,0.06)] sm:p-7 lg:grid-cols-2 lg:gap-12">
          <ProductArtwork
            id={product.id}
            name={product.name}
            imageUrl={product.imageUrl}
            background={product.background}
            className="min-h-[300px] w-full rounded-2xl sm:min-h-[440px]"
          />
          <div className="flex flex-col justify-center">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#A97668]">{product.category || 'WA Patisserie'}</p>
            <h1 className="font-display mt-3 text-3xl font-medium text-[#4A302B] sm:text-4xl">{product.name}</h1>
            <p className="mt-3 text-xs text-[#806B65]">Mã sản phẩm: {product.code || '—'}</p>
            <div className="mt-6 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              {hasPromotion && <span className="text-base text-[#9A7972] line-through">{currency.format(originalPrice)}</span>}
              <span className={`text-2xl font-bold ${hasPromotion ? 'text-[#B94F35]' : 'text-[#76534D]'}`}>{currency.format(discountedPrice)}</span>
              {hasPromotion && <span className="rounded-full bg-[#B94F35] px-2.5 py-1 text-xs font-bold text-white">-{currency.format(unitPromotion.discountAmount)}</span>}
            </div>
            {hasPromotion && <p className="mt-2 text-sm font-medium text-[#A45B46]">{unitPromotion.promotion.name || unitPromotion.promotion.promotionCode || 'Đang khuyến mãi'} · Tiết kiệm {currency.format(unitPromotion.discountAmount)} / sản phẩm</p>}
            {!hasPromotion && activePromotions.length > 0 && <p className="mt-2 text-sm font-medium text-[#A45B46]">Có ưu đãi theo điều kiện chương trình.</p>}
            <p className="mt-5 whitespace-pre-wrap text-sm leading-7 text-[#806B65]">{product.description || 'Thông tin mô tả sản phẩm hiện chưa được cập nhật.'}</p>

            <div className="mt-5 grid grid-cols-2 gap-3 rounded-2xl border border-[#EAE3DA] bg-[#FCF9F3] p-3.5 text-xs">
              <div>
                <p className="text-[10px] uppercase font-bold text-[#A97668]">Ngày sản xuất / Ngày tạo</p>
                <p className="mt-0.5 font-medium text-[#4A302B]">{formatDate(product.createdAt)}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-[#A97668]">Hạn sử dụng</p>
                <p className="mt-0.5 font-medium text-[#4A302B]">{formatDate(product.expiryDate)}</p>
              </div>
            </div>

            <p className={`mt-4 text-xs font-semibold ${canBuy ? 'text-[#536B50]' : 'text-[#914E46]'}`}>
              {product.status !== 'Đang bán' ? 'Sản phẩm hiện không mở bán' : product.stock <= 0 ? 'Sản phẩm tạm hết hàng' : `Còn ${product.stock} ${product.unit || 'sản phẩm'}`}
            </p>
            <div className="mt-6 flex items-end gap-2 sm:gap-3">
              <label className="grid shrink-0 gap-1.5 text-xs font-semibold text-[#675650]">
                Số lượng
                <span className="flex h-11 items-center rounded-xl border border-[#EAE3DA] bg-white">
                  <button
                    type="button"
                    aria-label="Giảm số lượng"
                    disabled={quantity <= 1}
                    onClick={() => setQuantity((current) => Math.max(1, current - 1))}
                    className="h-full w-10 text-lg text-[#76534D] disabled:opacity-40"
                  >
                    −
                  </button>
                  <input
                    aria-label="Số lượng sản phẩm"
                    type="number"
                    min="1"
                    max={product.stock}
                    step="1"
                    value={quantity}
                    onChange={(event) => setQuantity(event.target.value === '' ? '' : Number(event.target.value))}
                    onBlur={() => setQuantity((current) => (
                      Number.isInteger(current) && current >= 1
                        ? Math.min(current, product.stock)
                        : 1
                    ))}
                    className="h-full w-12 border-x border-[#EAE3DA] text-center text-sm outline-none focus:border-[#D0A263]"
                  />
                  <button
                    type="button"
                    aria-label="Tăng số lượng"
                    disabled={quantity >= product.stock}
                    onClick={() => setQuantity((current) => Math.min(product.stock, current + 1))}
                    className="h-full w-10 text-lg text-[#76534D] disabled:opacity-40"
                  >
                    +
                  </button>
                </span>
              </label>
              <button
                type="button"
                disabled={!canBuy}
                onClick={() => {
                  addToCart(product.id, quantity)
                  setFeedback('Đã thêm sản phẩm vào giỏ hàng.')
                }}
                aria-label="Thêm sản phẩm vào giỏ"
                title="Thêm vào giỏ"
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#DDCDB8] text-[#76534D] transition hover:bg-[#FAF0EE] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Icon name="cart" size={16} />
              </button>
              <button
                type="button"
                disabled={!canBuy}
                onClick={() => {
                  addToCart(product.id, quantity)
                  navigate('/shop/checkout')
                }}
                className="inline-flex h-11 min-w-0 flex-1 items-center justify-center whitespace-nowrap rounded-full bg-[#B94F35] px-3 text-xs font-semibold text-white transition hover:bg-[#9E402B] disabled:cursor-not-allowed disabled:opacity-50 sm:px-6 sm:text-sm"
              >
                Mua ngay
              </button>
            </div>
            {product && (
              <div className="mt-4 flex max-w-md items-center justify-between gap-4 border-t border-[#EAE3DA] pt-4 text-sm">
                <span className="text-[#806B65]">Tạm tính {quantity > 1 ? `(${quantity} sản phẩm)` : ''}</span>
                <span className="text-right">
                  {selectedQuantityPromotion && (
                    <span className="mr-2 text-xs text-[#9A7972] line-through">
                      {currency.format(originalPrice * quantity)}
                    </span>
                  )}
                  <strong className={selectedQuantityPromotion ? 'text-[#B94F35]' : 'text-[#76534D]'}>
                    {currency.format(
                      originalPrice * quantity
                      - (selectedQuantityPromotion?.discountAmount ?? 0),
                    )}
                  </strong>
                </span>
              </div>
            )}
            {feedback && <p role="status" className="mt-3 text-xs font-medium text-[#536B50]">{feedback}</p>}
            <p className="mt-5 text-[11px] leading-5 text-[#9A7972]">Giá và tồn kho sẽ được xác nhận lại khi báo giá và tạo đơn.</p>
          </div>
        </div>
      ) : null}
    </section>
  )
}
