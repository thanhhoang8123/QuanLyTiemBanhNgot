import { Link, useOutletContext } from 'react-router-dom'
import Icon from '../../../components/Icon.jsx'
import { ProductArtwork } from '../../products/components/ProductArtwork.jsx'
import ShopProductCard from '../components/ShopProductCard.jsx'
import useShopCatalog from '../hooks/useShopCatalog.js'

function CatalogError({ message, onRetry }) {
  return (
    <div role="alert" className="rounded-2xl border border-[#E2C5BF] bg-white px-5 py-8 text-center">
      <p className="font-display text-lg text-[#76534D]">Chưa thể tải dữ liệu cửa hàng</p>
      <p className="mx-auto mt-2 max-w-xl text-xs leading-5 text-[#806B65]">{message}</p>
      <button type="button" onClick={onRetry} className="mt-5 rounded-full bg-[#76534D] px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-[#4A302B]">
        Thử tải lại
      </button>
    </div>
  )
}

function LoadingCards() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4" aria-label="Đang tải sản phẩm">
      {Array.from({ length: 4 }, (_, index) => (
        <div key={index} className="animate-pulse rounded-2xl border border-[#EAE3DA] bg-white p-3">
          <div className="h-36 rounded-xl bg-[#F3EFEB] sm:h-48" />
          <div className="mt-4 h-3 w-2/3 rounded bg-[#F3EFEB]" />
          <div className="mt-3 h-4 w-4/5 rounded bg-[#F3EFEB]" />
          <div className="mt-5 h-3 w-1/3 rounded bg-[#F3EFEB]" />
        </div>
      ))}
    </div>
  )
}

export default function ShopHomePage() {
  const { categories, products, isLoading, error, retry } = useShopCatalog()
  const { addToCart } = useOutletContext()
  const featuredProducts = products.slice(0, 4)

  return (
    <div>
      <section className="relative overflow-hidden">
        <div className="absolute -right-20 top-2 h-72 w-72 rounded-full bg-[#FAF0EE] blur-3xl sm:h-[30rem] sm:w-[30rem]" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 py-10 sm:px-7 sm:py-16 lg:grid-cols-[1.02fr_0.98fr] lg:gap-14 lg:px-10 lg:py-20">
          <div className="relative z-10">
            <p className="inline-flex items-center gap-2 rounded-full border border-[#EAE3DA] bg-white/80 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#9A7972]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#D0A263]" /> Ngọt ngào từ căn bếp nhỏ
            </p>
            <h1 className="font-display mt-6 max-w-2xl text-[42px] font-medium leading-[1.12] tracking-[-0.035em] text-[#4A302B] sm:text-6xl lg:text-[68px]">
              Một chút ngọt ngào, <span className="italic text-[#A97668]">đong đầy yêu thương.</span>
            </h1>
            <p className="mt-5 max-w-lg text-sm leading-7 text-[#806B65] sm:text-base">
              Từ những chiếc bánh kem mềm mịn đến món bánh nhỏ nhắn cho buổi trà chiều — mỗi chiếc bánh đều được chăm chút để ngày thường thêm đáng nhớ.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link to="/shop/products" className="inline-flex h-12 items-center gap-2 rounded-full bg-[#76534D] px-6 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(118,83,77,0.18)] transition hover:-translate-y-0.5 hover:bg-[#4A302B]">
                Khám phá bánh <Icon name="arrowUpRight" size={16} />
              </Link>
              <span className="text-xs text-[#9A7972]">Món ngon cho những dịp thật riêng</span>
            </div>
            <div className="mt-10 flex items-center gap-4 border-t border-[#EAE3DA] pt-5">
              <span className="font-display text-2xl text-[#D0A263]">01</span>
              <p className="max-w-xs text-[11px] leading-5 text-[#806B65]">Khám phá những chiếc bánh và thức uống tươi ngon được chuẩn bị mỗi ngày tại Daily Fresh.</p>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[560px]">
            <div className="absolute -left-3 top-10 z-10 h-20 w-20 rounded-full border border-white/70 bg-[#E8A69A]/75 sm:-left-6 sm:h-28 sm:w-28" />
            <div className="absolute -bottom-4 -right-2 z-10 h-24 w-24 rounded-full border border-white/70 bg-[#D0A263]/30 sm:-right-5 sm:h-36 sm:w-36" />
            <div className="relative z-20 overflow-hidden rounded-[28px] border-[7px] border-white bg-[#E9D7C4] shadow-[0_25px_70px_rgba(91,61,53,0.16)] sm:rounded-[36px] sm:border-[10px]">
              <div className="h-[300px] sm:h-[420px]">
                <ProductArtwork id="hero" name="Bánh ngọt thủ công" background="from-[#ead6c0] via-[#d9b498] to-[#a97760]" className="h-full w-full rounded-none" />
              </div>
              <div className="absolute inset-x-4 bottom-4 flex items-center justify-between rounded-2xl border border-white/60 bg-white/90 px-4 py-3 backdrop-blur sm:inset-x-5 sm:bottom-5 sm:px-5">
                <div>
                  <p className="font-display text-base font-semibold text-[#4A302B]">Niềm vui trong từng lớp bánh</p>
                  <p className="mt-1 text-[10px] text-[#806B65]">Tinh tế · Thủ công · Dịu dàng</p>
                </div>
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FAF0EE] text-[#A97668]"><Icon name="sparkles" size={18} /></span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-7 sm:py-16 lg:px-10">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#A97668]">Tìm vị bánh yêu thích</p>
            <h2 className="font-display mt-2 text-3xl font-medium text-[#4A302B] sm:text-4xl">Danh mục bánh</h2>
          </div>
          <Link to="/shop/products" className="inline-flex items-center gap-2 self-start text-xs font-semibold text-[#76534D] transition hover:text-[#4A302B] sm:self-auto">
            Xem tất cả sản phẩm <Icon name="arrowUpRight" size={15} />
          </Link>
        </div>

        {error ? (
          <div className="mt-7"><CatalogError message={error} onRetry={retry} /></div>
        ) : isLoading ? (
          <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 4 }, (_, index) => <div key={index} className="h-28 animate-pulse rounded-2xl bg-white/80" />)}
          </div>
        ) : categories.length === 0 ? (
          <p className="mt-7 rounded-2xl border border-dashed border-[#DDCDB8] bg-white/70 px-5 py-8 text-center text-sm text-[#806B65]">Hiện chưa có danh mục bánh.</p>
        ) : (
          <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
            {categories.map((category, index) => (
              <Link
                key={category.id}
                to={`/shop/products?category=${encodeURIComponent(category.id)}`}
                className="group flex min-h-28 items-end justify-between overflow-hidden rounded-2xl border border-[#EAE3DA] bg-white p-4 transition hover:-translate-y-1 hover:border-[#D0A263]/60 hover:shadow-[0_14px_32px_rgba(91,61,53,0.08)] sm:min-h-32 sm:p-5"
              >
                <div>
                  <span className={`mb-3 block h-1 w-9 rounded-full ${index % 2 ? 'bg-[#E8A69A]' : 'bg-[#D0A263]'}`} />
                  <span className="font-display text-base font-medium text-[#4A302B] sm:text-lg">{category.name}</span>
                </div>
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#FAF0EE] text-[#A97668] transition group-hover:bg-[#76534D] group-hover:text-white">
                  <Icon name="arrowUpRight" size={15} />
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="bg-white/70">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-7 sm:py-16 lg:px-10">
          <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#A97668]">Một vài gợi ý từ tiệm</p>
              <h2 className="font-display mt-2 text-3xl font-medium text-[#4A302B] sm:text-4xl">Bánh dành cho bạn</h2>
              <p className="mt-2 text-xs text-[#806B65]">Những sản phẩm đang được mở bán tại cửa hàng.</p>
            </div>
            <Link to="/shop/products" className="inline-flex items-center gap-2 self-start rounded-full border border-[#DDCDB8] px-4 py-2.5 text-xs font-semibold text-[#76534D] transition hover:border-[#76534D] hover:bg-[#FAF0EE] sm:self-auto">
              Xem toàn bộ bánh <Icon name="arrowUpRight" size={15} />
            </Link>
          </div>

          {error ? (
            <CatalogError message={error} onRetry={retry} />
          ) : isLoading ? (
            <LoadingCards />
          ) : featuredProducts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#DDCDB8] bg-[#FCF9F3] px-5 py-10 text-center">
              <p className="font-display text-lg text-[#76534D]">Tiệm đang chuẩn bị những mẻ bánh mới</p>
              <p className="mt-2 text-xs text-[#806B65]">Hiện chưa có sản phẩm nào đang mở bán.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
              {featuredProducts.map((product) => <ShopProductCard key={product.id} product={product} onAddToCart={addToCart} />)}
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-7 lg:px-10">
        <div className="flex flex-col items-start justify-between gap-5 overflow-hidden rounded-3xl bg-[#76534D] px-6 py-8 text-white sm:flex-row sm:items-center sm:px-10 sm:py-10">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#E8C89D]">Mời bạn ghé xem</p>
            <h2 className="font-display mt-2 text-2xl font-medium sm:text-3xl">Tìm chiếc bánh cho dịp đặc biệt</h2>
            <p className="mt-2 max-w-xl text-xs leading-6 text-white/75">Khám phá các lựa chọn bánh hiện có và chọn hương vị bạn yêu thích.</p>
          </div>
          <Link to="/shop/products" className="inline-flex h-11 shrink-0 items-center gap-2 rounded-full bg-[#FCF9F3] px-5 text-xs font-bold text-[#4A302B] transition hover:bg-[#FAF0EE]">
            Xem danh sách bánh <Icon name="arrowUpRight" size={15} />
          </Link>
        </div>
      </section>
    </div>
  )
}
