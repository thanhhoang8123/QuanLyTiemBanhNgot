import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../../../components/Icon.jsx'
import { shopArticles } from '../services/shopArticles.js'

export default function ShopArticlesPage() {
  const [selectedCategory, setSelectedCategory] = useState('ALL')

  const categories = useMemo(() => {
    const set = new Set(shopArticles.map((a) => a.category))
    return ['ALL', ...Array.from(set)]
  }, [])

  const filteredArticles = useMemo(() => {
    if (selectedCategory === 'ALL') return shopArticles
    return shopArticles.filter((a) => a.category === selectedCategory)
  }, [selectedCategory])

  const featuredArticle = useMemo(() => {
    return shopArticles.find((a) => a.featured) || shopArticles[0]
  }, [])

  const remainingArticles = useMemo(() => {
    if (selectedCategory !== 'ALL') return filteredArticles
    return filteredArticles.filter((a) => a.slug !== featuredArticle?.slug)
  }, [filteredArticles, featuredArticle, selectedCategory])

  return (
    <div className="bg-[#FAF5F0]/40 pb-20 pt-6 sm:pt-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-7 lg:px-10">
        {/* Page Header */}
        <div className="mb-10 text-center sm:mb-14">
          <div className="inline-flex items-center gap-2 rounded-full border border-caramel/30 bg-[#FAF0EE] px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-[#A45B46]">
            <Icon name="sparkles" size={13} />
            <span>Góc Bếp & Chuyện Bánh Ngọt</span>
          </div>
          <h1 className="font-display mt-3 text-3xl font-bold tracking-tight text-[#4A302B] sm:text-4xl lg:text-5xl">
            Chuyện Bánh & Vị Ngọt Yêu Thương
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-xs sm:text-sm leading-6 text-[#7E6962]">
            Khám phá văn hóa bánh ngọt thủ công kiểu Pháp, bí quyết chọn bánh cho ngày đặc biệt và những mẹo bảo quản bánh chuẩn vị từ các bếp trưởng tại WA Patisserie.
          </p>

          {/* Category Filter Pills */}
          <div className="mt-7 flex flex-wrap items-center justify-center gap-2">
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                    isSelected
                      ? 'bg-[#4A302B] text-white shadow-md shadow-[#4A302B]/20'
                      : 'border border-[#EAE3DA] bg-white text-[#705851] hover:border-[#76534D] hover:bg-[#FAF0EE]'
                  }`}
                >
                  {cat === 'ALL' ? 'Tất cả bài viết' : cat}
                </button>
              )
            })}
          </div>
        </div>

        {/* Featured Spotlight Card (Only shown when "ALL" or matching category) */}
        {selectedCategory === 'ALL' && featuredArticle && (
          <div className="mb-14 overflow-hidden rounded-3xl border border-[#EAE3DA] bg-white shadow-md shadow-stone-900/5 transition hover:shadow-xl sm:grid sm:grid-cols-12 sm:gap-6">
            <div className="relative min-h-[260px] overflow-hidden sm:col-span-7 sm:min-h-[380px]">
              <img
                src={featuredArticle.image}
                alt={featuredArticle.title}
                loading="eager"
                className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
              />
              <span className="absolute left-4 top-4 rounded-full bg-[#4A302B]/90 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-xs">
                Nổi bật · {featuredArticle.category}
              </span>
            </div>
            <div className="flex flex-col justify-between p-6 sm:col-span-5 sm:p-8 sm:pl-2">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-[11px] font-semibold text-[#A45B46]">
                  <span>{featuredArticle.date}</span>
                  <span>·</span>
                  <span>{featuredArticle.readTime}</span>
                </div>
                <h2 className="font-display text-2xl font-bold leading-tight text-[#4A302B] sm:text-3xl">
                  <Link to={`/shop/articles/${featuredArticle.slug}`} className="hover:text-caramel transition">
                    {featuredArticle.title}
                  </Link>
                </h2>
                <p className="text-xs sm:text-sm leading-relaxed text-[#7E6962]">
                  {featuredArticle.excerpt}
                </p>
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-[#F0E8DF] pt-4">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-caramel-soft text-xs font-bold text-rosewood">
                    👨‍🍳
                  </span>
                  <span className="text-xs font-semibold text-[#4A302B]">{featuredArticle.author}</span>
                </div>
                <Link
                  to={`/shop/articles/${featuredArticle.slug}`}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#FAF0EE] px-4 py-2 text-xs font-bold text-[#A45B46] transition hover:bg-[#A45B46] hover:text-white"
                >
                  <span>Đọc bài viết</span>
                  <Icon name="arrowUpRight" size={13} />
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Section Title */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-display text-xl font-bold text-[#4A302B] sm:text-2xl">
            {selectedCategory === 'ALL' ? 'Bài viết mới nhất' : `Chuyên mục: ${selectedCategory}`}
          </h2>
          <span className="text-xs font-medium text-[#9A7972]">
            {filteredArticles.length} bài viết
          </span>
        </div>

        {/* Articles Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {remainingArticles.map((article) => (
            <article
              key={article.slug}
              className="group flex flex-col overflow-hidden rounded-2xl border border-[#EAE3DA] bg-white shadow-2xs transition-all duration-300 hover:-translate-y-1 hover:border-caramel/60 hover:shadow-xl"
            >
              {/* Cover Image */}
              <Link to={`/shop/articles/${article.slug}`} className="relative aspect-[16/10] overflow-hidden bg-[#FAF0EE]">
                <img
                  src={article.image}
                  alt={article.title}
                  loading="lazy"
                  className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                />
                <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-0.5 text-[10px] font-bold text-[#76534D] shadow-2xs backdrop-blur-xs">
                  {article.category}
                </span>
              </Link>

              {/* Card Body */}
              <div className="flex flex-1 flex-col justify-between p-5">
                <div>
                  <div className="flex items-center gap-2 text-[10px] font-semibold text-[#A68F87]">
                    <span>{article.date}</span>
                    <span>·</span>
                    <span>{article.readTime}</span>
                  </div>
                  <h3 className="font-display mt-2 text-lg font-bold leading-snug text-[#4A302B] transition group-hover:text-[#A45B46]">
                    <Link to={`/shop/articles/${article.slug}`}>
                      {article.title}
                    </Link>
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-[#7E6962] line-clamp-2">
                    {article.excerpt}
                  </p>
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-[#F0E8DF] pt-3.5">
                  <span className="text-[11px] font-medium text-[#9A7972]">
                    {article.author}
                  </span>
                  <Link
                    to={`/shop/articles/${article.slug}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#A45B46] transition group-hover:translate-x-0.5"
                  >
                    <span>Đọc tiếp</span>
                    <Icon name="arrowUpRight" size={13} />
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Bottom Banner */}
        <div className="mt-16 rounded-3xl bg-gradient-to-r from-[#4A302B] to-[#76534D] p-8 text-center text-white sm:p-12 shadow-xl shadow-[#4A302B]/15">
          <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#DDCDB8]">
            Trải nghiệm hương vị Pháp
          </span>
          <h2 className="font-display mt-2 text-2xl font-bold sm:text-3xl">
            Thưởng thức những chiếc bánh tươi nướng mỗi ngày
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-xs sm:text-sm text-white/85">
            Từ bánh sinh nhật ngọt ngào, bánh mousse hoa quả đến những mẻ bánh nướng giòn rụm đang chờ bạn khám phá.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              to="/shop/products"
              className="inline-flex h-11 items-center gap-2 rounded-full bg-white px-6 text-xs font-bold text-[#4A302B] shadow-md transition hover:bg-[#FAF0EE]"
            >
              <span>Xem bộ sưu tập bánh</span>
              <Icon name="arrowUpRight" size={14} />
            </Link>
            <Link
              to="/shop/custom-order"
              className="inline-flex h-11 items-center gap-2 rounded-full border border-white/60 bg-white/10 px-6 text-xs font-bold text-white backdrop-blur-xs transition hover:bg-white/20"
            >
              <Icon name="sparkles" size={14} />
              <span>Đặt bánh theo yêu cầu</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
