import { useEffect, useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import Icon from '../../../components/Icon.jsx'
import ShopProductCard from '../components/ShopProductCard.jsx'
import useShopCatalog from '../hooks/useShopCatalog.js'
import { getPromotions } from '../../promotions/services/promotionService.js'
import { getPromotionProducts } from '../../promotion-products/services/promotionProductService.js'

const photos = {
  hero: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=1400&q=88',
  cake: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=700&q=85',
  bread: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=700&q=85',
  pastry: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=700&q=85',
  cookies: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=700&q=85',
  story: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1000&q=85',
}

function CatalogError({ message, onRetry }) {
  return <div role="alert" className="rounded-2xl border border-[#E2C5BF] bg-white px-5 py-8 text-center"><p className="font-display text-lg text-[#76534D]">Chưa thể tải dữ liệu cửa hàng</p><p className="mx-auto mt-2 max-w-xl text-xs leading-5 text-[#806B65]">{message}</p><button type="button" onClick={onRetry} className="mt-5 rounded-full bg-[#76534D] px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-[#4A302B]">Thử tải lại</button></div>
}
function SectionHeading({ eyebrow, title, description, link = '/shop/products', linkText = 'Khám phá tất cả' }) {
  return <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-[10px] font-bold uppercase tracking-[.24em] text-[#B47B68]">{eyebrow}</p><h2 className="font-display mt-2 text-3xl font-medium tracking-tight text-[#452D27] sm:text-4xl">{title}</h2>{description && <p className="mt-2 max-w-xl text-sm leading-6 text-[#88736B]">{description}</p>}</div><Link to={link} className="inline-flex h-10 items-center gap-2 self-start rounded-full border border-[#DDCDB8] px-4 text-xs font-semibold text-[#76534D] transition hover:border-[#76534D] hover:bg-white sm:self-auto">{linkText}<Icon name="arrowUpRight" size={15}/></Link></div>
}
function CategoryTile({ category, index }) {
  const choices = [photos.cake, photos.bread, photos.pastry, photos.cookies, photos.cake, photos.bread]
  return <Link key={category.id} to={`/shop/products?category=${encodeURIComponent(category.id)}`} className="group relative min-h-52 overflow-hidden rounded-2xl bg-[#EAD9C9] sm:min-h-64"><img src={choices[index % choices.length]} alt={category.name} loading="lazy" className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105"/><div className="absolute inset-0 bg-gradient-to-t from-[#2F1D18]/75 via-[#2F1D18]/10 to-transparent"/><div className="absolute inset-x-4 bottom-4 flex items-end justify-between gap-3 sm:inset-x-5 sm:bottom-5"><div><p className="text-[9px] font-semibold uppercase tracking-[.2em] text-white/75">Bộ sưu tập</p><h3 className="font-display mt-1 text-xl text-white sm:text-2xl">{category.name}</h3></div><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-[#76534D] transition group-hover:bg-[#D0A263] group-hover:text-white"><Icon name="arrowUpRight" size={16}/></span></div></Link>
}

const heroSlides = [
  {
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=2200&q=90',
    alt: 'Bánh mì thủ công mới ra lò trong tiệm bánh',
    eyebrow: 'Lò bánh thủ công · Tươi mới mỗi ngày',
    title: <>Đánh thức vị giác<br className="hidden sm:block" /> với bánh mới ra lò</>,
    description: 'Bánh mì thủ công, bánh ngọt tinh tế và những món tráng miệng được làm bằng sự chăm chút — thơm ngon mỗi ngày tại Daily Fresh.',
  },
  {
    image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=2200&q=90',
    alt: 'Croissant vàng giòn và bánh ngọt mới nướng',
    eyebrow: 'Bánh nướng · Thơm giòn mỗi sáng',
    title: <>Một buổi sáng<br className="hidden sm:block" /> thơm mùi bánh mới</>,
    description: 'Từ chiếc croissant vàng giòn đến bánh ngọt mềm thơm — chọn món yêu thích cho một ngày thật dịu dàng.',
  },
  {
    image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=2200&q=90',
    alt: 'Bánh kem trang trí tinh tế cho dịp đặc biệt',
    eyebrow: 'Khoảnh khắc ngọt ngào · Dành riêng cho bạn',
    title: <>Trao gửi yêu thương<br className="hidden sm:block" /> bằng chiếc bánh xinh</>,
    description: 'Bánh kem và món ngọt cho sinh nhật, buổi gặp gỡ thân quen hay những dịp đáng nhớ bên người thương.',
  },
]

function HeroSlideshow() {
  const [activeSlide, setActiveSlide] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  useEffect(() => {
    if (isPaused) return undefined
    const timer = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % heroSlides.length)
    }, 5000)
    return () => window.clearInterval(timer)
  }, [isPaused])

  const goTo = (index) => setActiveSlide((index + heroSlides.length) % heroSlides.length)
  const slide = heroSlides[activeSlide]

  return <div
    className="relative min-h-[520px] sm:min-h-[600px] lg:min-h-[690px]"
    onMouseEnter={() => setIsPaused(true)}
    onMouseLeave={() => setIsPaused(false)}
    onFocus={() => setIsPaused(true)}
    onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setIsPaused(false) }}
    aria-roledescription="carousel"
    aria-label="Bộ ảnh giới thiệu tiệm bánh Daily Fresh"
  >
    {heroSlides.map((item, index) => <div key={item.image} className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === activeSlide ? 'opacity-100' : 'pointer-events-none opacity-0'}`} aria-hidden={index !== activeSlide}>
      <img src={item.image} alt={item.alt} className={`absolute inset-0 h-full w-full object-cover object-center transition-transform duration-[6000ms] ${index === activeSlide ? 'scale-105' : 'scale-100'}`} fetchPriority={index === 0 ? 'high' : 'auto'} loading={index === 0 ? 'eager' : 'lazy'} onError={(event) => { event.currentTarget.style.opacity = '0' }} />
    </div>)}
    <div className="absolute inset-0 bg-gradient-to-b from-[#21130E]/35 via-[#21130E]/30 to-[#21130E]/65" />
    <div className="absolute inset-x-0 top-0 z-[1] h-20 bg-gradient-to-b from-black/20 to-transparent sm:h-28" />
    <div className="relative z-10 flex min-h-[520px] flex-col items-center justify-center px-5 pb-24 pt-16 text-center text-white sm:min-h-[600px] sm:px-10 sm:pb-28 lg:min-h-[690px]">
      <span key={`eyebrow-${activeSlide}`} className="animate-[fadeIn_.6s_ease-out] mb-5 inline-flex items-center gap-2 rounded-full border border-white/50 bg-[#FFF9EF]/90 px-4 py-2 text-[9px] font-bold uppercase tracking-[.25em] text-[#7A3927] shadow-lg sm:text-[10px]">
        <span className="h-1.5 w-1.5 rounded-full bg-[#B85E3F]" /> {slide.eyebrow}
      </span>
      <h1 key={`title-${activeSlide}`} className="animate-[fadeIn_.7s_ease-out] font-display max-w-5xl text-4xl font-semibold uppercase leading-[1.04] tracking-[-.025em] drop-shadow-[0_3px_14px_rgba(0,0,0,.35)] sm:text-6xl lg:text-[76px]">
        {slide.title}
      </h1>
      <p key={`description-${activeSlide}`} className="animate-[fadeIn_.8s_ease-out] mt-5 max-w-2xl text-sm leading-6 text-white/95 drop-shadow sm:text-base sm:leading-7">{slide.description}</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link to="/shop/products" className="inline-flex h-12 items-center gap-2 rounded-full bg-[#B94F20] px-7 text-xs font-bold uppercase tracking-wide text-white shadow-[0_8px_25px_rgba(65,25,10,.25)] transition hover:-translate-y-0.5 hover:bg-[#963D18] focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#8A4934]">Khám phá tiệm bánh <Icon name="arrowUpRight" size={16} /></Link>
        <a href="#danh-muc-banh" className="inline-flex h-12 items-center gap-2 rounded-full border border-white/70 bg-white/10 px-6 text-xs font-bold uppercase tracking-wide text-white backdrop-blur-sm transition hover:bg-white/20">Xem bộ sưu tập <Icon name="arrowDown" size={15} /></a>
      </div>
      <div className="absolute bottom-5 left-5 right-5 flex items-center justify-between border-t border-white/40 pt-4 text-left sm:bottom-7 sm:left-8 sm:right-8 lg:bottom-8 lg:left-10 lg:right-10">
        <div><p className="font-display text-base sm:text-lg">The Daily Fresh Bakery</p><p className="mt-1 text-[9px] uppercase tracking-[.2em] text-white/80 sm:text-[10px]">Bánh ngon · Nguyên liệu chọn lọc · Làm bằng yêu thương</p></div>
        <Link to="/shop/products" className="hidden items-center gap-2 rounded-full bg-[#F8F1E4] px-4 py-2.5 text-xs font-semibold text-[#60382B] transition hover:bg-white sm:inline-flex">Đặt bánh online <Icon name="arrowUpRight" size={14}/></Link>
      </div>
      <div className="absolute bottom-[92px] left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 sm:bottom-[104px]" aria-label="Chọn ảnh banner">
        {heroSlides.map((item, index) => <button key={item.image} type="button" aria-label={`Chuyển đến ảnh ${index + 1}`} aria-current={index === activeSlide ? 'true' : undefined} onClick={() => goTo(index)} className={`h-2 rounded-full border border-white/80 transition-all duration-300 ${index === activeSlide ? 'w-8 bg-white' : 'w-2 bg-white/45 hover:bg-white/80'}`} />)}
      </div>
      <div className="absolute right-4 top-1/2 z-20 hidden -translate-y-1/2 flex-col gap-2 sm:flex">
        <button type="button" onClick={() => goTo(activeSlide - 1)} aria-label="Ảnh trước" className="flex h-10 w-10 items-center justify-center rounded-full border border-white/60 bg-black/20 text-2xl text-white backdrop-blur transition hover:bg-white hover:text-[#76534D]">‹</button>
        <button type="button" onClick={() => goTo(activeSlide + 1)} aria-label="Ảnh tiếp theo" className="flex h-10 w-10 items-center justify-center rounded-full border border-white/60 bg-black/20 text-2xl text-white backdrop-blur transition hover:bg-white hover:text-[#76534D]">›</button>
      </div>
    </div>
  </div>
}

export default function ShopHomePage() {
  const { categories, products, isLoading, error, retry } = useShopCatalog()
  const { addToCart } = useOutletContext()
  const [promotionLinks, setPromotionLinks] = useState([])
  const [promotions, setPromotions] = useState([])

  useEffect(() => {
    const controller = new AbortController()
    Promise.all([
      getPromotions({ signal: controller.signal }),
      getPromotionProducts({ signal: controller.signal }),
    ]).then(([promotionData, linkData]) => {
      if (!controller.signal.aborted) {
        setPromotions(Array.isArray(promotionData) ? promotionData : [])
        setPromotionLinks(Array.isArray(linkData) ? linkData : [])
      }
    }).catch((loadError) => {
      // Không làm ảnh hưởng trang chủ nếu API khuyến mãi chưa khả dụng.
      if (loadError.name !== 'AbortError') {
        setPromotions([])
        setPromotionLinks([])
      }
    })
    return () => controller.abort()
  }, [])

  const today = new Date().toISOString().slice(0, 10)
  const activePromotions = promotions.filter((promotion) => (
    promotion.status === true
    && (!promotion.startDate || String(promotion.startDate).slice(0, 10) <= today)
    && (!promotion.endDate || String(promotion.endDate).slice(0, 10) >= today)
  ))
  const activePromotionById = new Map(activePromotions.map((promotion) => [String(promotion.id), promotion]))
  const promotionalProducts = promotionLinks.flatMap((link) => {
    const promotion = activePromotionById.get(String(link.promotionId))
    if (!promotion) return []
    const product = products.find((item) => String(item.id) === String(link.productId))
    if (!product || product.status !== 'Đang bán' || product.stock <= 0) return []
    return [{ ...product, promotion }]
  }).filter((item, index, list) => list.findIndex((candidate) => String(candidate.id) === String(item.id)) === index).slice(0, 8)

const availableProducts = products.filter(
  (product) =>
    product.status === 'Đang bán' &&
    Number(product.stock) > 0
)

const featuredProducts = availableProducts.slice(0, 4)
const newProducts = [...availableProducts].slice(-4).reverse()
const bestSellers = featuredProducts

  return <div className="bg-[#FCF9F4] text-[#452D27]">
    {/* AUTO PLAY HERO SLIDESHOW - editorial bakery banner */}
    <section className="bg-[#B85E3F] px-0 py-0 sm:px-5 sm:py-5 lg:px-7 lg:py-7">
      <div className="relative mx-auto max-w-[1600px] overflow-hidden rounded-none bg-[#EDE5D4] shadow-[0_24px_70px_rgba(61,31,22,.20)] sm:rounded-[22px]">
        <HeroSlideshow />
      </div>
    </section>

    {/* PROMISE STRIP */}
    <section className="border-b border-[#EDE4D9] bg-white"><div className="mx-auto grid max-w-7xl grid-cols-1 gap-4 px-4 py-5 sm:grid-cols-3 sm:px-7 lg:px-10">{[['package','Đóng gói chỉn chu','Sẵn sàng làm quà tặng'],['clock','Làm mới mỗi ngày','Ưu tiên hương vị tươi ngon'],['heart','Trao gửi yêu thương','Một chút ngọt ngào cho bạn']].map(([icon,title,sub])=><div key={title} className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FAF0E9] text-[#A97668]"><Icon name={icon} size={18}/></span><div><p className="text-xs font-bold text-[#563A32]">{title}</p><p className="mt-1 text-[10px] text-[#907C73]">{sub}</p></div></div>)}</div></section>

    {/* CATEGORIES */}
    <section id="danh-muc-banh" className="mx-auto max-w-7xl px-4 py-12 sm:px-7 sm:py-16 lg:px-10"><SectionHeading eyebrow="Tìm vị bánh yêu thích" title="Chọn theo tâm trạng" description="Từ chiếc bánh kem cho dịp đáng nhớ đến món bánh nhỏ cho buổi chiều chậm rãi." linkText="Tất cả danh mục"/>{error?<div className="mt-6"><CatalogError message={error} onRetry={retry}/></div>:isLoading?<div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{[1,2,3,4].map(x=><div key={x} className="h-56 animate-pulse rounded-2xl bg-[#F0E6DC]"/>)}</div>:categories.length===0?<p className="rounded-2xl border border-dashed border-[#DDCDB8] bg-white p-8 text-center text-sm text-[#806B65]">Hiện chưa có danh mục bánh.</p>:<div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">{categories.slice(0,8).map((category,index)=><CategoryTile key={category.id} category={category} index={index}/>)}</div>}</section>

    {/* BEST SELLERS */}
    <section className="bg-white"><div className="mx-auto max-w-7xl px-4 py-12 sm:px-7 sm:py-16 lg:px-10"><SectionHeading eyebrow="Được chọn từ tủ bánh" title="Những chiếc bánh nổi bật" description="Một vài gợi ý ngọt ngào để bạn bắt đầu lựa chọn." linkText="Xem toàn bộ bánh"/>{error?<CatalogError message={error} onRetry={retry}/>:isLoading?<div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{[1,2,3,4].map(x=><div key={x} className="h-80 animate-pulse rounded-2xl bg-[#F4EEE7]"/>)}</div>:bestSellers.length===0?<div className="rounded-2xl bg-[#FCF9F4] p-8 text-center text-sm text-[#806B65]">Tiệm đang chuẩn bị những mẻ bánh mới.</div>:<div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">{bestSellers.map((product,index)=><div key={product.id} className="relative">{index===0&&<span className="absolute left-4 top-4 z-20 rounded-full bg-[#B47B68] px-3 py-1.5 text-[9px] font-bold uppercase tracking-wide text-white">Gợi ý của tiệm</span>}<ShopProductCard product={product} onAddToCart={addToCart}/></div>)}</div>}</div></section>

    {/* PRODUCTS WITH ACTIVE PROMOTIONS */}
    {promotionalProducts.length > 0 && <section className="border-y border-[#EDE4D9] bg-[#FFF9F2]">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-7 sm:py-16 lg:px-10">
        <SectionHeading eyebrow="Ưu đãi đang áp dụng" title="Sản phẩm khuyến mãi" description="Những chiếc bánh đang nằm trong chương trình ưu đãi của Daily Fresh." link="/shop/products" linkText="Xem tất cả bánh" />
        <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
          {promotionalProducts.map(({ promotion, ...product }) => <div key={`${promotion.id}-${product.id}`} className="relative">
            <div className="absolute left-4 top-4 z-20 max-w-[calc(100%-2rem)] rounded-full bg-[#B94F20] px-3 py-1.5 text-[9px] font-extrabold uppercase tracking-wide text-white shadow-md">
              -{Number(promotion.discountPercent) || 0}% · {promotion.promotionCode}
            </div>
            <ShopProductCard product={product} promotion={promotion} onAddToCart={addToCart} />
            <p className="mt-2 line-clamp-1 text-center text-[11px] font-semibold text-[#9B6654]">{promotion.name}</p>
          </div>)}
        </div>
        <p className="mt-4 text-[10px] leading-5 text-[#907C73]">Ưu đãi được hiển thị theo chương trình đang bật và thời hạn khuyến mãi. Giá giảm cuối cùng sẽ được xác nhận theo quy tắc áp dụng mã tại bước đặt hàng.</p>
      </div>
    </section>}

    {/* PROMO */}
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-7 sm:py-16 lg:px-10"><div className="relative overflow-hidden rounded-[28px] bg-[#76534D] px-6 py-8 text-white sm:px-10 sm:py-11 lg:px-14"><div className="absolute -right-8 -top-20 h-64 w-64 rounded-full border border-white/15"/><div className="absolute -right-1 top-4 h-44 w-44 rounded-full border border-white/10"/><div className="relative flex flex-col items-start justify-between gap-7 sm:flex-row sm:items-center"><div className="max-w-2xl"><p className="text-[10px] font-bold uppercase tracking-[.24em] text-[#E8C89D]">Một món quà thật ngọt</p><h2 className="font-display mt-3 text-3xl leading-tight sm:text-4xl">Dịp đặc biệt xứng đáng có một chiếc bánh đặc biệt.</h2><p className="mt-3 max-w-xl text-sm leading-6 text-white/75">Khám phá các lựa chọn hiện có và tìm hương vị dành riêng cho khoảnh khắc của bạn.</p></div><Link to="/shop/products" className="inline-flex h-12 shrink-0 items-center gap-2 rounded-full bg-[#FCF9F3] px-6 text-sm font-bold text-[#563A32] transition hover:-translate-y-0.5 hover:bg-white">Chọn bánh ngay <Icon name="arrowUpRight" size={16}/></Link></div></div></section>

    {/* NEW ARRIVALS */}
    {newProducts.length>0&&<section className="border-y border-[#EDE4D9] bg-[#F7F0E8]"><div className="mx-auto max-w-7xl px-4 py-12 sm:px-7 sm:py-16 lg:px-10"><SectionHeading eyebrow="Mới từ lò bánh" title="Có gì mới hôm nay?" description="Khám phá thêm những hương vị đang có tại Daily Fresh." linkText="Khám phá thêm"/>{error?<CatalogError message={error} onRetry={retry}/>:isLoading?<div className="h-64 animate-pulse rounded-2xl bg-white/70"/>:<div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">{newProducts.map(product=><ShopProductCard key={product.id} product={product} onAddToCart={addToCart}/>)}</div>}</div></section>}

    {/* BRAND STORY */}
    <section className="mx-auto grid max-w-7xl items-center gap-8 px-4 py-14 sm:px-7 sm:py-20 lg:grid-cols-2 lg:gap-16 lg:px-10"><div className="relative"><div className="absolute -bottom-4 -left-4 h-28 w-28 rounded-full bg-[#EAD6C2]"/><img src={photos.story} alt="Bánh mì mới ra lò tại Daily Fresh" loading="lazy" className="relative h-[280px] w-full rounded-[26px] object-cover shadow-xl shadow-[#76534D]/10 sm:h-[390px]"/></div><div><p className="text-[10px] font-bold uppercase tracking-[.24em] text-[#B47B68]">Câu chuyện Daily Fresh</p><h2 className="font-display mt-3 text-3xl leading-tight text-[#452D27] sm:text-4xl">Làm bánh bằng sự chăm chút, gửi đi bằng yêu thương.</h2><p className="mt-4 text-sm leading-7 text-[#806B65]">Chúng tôi tin rằng niềm vui đôi khi bắt đầu từ những điều giản dị: mùi bánh mới ra lò, một miếng bánh mềm thơm hay món quà nhỏ dành cho người thân. Daily Fresh mong mỗi lựa chọn của bạn đều góp thêm chút ngọt ngào cho ngày thường.</p><Link to="/shop/products" className="mt-6 inline-flex h-11 items-center gap-2 rounded-full border border-[#DDCDB8] bg-white px-5 text-xs font-bold text-[#76534D] transition hover:border-[#76534D]">Ghé thăm tủ bánh <Icon name="arrowUpRight" size={15}/></Link></div></section>

    {/* TESTIMONIAL / TRUST */}
    <section className="bg-[#F7F0E8]"><div className="mx-auto max-w-7xl px-4 py-12 sm:px-7 sm:py-14 lg:px-10"><div className="mx-auto max-w-3xl text-center"><span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#B47B68]"><Icon name="heart" size={21}/></span><p className="mt-4 text-[10px] font-bold uppercase tracking-[.24em] text-[#B47B68]">Một chút dịu dàng mỗi ngày</p><h2 className="font-display mt-2 text-3xl text-[#452D27] sm:text-4xl">Niềm vui nằm trong từng miếng bánh.</h2><p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-[#806B65]">Dành cho buổi trà chiều, sinh nhật, buổi gặp gỡ thân quen hoặc đơn giản là một ngày bạn muốn tự thưởng cho mình.</p><div className="mt-6 flex flex-wrap justify-center gap-2"><span className="rounded-full border border-[#E4D4C4] bg-white px-4 py-2 text-[10px] font-semibold text-[#76534D]">Bánh kem</span><span className="rounded-full border border-[#E4D4C4] bg-white px-4 py-2 text-[10px] font-semibold text-[#76534D]">Bánh mì</span><span className="rounded-full border border-[#E4D4C4] bg-white px-4 py-2 text-[10px] font-semibold text-[#76534D]">Bánh ngọt</span><span className="rounded-full border border-[#E4D4C4] bg-white px-4 py-2 text-[10px] font-semibold text-[#76534D]">Bánh quy</span></div></div></div></section>
  </div>
}
