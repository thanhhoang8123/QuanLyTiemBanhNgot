import { useEffect, useState } from 'react'
import { Link, useOutletContext, useParams } from 'react-router-dom'
import Icon from '../../../components/Icon.jsx'
import { ProductArtwork } from '../../products/components/ProductArtwork.jsx'
import { getProductById } from '../../products/services/productService.js'
import { toProductViewModel } from '../../products/adapters/productAdapter.js'
import { getUserFacingErrorMessage } from '../../../services/apiClient.js'

const currency = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
})

export default function ShopProductDetailPage() {
  const { productId } = useParams()
  const { addToCart } = useOutletContext()
  const [product, setProduct] = useState(null)
  const [quantity, setQuantity] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState('')
  const [reloadVersion, setReloadVersion] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    setIsLoading(true)
    setError('')
    getProductById(productId, { signal: controller.signal })
      .then((result) => setProduct(toProductViewModel(result)))
      .catch((loadError) => {
        if (loadError.name !== 'AbortError') {
          setError(getUserFacingErrorMessage(loadError, 'Chưa thể tải thông tin sản phẩm. Vui lòng thử lại.'))
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false)
      })
    return () => controller.abort()
  }, [productId, reloadVersion])

  const canBuy = product?.status === 'Đang bán'
    && product.stock > 0
    && quantity <= product.stock

  return (
    <section className="mx-auto max-w-6xl px-4 py-8 sm:px-7 sm:py-12 lg:px-10">
      <Link to="/shop/products" className="inline-flex items-center gap-2 text-xs font-semibold text-[#76534D] hover:text-[#4A302B]">
        <Icon name="arrowUpRight" size={14} className="rotate-180" /> Quay lại danh sách bánh
      </Link>

      {isLoading ? (
        <p role="status" className="mt-8 rounded-2xl bg-white px-5 py-16 text-center text-sm text-[#806B65]">Đang tải thông tin sản phẩm...</p>
      ) : error ? (
        <div role="alert" className="mt-8 rounded-2xl border border-[#E2C5BF] bg-white px-5 py-12 text-center">
          <p className="font-display text-xl text-[#76534D]">Không tải được sản phẩm</p>
          <p className="mt-2 text-sm text-[#806B65]">{error}</p>
          <button type="button" onClick={() => setReloadVersion((version) => version + 1)} className="mt-5 rounded-full bg-[#76534D] px-5 py-2.5 text-xs font-semibold text-white">Thử lại</button>
        </div>
      ) : product ? (
        <div className="mt-7 grid gap-8 rounded-3xl border border-[#EAE3DA] bg-white p-4 shadow-[0_18px_60px_rgba(91,61,53,0.06)] sm:p-7 lg:grid-cols-2 lg:gap-12">
          <ProductArtwork
            id={product.id}
            name={product.name}
            imageUrl={product.imageUrl}
            background={product.background}
            className="min-h-[300px] w-full rounded-2xl sm:min-h-[440px]"
          />
          <div className="flex flex-col justify-center">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#A97668]">{product.category || 'Daily Fresh'}</p>
            <h1 className="font-display mt-3 text-3xl font-medium text-[#4A302B] sm:text-4xl">{product.name}</h1>
            <p className="mt-3 text-xs text-[#806B65]">Mã sản phẩm: {product.code || '—'}</p>
            <p className="mt-6 text-2xl font-bold text-[#76534D]">{currency.format(product.price)}</p>
            <p className="mt-5 whitespace-pre-wrap text-sm leading-7 text-[#806B65]">{product.description || 'Thông tin mô tả sản phẩm hiện chưa được cập nhật.'}</p>
            <p className={`mt-5 text-xs font-semibold ${canBuy ? 'text-[#536B50]' : 'text-[#914E46]'}`}>
              {product.status !== 'Đang bán' ? 'Sản phẩm hiện không mở bán' : product.stock <= 0 ? 'Sản phẩm tạm hết hàng' : `Còn ${product.stock} ${product.unit || 'sản phẩm'}`}
            </p>
            <div className="mt-6 flex flex-wrap items-end gap-3">
              <label className="grid gap-1.5 text-xs font-semibold text-[#675650]">
                Số lượng
                <input
                  aria-label="Số lượng sản phẩm"
                  type="number"
                  min="1"
                  max={product.stock}
                  step="1"
                  value={quantity}
                  onChange={(event) => setQuantity(Number(event.target.value))}
                  className="h-11 w-28 rounded-xl border border-[#EAE3DA] px-3 text-sm outline-none focus:border-[#D0A263]"
                />
              </label>
              <button
                type="button"
                disabled={!canBuy}
                onClick={() => {
                  addToCart(product.id, quantity)
                  setFeedback('Đã thêm sản phẩm vào giỏ hàng.')
                }}
                className="inline-flex h-11 items-center gap-2 rounded-full bg-[#76534D] px-6 text-sm font-semibold text-white hover:bg-[#4A302B] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Icon name="cart" size={16} /> Thêm vào giỏ
              </button>
            </div>
            {feedback && <p role="status" className="mt-3 text-xs font-medium text-[#536B50]">{feedback}</p>}
            <p className="mt-5 text-[11px] leading-5 text-[#9A7972]">Giá và tồn kho sẽ được xác nhận lại khi báo giá và tạo đơn.</p>
          </div>
        </div>
      ) : null}
    </section>
  )
}
