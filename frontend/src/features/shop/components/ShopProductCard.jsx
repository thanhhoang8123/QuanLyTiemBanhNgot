import { ProductArtwork } from '../../products/components/ProductArtwork.jsx'

const currency = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
})

export default function ShopProductCard({ product }) {
  const isInStock = product.stock > 0

  return (
    <article className="group overflow-hidden rounded-2xl border border-[#EAE3DA] bg-white transition duration-300 hover:-translate-y-1 hover:border-[#D0A263]/60 hover:shadow-[0_18px_40px_rgba(91,61,53,0.10)]">
      <div className="relative p-2.5">
        <ProductArtwork
          id={product.id}
          name={product.name}
          background={product.background}
          imageUrl={product.imageUrl}
          className="h-48 w-full rounded-xl sm:h-56"
        />
        <span className={`absolute left-5 top-5 rounded-full px-3 py-1 text-[10px] font-semibold ${isInStock ? 'bg-white/95 text-[#536B50]' : 'bg-[#F3EFEB] text-[#675650]'}`}>
          {isInStock ? 'Đang bán' : 'Tạm hết hàng'}
        </span>
      </div>
      <div className="px-4 pb-4 pt-1 sm:px-5 sm:pb-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9A7972]">
          {product.category || 'WA Pâtisserie'}
        </p>
        <h3 className="font-display mt-2 line-clamp-2 min-h-12 text-lg font-medium leading-6 text-[#4A302B]">
          {product.name}
        </h3>
        <div className="mt-4 flex items-center justify-between gap-3">
          <p className="text-sm font-bold text-[#76534D]">{currency.format(product.price)}</p>
          <span className="text-[10px] font-medium text-[#806B65]">{product.code}</span>
        </div>
      </div>
    </article>
  )
}
