import { useEffect, useRef } from 'react'
import Button from './Button.jsx'
import Icon from './Icon.jsx'
import Modal from './Modal.jsx'

const moneyFormat = new Intl.NumberFormat('vi-VN', {
  maximumFractionDigits: 0,
})

function formatMoney(amount) {
  const num = Number(amount)
  return Number.isFinite(num) ? `${moneyFormat.format(num)} ₫` : '0 ₫'
}

function formatReceiptDateTime(dateStr) {
  if (!dateStr) return new Date().toLocaleString('vi-VN')
  const date = new Date(/(?:Z|[+-]\d{2}:\d{2})$/i.test(dateStr) ? dateStr : `${dateStr}Z`)
  if (Number.isNaN(date.getTime())) return String(dateStr)
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'medium',
  }).format(date)
}

export default function ReceiptModal({
  open,
  onClose,
  order,
  customer,
  employee,
  payment,
  receiptTitle = 'HÓA ĐƠN BÁN HÀNG',
  storeInfo = {
    name: 'TIỆM BÁNH WA PATISSERIE',
    address: '123 Đường Bánh Ngọt, TP. Hồ Chí Minh',
    hotline: '0901 234 567',
    website: 'wapatisserie.vn',
  },
}) {
  const printContainerRef = useRef(null)

  const handlePrint = () => {
    window.print()
  }

  if (!open || !order) return null

  const items = Array.isArray(order.items) ? order.items : []
  const subtotal = Number(order.totalAmount ?? 0)
  const discount = Number(order.discountAmount ?? 0)
  const finalAmount = Number(order.finalAmount ?? subtotal - discount)
  const customerName = customer?.fullName || order.customerName || 'Khách vãng lai'
  const customerPhone = customer?.phone || order.customerPhone || ''
  const employeeName = employee?.fullName || order.employeeName || 'Nhân viên thu ngân'
  const paymentMethodLabel = payment?.paymentMethod === 'VNPAY'
    ? 'VNPay QR / Thẻ'
    : payment?.paymentMethod === 'BANK_TRANSFER'
      ? 'Chuyển khoản'
      : 'Tiền mặt'

  return (
    <>
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #print-receipt-content, #print-receipt-content * {
            visibility: visible !important;
          }
          #print-receipt-content {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 80mm !important;
            margin: 0 auto !important;
            padding: 8mm 6mm !important;
            background: white !important;
            color: black !important;
            font-size: 11px !important;
            font-family: monospace, -apple-system, sans-serif !important;
            box-shadow: none !important;
            border: none !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <Modal open={open} onClose={onClose} title="Hóa đơn thanh toán">
        <div className="space-y-4">
          {/* Printable Receipt Paper Container */}
          <div
            id="print-receipt-content"
            ref={printContainerRef}
            className="mx-auto w-full max-w-sm rounded-xl border border-dashed border-stone-300 bg-white p-5 font-mono text-xs text-stone-800 shadow-sm sm:p-6"
          >
            {/* Header */}
            <div className="border-b border-dashed border-stone-300 pb-3 text-center">
              <h2 className="text-base font-bold uppercase tracking-wide text-stone-900">
                {storeInfo.name}
              </h2>
              <p className="mt-1 text-[11px] text-stone-600">{storeInfo.address}</p>
              <p className="text-[11px] text-stone-600">Hotline: {storeInfo.hotline}</p>
              <div className="my-2 border-t border-dotted border-stone-300" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-stone-900">
                {receiptTitle}
              </h3>
              <p className="text-[11px] text-stone-500">
                Mã đơn: <span className="font-bold text-stone-800">{order.orderCode || `#${order.id}`}</span>
              </p>
              <p className="text-[10px] text-stone-500">
                Ngày: {formatReceiptDateTime(order.orderDate || order.createdAt)}
              </p>
            </div>

            {/* Order meta */}
            <div className="space-y-1 border-b border-dashed border-stone-300 py-2.5 text-[11px]">
              <div className="flex justify-between">
                <span className="text-stone-500">Thu ngân:</span>
                <span className="font-medium text-stone-800">{employeeName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Khách hàng:</span>
                <span className="font-medium text-stone-800">
                  {customerName} {customerPhone ? `(${customerPhone})` : ''}
                </span>
              </div>
              {order.deliveryAddress && (
                <div className="flex justify-between">
                  <span className="text-stone-500">Địa chỉ giao:</span>
                  <span className="max-w-[60%] text-right font-medium text-stone-800">
                    {order.deliveryAddress}
                  </span>
                </div>
              )}
            </div>

            {/* Items Table */}
            <div className="border-b border-dashed border-stone-300 py-3">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-stone-200 text-[10px] uppercase text-stone-500">
                    <th className="pb-1">Món</th>
                    <th className="pb-1 text-center">SL</th>
                    <th className="pb-1 text-right">Đơn giá</th>
                    <th className="pb-1 text-right">T.Tiền</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dotted divide-stone-200 text-[11px]">
                  {items.map((item, index) => {
                    const name = item.productName || item.name || `Sản phẩm #${item.productId ?? index + 1}`
                    const qty = Number(item.quantity ?? 1)
                    const unitPrice = Number(item.unitPrice ?? item.price ?? (item.lineTotal ? item.lineTotal / qty : 0))
                    const lineTotal = Number(item.lineTotal ?? unitPrice * qty)

                    return (
                      <tr key={item.id ?? index}>
                        <td className="py-1.5 pr-1 font-medium text-stone-800">{name}</td>
                        <td className="py-1.5 text-center text-stone-600">{qty}</td>
                        <td className="py-1.5 text-right text-stone-600">{formatMoney(unitPrice)}</td>
                        <td className="py-1.5 text-right font-semibold text-stone-900">{formatMoney(lineTotal)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Summary calculation */}
            <div className="space-y-1.5 border-b border-dashed border-stone-300 py-3 text-[11px]">
              <div className="flex justify-between">
                <span className="text-stone-600">Tổng tiền hàng:</span>
                <span>{formatMoney(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Giảm giá / Khuyến mãi:</span>
                  <span>- {formatMoney(discount)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-dotted border-stone-300 pt-1.5 text-sm font-bold text-stone-900">
                <span>TỔNG CỘNG:</span>
                <span className="text-rosewood">{formatMoney(finalAmount)}</span>
              </div>
            </div>

            {/* Payment Details */}
            <div className="space-y-1 border-b border-dashed border-stone-300 py-2.5 text-[11px]">
              <div className="flex justify-between">
                <span className="text-stone-500">Phương thức:</span>
                <span className="font-medium text-stone-800">{paymentMethodLabel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Trạng thái:</span>
                <span className="font-semibold text-emerald-700">
                  {order.status === 'CANCELLED' ? 'ĐÃ HỦY' : 'ĐÃ THANH TOÁN'}
                </span>
              </div>
            </div>

            {/* Footer message & Barcode */}
            <div className="pt-3 text-center text-[10px] text-stone-500">
              <p className="font-semibold text-stone-700">Cảm ơn Quý khách & Hẹn gặp lại!</p>
              <p className="mt-0.5">Bánh tươi bảo quản lạnh từ 2°C – 6°C.</p>
              <div className="mt-3 flex justify-center">
                <div className="rounded bg-stone-100 px-3 py-1 text-[9px] tracking-widest text-stone-600">
                  *{order.orderCode || order.id}*
                </div>
              </div>
              <p className="mt-1 text-[9px] text-stone-400">{storeInfo.website}</p>
            </div>
          </div>

          {/* Action buttons (hidden when printing) */}
          <div className="no-print flex justify-end gap-2 border-t border-border pt-4">
            <Button variant="secondary" onClick={onClose}>
              Đóng
            </Button>
            <Button onClick={handlePrint}>
              <Icon name="check" size={16} />
              In hóa đơn ngay (Print)
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
