import { useMemo, useState } from 'react'
import Icon from '../../../components/Icon.jsx'
import ProductCard from '../components/ProductCard.jsx'
import CartPanel from '../components/CartPanel.jsx'
import { categories } from '../../../data/mockData.js'

export default function PosPage({ onToast, products, cart, onCartChange, discount, onDiscountChange, note, onNoteChange }) {
  const [category, setCategory] = useState('Tất cả')
  const [search, setSearch] = useState('')
  const [cartOpen, setCartOpen] = useState(false)
  const [checkout, setCheckout] = useState(null)

  const filteredProducts = useMemo(() => products.filter((product) => product.status === 'Đang bán' && product.stock > 0).filter((product) => {
    const matchesCategory = category === 'Tất cả' || product.category === category
    const matchesSearch = `${product.name} ${product.category}`.toLocaleLowerCase('vi').includes(search.trim().toLocaleLowerCase('vi'))
    return matchesCategory && matchesSearch
  }), [category, search])

  const addToCart = (product) => {
    onCartChange((current) => {
      const existing = current.find((item) => item.id === product.id)
      return existing
        ? current.map((item) => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item)
        : [...current, { ...product, quantity: 1 }]
    })
    onToast(`${product.name} đã được thêm vào đơn.`)
  }

  const updateQuantity = (id, delta) => {
    onCartChange((current) => current
      .map((item) => item.id === id ? { ...item, quantity: item.quantity + delta } : item)
      .filter((item) => item.quantity > 0))
  }

  const removeFromCart = (id) => onCartChange((current) => current.filter((item) => item.id !== id))
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  const finishCheckout = () => {
    setCheckout(null)
    onCartChange([])
    onDiscountChange('')
    onNoteChange('')
    onToast('Đã hoàn tất mô phỏng thanh toán. Không có giao dịch thật.')
  }

  return (
    <>
      <div className="flex min-h-[calc(100vh-152px)] gap-6">
        <section className="min-w-0 flex-1 pb-28 xl:pb-0">
          <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <div>
                <h2 className="font-display text-xl text-rosewood">Chọn món bánh</h2>
                <p className="mt-1 text-xs text-muted">Bánh tươi mỗi ngày, chọn nhanh cho đơn hàng của bạn.</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative min-w-0 flex-1 sm:w-64 sm:flex-none">
                <Icon name="search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-rosewood" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Tìm tên bánh..."
                  aria-label="Tìm sản phẩm"
                  className="h-10 w-full rounded-xl border border-border bg-paper pl-9 pr-3 text-[11px] text-rosewood outline-none placeholder:text-muted transition hover:border-caramel-hover focus:border-caramel-hover"
                />
              </div>
              <span className="hidden h-10 items-center gap-2 rounded-xl border border-border bg-paper px-3 text-[10px] font-semibold text-rosewood md:flex">
                <Icon name="clock" size={14} /> Đơn tại quầy
              </span>
            </div>
          </div>

          <div className="hide-scrollbar mb-5 flex gap-2 overflow-x-auto overscroll-x-contain pb-1" role="tablist" aria-label="Danh mục sản phẩm">
            {categories.map((item) => (
              <button
                key={item}
                type="button"
                role="tab"
                aria-selected={category === item}
                onClick={() => setCategory(item)}
                className={`whitespace-nowrap rounded-full px-4 py-2 text-[11px] font-medium transition ${
                  category === item ? 'bg-rosewood font-semibold text-white shadow-sm' : 'border border-border bg-paper text-rosewood hover:border-caramel-hover hover:bg-petal'
                }`}
              >
                {item}
              </button>
            ))}
          </div>

          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-lg text-rosewood">{category === 'Tất cả' ? 'Bánh được yêu thích' : category}</h2>
            <span className="text-[11px] font-medium text-muted">{filteredProducts.length} sản phẩm</span>
          </div>

          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 2xl:grid-cols-4">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAdd={addToCart}
                  quantityInCart={cart.find((item) => item.id === product.id)?.quantity ?? 0}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border bg-paper px-5 py-12 text-center">
              <p className="font-display text-base text-rosewood">Không tìm thấy sản phẩm</p>
              <p className="mt-1 text-[11px] text-muted">Thử từ khóa hoặc danh mục khác nhé.</p>
            </div>
          )}
        </section>

        <CartPanel
          cart={cart}
          discount={discount}
          onDiscountChange={onDiscountChange}
          onQuantityChange={updateQuantity}
          onRemove={removeFromCart}
          onCheckout={setCheckout}
          onClear={() => { onCartChange([]); onDiscountChange('') }}
          mobileOpen={cartOpen}
          onClose={() => setCartOpen(false)}
          onNoteChange={onNoteChange}
        />
      </div>

      <button
        type="button"
        onClick={() => setCartOpen(true)}
        className="fixed inset-x-0 bottom-0 z-20 flex justify-center border-t border-border bg-cream/95 px-4 pt-3 shadow-[0_-8px_24px_rgba(74,48,43,0.08)] backdrop-blur-md xl:hidden"
        style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}
      >
        <span className="flex h-12 w-full max-w-[480px] items-center justify-center gap-2 rounded-xl bg-caramel text-xs font-bold text-action-ink shadow-md shadow-caramel/20 transition hover:bg-caramel-hover">
          <Icon name="cart" size={17} /> Giỏ hàng
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-paper px-1 text-[10px] font-bold text-rosewood">{cartCount}</span>
        </span>
      </button>

      {checkout !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-rosewood/45 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setCheckout(null) }}>
          <section role="dialog" aria-modal="true" aria-labelledby="checkout-title" className="w-full max-w-sm rounded-3xl bg-paper p-6 text-center shadow-2xl">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-caramel-soft text-rosewood"><Icon name="creditCard" size={23} /></span>
            <h2 id="checkout-title" className="font-display mt-4 text-xl font-semibold text-rosewood">Xác nhận đơn hàng</h2>
            <p className="mt-2 text-[11px] leading-5 text-muted">Đây chỉ là thao tác mô phỏng. Prototype không kết nối cổng thanh toán hay lưu đơn hàng.</p>
            <p className="font-display mt-4 text-2xl font-bold text-rosewood">{new Intl.NumberFormat('vi-VN').format(checkout)}đ</p>
            {note && <p className="mt-2 text-[10px] text-rosewood">Ghi chú: {note}</p>}
            <div className="mt-5 grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setCheckout(null)} className="rounded-xl border border-border py-3 text-xs font-semibold text-rosewood transition hover:bg-petal">Quay lại</button>
              <button type="button" onClick={finishCheckout} className="rounded-xl bg-caramel py-3 text-xs font-bold text-action-ink transition hover:bg-caramel-hover">Xác nhận giả lập</button>
            </div>
          </section>
        </div>
      )}
    </>
  )
}
