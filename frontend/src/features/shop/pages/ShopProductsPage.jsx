import { useMemo, useState } from 'react'
import { Link, useOutletContext, useSearchParams } from 'react-router-dom'
import Icon from '../../../components/Icon.jsx'
import ShopProductCard from '../components/ShopProductCard.jsx'
import useShopCatalog from '../hooks/useShopCatalog.js'

function CatalogError({ message, onRetry }) {
  return (
    <div role="alert" className="rounded-2xl border border-[#E2C5BF] bg-white px-5 py-12 text-center">
      <p className="font-display text-xl text-[#76534D]">Không tải được danh sách bánh</p>
      <p className="mx-auto mt-2 max-w-xl text-xs leading-5 text-[#806B65]">{message}</p>
      <button type="button" onClick={onRetry} className="mt-5 rounded-full bg-[#76534D] px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-[#4A302B]">
        Thử tải lại
      </button>
    </div>
  )
}

export default function ShopProductsPage() {
  const { categories, products, isLoading, error, retry } = useShopCatalog()
  const { addToCart } = useOutletContext()
  const [searchParams, setSearchParams] = useSearchParams()
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState('default')
  const selectedCategory = searchParams.get('category') || ''

  const visibleProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('vi')
    const filtered = products.filter((product) => {
      const matchesQuery = `${product.name} ${product.code}`.toLocaleLowerCase('vi').includes(normalizedQuery)
      return matchesQuery && (!selectedCategory || product.categoryId === selectedCategory)
    })

    if (sort === 'price-asc') return filtered.sort((a, b) => a.price - b.price)
    if (sort === 'price-desc') return filtered.sort((a, b) => b.price - a.price)
    return filtered
  }, [products, query, selectedCategory, sort])

  const updateCategory = (value) => {
    const nextParams = new URLSearchParams(searchParams)
    if (value) nextParams.set('category', value)
    else nextParams.delete('category')
    setSearchParams(nextParams)
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-7 sm:py-12 lg:px-10">
      <div className="mb-8 flex flex-col gap-5 border-b border-[#EAE3DA] pb-7 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link to="/shop" className="mb-4 inline-flex items-center gap-2 text-[11px] font-semibold text-[#9A7972] transition hover:text-[#4A302B]">
            <span className="rotate-180"><Icon name="arrowUpRight" size={14} /></span> Về trang chủ
          </Link>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#A97668]">Bộ sưu tập WA Pâtisserie</p>
          <h1 className="font-display mt-2 text-4xl font-medium text-[#4A302B] sm:text-5xl">Những chiếc bánh ngọt</h1>
          <p className="mt-3 max-w-2xl text-xs leading-6 text-[#806B65] sm:text-sm">Tìm món bánh phù hợp cho buổi trà chiều, ngày đặc biệt hay một chút tự thưởng cho riêng mình.</p>
        </div>
        <Link to="/shop" className="inline-flex h-10 shrink-0 items-center justify-center gap-2 self-start rounded-full border border-[#DDCDB8] px-4 text-xs font-semibold text-[#76534D] transition hover:border-[#76534D] hover:bg-white sm:self-auto">
          <Icon name="arrowUpRight" size={15} /> Trang chủ cửa hàng
        </Link>
      </div>

      <section aria-label="Tìm và lọc sản phẩm" className="mb-7 rounded-2xl border border-[#EAE3DA] bg-white p-4 sm:p-5">
        <div className="grid gap-3 md:grid-cols-[minmax(240px,1fr)_minmax(180px,0.55fr)_minmax(180px,0.55fr)]">
          <label className="relative block">
            <span className="sr-only">Tìm theo tên hoặc mã sản phẩm</span>
            <Icon name="search" size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9A7972]" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Tìm tên hoặc mã bánh..."
              className="h-11 w-full rounded-xl border border-[#EAE3DA] bg-[#FCF9F3] pl-10 pr-3 text-xs text-[#4A302B] outline-none transition placeholder:text-[#9A7972] focus:border-[#D0A263] focus:bg-white"
            />
          </label>
          <label>
            <span className="sr-only">Lọc theo danh mục</span>
            <select
              value={selectedCategory}
              onChange={(event) => updateCategory(event.target.value)}
              className="h-11 w-full rounded-xl border border-[#EAE3DA] bg-[#FCF9F3] px-3 text-xs text-[#4A302B] outline-none transition focus:border-[#D0A263] focus:bg-white"
            >
              <option value="">Tất cả danh mục</option>
              {categories.map((category) => <option key={category.id} value={String(category.id)}>{category.name}</option>)}
            </select>
          </label>
          <label>
            <span className="sr-only">Sắp xếp sản phẩm</span>
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value)}
              className="h-11 w-full rounded-xl border border-[#EAE3DA] bg-[#FCF9F3] px-3 text-xs text-[#4A302B] outline-none transition focus:border-[#D0A263] focus:bg-white"
            >
              <option value="default">Sắp xếp: Mặc định</option>
              <option value="price-asc">Giá: thấp đến cao</option>
              <option value="price-desc">Giá: cao đến thấp</option>
            </select>
          </label>
        </div>
        {!isLoading && !error && (
          <p className="mt-4 text-[11px] text-[#806B65]">
            {visibleProducts.length} sản phẩm{selectedCategory ? ' trong danh mục đã chọn' : ''} đang mở bán
          </p>
        )}
      </section>

      {error ? (
        <CatalogError message={error} onRetry={retry} />
      ) : isLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4" aria-label="Đang tải sản phẩm">
          {Array.from({ length: 8 }, (_, index) => (
            <div key={index} className="animate-pulse rounded-2xl border border-[#EAE3DA] bg-white p-3">
              <div className="h-36 rounded-xl bg-[#F3EFEB] sm:h-48" />
              <div className="mt-4 h-3 w-2/3 rounded bg-[#F3EFEB]" />
              <div className="mt-3 h-4 w-4/5 rounded bg-[#F3EFEB]" />
              <div className="mt-5 h-3 w-1/3 rounded bg-[#F3EFEB]" />
            </div>
          ))}
        </div>
      ) : visibleProducts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#DDCDB8] bg-white px-5 py-14 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#FAF0EE] text-[#A97668]"><Icon name="search" size={20} /></span>
          <h2 className="font-display mt-4 text-xl text-[#4A302B]">Chưa tìm thấy chiếc bánh phù hợp</h2>
          <p className="mt-2 text-xs text-[#806B65]">Thử từ khóa khác hoặc xem toàn bộ sản phẩm đang mở bán.</p>
          <button
            type="button"
            onClick={() => {
              setQuery('')
              updateCategory('')
            }}
            className="mt-5 rounded-full border border-[#DDCDB8] px-5 py-2.5 text-xs font-semibold text-[#76534D] transition hover:bg-[#FAF0EE]"
          >
            Xóa bộ lọc
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
          {visibleProducts.map((product) => <ShopProductCard key={product.id} product={product} onAddToCart={addToCart} />)}
        </div>
      )}
    </div>
  )
}
