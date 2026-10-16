import { useCallback, useEffect, useMemo, useState } from 'react'
import Button from '../../../components/Button.jsx'
import DataTable from '../../../components/DataTable.jsx'
import Icon from '../../../components/Icon.jsx'
import Modal from '../../../components/Modal.jsx'
import StatusBadge from '../../../components/StatusBadge.jsx'
import { createSupplier, getSuppliers, updateSupplier } from '../services/supplierService.js'

const emptyForm = { supplierCode: '', name: '', phone: '', email: '', address: '', status: true }
const inputClass = 'h-10 w-full rounded-xl border border-border bg-white px-3 text-xs text-rosewood outline-none focus:border-caramel-hover'

function getErrorMessage(error) {
  return error instanceof Error ? error.message : 'Đã xảy ra lỗi không xác định.'
}

function supplierPayload(supplier) {
  return {
    supplierCode: supplier.supplierCode.trim(),
    name: supplier.name.trim(),
    phone: (supplier.phone ?? '').trim() || null,
    email: (supplier.email ?? '').trim() || null,
    address: (supplier.address ?? '').trim() || null,
    status: supplier.status !== false,
  }
}

export default function SuppliersPage({ onToast }) {
  const [items, setItems] = useState([])
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('Tất cả trạng thái')
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [detail, setDetail] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [formError, setFormError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [pendingId, setPendingId] = useState(null)

  const loadSuppliers = useCallback(async (signal) => {
    setIsLoading(true)
    setLoadError('')
    try {
      const result = await getSuppliers({ signal })
      if (!Array.isArray(result)) throw new Error('API trả về danh sách nhà cung cấp không hợp lệ.')
      setItems(result)
    } catch (error) {
      if (error.name !== 'AbortError') setLoadError(getErrorMessage(error))
    } finally {
      if (!signal?.aborted) setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    void loadSuppliers(controller.signal)
    return () => controller.abort()
  }, [loadSuppliers])

  const filteredItems = useMemo(() => items.filter((item) => {
    const matchesQuery = `${item.supplierCode ?? ''} ${item.name ?? ''} ${item.phone ?? ''} ${item.email ?? ''}`
      .toLocaleLowerCase('vi')
      .includes(query.trim().toLocaleLowerCase('vi'))
    const status = item.status === false ? 'Ngừng hoạt động' : 'Đang hoạt động'
    return matchesQuery && (statusFilter === 'Tất cả trạng thái' || status === statusFilter)
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
      supplierCode: item.supplierCode ?? '',
      name: item.name ?? '',
      phone: item.phone ?? '',
      email: item.email ?? '',
      address: item.address ?? '',
      status: item.status !== false,
    })
    setFormError('')
    setFormOpen(true)
  }

  const saveSupplier = async (event) => {
    event.preventDefault()
    if (!form.supplierCode.trim() || !form.name.trim()) {
      setFormError('Mã và tên nhà cung cấp là bắt buộc.')
      return
    }
    if (form.phone.trim() && !/^[0-9+() -]{8,15}$/.test(form.phone.trim())) {
      setFormError('Số điện thoại không hợp lệ.')
      return
    }
    if (form.email.trim() && !/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(form.email.trim())) {
      setFormError('Email không hợp lệ.')
      return
    }

    setIsSaving(true)
    setFormError('')
    try {
      const payload = supplierPayload(form)
      if (editing) await updateSupplier(editing.id, payload)
      else await createSupplier(payload)
      setFormOpen(false)
      setEditing(null)
      onToast(editing ? 'Đã cập nhật nhà cung cấp trên máy chủ.' : 'Đã tạo nhà cung cấp trên máy chủ.')
      await loadSuppliers()
    } catch (error) {
      setFormError(getErrorMessage(error))
    } finally {
      setIsSaving(false)
    }
  }

  const toggleStatus = async (item) => {
    setPendingId(item.id)
    setLoadError('')
    try {
      await updateSupplier(item.id, supplierPayload({ ...item, status: item.status === false }))
      onToast(`Đã cập nhật trạng thái "${item.name}".`)
      await loadSuppliers()
    } catch (error) {
      setLoadError(`Không thể cập nhật nhà cung cấp: ${getErrorMessage(error)}`)
    } finally {
      setPendingId(null)
    }
  }

  const columns = [
    {
      key: 'supplierCode',
      label: 'Nhà cung cấp',
      render: (item) => (
        <div className="min-w-[175px]">
          <p className="font-bold text-rosewood">{item.name}</p>
          <p className="mt-1 text-[10px] text-muted">{item.supplierCode}</p>
        </div>
      ),
    },
    { key: 'phone', label: 'Điện thoại', render: (item) => item.phone || '—' },
    { key: 'email', label: 'Email', render: (item) => <span className="break-all">{item.email || '—'}</span> },
    { key: 'status', label: 'Trạng thái', render: (item) => <StatusBadge status={item.status === false ? 'Ngừng hoạt động' : 'Đang hoạt động'} /> },
    {
      key: 'actions',
      label: 'Thao tác',
      headerClassName: 'text-right',
      cellClassName: 'text-right',
      render: (item) => (
        <div className="inline-flex items-center gap-1">
          <button type="button" onClick={() => setDetail(item)} aria-label={`Xem ${item.name}`} className="rounded-lg px-2 py-1.5 text-[10px] font-semibold text-rosewood transition hover:bg-petal">Chi tiết</button>
          <button type="button" disabled={pendingId === item.id} onClick={() => openEdit(item)} aria-label={`Sửa ${item.name}`} className="flex h-8 w-8 items-center justify-center rounded-lg text-rosewood transition hover:bg-petal disabled:opacity-50"><Icon name="edit" size={14} /></button>
          <button type="button" disabled={pendingId === item.id} onClick={() => toggleStatus(item)} className="rounded-lg px-2 py-1.5 text-[10px] font-semibold text-rosewood transition hover:bg-petal disabled:opacity-50">
            {item.status === false ? 'Kích hoạt' : 'Ngừng'}
          </button>
        </div>
      ),
    },
  ]

  const activeCount = items.filter((item) => item.status !== false).length

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-[11px] font-semibold tracking-wide text-muted">Đối tác cung ứng</p>
          <h2 className="font-display mt-1 text-[28px] text-rosewood sm:text-[32px]">Nhà cung cấp</h2>
          <p className="mt-1 text-xs text-muted">Quản lý thông tin liên hệ và trạng thái nhà cung cấp.</p>
        </div>
        <Button onClick={openCreate}><Icon name="plus" size={16} /> Thêm nhà cung cấp</Button>
      </div>

      {loadError && <div role="alert" className="flex flex-col gap-3 rounded-xl border border-danger-line bg-danger-soft px-4 py-3 text-xs text-danger sm:flex-row sm:items-center sm:justify-between"><span>{loadError}</span><Button size="sm" variant="secondary" onClick={() => void loadSuppliers()}>Tải lại</Button></div>}

      {isLoading ? (
        <section role="status" className="soft-shadow rounded-2xl border border-border bg-paper px-5 py-16 text-center text-sm text-muted">Đang tải nhà cung cấp...</section>
      ) : (
        <>
          <section className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-3" aria-label="Tổng quan nhà cung cấp">
            {[
              { label: 'Tổng nhà cung cấp', value: items.length, icon: 'package' },
              { label: 'Đang hoạt động', value: activeCount, icon: 'check' },
              { label: 'Ngừng hoạt động', value: items.length - activeCount, icon: 'receipt' },
            ].map((stat) => (
              <article key={stat.label} className="soft-shadow flex items-center justify-between rounded-2xl border border-border bg-paper p-4 sm:p-5">
                <div><p className="text-[11px] font-semibold text-muted">{stat.label}</p><p className="font-display mt-2 text-2xl font-semibold text-rosewood">{stat.value}</p></div>
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-caramel-soft text-rosewood"><Icon name={stat.icon} size={18} /></span>
              </article>
            ))}
          </section>

          <section className="soft-shadow overflow-hidden rounded-2xl border border-border bg-paper">
            <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
              <div><h3 className="font-display text-lg font-semibold text-rosewood">Danh sách nhà cung cấp</h3><p className="mt-1 text-[11px] text-muted">{filteredItems.length} nhà cung cấp phù hợp</p></div>
              <div className="grid gap-2 sm:grid-cols-[minmax(220px,1fr)_190px]">
                <label className="relative"><span className="sr-only">Tìm nhà cung cấp</span><Icon name="search" size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-rosewood" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tên, mã hoặc liên hệ..." className="h-10 w-full rounded-xl border border-border bg-white pl-9 pr-3 text-[11px] text-rosewood outline-none focus:border-caramel-hover" /></label>
                <select aria-label="Lọc trạng thái nhà cung cấp" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-10 rounded-xl border border-border bg-white px-3 text-[11px] text-rosewood outline-none focus:border-caramel-hover"><option>Tất cả trạng thái</option><option>Đang hoạt động</option><option>Ngừng hoạt động</option></select>
              </div>
            </div>
            <DataTable columns={columns} rows={filteredItems} rowKey={(item) => item.id} emptyTitle={items.length ? 'Không tìm thấy nhà cung cấp' : 'Chưa có nhà cung cấp'} emptyDescription={items.length ? 'Thử từ khóa hoặc trạng thái khác.' : 'Tạo nhà cung cấp để bắt đầu quản lý đối tác.'} />
          </section>
        </>
      )}

      <Modal open={formOpen} title={editing ? 'Cập nhật nhà cung cấp' : 'Thêm nhà cung cấp'} onClose={() => { if (!isSaving) setFormOpen(false) }}>
        <form className="space-y-4" onSubmit={saveSupplier}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="block"><span className="mb-1.5 block text-[11px] font-semibold text-rosewood">Mã nhà cung cấp</span><input required maxLength={30} value={form.supplierCode} onChange={(event) => setForm({ ...form, supplierCode: event.target.value })} className={inputClass} /></label>
            <label className="block"><span className="mb-1.5 block text-[11px] font-semibold text-rosewood">Tên nhà cung cấp</span><input required maxLength={150} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className={inputClass} /></label>
            <label className="block"><span className="mb-1.5 block text-[11px] font-semibold text-rosewood">Số điện thoại</span><input maxLength={15} value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} className={inputClass} /></label>
            <label className="block"><span className="mb-1.5 block text-[11px] font-semibold text-rosewood">Email</span><input type="email" maxLength={100} value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className={inputClass} /></label>
            <label className="block sm:col-span-2"><span className="mb-1.5 block text-[11px] font-semibold text-rosewood">Địa chỉ</span><input maxLength={255} value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} className={inputClass} /></label>
          </div>
          {formError && <p role="alert" className="rounded-xl border border-danger-line bg-danger-soft px-3 py-2 text-xs text-danger">{formError}</p>}
          <div className="flex justify-end gap-2 border-t border-border pt-4"><Button variant="secondary" disabled={isSaving} onClick={() => setFormOpen(false)}>Hủy</Button><Button type="submit" disabled={isSaving}>{isSaving ? 'Đang lưu...' : 'Lưu nhà cung cấp'}</Button></div>
        </form>
      </Modal>

      <Modal open={Boolean(detail)} title="Thông tin nhà cung cấp" onClose={() => setDetail(null)} size="max-w-md">
        {detail && <dl className="grid grid-cols-[120px_1fr] gap-x-4 gap-y-3 text-xs"><dt className="text-muted">Mã</dt><dd className="font-semibold text-rosewood">{detail.supplierCode}</dd><dt className="text-muted">Tên</dt><dd className="font-semibold text-rosewood">{detail.name}</dd><dt className="text-muted">Điện thoại</dt><dd className="text-rosewood">{detail.phone || '—'}</dd><dt className="text-muted">Email</dt><dd className="break-all text-rosewood">{detail.email || '—'}</dd><dt className="text-muted">Địa chỉ</dt><dd className="text-rosewood">{detail.address || '—'}</dd><dt className="text-muted">Trạng thái</dt><dd><StatusBadge status={detail.status === false ? 'Ngừng hoạt động' : 'Đang hoạt động'} /></dd></dl>}
      </Modal>
    </div>
  )
}
