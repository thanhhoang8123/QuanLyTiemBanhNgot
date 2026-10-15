import { useMemo, useState } from 'react'
import Button from '../components/Button.jsx'
import DataTable from '../components/DataTable.jsx'
import Icon from '../components/Icon.jsx'
import Modal from '../components/Modal.jsx'
import { ProductArtwork } from '../components/ProductCard.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import { categories } from '../data/mockData.js'

const currency = new Intl.NumberFormat('vi-VN')
const productCategories = categories.filter((category) => category !== 'Tất cả')
const emptyForm = { name: '', code: '', category: productCategories[0], price: '', stock: '', status: 'Đang bán' }

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-semibold text-rosewood">{label}</span>
      {children}
    </label>
  )
}

const inputClass = 'h-10 w-full rounded-xl border border-border bg-white px-3 text-xs text-rosewood outline-none transition placeholder:text-muted focus:border-caramel-hover'

export default function ProductsPage({ onToast, products, onProductsChange }) {
  const items = products
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('Tất cả')
  const [status, setStatus] = useState('Tất cả trạng thái')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const filteredItems = useMemo(() => items.filter((item) => {
    const matchesQuery = `${item.name} ${item.code}`.toLocaleLowerCase('vi').includes(query.trim().toLocaleLowerCase('vi'))
    return matchesQuery
      && (category === 'Tất cả' || item.category === category)
      && (status === 'Tất cả trạng thái' || item.status === status)
  }), [items, query, category, status])

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setFormOpen(true)
  }

  const openEdit = (item) => {
    setEditing(item)
    setFormOpen(true)
    setForm({
      name: item.name,
      code: item.code,
      category: item.category,
      price: String(item.price),
      stock: String(item.stock),
      status: item.status,
    })
  }

  const saveProduct = (event) => {
    event.preventDefault()
    const price = Number(form.price)
    const stock = Number(form.stock)
    if (!form.name.trim() || !form.code.trim() || !Number.isFinite(price) || price < 0 || !Number.isFinite(stock) || stock < 0) {
      onToast('Vui lòng nhập tên, mã, giá và số lượng hợp lệ.')
      return
    }
    const normalizedCode = form.code.trim().toLocaleLowerCase('vi')
    if (items.some((item) => item.code.toLocaleLowerCase('vi') === normalizedCode && item.id !== editing?.id)) {
      onToast('Mã sản phẩm này đã được sử dụng.')
      return
    }
    if (editing) {
      onProductsChange((current) => current.map((item) => item.id === editing.id
        ? { ...item, ...form, name: form.name.trim(), code: form.code.trim(), price, stock }
        : item))
      onToast('Đã cập nhật sản phẩm mẫu.')
    } else {
      const id = `product-${Date.now()}`
      onProductsChange((current) => [...current, {
        id,
        background: 'from-[#e7d1bb] to-[#b9855f]',
        ...form,
        name: form.name.trim(),
        code: form.code.trim(),
        price,
        stock,
      }])
      onToast('Đã thêm sản phẩm mẫu.')
    }
    setEditing(null)
    setForm(emptyForm)
    setFormOpen(false)
  }

  const toggleStatus = (item) => {
    if (item.status === 'Tạm ẩn' && item.stock === 0) {
      onToast('Sản phẩm đã hết hàng; hãy cập nhật tồn kho trước khi mở bán.')
      return
    }
    const nextStatus = item.status === 'Đang bán' ? 'Tạm ẩn' : 'Đang bán'
    onProductsChange((current) => current.map((candidate) => candidate.id === item.id ? { ...candidate, status: nextStatus } : candidate))
    onToast(`Đã chuyển "${item.name}" sang trạng thái ${nextStatus.toLocaleLowerCase('vi')}.`)
  }

  const removeProduct = () => {
    onProductsChange((current) => current.filter((item) => item.id !== deleteTarget.id))
    onToast(`Đã xóa sản phẩm mẫu "${deleteTarget.name}".`)
    setDeleteTarget(null)
  }

  const columns = [
    {
      key: 'product',
      label: 'Sản phẩm',
      render: (item) => (
        <div className="flex min-w-[205px] items-center gap-3">
          <ProductArtwork id={item.id} name={item.name} background={item.background} compact />
          <div>
            <p className="font-bold text-rosewood">{item.name}</p>
            <p className="mt-1 text-[10px] text-muted">{item.code}</p>
          </div>
        </div>
      ),
    },
    { key: 'category', label: 'Danh mục', render: (item) => <span className="whitespace-nowrap">{item.category}</span> },
    { key: 'price', label: 'Giá bán', render: (item) => <span className="whitespace-nowrap font-bold text-rosewood">{currency.format(item.price)}đ</span> },
    {
      key: 'stock',
      label: 'Tồn kho',
      render: (item) => (
        <span className={`whitespace-nowrap font-semibold ${item.stock === 0 ? 'text-danger' : item.stock <= 5 ? 'text-warning' : 'text-rosewood'}`}>
          {item.stock} chiếc
        </span>
      ),
    },
    { key: 'status', label: 'Trạng thái', render: (item) => <StatusBadge status={item.status} /> },
    {
      key: 'actions',
      label: 'Thao tác',
      headerClassName: 'text-right',
      cellClassName: 'text-right',
      render: (item) => (
        <div className="inline-flex items-center gap-1">
          <button type="button" aria-label={`Sửa ${item.name}`} onClick={() => openEdit(item)} className="flex h-8 w-8 items-center justify-center rounded-lg text-rosewood transition hover:bg-petal">
            <Icon name="edit" size={15} />
          </button>
          <button type="button" aria-label={item.status === 'Đang bán' ? `Ẩn ${item.name}` : `Mở bán ${item.name}`} onClick={() => toggleStatus(item)} className="rounded-lg px-2 py-1.5 text-[10px] font-semibold text-rosewood transition hover:bg-petal">
            {item.status === 'Đang bán' ? 'Ẩn' : 'Mở bán'}
          </button>
          <button type="button" aria-label={`Xóa ${item.name}`} onClick={() => setDeleteTarget(item)} className="flex h-8 w-8 items-center justify-center rounded-lg text-danger transition hover:bg-danger-soft">
            <Icon name="trash" size={15} />
          </button>
        </div>
      ),
    },
  ]

  const activeCount = items.filter((item) => item.status === 'Đang bán').length
  const lowStockCount = items.filter((item) => item.stock > 0 && item.stock <= 5).length

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-[11px] font-semibold tracking-wide text-muted">Danh mục sản phẩm</p>
          <h2 className="font-display mt-1 text-[28px] text-rosewood sm:text-[32px]">Sản phẩm</h2>
          <p className="mt-1 text-xs text-muted">Quản lý bánh, giá bán và trạng thái kinh doanh.</p>
        </div>
        <Button onClick={openCreate}><Icon name="plus" size={16} /> Thêm sản phẩm</Button>
      </div>

      <section aria-label="Tổng quan sản phẩm" className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-3">
        {[
          { label: 'Tổng sản phẩm', value: items.length, icon: 'package' },
          { label: 'Đang kinh doanh', value: activeCount, icon: 'check' },
          { label: 'Tồn kho thấp', value: lowStockCount, icon: 'receipt' },
        ].map((stat) => (
          <article key={stat.label} className="soft-shadow flex items-center justify-between rounded-2xl border border-border bg-paper p-4 sm:p-5">
            <div>
              <p className="text-[11px] font-semibold text-muted">{stat.label}</p>
              <p className="font-display mt-2 text-2xl font-semibold text-rosewood">{stat.value}</p>
            </div>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-caramel-soft text-rosewood"><Icon name={stat.icon} size={18} /></span>
          </article>
        ))}
      </section>

      <section className="soft-shadow overflow-hidden rounded-2xl border border-border bg-paper">
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div>
            <h3 className="font-display text-lg font-semibold text-rosewood">Danh sách sản phẩm</h3>
            <p className="mt-1 text-[11px] text-muted">{filteredItems.length} sản phẩm phù hợp</p>
          </div>
          <div className="grid grid-cols-1 gap-2 min-[480px]:grid-cols-3">
            <label className="relative min-w-0 min-[480px]:col-span-1">
              <span className="sr-only">Tìm sản phẩm</span>
              <Icon name="search" size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-rosewood" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tên hoặc mã..." className="h-10 w-full rounded-xl border border-border bg-white pl-9 pr-3 text-[11px] text-rosewood outline-none focus:border-caramel-hover" />
            </label>
            <select aria-label="Lọc danh mục" value={category} onChange={(event) => setCategory(event.target.value)} className="h-10 rounded-xl border border-border bg-white px-3 text-[11px] text-rosewood outline-none focus:border-caramel-hover">
              <option>Tất cả</option>
              {productCategories.map((item) => <option key={item}>{item}</option>)}
            </select>
            <select aria-label="Lọc trạng thái sản phẩm" value={status} onChange={(event) => setStatus(event.target.value)} className="h-10 rounded-xl border border-border bg-white px-3 text-[11px] text-rosewood outline-none focus:border-caramel-hover">
              <option>Tất cả trạng thái</option>
              <option>Đang bán</option>
              <option>Tạm ẩn</option>
            </select>
          </div>
        </div>
        <DataTable
          columns={columns}
          rows={filteredItems}
          rowKey={(item) => item.id}
          emptyTitle="Không tìm thấy sản phẩm"
          emptyDescription="Thử từ khóa, danh mục hoặc trạng thái khác."
        />
      </section>

      <Modal open={formOpen} title={editing ? 'Cập nhật sản phẩm' : 'Thêm sản phẩm mới'} onClose={() => { setFormOpen(false); setEditing(null) }}>
        <form className="space-y-4" onSubmit={saveProduct}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Tên sản phẩm">
              <input autoFocus required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className={inputClass} placeholder="Ví dụ: Bánh mousse xoài" />
            </Field>
            <Field label="Mã sản phẩm">
              <input required value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })} className={inputClass} placeholder="WA-009" />
            </Field>
            <Field label="Danh mục">
              <select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} className={inputClass}>
                {productCategories.map((item) => <option key={item}>{item}</option>)}
              </select>
            </Field>
            <Field label="Trạng thái">
              <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })} className={inputClass}>
                <option>Đang bán</option>
                <option>Tạm ẩn</option>
              </select>
            </Field>
            <Field label="Giá bán (đ)">
              <input required type="number" min="0" step="1000" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} className={inputClass} placeholder="95000" />
            </Field>
            <Field label="Tồn kho (chiếc)">
              <input required type="number" min="0" step="1" value={form.stock} onChange={(event) => setForm({ ...form, stock: event.target.value })} className={inputClass} placeholder="0" />
            </Field>
          </div>
          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <Button variant="secondary" onClick={() => { setFormOpen(false); setEditing(null) }}>Hủy</Button>
            <Button type="submit"><Icon name="check" size={15} /> Lưu sản phẩm</Button>
          </div>
        </form>
      </Modal>

      <Modal open={Boolean(deleteTarget)} title="Xóa sản phẩm?" onClose={() => setDeleteTarget(null)} size="max-w-md">
        <p className="text-sm leading-6 text-rosewood">
          Bạn sắp xóa <strong className="text-rosewood">{deleteTarget?.name}</strong> khỏi danh sách dữ liệu mẫu. Thao tác này không thể hoàn tác trong phiên prototype.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Giữ lại</Button>
          <Button variant="danger" onClick={removeProduct}><Icon name="trash" size={15} /> Xóa sản phẩm</Button>
        </div>
      </Modal>
    </div>
  )
}
