import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useOutletContext, useSearchParams } from 'react-router-dom'
import Icon from '../../../components/Icon.jsx'
import Pagination, { usePagination } from '../../../components/Pagination.jsx'
import useShopCatalog from '../hooks/useShopCatalog.js'
import { getPromotions } from '../../promotions/services/promotionService.js'
import { getPromotionProducts } from '../../promotion-products/services/promotionProductService.js'
import ShopProductImage from '../components/ShopProductImage.jsx'
import {
  findBestShopPromotion,
  getActiveShopPromotions,
} from '../services/shopPromotions.js'

const currency = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
})

function CatalogError({ message, onRetry }) {
  return (
    <div role="alert" className="rounded-3xl border border-[#E2C5BF] bg-white px-5 py-12 text-center">
      <p className="font-display text-xl text-[#76534D]">Chưa thể tải danh sách bánh</p>
      <p className="mx-auto mt-2 max-w-xl text-xs leading-5 text-[#806B65]">{message}</p>
      <button type="button" onClick={onRetry} className="mt-5 rounded-full bg-[#76534D] px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-[#4A302B]">
        Thử tải lại
      </button>
    </div>
  )
}

function ProductCard({ product, promotions, onAddToCart, onBuyNow, isFavorite, onToggleFavorite }) {
  const canBuy = product.stock > 0 && product.status === 'Đang bán'
  const originalPrice = Number(product.price) || 0
  const activePromotions = getActiveShopPromotions(promotions)
  const bestPromotion = findBestShopPromotion(activePromotions, originalPrice)
  const promotion = bestPromotion?.promotion ?? null
  const hasPromotion = Boolean(bestPromotion)
  const discountedPrice = originalPrice - (bestPromotion?.discountAmount ?? 0)

  return (
    <article className="group flex h-full min-w-0 flex-col overflow-hidden rounded-[20px] border border-[#EAE3DA] bg-white transition duration-300 hover:-translate-y-1 hover:border-[#D0A263]/70 hover:shadow-[0_18px_42px_rgba(91,61,53,0.12)]">
      <div className="relative m-2 overflow-hidden rounded-[15px] bg-[#F3E3D3]">
        <Link to={`/shop/products/${product.id}`} className="block aspect-[1.24/1] overflow-hidden" aria-label={`Xem ${product.name}`}>
          <ShopProductImage product={product} className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.06]" />
        </Link>

        {hasPromotion && (
          <span className="absolute bottom-2.5 left-2.5 max-w-[calc(100%-1.25rem)] truncate rounded-full bg-[#B94F35] px-2.5 py-1.5 text-[9px] font-bold text-white shadow-sm">
            Giảm {currency.format(bestPromotion.discountAmount)}{promotion?.promotionCode ? ` · ${promotion.promotionCode}` : ''}
          </span>
        )}
        <button
          type="button"
          onClick={() => onToggleFavorite(product.id)}
          aria-label={isFavorite ? `Bỏ yêu thích ${product.name}` : `Yêu thích ${product.name}`}
          aria-pressed={isFavorite}
          className={`absolute right-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-full shadow-sm backdrop-blur transition ${isFavorite ? 'bg-[#B94F35] text-white' : 'bg-white/95 text-[#76534D] hover:bg-[#FAF0EE]'}`}
        >
          <span className="text-lg leading-none">{isFavorite ? '♥' : '♡'}</span>
        </button>
      </div>

      <div className="flex flex-1 flex-col px-3 pb-3 pt-1 sm:px-4 sm:pb-4">
        <div className="flex items-center justify-between gap-2">
          <p className="min-w-0 truncate text-[9px] font-bold uppercase tracking-[0.12em] text-[#A97668]">
            {product.category || 'WA Patisserie'}
          </p>
          <p className={`shrink-0 text-[9px] font-medium ${canBuy ? 'text-[#5F805B]' : 'text-[#A97668]'}`}>
            {canBuy ? `Còn ${product.stock}` : product.stock <= 0 ? 'Hết hàng' : 'Ngừng bán'}
          </p>
        </div>

        <Link to={`/shop/products/${product.id}`} className="block">
          <h2 className="font-display mt-1 line-clamp-2 text-[15px] font-medium leading-5 text-[#4A302B] transition group-hover:text-[#9A5E4E] sm:text-base">
            {product.name}
          </h2>
        </Link>

        <div className="mt-2 flex min-h-6 flex-wrap items-baseline gap-x-2">
          {hasPromotion && (
            <span className="whitespace-nowrap text-[10px] text-[#9A7972] line-through sm:text-xs">
              {currency.format(originalPrice)}
            </span>
          )}
          <span className={`whitespace-nowrap text-sm font-extrabold tracking-tight sm:text-base ${hasPromotion ? 'text-[#B94F35]' : 'text-[#76534D]'}`}>
            {currency.format(discountedPrice)}
          </span>
        </div>

        <div className="mt-auto grid grid-cols-2 gap-2 pt-2">
            <button
              type="button"
              disabled={!canBuy}
              onClick={() => onAddToCart?.(product.id, 1)}
              className="inline-flex h-9 min-w-0 items-center justify-center gap-1 rounded-full border border-[#DDCDB8] px-2 text-[9px] font-bold text-[#76534D] transition hover:bg-[#FAF0EE] disabled:cursor-not-allowed disabled:opacity-50 sm:text-[10px]"
            >
              <Icon name="cart" size={12} /> <span className="whitespace-nowrap">Thêm giỏ</span>
            </button>
            <button
              type="button"
              disabled={!canBuy}
              onClick={() => onBuyNow(product.id, 1)}
              className="inline-flex h-9 min-w-0 items-center justify-center whitespace-nowrap rounded-full bg-[#76534D] px-2 text-[9px] font-bold text-white transition hover:bg-[#4A302B] disabled:cursor-not-allowed disabled:bg-[#C9B9AF] sm:text-[10px]"
            >
              Mua ngay
            </button>
        </div>
      </div>
    </article>
  )
}


export default function ShopProductsPage() {
  const { categories, products, isLoading, error, retry } = useShopCatalog()
  const { addToCart } = useOutletContext()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState('default')
  const [showPromotionsOnly, setShowPromotionsOnly] = useState(false)
  const [favoriteIds, setFavoriteIds] = useState(() => new Set())
  const [promotions, setPromotions] = useState([])
  const [promotionLinks, setPromotionLinks] = useState([])
  const [promotionLoading, setPromotionLoading] = useState(true)
  const selectedCategory = searchParams.get('category') || ''

  useEffect(() => {
    const controller = new AbortController()
    Promise.allSettled([
      getPromotions({ signal: controller.signal }),
      getPromotionProducts({ signal: controller.signal }),
    ]).then(([promotionResult, linkResult]) => {
      if (controller.signal.aborted) return
      if (promotionResult.status === 'fulfilled' && Array.isArray(promotionResult.value)) setPromotions(promotionResult.value)
      if (linkResult.status === 'fulfilled' && Array.isArray(linkResult.value)) setPromotionLinks(linkResult.value)
    }).finally(() => {
      if (!controller.signal.aborted) setPromotionLoading(false)
    })
    return () => controller.abort()
  }, [])

  const activePromotionsByProduct = useMemo(() => {
    const activePromotions = getActiveShopPromotions(promotions)
    const promotionById = new Map(activePromotions.map((promotion) => [Number(promotion.id), promotion]))
    const result = new Map()

    promotionLinks.forEach((link) => {
      const promotion = promotionById.get(Number(link.promotionId))
      if (!promotion) return
      const productId = Number(link.productId)
      const existing = result.get(productId) || []
      existing.push(promotion)
      result.set(productId, existing)
    })

    result.forEach((items, id) => result.set(id, items.sort((a, b) => Number(b.discountPercent) - Number(a.discountPercent))))
    return result
  }, [promotions, promotionLinks])

  const visibleProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('vi')
    const filtered = products.filter((product) => {
      const matchesQuery = `${product.name} ${product.code}`.toLocaleLowerCase('vi').includes(normalizedQuery)
      const matchesCategory = !selectedCategory || product.categoryId === selectedCategory
      const matchesPromotion = !showPromotionsOnly || activePromotionsByProduct.has(Number(product.id))
      return matchesQuery && matchesCategory && matchesPromotion
    })

    if (sort === 'price-asc') filtered.sort((a, b) => a.price - b.price)
    else if (sort === 'price-desc') filtered.sort((a, b) => b.price - a.price)
    else if (sort === 'name') filtered.sort((a, b) => a.name.localeCompare(b.name, 'vi'))
    return filtered
  }, [products, query, selectedCategory, showPromotionsOnly, activePromotionsByProduct, sort])

  const productPagination = usePagination(visibleProducts, 8)
  const promotedCount = products.filter((product) => activePromotionsByProduct.has(Number(product.id))).length

  const updateCategory = (value) => {
    const nextParams = new URLSearchParams(searchParams)
    if (value) nextParams.set('category', value)
    else nextParams.delete('category')
    setSearchParams(nextParams)
  }

  const toggleFavorite = (id) => {
    setFavoriteIds((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const buyNow = (productId, quantity) => {
    addToCart(productId, quantity)
    navigate('/shop/checkout')
  }

  return (
    <div className="min-h-screen bg-[#FCF9F3] pb-10">
      <div className="mx-auto max-w-[1380px] px-4 pb-10 pt-6 sm:px-7 sm:pt-8 lg:px-10">
        <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <Link to="/shop" className="mb-3 inline-flex items-center gap-2 text-[10px] font-semibold text-[#9A7972] transition hover:text-[#4A302B]">
              <span aria-hidden="true">←</span> Về trang chủ
            </Link>
            <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-[#A97668]">Bộ sưu tập WA Patisserie</p>
            <h1 className="font-display mt-1.5 text-3xl font-semibold leading-tight text-[#4A302B] sm:text-4xl lg:text-[46px]">Khám phá những chiếc bánh ngọt</h1>
            <p className="mt-2 max-w-2xl text-xs leading-5 text-[#806B65] sm:text-sm">Từ những công thức truyền thống đến sáng tạo hiện đại, mỗi chiếc bánh tại WA Patisserie đều được làm bằng sự chăm chút và tình yêu với ẩm thực.</p>
          </div>
          <div className="hidden shrink-0 pb-1 text-right md:block">
            <span className="font-display block rotate-[-5deg] text-lg italic text-[#B7835E]">Bánh ngon</span>
            <span className="font-display block rotate-[-5deg] text-sm italic text-[#B7835E]">cho cuộc sống ngọt ngào ♥</span>
          </div>
        </div>

        <section aria-label="Ưu đãi WA Patisserie" className="relative mb-5 overflow-hidden rounded-2xl bg-[#E9C8A9] shadow-sm">
          <div className="absolute inset-0">
            <img
              src="https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=1800&q=90"
              alt=""
              className="h-full w-full object-cover object-center"
              onError={(event) => { event.currentTarget.style.display = 'none' }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#F6E4D0] via-[#F6E4D0]/95 to-[#6C3927]/10" />
          </div>
          <div className="relative flex min-h-[164px] flex-col justify-center gap-4 px-5 py-6 sm:min-h-[178px] sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10">
            <div className="max-w-xl">
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#A45B46]">Một chút ngọt ngào dành cho bạn</p>
              <h2 className="font-display mt-1 text-2xl font-semibold leading-tight text-[#4A302B] sm:text-3xl">Ưu đãi ngọt ngào mỗi ngày</h2>
              <p className="mt-1.5 max-w-lg text-xs leading-5 text-[#76534D]">Khám phá những chiếc bánh đang được áp dụng mã khuyến mãi tại WA Patisserie.</p>
              <button
                type="button"
                onClick={() => setShowPromotionsOnly(true)}
                className="mt-3 inline-flex h-9 items-center gap-2 rounded-full bg-[#76534D] px-4 text-[10px] font-bold text-white shadow-sm transition hover:bg-[#4A302B]"
              >
                Xem bánh khuyến mãi <span aria-hidden="true">→</span>
              </button>
            </div>
            <div className="hidden shrink-0 items-center justify-center sm:flex">
              <div className="flex h-[94px] w-[94px] rotate-6 flex-col items-center justify-center rounded-full border-2 border-dashed border-white/90 bg-[#B94F35]/90 text-center text-white shadow-lg">
                <span className="text-[9px] font-semibold">Mã giảm giá</span>
                <span className="font-display text-2xl font-bold">Daily</span>
                <span className="text-[8px]">Fresh</span>
              </div>
            </div>
          </div>
        </section>

        <section aria-label="Tìm kiếm và lọc bánh" className="mb-5 rounded-2xl border border-[#EAE3DA] bg-white/90 p-3 sm:p-4">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
            <label className="relative block min-w-0 flex-1 xl:max-w-[390px]">
              <span className="sr-only">Tìm theo tên hoặc mã bánh</span>
              <Icon name="search" size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A97668]" />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Tìm tên hoặc mã bánh..."
                className="h-10 w-full rounded-full border border-[#EAE3DA] bg-[#FCF9F3] pl-10 pr-4 text-xs text-[#4A302B] outline-none transition placeholder:text-[#A18A80] focus:border-[#D0A263] focus:bg-white"
              />
            </label>

            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5" aria-label="Danh mục bánh">
              <button type="button" onClick={() => { updateCategory(''); setShowPromotionsOnly(false) }} className={`rounded-full px-3.5 py-2 text-[10px] font-bold transition ${!selectedCategory && !showPromotionsOnly ? 'bg-[#76534D] text-white' : 'border border-[#EAE3DA] bg-[#FCF9F3] text-[#76534D] hover:bg-[#FAF0EE]'}`}>
                Tất cả
              </button>
              {categories.slice(0, 5).map((category) => (
                <button key={category.id} type="button" onClick={() => { updateCategory(String(category.id)); setShowPromotionsOnly(false) }} className={`rounded-full px-3.5 py-2 text-[10px] font-semibold transition ${selectedCategory === String(category.id) && !showPromotionsOnly ? 'bg-[#76534D] text-white' : 'border border-[#EAE3DA] bg-[#FCF9F3] text-[#76534D] hover:bg-[#FAF0EE]'}`}>
                  {category.name}
                </button>
              ))}
              <button type="button" onClick={() => setShowPromotionsOnly((current) => !current)} className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[10px] font-bold transition ${showPromotionsOnly ? 'bg-[#B94F35] text-white' : 'border border-[#E6C9BB] bg-[#FFF7F0] text-[#A45B46] hover:bg-[#F9E8DC]'}`}>
                <span aria-hidden="true">✦</span> Ưu đãi {promotedCount > 0 ? `(${promotedCount})` : ''}
              </button>
            </div>

            <label className="block shrink-0 xl:w-[190px]">
              <span className="sr-only">Sắp xếp sản phẩm</span>
              <select value={sort} onChange={(event) => setSort(event.target.value)} className="h-10 w-full rounded-full border border-[#EAE3DA] bg-[#FCF9F3] px-3.5 text-[10px] font-semibold text-[#76534D] outline-none transition focus:border-[#D0A263]">
                <option value="default">Sắp xếp: Mặc định</option>
                <option value="price-asc">Giá: thấp đến cao</option>
                <option value="price-desc">Giá: cao đến thấp</option>
                <option value="name">Tên bánh: A – Z</option>
              </select>
            </label>
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-[#F0E8DF] pt-3 text-[10px] text-[#806B65]">
            <p>{isLoading ? 'Đang tải danh sách bánh…' : `${visibleProducts.length} sản phẩm${showPromotionsOnly ? ' đang áp dụng khuyến mãi' : selectedCategory ? ' trong danh mục đã chọn' : ' đang mở bán'}`}</p>
            {showPromotionsOnly && <button type="button" onClick={() => setShowPromotionsOnly(false)} className="font-semibold text-[#A45B46] hover:underline">Bỏ lọc khuyến mãi ×</button>}
          </div>
        </section>

        {error ? (
          <CatalogError message={error} onRetry={retry} />
        ) : isLoading ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4" aria-label="Đang tải sản phẩm">
            {Array.from({ length: 8 }, (_, index) => (
              <div key={index} className="animate-pulse rounded-[20px] border border-[#EAE3DA] bg-white p-2">
                <div className="aspect-[1.24/1] rounded-[15px] bg-[#F3EFEB]" />
                <div className="mt-4 h-3 w-2/3 rounded bg-[#F3EFEB]" />
                <div className="mt-3 h-4 w-4/5 rounded bg-[#F3EFEB]" />
                <div className="mt-5 h-8 rounded-full bg-[#F3EFEB]" />
              </div>
            ))}
          </div>
        ) : visibleProducts.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-[#DDCDB8] bg-white px-5 py-14 text-center">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#FAF0EE] text-[#A97668]"><Icon name="search" size={20} /></span>
            <h2 className="font-display mt-4 text-xl text-[#4A302B]">{showPromotionsOnly ? 'Chưa có bánh áp dụng khuyến mãi' : 'Chưa tìm thấy chiếc bánh phù hợp'}</h2>
            <p className="mt-2 text-xs text-[#806B65]">Thử từ khóa khác hoặc xem toàn bộ sản phẩm đang mở bán.</p>
            <button type="button" onClick={() => { setQuery(''); updateCategory(''); setShowPromotionsOnly(false) }} className="mt-5 rounded-full border border-[#DDCDB8] px-5 py-2.5 text-xs font-semibold text-[#76534D] transition hover:bg-[#FAF0EE]">Xóa bộ lọc</button>
          </div>
        ) : (
          <>
            <div className="mb-4 flex items-end justify-between gap-3">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#A97668]">{showPromotionsOnly ? 'Ưu đãi dành riêng cho bạn' : 'Từ gian bếp WA Patisserie'}</p>
                <h2 className="font-display mt-1 text-xl font-semibold text-[#4A302B] sm:text-2xl">{showPromotionsOnly ? 'Những chiếc bánh đang ưu đãi' : 'Chọn vị ngọt bạn yêu'}</h2>
              </div>
              {!promotionLoading && promotedCount > 0 && !showPromotionsOnly && <button type="button" onClick={() => setShowPromotionsOnly(true)} className="shrink-0 text-[10px] font-bold text-[#A45B46] hover:underline">Xem {promotedCount} bánh ưu đãi ↗</button>}
            </div>
            <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
              {productPagination.pageItems.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  promotions={activePromotionsByProduct.get(Number(product.id)) || []}
                  onAddToCart={addToCart}
                  onBuyNow={buyNow}
                  isFavorite={favoriteIds.has(product.id)}
                  onToggleFavorite={toggleFavorite}
                />
              ))}
            </div>
            <Pagination
              currentPage={productPagination.currentPage}
              pageSize={productPagination.pageSize}
              totalItems={productPagination.totalItems}
              onPageChange={productPagination.setCurrentPage}
              onPageSizeChange={productPagination.setPageSize}
              pageSizeOptions={[4, 8, 12, 16]}
              itemLabel="sản phẩm"
              pageSizeLabel="Sản phẩm/trang"
            />
          </>
        )}

        <section aria-label="Cam kết WA Patisserie" className="mt-10 grid gap-3 rounded-2xl border border-[#EAE3DA] bg-[#F8F0E6] p-4 sm:grid-cols-3 sm:p-5">
          <div className="flex items-center gap-3 px-2 py-1">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-[#A97668]">✦</span>
            <div><p className="text-xs font-bold text-[#4A302B]">Bánh tươi mỗi ngày</p><p className="mt-1 text-[10px] leading-4 text-[#806B65]">Chọn lọc nguyên liệu, chăm chút chất lượng.</p></div>
          </div>
          <div className="flex items-center gap-3 border-[#E4D5C5] px-2 py-1 sm:border-x sm:px-5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-[#A97668]">✓</span>
            <div><p className="text-xs font-bold text-[#4A302B]">Thanh toán an toàn</p><p className="mt-1 text-[10px] leading-4 text-[#806B65]">Thông tin đơn hàng được xử lý bảo mật.</p></div>
          </div>
          <div className="flex items-center gap-3 px-2 py-1">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-[#A97668]">♡</span>
            <div><p className="text-xs font-bold text-[#4A302B]">Chăm sóc tận tâm</p><p className="mt-1 text-[10px] leading-4 text-[#806B65]">Sẵn sàng hỗ trợ bạn chọn bánh phù hợp.</p></div>
          </div>
        </section>
      </div>
    </div>
  )
}
