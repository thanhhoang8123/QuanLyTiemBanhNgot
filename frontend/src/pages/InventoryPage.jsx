import { useMemo, useState } from 'react'
import Button from '../components/Button.jsx'
import DataTable from '../components/DataTable.jsx'
import Icon from '../components/Icon.jsx'
import Modal from '../components/Modal.jsx'
import StatusBadge from '../components/StatusBadge.jsx'

const currency = new Intl.NumberFormat('vi-VN')
const quantityFormat = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 })
const inputClass = 'h-10 w-full rounded-xl border border-border bg-white px-3 text-xs text-rosewood outline-none focus:border-caramel-hover'

function ingredientStatus(item) {
  if (item.quantity <= 0) return 'Hết hàng'
  if (item.quantity <= item.minimum) return 'Sắp hết'
  return 'Còn hàng'
}

export default function InventoryPage({ onToast, items, onItemsChange }) {
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('Tất cả trạng thái')
  const [stockPickerOpen, setStockPickerOpen] = useState(false)
  const [selected, setSelected] = useState(null)
  const [mode, setMode] = useState('Nhập kho')
  const [amount, setAmount] = useState('1')

  const filteredItems = useMemo(() => items.filter((item) => {
    const matchesQuery = `${item.name} ${item.category}`.toLocaleLowerCase('vi').includes(query.trim().toLocaleLowerCase('vi'))
    const currentStatus = ingredientStatus(item)
    return matchesQuery && (statusFilter === 'Tất cả trạng thái' || currentStatus === statusFilter)
  }), [items, query, statusFilter])

  const openStockModal = (item, action) => {
    setSelected(item)
    setMode(action)
    setAmount(action === 'Điều chỉnh' ? String(item.quantity) : '1')
  }

  const saveStockChange = (event) => {
    event.preventDefault()
    const value = Number(amount)
    if (!Number.isFinite(value) || value < 0 || (mode === 'Nhập kho' && value === 0)) {
      onToast(mode === 'Nhập kho' ? 'Số lượng nhập phải lớn hơn 0.' : 'Số lượng tồn phải là số không âm.')
      return
    }
    onItemsChange((current) => current.map((item) => {
      if (item.id !== selected.id) return item
      const nextQuantity = mode === 'Nhập kho' ? item.quantity + value : value
      return { ...item, quantity: nextQuantity, updatedAt: 'Vừa cập nhật' }
    }))
    onToast(mode === 'Nhập kho' ? `Đã ghi nhận nhập ${quantityFormat.format(value)} ${selected.unit} ${selected.name}.` : `Đã cập nhật tồn kho ${selected.name}.`)
    setSelected(null)
  }

  const columns = [
    {
      key: 'name',
      label: 'Nguyên liệu',
      render: (item) => (
        <div className="min-w-[185px]">
          <p className="font-bold text-rosewood">{item.name}</p>
          <p className="mt-1 text-[10px] text-muted">{item.category}</p>
        </div>
      ),
    },
    {
      key: 'quantity',
      label: 'Tồn hiện tại',
      render: (item) => (
        <span className={`whitespace-nowrap font-bold ${ingredientStatus(item) === 'Hết hàng' ? 'text-danger' : ingredientStatus(item) === 'Sắp hết' ? 'text-warning' : 'text-rosewood'}`}>
          {quantityFormat.format(item.quantity)} {item.unit}
        </span>
      ),
    },
    { key: 'minimum', label: 'Ngưỡng tối thiểu', render: (item) => <span className="whitespace-nowrap">{quantityFormat.format(item.minimum)} {item.unit}</span> },
    { key: 'status', label: 'Trạng thái', render: (item) => <StatusBadge status={ingredientStatus(item)} /> },
    { key: 'updatedAt', label: 'Cập nhật', render: (item) => <span className="whitespace-nowrap text-[10px]">{item.updatedAt}</span> },
    {
      key: 'actions',
      label: 'Thao tác',
      headerClassName: 'text-right',
      cellClassName: 'text-right',
      render: (item) => (
        <div className="inline-flex items-center gap-1">
          <button type="button" onClick={() => openStockModal(item, 'Nhập kho')} className="rounded-lg px-2.5 py-2 text-[10px] font-bold text-rosewood transition hover:bg-petal">
            <span className="inline-flex items-center gap-1"><Icon name="plus" size={13} /> Nhập</span>
          </button>
          <button type="button" aria-label={`Điều chỉnh tồn ${item.name}`} onClick={() => openStockModal(item, 'Điều chỉnh')} className="flex h-8 w-8 items-center justify-center rounded-lg text-rosewood transition hover:bg-petal">
            <Icon name="edit" size={14} />
          </button>
        </div>
      ),
    },
  ]

  const lowCount = items.filter((item) => ingredientStatus(item) === 'Sắp hết').length
  const outCount = items.filter((item) => ingredientStatus(item) === 'Hết hàng').length
  const stockValue = items.reduce((total, item) => total + item.quantity * item.unitCost, 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-[11px] font-semibold tracking-wide text-muted">Nguyên liệu & định mức</p>
          <h2 className="font-display mt-1 text-[28px] text-rosewood sm:text-[32px]">Kho nguyên liệu</h2>
          <p className="mt-1 text-xs text-muted">Theo dõi lượng tồn và bổ sung nguyên liệu cho gian bếp.</p>
        </div>
        <Button onClick={() => setStockPickerOpen(true)}><Icon name="plus" size={16} /> Nhập kho</Button>
      </div>

      <section aria-label="Tổng quan kho" className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-3">
        {[
          { label: 'Loại nguyên liệu', value: items.length, icon: 'package', detail: 'đang theo dõi' },
          { label: 'Dưới ngưỡng', value: lowCount + outCount, icon: 'receipt', detail: `${outCount} loại đã hết` },
          { label: 'Giá trị tồn ước tính', value: `${currency.format(stockValue)}đ`, icon: 'creditCard', detail: 'theo giá nhập mẫu' },
        ].map((stat) => (
          <article key={stat.label} className="soft-shadow flex items-center justify-between rounded-2xl border border-border bg-paper p-4 sm:p-5">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-muted">{stat.label}</p>
              <p className={`font-display mt-2 truncate font-semibold text-rosewood ${stat.label === 'Giá trị tồn ước tính' ? 'text-xl sm:text-2xl' : 'text-2xl'}`}>{stat.value}</p>
              <p className="mt-1 text-[10px] text-muted">{stat.detail}</p>
            </div>
            <span className="ml-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-caramel-soft text-rosewood"><Icon name={stat.icon} size={18} /></span>
          </article>
        ))}
      </section>

      <section className="soft-shadow overflow-hidden rounded-2xl border border-border bg-paper">
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div>
            <h3 className="font-display text-lg font-semibold text-rosewood">Tồn kho nguyên liệu</h3>
            <p className="mt-1 text-[11px] text-muted">{filteredItems.length} nguyên liệu phù hợp</p>
          </div>
          <div className="grid grid-cols-1 gap-2 min-[480px]:grid-cols-[minmax(180px,1fr)_190px]">
            <label className="relative">
              <span className="sr-only">Tìm nguyên liệu</span>
              <Icon name="search" size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-rosewood" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm nguyên liệu..." className="h-10 w-full rounded-xl border border-border bg-white pl-9 pr-3 text-[11px] text-rosewood outline-none focus:border-caramel-hover" />
            </label>
            <select aria-label="Lọc trạng thái tồn kho" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-10 rounded-xl border border-border bg-white px-3 text-[11px] text-rosewood outline-none focus:border-caramel-hover">
              <option>Tất cả trạng thái</option>
              <option>Còn hàng</option>
              <option>Sắp hết</option>
              <option>Hết hàng</option>
            </select>
          </div>
        </div>
        <DataTable
          columns={columns}
          rows={filteredItems}
          rowKey={(item) => item.id}
          emptyTitle="Không tìm thấy nguyên liệu"
          emptyDescription="Thử từ khóa hoặc trạng thái tồn kho khác."
        />
      </section>

      <Modal open={stockPickerOpen} title="Chọn nguyên liệu nhập kho" onClose={() => setStockPickerOpen(false)} size="max-w-md">
        <div className="space-y-2">
          <p className="mb-3 text-[11px] text-muted">Chọn nguyên liệu cần nhập; số tồn chỉ thay đổi trong prototype.</p>
          {items.map((item) => (
            <Button
              key={item.id}
              variant="secondary"
              className="h-auto w-full justify-between rounded-xl px-4 py-3 text-left"
              onClick={() => {
                setStockPickerOpen(false)
                openStockModal(item, 'Nhập kho')
              }}
            >
              <span>
                <span className="block text-xs font-bold text-rosewood">{item.name}</span>
                <span className="mt-1 block text-[10px] font-normal text-muted">Tồn: {quantityFormat.format(item.quantity)} {item.unit}</span>
              </span>
              <Icon name="chevronRight" size={15} />
            </Button>
          ))}
        </div>
      </Modal>

      <Modal open={Boolean(selected)} title={`${mode} nguyên liệu`} onClose={() => setSelected(null)} size="max-w-md">
        {selected && (
          <form className="space-y-4" onSubmit={saveStockChange}>
            <div className="rounded-xl border border-border bg-petal px-4 py-3">
              <p className="text-xs font-bold text-rosewood">{selected.name}</p>
              <p className="mt-1 text-[10px] text-muted">Tồn hiện tại: {quantityFormat.format(selected.quantity)} {selected.unit} · Ngưỡng: {quantityFormat.format(selected.minimum)} {selected.unit}</p>
            </div>
            <label className="block">
              <span className="mb-1.5 block text-[11px] font-semibold text-rosewood">Thao tác</span>
              <select value={mode} onChange={(event) => {
                setMode(event.target.value)
                setAmount(event.target.value === 'Điều chỉnh' ? String(selected.quantity) : '1')
              }} className={inputClass}>
                <option>Nhập kho</option>
                <option>Điều chỉnh</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[11px] font-semibold text-rosewood">{mode === 'Nhập kho' ? `Số lượng nhập (${selected.unit})` : `Số lượng tồn mới (${selected.unit})`}</span>
              <input autoFocus required type="number" min={mode === 'Nhập kho' ? '0.01' : '0'} step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} className={inputClass} />
            </label>
            <p className="text-[10px] leading-5 text-muted">Thao tác chỉ cập nhật dữ liệu mẫu trong phiên trình duyệt này.</p>
            <div className="flex justify-end gap-2 border-t border-border pt-4">
              <Button variant="secondary" onClick={() => setSelected(null)}>Hủy</Button>
              <Button type="submit"><Icon name="check" size={15} /> Lưu điều chỉnh</Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}
