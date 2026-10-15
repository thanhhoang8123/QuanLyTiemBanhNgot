import Icon from './Icon.jsx'
import { ProductArtwork } from './ProductCard.jsx'

const currency = new Intl.NumberFormat('vi-VN')

export default function CartPanel({
  cart,
  discount,
  onDiscountChange,
  onQuantityChange,
  onRemove,
  onCheckout,
  onClear,
  mobileOpen,
  onClose,
  onNoteChange,
}) {
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const appliedDiscount = Math.min(Math.max(Number(discount) || 0, 0), subtotal)
  const total = subtotal - appliedDiscount

  return (
    <>
      {mobileOpen && (
        <button type="button" aria-label="Đóng giỏ hàng" onClick={onClose} className="fixed inset-0 z-30 bg-rosewood/35 xl:hidden" />
      )}
      <aside className={`fixed inset-y-0 right-0 z-40 flex w-full max-w-[390px] flex-col border-l border-border bg-paper shadow-2xl shadow-rosewood/15 transition-transform xl:sticky xl:top-[76px] xl:z-0 xl:h-[calc(100vh-76px)] xl:w-[350px] xl:max-w-none xl:shrink-0 xl:translate-x-0 xl:border-l xl:shadow-none ${
        mobileOpen ? 'translate-x-0' : 'translate-x-full xl:translate-x-0'
      }`}>
        <div className="flex items-start justify-between border-b border-border px-5 py-5">
          <div>
            <p className="font-display text-xl font-semibold text-rosewood">Đơn hàng hiện tại</p>
            <p className="mt-1 text-[10px] font-medium text-muted">{cart.length} món trong giỏ</p>
          </div>
          <div className="flex gap-1">
            {cart.length > 0 && (
              <button type="button" onClick={onClear} className="rounded-lg px-2 py-1.5 text-[10px] font-semibold text-danger transition hover:bg-danger-soft">Xóa đơn</button>
            )}
            <button type="button" aria-label="Đóng giỏ hàng" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-petal xl:hidden"><Icon name="close" size={17} /></button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5">
          {cart.length === 0 ? (
            <div className="flex h-full min-h-52 flex-col items-center justify-center text-center">
              <span className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-border bg-petal text-rosewood"><Icon name="cart" size={25} /></span>
              <p className="font-display text-lg font-semibold text-rosewood">Giỏ hàng đang trống</p>
              <p className="mt-1 max-w-48 text-[11px] leading-5 text-muted">Chọn món bánh yêu thích để bắt đầu đơn hàng.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {cart.map((item) => (
                <div key={item.id} className="py-4">
                  <div className="flex gap-3">
                    <ProductArtwork id={item.id} name={item.name} background={item.background} compact />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-[11px] font-bold leading-4 text-rosewood">{item.name}</p>
                        <button type="button" aria-label={`Xóa ${item.name}`} onClick={() => onRemove(item.id)} className="shrink-0 text-muted transition hover:text-danger"><Icon name="trash" size={14} /></button>
                      </div>
                      <p className="mt-1 text-[10px] font-medium text-muted">{currency.format(item.price)}đ</p>
                      <div className="mt-2 flex items-center justify-between">
                        <div className="flex items-center gap-2 rounded-lg border border-border bg-white px-1.5 py-1">
                          <button type="button" aria-label={`Giảm số lượng ${item.name}`} onClick={() => onQuantityChange(item.id, -1)} className="text-rosewood transition hover:text-caramel-hover"><Icon name="minus" size={13} /></button>
                          <span className="min-w-4 text-center text-[10px] font-bold text-rosewood">{item.quantity}</span>
                          <button type="button" aria-label={`Tăng số lượng ${item.name}`} onClick={() => onQuantityChange(item.id, 1)} className="text-rosewood transition hover:text-caramel-hover"><Icon name="plus" size={13} /></button>
                        </div>
                        <span className="text-[11px] font-bold text-rosewood">{currency.format(item.price * item.quantity)}đ</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <label className="mb-4 mt-1 block">
            <span className="mb-1.5 block text-[10px] font-semibold text-rosewood">Ghi chú đơn hàng</span>
            <textarea
              rows="2"
              onChange={(event) => onNoteChange(event.target.value)}
              placeholder="Ví dụ: Gửi kèm nến, viết lời chúc..."
              className="w-full resize-none rounded-xl border border-border bg-white px-3 py-2.5 text-[10px] text-rosewood outline-none placeholder:text-muted focus:border-caramel-hover"
            />
          </label>
        </div>

        <div className="border-t border-border bg-petal px-5 py-4">
          <label className="mb-3 flex items-center gap-2 rounded-xl border border-border bg-paper px-3 py-2.5">
            <Icon name="tag" size={15} className="shrink-0 text-rosewood" />
            <span className="flex-1 text-[10px] font-semibold text-rosewood">Giảm giá (đ)</span>
            <input
              type="number"
              min="0"
              max={subtotal}
              value={discount}
              onChange={(event) => onDiscountChange(event.target.value)}
              placeholder="0"
              className="w-20 bg-transparent text-right text-[10px] font-semibold text-rosewood outline-none"
            />
          </label>
          <div className="space-y-2 text-[11px]">
            <div className="flex justify-between text-rosewood"><span>Tạm tính</span><span>{currency.format(subtotal)}đ</span></div>
            <div className="flex justify-between text-rosewood"><span>Giảm giá</span><span>-{currency.format(appliedDiscount)}đ</span></div>
            <div className="my-2 border-t border-dashed border-border" />
            <div className="flex items-center justify-between">
              <span className="font-bold text-rosewood">Tổng thanh toán</span>
              <span className="font-display text-2xl font-bold text-rosewood">{currency.format(total)}đ</span>
            </div>
          </div>
          <button
            type="button"
            disabled={cart.length === 0}
            onClick={() => onCheckout(total)}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-caramel py-3.5 text-xs font-bold text-action-ink shadow-md shadow-caramel/20 transition hover:bg-caramel-hover active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-rosewood-soft disabled:text-white disabled:shadow-none"
          >
            <Icon name="creditCard" size={17} /> Thanh toán
          </button>
          <p className="mt-2 text-center text-[9px] font-medium text-muted">Thanh toán mô phỏng · Không phát sinh giao dịch thật</p>
        </div>
      </aside>
    </>
  )
}
