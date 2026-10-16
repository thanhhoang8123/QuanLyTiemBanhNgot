import Icon from '../../../components/Icon.jsx'
import { ProductArtwork } from '../../products/components/ProductArtwork.jsx'

const currency = new Intl.NumberFormat('vi-VN')

export default function ProductCard({ product, onAdd, quantityInCart = 0 }) {
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
          <span className="text-[13px] font-bold tracking-tight text-rosewood sm:text-sm">{currency.format(product.price)}đ</span>
          <button type="button" onClick={() => onAdd(product)} aria-label={`Thêm ${product.name} vào giỏ`} className="flex h-10 w-10 items-center justify-center rounded-xl bg-caramel text-action-ink shadow-sm transition hover:bg-caramel-hover active:scale-95 focus-visible:outline-caramel">
            <Icon name="plus" size={18} />
          </button>
        </div>
      </div>
    </article>
  )
}
