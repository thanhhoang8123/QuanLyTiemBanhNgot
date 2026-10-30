import Icon from '../../../components/Icon.jsx'
import { ProductArtwork } from '../../products/components/ProductArtwork.jsx'

const currency = new Intl.NumberFormat('vi-VN')

function CartInnerContent({
  cart,
  quote,
  quoteLoading,
  quoteError,
  onQuantityChange,
  onRemove,
  onCheckout,
  onClear,
  onClose,
  isMobile = false,
  note,
  onNoteChange,
}) {
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const quoteItems = new Map((quote?.items ?? []).map((item) => [Number(item.productId), item]))
  const finalAmount = quote?.finalAmount != null ? Number(quote.finalAmount) : subtotal

  return (
    <>
      <div className="flex items-start justify-between border-b border-border px-5 py-4 shrink-0 bg-paper">
        <div>
          <p className="font-display text-lg font-bold text-rosewood">Đơn hàng hiện tại</p>
          <p className="mt-0.5 text-[10px] font-medium text-muted">
            {cart.reduce((sum, item) => sum + item.quantity, 0)} sản phẩm ({cart.length} món)
          </p>
        </div>
        <div className="flex items-center gap-1">
          {cart.length > 0 && (
            <button
              type="button"
              onClick={onClear}
              className="rounded-lg px-2.5 py-1 text-[11px] font-semibold text-danger transition hover:bg-danger-soft"
            >
              Xóa đơn
            </button>
          )}
          {isMobile && (
            <button
              type="button"
              aria-label="Đóng giỏ hàng"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-petal"
            >
              <Icon name="close" size={18} />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 sm:px-5">
        {cart.length === 0 ? (
          <div className="flex h-full min-h-52 flex-col items-center justify-center text-center py-8">
            <span className="mb-3 flex h-14 w-14 items-center justify-center rounded-full border border-border bg-petal text-rosewood">
              <Icon name="cart" size={24} />
            </span>
            <p className="font-display text-base font-semibold text-rosewood">Giỏ hàng đang trống</p>
            <p className="mt-1 max-w-48 text-[11px] leading-5 text-muted">
              Chọn món bánh từ menu để tạo đơn bán hàng.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {cart.map((item) => {
              const quotedItem = quoteItems.get(Number(item.id))
              const unitPrice = Number(item.originalPrice ?? item.price)
              const lineTotal = Number(quotedItem?.lineTotal ?? item.price * item.quantity)
              return (
                <div key={item.id} className="py-3">
                  <div className="flex gap-3">
                    <ProductArtwork
                      id={item.id}
                      name={item.name}
                      background={item.background}
                      imageUrl={item.imageUrl}
                      compact
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-[11px] font-bold leading-4 text-rosewood">{item.name}</p>
                        <button
                          type="button"
                          aria-label={`Xóa ${item.name}`}
                          onClick={() => onRemove(item.id)}
                          className="shrink-0 text-muted transition hover:text-danger"
                        >
                          <Icon name="trash" size={14} />
                        </button>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center justify-between gap-x-3 text-[10px] text-muted">
                        <span className="flex flex-wrap items-center gap-1.5">
                          <span>Đơn giá {currency.format(unitPrice)}đ</span>
                        </span>
                        <span className="font-semibold text-rosewood">
                          Thành tiền {currency.format(lineTotal)}đ
                        </span>
                      </div>
                      {Number(quotedItem?.productDiscountAmount ?? 0) > 0 && (
                        <p className="mt-1 text-[9px] font-semibold text-danger">
                          Giảm {currency.format(quotedItem.productDiscountAmount)}đ
                          {quotedItem.promotionCode
                            ? ` · Phiếu ${quotedItem.promotionCode}`
                            : ' theo khuyến mãi'}
                        </p>
                      )}
                      <div className="mt-2 flex items-center justify-between">
                        <div className="flex items-center gap-2 rounded-lg border border-border bg-white px-1.5 py-1">
                          <button
                            type="button"
                            aria-label={`Giảm số lượng ${item.name}`}
                            onClick={() => onQuantityChange(item.id, -1)}
                            className="text-rosewood transition hover:text-caramel-hover"
                          >
                            <Icon name="minus" size={13} />
                          </button>
                          <span className="min-w-4 text-center text-[10px] font-bold text-rosewood">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            aria-label={`Tăng số lượng ${item.name}`}
                            disabled={item.quantity >= item.stock}
                            onClick={() => onQuantityChange(item.id, 1)}
                            className="text-rosewood transition hover:text-caramel-hover disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <Icon name="plus" size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
        <label className="mb-4 mt-3 block">
          <span className="mb-1.5 block text-[10px] font-semibold text-rosewood">
            Ghi chú đơn hàng (Tùy chọn)
          </span>
          <textarea
            rows="2"
            maxLength={500}
            value={note}
            onChange={(event) => onNoteChange(event.target.value)}
            placeholder="VD: Viết chữ lên bánh, thêm dao dĩa..."
            className="w-full resize-none rounded-xl border border-border bg-white px-3 py-2 text-[11px] text-rosewood outline-none placeholder:text-muted focus:border-caramel-hover"
          />
        </label>
      </div>

      <div className="border-t border-border bg-petal px-4 py-3 sm:px-5 shrink-0">
        <div className="space-y-1.5 text-[11px]">
          <div className="flex justify-between text-rosewood">
            <span>Tiền hàng</span>
            <span>{currency.format(quote?.totalAmount ?? subtotal)}đ</span>
          </div>
          {Number(quote?.productDiscountAmount ?? 0) > 0 && (
            <div className="flex justify-between text-danger font-medium">
              <span>Khuyến mãi giảm giá</span>
              <span>-{currency.format(quote.productDiscountAmount)}đ</span>
            </div>
          )}
          {Number(quote?.loyaltyDiscountAmount ?? 0) > 0 && (
            <div className="flex justify-between text-danger font-medium">
              <span>Giảm từ điểm tích lũy</span>
              <span>-{currency.format(quote.loyaltyDiscountAmount)}đ</span>
            </div>
          )}
          <div className="my-1.5 border-t border-border" />
          <div className="flex items-center justify-between gap-3">
            <span className="font-bold text-rosewood">Tổng thanh toán</span>
            <span className="font-display text-2xl font-bold text-rosewood">
              {currency.format(finalAmount)}đ
            </span>
          </div>
          {quoteLoading && (
            <p className="text-[10px] text-muted animate-pulse">Đang cập nhật báo giá...</p>
          )}
          {quoteError && <p role="alert" className="text-[10px] text-danger">{quoteError}</p>}
        </div>

        <button
          type="button"
          disabled={cart.length === 0 || finalAmount <= 0}
          onClick={onCheckout}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-caramel py-3.5 text-xs font-bold text-action-ink shadow-md shadow-caramel/20 transition hover:bg-caramel-hover active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-rosewood-soft disabled:text-white disabled:shadow-none"
        >
          <Icon name="creditCard" size={17} />
          <span>Thanh toán đơn ({currency.format(finalAmount)}đ)</span>
        </button>
        <p className="mt-1.5 text-center text-[9px] font-medium text-muted">
          Thu ngân bán lẻ · In hóa đơn trực tiếp
        </p>
      </div>
    </>
  )
}

export default function CartPanel({
  cart,
  quote,
  quoteLoading,
  quoteError,
  onQuantityChange,
  onRemove,
  onCheckout,
  onClear,
  mobileOpen,
  onClose,
  note,
  onNoteChange,
}) {
  const commonProps = {
    cart,
    quote,
    quoteLoading,
    quoteError,
    onQuantityChange,
    onRemove,
    onCheckout,
    onClear,
    note,
    onNoteChange,
  }

  return (
    <>
      {/* Cột giỏ hàng độc lập trên Desktop / Tablet ngang (lg trở lên) - Nằm gọn trong layout, không tràn viền */}
      <aside className="hidden lg:flex lg:w-[290px] xl:w-[320px] 2xl:w-[350px] shrink-0 flex-col rounded-2xl border border-border bg-paper shadow-sm sticky top-[88px] h-[calc(100vh-108px)] overflow-hidden">
        <CartInnerContent {...commonProps} isMobile={false} />
      </aside>

      {/* Drawer trượt ra trên Mobile (< lg) khi bấm nút giỏ hàng */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex justify-end lg:hidden">
          <div
            className="fixed inset-0 bg-rosewood/40 backdrop-blur-xs transition-opacity"
            onClick={onClose}
            aria-hidden="true"
          />
          <aside className="relative z-10 flex h-full w-full max-w-[380px] flex-col bg-paper shadow-2xl border-l border-border">
            <CartInnerContent {...commonProps} isMobile onClose={onClose} />
          </aside>
        </div>
      )}
    </>
  )
}
