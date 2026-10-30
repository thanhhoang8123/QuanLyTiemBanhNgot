import { Link, useNavigate } from 'react-router-dom'
import Icon from '../../../components/Icon.jsx'
import ShopProductImage from './ShopProductImage.jsx'
import {
  findBestShopPromotion,
  getActiveShopPromotions,
} from '../services/shopPromotions.js'
import { getExpiryStatus } from '../../products/services/productExpiry.js'

const currency = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
})

export default function ShopProductCard({ product, onAddToCart, promotion = null, badge = product.shopBadge ?? '' }) {
  const navigate = useNavigate()
  const expiryStatus = getExpiryStatus(product.expiryDate)
  const isExpired = expiryStatus.isExpired
  const isInStock = product.stock > 0
  const canBuy = isInStock && product.status === 'Đang bán' && !isExpired
  const originalPrice = Number(product.price) || 0
  const activePromotions = getActiveShopPromotions(
    Array.isArray(promotion) ? promotion : promotion ? [promotion] : [],
  )
  const bestPromotion = findBestShopPromotion(activePromotions, originalPrice)
  const hasPromotion = Boolean(bestPromotion)
  const discountedPrice = originalPrice - (bestPromotion?.discountAmount ?? 0)

  return (
    <article className="group flex h-full min-w-0 flex-col overflow-hidden rounded-[20px] border border-[#EAE3DA] bg-white transition duration-300 hover:-translate-y-1 hover:border-[#D0A263]/60 hover:shadow-[0_18px_40px_rgba(91,61,53,0.10)]">
      <div className="relative m-2 overflow-hidden rounded-[15px] bg-[#F3E3D3]">
        <Link to={`/shop/products/${product.id}`} className="block aspect-[1.24/1] overflow-hidden" aria-label={`Xem ${product.name}`}>
          <ShopProductImage product={product} className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.06]" />
        </Link>
        {isExpired ? (
          <span className="absolute bottom-2.5 left-2.5 max-w-[calc(100%-1.25rem)] truncate rounded-full bg-rose-700 px-2.5 py-1 text-[9px] font-bold text-white shadow-sm">
            ⛔ Hết hạn sử dụng
          </span>
        ) : hasPromotion ? (
          <span className="absolute bottom-2.5 left-2.5 max-w-[calc(100%-1.25rem)] truncate rounded-full bg-[#B94F35] px-2.5 py-1.5 text-[9px] font-bold text-white shadow-sm">
            Giảm {currency.format(bestPromotion.discountAmount)}
            {bestPromotion.promotion.promotionCode ? ` · ${bestPromotion.promotion.promotionCode}` : ''}
          </span>
        ) : badge ? (
          <span className="absolute bottom-2.5 left-2.5 max-w-[calc(100%-1.25rem)] truncate rounded-full bg-[#76534D] px-2.5 py-1.5 text-[9px] font-bold text-white shadow-sm">
            {badge}
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col px-3 pb-3 pt-1 sm:px-4 sm:pb-4">
        <div className="flex items-center justify-between gap-2">
          <p className="min-w-0 truncate text-[9px] font-bold uppercase tracking-[0.12em] text-[#A97668]">
            {product.category || 'WA Patisserie'}
          </p>
          <p className={`shrink-0 text-[9px] font-medium ${canBuy ? 'text-[#5F805B]' : 'text-[#A97668]'}`}>
            {canBuy ? `Còn ${product.stock}` : isExpired ? '⛔ Hết HSD' : product.stock <= 0 ? 'Hết hàng' : 'Ngừng bán'}
          </p>
        </div>
        <Link to={`/shop/products/${product.id}`} className="block">
          <h3 className="font-display mt-1 line-clamp-2 text-[15px] font-medium leading-5 text-[#4A302B] transition group-hover:text-[#9A5E4E] sm:text-base">
            {product.name}
          </h3>
        </Link>
        <div className="mt-2 flex min-h-6 flex-wrap items-baseline gap-x-2">
          {hasPromotion && (
            <span className="whitespace-nowrap text-[10px] text-[#9A7972] line-through sm:text-xs">
              {currency.format(originalPrice)}
            </span>
          )}
          <p className={`whitespace-nowrap text-sm font-extrabold tracking-tight sm:text-base ${hasPromotion ? 'text-[#B94F35]' : 'text-[#76534D]'}`}>
            {currency.format(discountedPrice)}
          </p>
        </div>
        <div className="mt-auto grid grid-cols-2 gap-2 pt-2">
          {onAddToCart && (
            <button
              type="button"
              disabled={!canBuy}
              onClick={() => onAddToCart(product.id, 1)}
              className="inline-flex h-9 min-w-0 items-center justify-center gap-1 rounded-full border border-[#DDCDB8] px-2 text-[9px] font-bold text-[#76534D] transition hover:bg-[#FAF0EE] disabled:cursor-not-allowed disabled:opacity-50 sm:text-[10px]"
            >
              <Icon name="cart" size={12} /> <span className="whitespace-nowrap">{isExpired ? 'Hết HSD' : 'Thêm giỏ'}</span>
            </button>
          )}
          {onAddToCart && (
            <button
              type="button"
              disabled={!canBuy}
              onClick={() => {
                onAddToCart(product.id, 1)
                navigate('/shop/checkout')
              }}
              className="inline-flex h-9 min-w-0 items-center justify-center whitespace-nowrap rounded-full bg-[#76534D] px-2 text-[9px] font-bold text-white transition hover:bg-[#4A302B] disabled:cursor-not-allowed disabled:bg-[#C9B9AF] sm:text-[10px]"
            >
              {isExpired ? 'Ngừng bán' : 'Mua ngay'}
            </button>
          )}
        </div>
      </div>
    </article>
  )
}
