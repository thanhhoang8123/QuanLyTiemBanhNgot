import Icon from '../../../components/Icon.jsx'
import { ProductArtwork } from '../../products/components/ProductArtwork.jsx'
import { getExpiryStatus, isExpiringWithinDays } from '../../products/services/productExpiry.js'

const currency = new Intl.NumberFormat('vi-VN')

export default function ProductCard({
  product,
  onAdd,
  quantityInCart = 0,
}) {
  const expiryInfo = getExpiryStatus(product.expiryDate)
  const isExpired = expiryInfo.isExpired
  const outOfStock = quantityInCart >= product.stock
  const cannotSell = outOfStock || isExpired
  const hasPromotion = Number(product.salePrice) < Number(product.originalPrice)
  const expiringSoon = isExpiringWithinDays(product.expiryDate, 1)

  return (
    <article
      className={`group overflow-hidden rounded-2xl border bg-paper transition duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-rosewood/[0.08] ${
        isExpired
          ? 'border-rose-200 bg-rose-50/20 opacity-80'
          : quantityInCart > 0
            ? 'border-caramel ring-2 ring-caramel/25'
            : 'border-border'
      }`}
    >
      <div className="relative">
        <ProductArtwork
          id={product.id}
          name={product.name}
          background={product.background}
          imageUrl={product.imageUrl}
        />
        {product.label && (
          <span className="absolute left-2.5 top-2.5 rounded-full border border-white/80 bg-paper/95 px-2.5 py-0.5 text-[10px] font-bold text-rosewood shadow-sm">
            {product.label}
          </span>
        )}
        {isExpired ? (
          <span className="absolute right-2.5 top-2.5 rounded-full border border-rose-300 bg-rose-600/95 px-2.5 py-0.5 text-[10px] font-bold text-white shadow-sm">
            ⛔ Hết HSD
          </span>
        ) : expiringSoon ? (
          <span className="absolute right-2.5 top-2.5 rounded-full border border-amber-300 bg-amber-500/95 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
            ⚠️ Cận date
          </span>
        ) : null}
        {quantityInCart > 0 && (
          <span className="absolute bottom-2.5 left-2.5 rounded-full bg-caramel px-2.5 py-0.5 text-[10px] font-bold text-white shadow-md">
            Đã chọn · {quantityInCart}
          </span>
        )}
      </div>
      <div className="p-3.5 sm:p-4">
        <span className="inline-block rounded-md bg-petal/80 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-rosewood/70">
          {product.category}
        </span>
        <h3 className="mt-1.5 min-h-10 text-sm font-bold leading-5 text-rosewood transition-colors group-hover:text-caramel">
          {product.name}
        </h3>
        <div className="mt-3 flex items-center justify-between gap-1">
          <span className="flex min-w-0 flex-col">
            {hasPromotion && (
              <span className="text-[11px] font-medium text-muted line-through">
                {currency.format(product.originalPrice)}đ
              </span>
            )}
            <span
              className={`text-sm font-extrabold tracking-tight sm:text-base ${
                hasPromotion ? 'text-danger' : 'text-rosewood'
              }`}
            >
              {currency.format(hasPromotion ? product.salePrice : product.originalPrice)}đ
            </span>
          </span>
          <button
            type="button"
            onClick={() => onAdd(product)}
            disabled={cannotSell}
            aria-label={`Thêm ${product.name} vào giỏ`}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-caramel text-white shadow-md shadow-caramel/25 transition hover:bg-caramel-hover hover:scale-105 active:scale-95 focus-visible:outline-caramel disabled:cursor-not-allowed disabled:bg-rosewood/20 disabled:text-white disabled:shadow-none"
          >
            <Icon name="plus" size={18} />
          </button>
        </div>
        <p className="mt-1.5 text-[10px] font-medium">
          {isExpired ? (
            <span className="text-rose-700 font-bold">⛔ Quá hạn sử dụng</span>
          ) : outOfStock ? (
            <span className="text-danger font-semibold">Hết tồn kho</span>
          ) : (
            <span className="text-muted">Còn {product.stock} {product.unit || 'cái'}</span>
          )}
        </p>
      </div>
    </article>
  )
}
