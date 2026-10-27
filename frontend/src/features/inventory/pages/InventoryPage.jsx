import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Button from '../../../components/Button.jsx'
import DataTable from '../../../components/DataTable.jsx'
import Icon from '../../../components/Icon.jsx'
import Modal from '../../../components/Modal.jsx'
import ConfirmDialog from '../../../components/ConfirmDialog.jsx'
import StatusBadge from '../../../components/StatusBadge.jsx'
import { createIngredient, deleteIngredient, getIngredients, updateIngredient } from '../services/ingredientService.js'
import { getUserFacingErrorMessage } from '../../../services/apiClient.js'

const currency = new Intl.NumberFormat('vi-VN')
const quantityFormat = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 3 })
const emptyForm = {
  ingredientCode: '',
  name: '',
  unit: '',
  stockQuantity: '0',
  minStockLevel: '0',
  unitPrice: '0',
  status: true,
}
const inputClass = 'h-10 w-full rounded-xl border border-border bg-white px-3 text-xs text-rosewood outline-none focus:border-caramel-hover'

function ingredientStatus(item) {
  const quantity = Number(item.stockQuantity ?? 0)
  if (quantity <= 0) return 'Hết hàng'
  if (quantity <= Number(item.minStockLevel ?? 0)) return 'Sắp hết'
  return 'Còn hàng'
}

function getErrorMessage(error) {
  return getUserFacingErrorMessage(error)
}

function formatIngredient(item) {
  return {
    ...item,
    stockQuantity: Number(item.stockQuantity ?? 0),
    minStockLevel: Number(item.minStockLevel ?? 0),
    unitPrice: Number(item.unitPrice ?? 0),
  }
}

export default function InventoryPage({ onToast }) {
  const [items, setItems] = useState([])
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('Tất cả trạng thái')
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [formError, setFormError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [pendingId, setPendingId] = useState(null)

  const loadItems = useCallback(async (signal) => {
    setIsLoading(true)
    setLoadError('')
    try {
      const result = await getIngredients({ signal })
      if (!Array.isArray(result)) throw new Error('Chưa thể tải danh sách nguyên liệu. Vui lòng thử lại.')
      setItems(result.map(formatIngredient))
    } catch (error) {
      if (error.name !== 'AbortError') setLoadError(getErrorMessage(error))
    } finally {
      if (!signal?.aborted) setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    void loadItems(controller.signal)
    return () => controller.abort()
  }, [loadItems])

  const filteredItems = useMemo(() => items.filter((item) => {
    const normalizedQuery = query.trim().toLocaleLowerCase('vi')
    const matchesQuery = `${item.ingredientCode ?? ''} ${item.name ?? ''}`
      .toLocaleLowerCase('vi')
      .includes(normalizedQuery)

    const status = ingredientStatus(item)

    const matchesStatus =
      statusFilter === 'Tất cả trạng thái'
        ? true
        : statusFilter === 'Ngừng hoạt động'
          ? item.status === false
          : item.status !== false && status === statusFilter

    return matchesQuery && matchesStatus
  }), [items, query, statusFilter])

  const openCreate = () => {
    setEditing(null)
    setForm({ ...emptyForm })
    setFormError('')
    setFormOpen(true)
  }

  const openEdit = (item) => {
    setEditing(item)
    setForm({
      ingredientCode: item.ingredientCode ?? '',
      name: item.name ?? '',
      unit: item.unit ?? '',
      stockQuantity: String(item.stockQuantity),
      minStockLevel: String(item.minStockLevel),
      unitPrice: String(item.unitPrice),
      status: item.status !== false,
    })
    setFormError('')
    setFormOpen(true)
  }

  const saveIngredient = async (event) => {
    event.preventDefault()
    const stockQuantity = Number(form.stockQuantity)
    const minStockLevel = Number(form.minStockLevel)
    const unitPrice = Number(form.unitPrice)
    if (!form.ingredientCode.trim() || !form.name.trim() || !form.unit.trim()
      || !Number.isFinite(stockQuantity) || stockQuantity < 0
      || !Number.isFinite(minStockLevel) || minStockLevel < 0
      || !Number.isFinite(unitPrice) || unitPrice < 0
      || !/^\d+(\.\d{1,3})?$/.test(form.stockQuantity.trim())
      || !/^\d+(\.\d{1,3})?$/.test(form.minStockLevel.trim())
      || !/^\d+(\.\d{1,2})?$/.test(form.unitPrice.trim())) {
      setFormError('Vui lòng nhập mã, tên, đơn vị và số liệu hợp lệ (tồn/ngưỡng tối đa 3 chữ số thập phân, đơn giá tối đa 2).')
      return
    }

    const payload = {
      ingredientCode: form.ingredientCode.trim(),
      name: form.name.trim(),
      unit: form.unit.trim(),
      stockQuantity,
      minStockLevel,
      unitPrice,
      status: form.status,
    }
    setIsSaving(true)
    setFormError('')
    try {
      if (editing) await updateIngredient(editing.id, payload)
      else await createIngredient(payload)
      setFormOpen(false)
      onToast(editing ? 'Đã cập nhật nguyên liệu.' : 'Đã thêm nguyên liệu.')
      await loadItems()
    } catch (error) {
      setFormError(getErrorMessage(error))
    } finally {
      setIsSaving(false)
    }
  }

  const toggleIngredientStatus = async (item) => {
    setPendingId(item.id)
    setLoadError('')
    const payload = {
      ingredientCode: item.ingredientCode,
      name: item.name,
      unit: item.unit,
      stockQuantity: item.stockQuantity,
      minStockLevel: item.minStockLevel,
      unitPrice: item.unitPrice,
      status: item.status === false,
    }
    try {
      await updateIngredient(item.id, payload)
      onToast(`Đã cập nhật trạng thái nguyên liệu "${item.name}".`)
      await loadItems()
    } catch (error) {
      setLoadError(`Không thể cập nhật trạng thái: ${getErrorMessage(error)}`)
    } finally {
      setPendingId(null)
    }
  }

  const removeIngredient = async () => {
    if (!deleteTarget || pendingId !== null) return

    setPendingId(deleteTarget.id)
    setLoadError('')
    try {
      await deleteIngredient(deleteTarget.id)
      onToast(`Đã xóa nguyên liệu "${deleteTarget.name}".`)
      setDeleteTarget(null)
      await loadItems()
    } catch (error) {
      setLoadError(`Không thể xóa nguyên liệu: ${getErrorMessage(error)}`)
    } finally {
      setPendingId(null)
    }
  }

  const columns = [
    {
      key: 'name',
      label: 'Nguyên liệu',
      render: (item) => (
        <div className="min-w-[185px]">
          <p className="font-bold text-rosewood">{item.name}</p>
          <p className="mt-1 text-[10px] text-muted">{item.ingredientCode}</p>
        </div>
      ),
    },
    {
      key: 'stockQuantity',
      label: 'Tồn hiện tại',
      render: (item) => (
        <span className={`whitespace-nowrap font-bold ${ingredientStatus(item) === 'Hết hàng' ? 'text-danger' : ingredientStatus(item) === 'Sắp hết' ? 'text-warning' : 'text-rosewood'}`}>
          {quantityFormat.format(item.stockQuantity)} {item.unit}
        </span>
      ),
    },
    { key: 'minStockLevel', label: 'Ngưỡng tối thiểu', render: (item) => <span className="whitespace-nowrap">{quantityFormat.format(item.minStockLevel)} {item.unit}</span> },
    { key: 'unitPrice', label: 'Giá nhập gần nhất', render: (item) => <span className="whitespace-nowrap">{currency.format(item.unitPrice)}đ / {item.unit}</span> },
    { key: 'status', label: 'Trạng thái tồn', render: (item) => <StatusBadge status={item.status === false ? 'Ngừng hoạt động' : ingredientStatus(item)} /> },
    {
      key: 'actions',
      label: 'Thao tác',
      headerClassName: 'text-right',
      cellClassName: 'text-right',
      render: (item) => (
        <div className="inline-flex items-center gap-1">
          <button type="button" aria-label={`Sửa ${item.name}`} disabled={pendingId !== null || isSaving} onClick={() => openEdit(item)} className="flex h-8 w-8 items-center justify-center rounded-lg text-rosewood transition hover:bg-petal disabled:opacity-50">
            <Icon name="edit" size={14} />
          </button>
          <button type="button" disabled={pendingId !== null || isSaving} onClick={() => toggleIngredientStatus(item)} className="rounded-lg px-2 py-1.5 text-[10px] font-semibold text-rosewood transition hover:bg-petal disabled:opacity-50">
            {item.status === false ? 'Kích hoạt' : 'Ngừng'}
          </button>
          <button type="button" aria-label={`Xóa ${item.name}`} disabled={pendingId !== null || isSaving} onClick={() => setDeleteTarget(item)} className="flex h-8 w-8 items-center justify-center rounded-lg text-danger transition hover:bg-danger-soft disabled:opacity-50">
            <Icon name="trash" size={14} />
          </button>
        </div>
      ),
    },
  ]

  const lowCount = items.filter((item) => item.status !== false && ingredientStatus(item) === 'Sắp hết').length
  const outCount = items.filter((item) => item.status !== false && ingredientStatus(item) === 'Hết hàng').length
  const activeItems = items.filter((item) => item.status !== false)
  const stockValue = activeItems.reduce((total, item) => total + item.stockQuantity * item.unitPrice, 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-[11px] font-semibold tracking-wide text-muted">Nguyên liệu & định mức</p>
          <h2 className="font-display mt-1 text-[28px] text-rosewood sm:text-[32px]">Kho nguyên liệu</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/admin/purchase-orders"><Button variant="secondary"><Icon name="receipt" size={15} /> Phiếu nhập</Button></Link>
          <Button variant="secondary" onClick={() => void loadItems()} disabled={isLoading || pendingId !== null}><Icon name="refresh" size={15} /> Làm mới</Button>
          <Button onClick={openCreate}><Icon name="plus" size={16} /> Thêm nguyên liệu</Button>
        </div>
      </div>

      {loadError && <div role="alert" className="flex flex-col gap-3 rounded-xl border border-danger-line bg-danger-soft px-4 py-3 text-xs text-danger sm:flex-row sm:items-center sm:justify-between"><span>{loadError}</span><Button size="sm" variant="secondary" onClick={() => void loadItems()}>Tải lại</Button></div>}

      {isLoading ? (
        <section role="status" className="soft-shadow rounded-2xl border border-border bg-paper px-5 py-16 text-center text-sm text-muted">Đang tải tồn kho...</section>
      ) : (
        <>
          <section aria-label="Tổng quan kho" className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-3">
            {[
              { label: 'Loại nguyên liệu', value: activeItems.length, icon: 'package', detail: 'đang theo dõi' },
              { label: 'Dưới ngưỡng', value: lowCount + outCount, icon: 'receipt', detail: `${outCount} loại đã hết` },
              { label: 'Giá trị tồn ước tính', value: `${currency.format(stockValue)}đ`, icon: 'creditCard', detail: 'theo giá nhập gần nhất' },
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
                  <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Mã hoặc tên nguyên liệu..." className="h-10 w-full rounded-xl border border-border bg-white pl-9 pr-3 text-[11px] text-rosewood outline-none focus:border-caramel-hover" />
                </label>
                <select aria-label="Lọc trạng thái tồn kho" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-10 rounded-xl border border-border bg-white px-3 text-[11px] text-rosewood outline-none focus:border-caramel-hover">
                  <option>Tất cả trạng thái</option>
                  <option>Còn hàng</option>
                  <option>Sắp hết</option>
                  <option>Hết hàng</option>
                  <option>Ngừng hoạt động</option>
                </select>
              </div>
            </div>
            <DataTable
              columns={columns}
              rows={filteredItems}
              rowKey={(item) => item.id}
              emptyTitle={items.length ? 'Không tìm thấy nguyên liệu' : 'Chưa có nguyên liệu'}
              emptyDescription={items.length ? 'Thử từ khóa hoặc trạng thái tồn kho khác.' : 'Thêm nguyên liệu để quản lý tồn kho.'}
            />
          </section>
        </>
      )}

      <Modal open={formOpen} title={editing ? 'Cập nhật nguyên liệu' : 'Thêm nguyên liệu'} onClose={() => { if (!isSaving) setFormOpen(false) }}>
        <form className="space-y-4" onSubmit={saveIngredient}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="block"><span className="mb-1.5 block text-[11px] font-semibold text-rosewood">Mã nguyên liệu</span><input required maxLength={30} value={form.ingredientCode} onChange={(event) => setForm({ ...form, ingredientCode: event.target.value })} className={inputClass} placeholder="Ví dụ: NL-001" /></label>
            <label className="block"><span className="mb-1.5 block text-[11px] font-semibold text-rosewood">Tên nguyên liệu</span><input required maxLength={150} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className={inputClass} placeholder="Ví dụ: Bột mì số 13" /></label>
            <label className="block"><span className="mb-1.5 block text-[11px] font-semibold text-rosewood">Đơn vị</span><input required maxLength={30} value={form.unit} onChange={(event) => setForm({ ...form, unit: event.target.value })} className={inputClass} placeholder="Ví dụ: kg, g, lít, quả" /></label>
            <label className="block"><span className="mb-1.5 block text-[11px] font-semibold text-rosewood">Tồn hiện tại (chỉ xem)</span><input type="number" min="0" step="0.001" readOnly value={form.stockQuantity} className={`${inputClass} read-only:bg-cream read-only:text-muted`} /></label>
            <label className="block"><span className="mb-1.5 block text-[11px] font-semibold text-rosewood">Ngưỡng tồn thấp</span><input required type="number" min="0" step="0.001" value={form.minStockLevel} onChange={(event) => setForm({ ...form, minStockLevel: event.target.value })} className={inputClass} placeholder="Ví dụ: 2" /><span className="mt-1 block text-[10px] text-muted">Nhập số không âm, tối đa 3 chữ số thập phân.</span></label>
            <label className="block"><span className="mb-1.5 block text-[11px] font-semibold text-rosewood">Giá nhập gần nhất</span><input required type="number" min="0" step="0.01" value={form.unitPrice} onChange={(event) => setForm({ ...form, unitPrice: event.target.value })} className={inputClass} placeholder="Ví dụ: 25000" /><span className="mt-1 block text-[10px] text-muted">Nhập số không âm, tối đa 2 chữ số thập phân.</span></label>
          </div>
          {formError && <p role="alert" className="rounded-xl border border-danger-line bg-danger-soft px-3 py-2 text-xs text-danger">{formError}</p>}
          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <Button variant="secondary" disabled={isSaving} onClick={() => setFormOpen(false)}>Hủy</Button>
            <Button type="submit" disabled={isSaving}>{isSaving ? 'Đang lưu...' : 'Lưu nguyên liệu'}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Xóa nguyên liệu?"
        description={deleteTarget
          ? `Xóa "${deleteTarget.name}". Nguyên liệu còn tồn kho hoặc đã được phiếu nhập tham chiếu không thể xóa; hãy ngừng hoạt động để giữ dữ liệu.`
          : ''}
        confirmLabel="Xóa nguyên liệu"
        onConfirm={() => void removeIngredient()}
        onClose={() => { if (pendingId === null) setDeleteTarget(null) }}
        busy={pendingId !== null}
      />
    </div>
  )
}
