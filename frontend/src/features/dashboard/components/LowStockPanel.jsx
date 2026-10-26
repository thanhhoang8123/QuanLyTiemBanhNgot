import { Link } from 'react-router-dom'
import Icon from '../../../components/Icon.jsx'
import { Link } from 'react-router-dom'

const quantityFormat = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 3 })

export default function LowStockPanel({ items, error }) {
  return (
    <section className="soft-shadow rounded-2xl border border-border bg-paper p-5 sm:p-6">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="font-display text-lg font-semibold text-rosewood">Nguyên liệu sắp hết</h2>
          <p className="mt-1 text-[11px] text-muted">Theo ngưỡng tồn kho đã cấu hình</p>
        </div>
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-caramel-soft text-rosewood">
          <Icon name="package" size={16} />
        </span>
      </div>
      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <div key={item.id} className="flex items-center justify-between gap-2 border-b border-border pb-3 last:border-0 last:pb-0">
            <div className="min-w-0">
              <p className="truncate text-[11px] font-semibold text-rosewood">{item.name}</p>
              <p className="mt-1 text-[9px] text-muted">Tối thiểu {quantityFormat.format(Number(item.minStockLevel))} {item.unit}</p>
            </div>
            <span className="shrink-0 rounded-lg border border-danger-line bg-danger-soft px-2 py-1 text-[10px] font-bold text-danger">{quantityFormat.format(Number(item.stockQuantity))} {item.unit}</span>
          </div>
        ))}
        {!items.length && (
          <p className="text-[11px] text-muted">
            {error ? `Không tải được tồn kho: ${error}` : 'Không có nguyên liệu nào dưới mức tồn tối thiểu.'}
          </p>
        )}
      </div>
      <Link to="/admin/purchase-orders" className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-caramel-soft py-2.5 text-[11px] font-bold text-rosewood transition hover:border-caramel hover:bg-caramel/20">
        <Icon name="plus" size={15} /> Ghi nhận nhập kho
      </Link>
    </section>
  )
}
