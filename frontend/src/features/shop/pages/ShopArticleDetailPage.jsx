import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import Icon from '../../../components/Icon.jsx'
import { getShopArticle, shopArticles } from '../services/shopArticles.js'

export default function ShopArticleDetailPage() {
  const { slug } = useParams()
  const article = getShopArticle(slug)

  const relatedArticles = useMemo(() => {
    if (!article) return []
    return shopArticles
      .filter((a) => a.slug !== article.slug)
      .slice(0, 3)
  }, [article])

  if (!article) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-7">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FAF0EE] text-[#76534D]">
          <Icon name="package" size={28} />
        </div>
        <h1 className="font-display text-3xl font-bold text-[#4A302B]">Không tìm thấy bài viết</h1>
        <p className="mt-3 text-sm text-[#806B65]">Bài viết này có thể đã được chuyển hoặc không còn tồn tại trên hệ thống.</p>
        <Link
          to="/shop/articles"
          className="mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-[#76534D] px-6 text-xs font-semibold text-white shadow-md transition hover:bg-[#4A302B]"
        >
          <span>Xem tất cả bài viết</span>
          <Icon name="arrowUpRight" size={14} />
        </Link>
      </section>
    )
  }

  return (
    <div className="bg-[#FAF5F0]/30 pb-20 pt-6 sm:pt-10">
      <article className="mx-auto max-w-4xl px-4 sm:px-7 lg:px-10">
        {/* Navigation Breadcrumb */}
        <div className="mb-6 flex items-center gap-2 text-xs text-[#806B65]">
          <Link to="/shop" className="hover:text-[#4A302B] transition">Trang chủ</Link>
          <span>/</span>
          <Link to="/shop/articles" className="hover:text-[#4A302B] transition">Bài viết</Link>
          <span>/</span>
          <span className="truncate text-[#4A302B] font-medium">{article.title}</span>
        </div>

        {/* Back Link */}
        <Link
          to="/shop/articles"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#A45B46] hover:underline"
        >
          <span>← Quay lại danh sách bài viết</span>
        </Link>

        {/* Header Meta */}
        <div className="mt-5 space-y-3">
          <div className="flex flex-wrap items-center gap-2.5 text-xs">
            <span className="rounded-full bg-caramel-soft px-3 py-1 text-[11px] font-bold text-rosewood">
              {article.category}
            </span>
            <span className="text-[#9A7972]">·</span>
            <span className="font-medium text-[#9A7972]">{article.date}</span>
            <span className="text-[#9A7972]">·</span>
            <span className="font-medium text-[#9A7972]">{article.readTime}</span>
          </div>

          <h1 className="font-display text-3xl font-bold leading-tight text-[#4A302B] sm:text-4xl lg:text-5xl">
            {article.title}
          </h1>

          {/* Author Pill */}
          <div className="flex items-center gap-3 pt-2">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#4A302B] to-[#76534D] text-sm font-bold text-white shadow-xs">
              👨‍🍳
            </div>
            <div>
              <p className="text-xs font-bold text-[#4A302B]">{article.author}</p>
              <p className="text-[10px] text-[#9A7972]">WA Patisserie · Bakery & Patisserie</p>
            </div>
          </div>
        </div>

        {/* Hero Photo Banner */}
        <div className="mt-8 overflow-hidden rounded-3xl border border-[#EAE3DA] bg-[#FAF0EE] shadow-md shadow-stone-900/5">
          <img
            src={article.image}
            alt={article.title}
            className="aspect-[16/9] w-full object-cover"
          />
        </div>

        {/* Lead Excerpt */}
        <div className="mt-8 rounded-2xl border-l-4 border-[#A45B46] bg-white p-5 shadow-2xs">
          <p className="text-base sm:text-lg font-medium italic leading-relaxed text-[#5F4039]">
            "{article.excerpt}"
          </p>
        </div>

        {/* Tips Box */}
        {article.tips && article.tips.length > 0 && (
          <div className="mt-8 rounded-2xl border border-caramel/30 bg-[#FAF5F0] p-5 sm:p-6 shadow-2xs">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#A45B46]">
              <Icon name="sparkles" size={16} />
              <span>Gợi ý quan trọng từ Bếp trưởng</span>
            </div>
            <ul className="mt-3.5 space-y-2 text-xs sm:text-sm text-[#5D4641]">
              {article.tips.map((tip, idx) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-caramel text-[10px] font-bold text-white">
                    ✓
                  </span>
                  <span className="leading-relaxed">{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Article Body */}
        <div className="mt-8 space-y-6 text-sm sm:text-base leading-relaxed text-[#5F4039]">
          {article.paragraphs.map((paragraph, idx) => (
            <p key={idx} className="leading-8">
              {paragraph}
            </p>
          ))}
        </div>

        {/* Call to Action Card */}
        <div className="mt-14 rounded-3xl border border-[#EAE3DA] bg-gradient-to-br from-[#FAF0EE] to-[#F5ECE2] p-6 sm:p-8 text-center shadow-xs">
          <h3 className="font-display text-2xl font-bold text-[#4A302B]">
            Thưởng thức hương vị bánh ngọt tươi mới hôm nay
          </h3>
          <p className="mx-auto mt-2 max-w-lg text-xs sm:text-sm text-[#76534D]">
            Mỗi chiếc bánh tại WA Patisserie đều được các thợ bánh chăm chút bằng cả đam mê. Khám phá menu hoặc đặt mẫu bánh độc bản cho riêng bạn.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              to="/shop/products"
              className="inline-flex h-10 items-center gap-2 rounded-full bg-[#4A302B] px-5 text-xs font-bold text-white shadow-md transition hover:bg-[#76534D]"
            >
              <span>Xem bộ sưu tập bánh</span>
              <Icon name="arrowUpRight" size={13} />
            </Link>
            <Link
              to="/shop/custom-order"
              className="inline-flex h-10 items-center gap-2 rounded-full border border-[#DDCDB8] bg-white px-5 text-xs font-bold text-[#4A302B] shadow-2xs transition hover:bg-[#FAF0EE]"
            >
              <Icon name="sparkles" size={13} />
              <span>Đặt bánh theo yêu cầu</span>
            </Link>
          </div>
        </div>

        {/* Related Articles */}
        {relatedArticles.length > 0 && (
          <div className="mt-16 border-t border-[#EAE3DA] pt-12">
            <h2 className="font-display text-2xl font-bold text-[#4A302B]">
              Bài viết cùng chuyên mục & Khám phá thêm
            </h2>
            <div className="mt-6 grid gap-6 sm:grid-cols-3">
              {relatedArticles.map((rel) => (
                <Link
                  key={rel.slug}
                  to={`/shop/articles/${rel.slug}`}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-[#EAE3DA] bg-white shadow-2xs transition hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="aspect-[16/10] overflow-hidden bg-[#FAF0EE]">
                    <img
                      src={rel.image}
                      alt={rel.title}
                      loading="lazy"
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="flex flex-1 flex-col justify-between p-4">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#A45B46]">
                        {rel.category}
                      </span>
                      <h4 className="font-display mt-1 text-sm font-bold text-[#4A302B] group-hover:text-[#A45B46] transition line-clamp-2">
                        {rel.title}
                      </h4>
                    </div>
                    <span className="mt-3 text-[10px] text-[#9A7972]">{rel.readTime} · Đọc ngay →</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </article>
    </div>
  )
}
