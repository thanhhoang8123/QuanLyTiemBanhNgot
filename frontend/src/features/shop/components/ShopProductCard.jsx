import { ProductArtwork } from '../../products/components/ProductArtwork.jsx'
import { Link } from 'react-router-dom'

const currency = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
})

export default function ShopProductCard({ product, onAddToCart }) {
  const isInStock = product.stock > 0
  const canBuy = isInStock && product.status === 'Đang bán'

  return (
    <article className="group overflow-hidden rounded-2xl border border-[#EAE3DA] bg-white transition duration-300 hover:-translate-y-1 hover:border-[#D0A263]/60 hover:shadow-[0_18px_40px_rgba(91,61,53,0.10)]">
      <Link to={`/shop/products/${product.id}`} className="block">
        <div className="relative p-2.5">
          <ProductArtwork
            id={product.id}
            name={product.name}
            background={product.background}
            imageUrl={product.imageUrl}
            className="h-48 w-full rounded-xl sm:h-56"
          />
          <span className={`absolute left-5 top-5 rounded-full px-3 py-1 text-[10px] font-semibold ${canBuy ? 'bg-white/95 text-[#536B50]' : 'bg-[#F3EFEB] text-[#675650]'}`}>
            {canBuy ? 'Đang bán' : product.status !== 'Đang bán' ? 'Ngừng bán' : 'Tạm hết hàng'}
          </span>
        </div>
        <div className="px-4 pt-1 sm:px-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9A7972]">
            {product.category || 'WA Pâtisserie'}
          </p>
          <h3 className="font-display mt-2 line-clamp-2 min-h-12 text-lg font-medium leading-6 text-[#4A302B]">
            {product.name}
          </h3>
          <div className="mt-3 flex items-center justify-between gap-3">
            <p className="text-sm font-bold text-[#76534D]">{currency.format(product.price)}</p>
            <span className="text-[10px] font-medium text-[#806B65]">{product.code}</span>
          </div>
        </div>
      </Link>
      <div className="flex items-center justify-between gap-2 px-4 pb-4 pt-3 sm:px-5 sm:pb-5">
        <span className="text-[10px] text-[#806B65]">{canBuy ? `Còn ${product.stock}` : 'Chưa thể đặt mua'}</span>
        {onAddToCart && (
          <button
            type="button"
            disabled={!canBuy}
            onClick={() => onAddToCart(product.id, 1)}
            className="rounded-full border border-[#DDCDB8] px-3 py-2 text-[10px] font-semibold text-[#76534D] transition hover:bg-[#FAF0EE] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Thêm giỏ
          </button>
        )}
      </div>
    </article>
  )
}
