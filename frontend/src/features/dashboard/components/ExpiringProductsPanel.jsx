import { Link } from 'react-router-dom'
import Icon from '../../../components/Icon.jsx'
import { formatDate, getExpiryStatus } from '../../products/services/productExpiry.js'

export default function ExpiringProductsPanel({ items = [], error }) {
  return (
    <section className="soft-shadow rounded-2xl border border-border bg-paper p-5 sm:p-6">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="font-display text-lg font-semibold text-rosewood">Sản phẩm sắp hết hạn</h2>
          <p className="mt-1 text-[11px] text-muted">Hạn sử dụng còn 1 ngày hoặc đã đến hạn</p>
        </div>
        <span className={`flex h-8 w-8 items-center justify-center rounded-xl ${
          items.length > 0 ? 'bg-amber-100 text-amber-900' : 'bg-caramel-soft text-rosewood'
        }`}>
          <Icon name="bell" size={16} />
        </span>
      </div>
      <div className="mt-4 space-y-3">
        {items.map((item) => {
          const status = getExpiryStatus(item.expiryDate)
          return (
            <Link
              key={item.id}
              to={`/admin/products?editId=${item.id}&search=${encodeURIComponent(item.name)}`}
              className="group flex items-center justify-between gap-2 border-b border-border pb-3 last:border-0 last:pb-0 transition hover:bg-caramel-soft/40 -mx-2 px-2 py-1 rounded-xl"
            >
              <div className="min-w-0">
                <p className="truncate text-[11px] font-semibold text-rosewood group-hover:text-caramel transition-colors">{item.name}</p>
                <p className="mt-0.5 text-[9px] text-muted">HSD: {formatDate(item.expiryDate)} · Tồn: {item.quantity ?? item.stock} {item.unit || 'chiếc'}</p>
              </div>
              <span className={`shrink-0 rounded-lg px-2 py-1 text-[10px] font-bold ${
                status.status === 'expired'
                  ? 'border border-danger-line bg-danger-soft text-danger'
                  : 'border border-amber-300 bg-amber-100 text-amber-900'
              }`}>
                {status.shortLabel}
              </span>
            </Link>
          )
        })}
        {!items.length && (
          <p className="text-[11px] text-muted">
            {error ? `Không tải được danh sách: ${error}` : 'Không có sản phẩm nào sắp hết hạn trong 1 ngày.'}
          </p>
        )}
      </div>
      <Link to="/admin/products" className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-caramel-soft py-2.5 text-[11px] font-bold text-rosewood transition hover:border-caramel hover:bg-caramel/20">
        <Icon name="package" size={15} /> Kiểm tra kho sản phẩm
      </Link>
    </section>
  )
}
