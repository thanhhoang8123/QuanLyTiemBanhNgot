import Icon from '../../../components/Icon.jsx'
import { ProductArtwork } from '../../products/components/ProductArtwork.jsx'

const currency = new Intl.NumberFormat('vi-VN')

export default function ProductCard({
  product,
  onAdd,
  quantityInCart = 0,
  pricingLoading = false,
}) {
  const outOfStock = quantityInCart >= product.stock
  const hasPromotion = Number(product.salePrice) < Number(product.originalPrice)

  return (
    <article className={`group overflow-hidden rounded-2xl border bg-paper transition duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-rosewood/[0.12] ${
      quantityInCart > 0 ? 'border-caramel ring-1 ring-caramel/35' : 'border-border'
    }`}>
      <div className="relative">
        <ProductArtwork id={product.id} name={product.name} background={product.background} />
        {product.label && <span className="absolute left-2.5 top-2.5 rounded-full border border-white/70 bg-paper/95 px-2.5 py-1 text-[9px] font-bold text-rosewood shadow-sm">{product.label}</span>}
        {quantityInCart > 0 && <span className="absolute bottom-2.5 left-2.5 rounded-full bg-rosewood px-2.5 py-1 text-[9px] font-bold text-white shadow">Đã chọn · {quantityInCart}</span>}
      </div>
      <div className="p-3 sm:p-3.5">
        <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted">{product.category}</p>
        <h3 className="mt-1.5 min-h-8 text-xs font-bold leading-4 text-rosewood sm:text-[13px]">{product.name}</h3>
        <div className="mt-3 flex items-center justify-between gap-1">
          <span className="flex min-w-0 flex-col">
            {hasPromotion && (
              <span className="text-[10px] font-medium text-muted line-through">
                {currency.format(product.originalPrice)}đ
              </span>
            )}
            <span className={`text-[13px] font-bold tracking-tight sm:text-sm ${hasPromotion ? 'text-danger' : 'text-rosewood'}`}>
              {currency.format(hasPromotion ? product.salePrice : product.originalPrice)}đ
            </span>
          </span>
          <button type="button" onClick={() => onAdd(product)} disabled={outOfStock || pricingLoading} aria-label={`Thêm ${product.name} vào giỏ`} className="flex h-10 w-10 items-center justify-center rounded-xl bg-caramel text-action-ink shadow-sm transition hover:bg-caramel-hover active:scale-95 focus-visible:outline-caramel disabled:cursor-not-allowed disabled:bg-rosewood-soft disabled:text-white disabled:shadow-none">
            <Icon name="plus" size={18} />
          </button>
        </div>
        <p className="mt-1 text-[9px] text-muted">
          {outOfStock ? 'Hết tồn kho' : `Còn ${product.stock} ${product.unit || 'cái'}`}
        </p>
      </div>
    </article>
  )
}
