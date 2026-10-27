import { useCallback, useEffect, useMemo, useState } from 'react'
import Button from '../../../components/Button.jsx'
import DataTable from '../../../components/DataTable.jsx'
import Icon from '../../../components/Icon.jsx'
import Modal from '../../../components/Modal.jsx'
import Pagination, { usePagination } from '../../../components/Pagination.jsx'
import StatusBadge from '../../../components/StatusBadge.jsx'
import { getIngredients } from '../../inventory/services/ingredientService.js'
import {
  cancelPurchaseOrder,
  createPurchaseOrder,
  getPurchaseOrders,
  receivePurchaseOrder,
} from '../services/purchaseOrderService.js'
import { getSuppliers } from '../../suppliers/services/supplierService.js'
import { getEmployees } from '../../orders/services/orderService.js'
import { getUserFacingErrorMessage } from '../../../services/apiClient.js'

const currency = new Intl.NumberFormat('vi-VN')
const quantityFormat = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 3 })
const emptyForm = { supplierId: '', employeeId: '', items: [] }
const emptyItems = []
const inputClass = 'h-10 w-full rounded-xl border border-border bg-white px-3 text-xs text-rosewood outline-none focus:border-caramel-hover'
const statusLabels = { PENDING: 'Chờ xử lý', RECEIVED: 'Đã nhận', CANCELLED: 'Đã hủy' }

function getErrorMessage(error) {
  return getUserFacingErrorMessage(error)
}

function getStatusLabel(status) {
  return statusLabels[status] ?? 'Đang cập nhật'
}

function formatDateTime(value) {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

async function loadPurchaseData(signal) {
  const [orders, suppliers, ingredients, employees] = await Promise.all([
    getPurchaseOrders({ signal }),
    getSuppliers({ signal }),
    getIngredients({ signal }),
    getEmployees({ signal }),
  ])
  if (![orders, suppliers, ingredients, employees].every(Array.isArray)) {
    throw new Error('Chưa thể tải dữ liệu phiếu nhập. Vui lòng thử lại.')
  }
  return { orders, suppliers, ingredients, employees }
}

export default function PurchaseOrdersPage({ onToast }) {
  const [orders, setOrders] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [ingredients, setIngredients] = useState([])
  const [employees, setEmployees] = useState([])
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('Tất cả trạng thái')
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [formError, setFormError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isWorkflowSaving, setIsWorkflowSaving] = useState(false)
  const [pendingAction, setPendingAction] = useState(null)
  const [detail, setDetail] = useState(null)
  const detailPagination = usePagination(detail?.items ?? emptyItems)

  const loadData = useCallback(async (signal) => {
    setIsLoading(true)
    setLoadError('')
    try {
      const data = await loadPurchaseData(signal)
      setOrders(data.orders)
      setSuppliers(data.suppliers)
      setIngredients(data.ingredients)
      setEmployees(data.employees)
    } catch (error) {
      if (error.name !== 'AbortError') setLoadError(getErrorMessage(error))
    } finally {
      if (!signal?.aborted) setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    void loadData(controller.signal)
    return () => controller.abort()
  }, [loadData])

  const activeSuppliers = suppliers.filter((supplier) => supplier.status !== false)
  const activeIngredients = ingredients.filter((ingredient) => ingredient.status !== false)
  const currentEmployee = employees.find(
    (employee) => employee.status === true && employee.currentUser === true,
  )

  const filteredOrders = useMemo(() => orders.filter((order) => {
    const matchesQuery = `${order.purchaseCode ?? ''} ${order.supplierName ?? ''} ${order.employeeId ?? ''}`
      .toLocaleLowerCase('vi')
      .includes(query.trim().toLocaleLowerCase('vi'))
    const status = getStatusLabel(order.status)
    return matchesQuery && (statusFilter === 'Tất cả trạng thái' || status === statusFilter)
  }), [orders, query, statusFilter])

  const openCreate = () => {
    setForm({
      ...emptyForm,
      supplierId: activeSuppliers[0]?.id == null ? '' : String(activeSuppliers[0].id),
      employeeId: currentEmployee ? String(currentEmployee.id) : '',
      items: activeIngredients.length ? [{ ingredientId: '', quantity: '', unitCost: '' }] : [],
    })
    setFormError('')
    setFormOpen(true)
  }

  const updateLine = (index, key, value) => {
    setForm((current) => ({
      ...current,
      items: current.items.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: value } : item),
    }))
  }

  const addLine = () => setForm((current) => ({
    ...current,
    items: [...current.items, { ingredientId: '', quantity: '', unitCost: '' }],
  }))

  const removeLine = (index) => setForm((current) => ({
    ...current,
    items: current.items.filter((_, itemIndex) => itemIndex !== index),
  }))

  const estimatedTotal = form.items.reduce((total, item) => {
    const quantity = Number(item.quantity)
    const unitCost = Number(item.unitCost)
    const lineTotal = Number.isFinite(quantity) && Number.isFinite(unitCost)
      ? Math.round((quantity * unitCost + Number.EPSILON) * 100) / 100
      : 0
    return total + lineTotal
  }, 0)

  const savePurchaseOrder = async (event) => {
    event.preventDefault()
    if (!form.supplierId || !/^[1-9]\d*$/.test(form.employeeId) || form.items.length === 0) {
      setFormError('Chọn nhà cung cấp, nhân viên lập phiếu và ít nhất một nguyên liệu.')
      return
    }
    const ingredientIds = form.items.map((item) => item.ingredientId)
    if (ingredientIds.some((id) => !id) || new Set(ingredientIds).size !== ingredientIds.length) {
      setFormError('Chọn một nguyên liệu khác nhau cho từng dòng phiếu.')
      return
    }
    const invalidLine = form.items.some((item) => {
      const quantity = Number(item.quantity)
      const unitCost = Number(item.unitCost)
      return !/^\d+(\.\d{1,3})?$/.test(item.quantity.trim())
        || !/^\d+(\.\d{1,2})?$/.test(item.unitCost.trim())
        || !Number.isFinite(quantity) || quantity <= 0
        || !Number.isFinite(unitCost) || unitCost < 0
    })
    if (invalidLine) {
      setFormError('Số lượng phải lớn hơn 0 (tối đa 3 chữ số thập phân); đơn giá không âm (tối đa 2 chữ số thập phân).')
      return
    }

    setIsSaving(true)
    setFormError('')
    try {
      await createPurchaseOrder({
        supplierId: Number(form.supplierId),
        employeeId: Number(form.employeeId),
        items: form.items.map((item) => ({
          ingredientId: Number(item.ingredientId),
          quantity: Number(item.quantity),
          unitCost: Number(item.unitCost),
        })),
      })
      setFormOpen(false)
      setForm({ ...emptyForm })
      onToast('Đã tạo phiếu nhập hàng.')
      await loadData()
    } catch (error) {
      setFormError(getErrorMessage(error))
    } finally {
      setIsSaving(false)
    }
  }

  const runWorkflow = async () => {
    if (!pendingAction || isWorkflowSaving) return
    const { order, action } = pendingAction
    setIsWorkflowSaving(true)
    try {
      if (action === 'receive') await receivePurchaseOrder(order.id)
      else await cancelPurchaseOrder(order.id)
      onToast(action === 'receive' ? 'Đã nhận phiếu; tồn kho đã được cập nhật.' : 'Đã hủy phiếu nhập.')
      setPendingAction(null)
      await loadData()
      if (detail?.id === order.id) {
        const refreshed = await getPurchaseOrders()
        if (Array.isArray(refreshed)) setDetail(refreshed.find((candidate) => candidate.id === order.id) ?? null)
      }
    } catch (error) {
      setLoadError(`Không thể ${action === 'receive' ? 'nhận' : 'hủy'} phiếu: ${getErrorMessage(error)}`)
      setPendingAction(null)
    } finally {
      setIsWorkflowSaving(false)
    }
  }

  const employeeName = (id) => `Nhân viên #${id ?? '—'}`

  const columns = [
    { key: 'purchaseCode', label: 'Mã phiếu', render: (order) => <span className="font-bold text-rosewood">{order.purchaseCode}</span> },
    { key: 'supplierName', label: 'Nhà cung cấp', render: (order) => order.supplierName || '—' },
    { key: 'employeeId', label: 'Nhân viên', render: (order) => employeeName(order.employeeId) },
    { key: 'orderDate', label: 'Ngày lập', render: (order) => <span className="whitespace-nowrap">{formatDateTime(order.orderDate)}</span> },
    { key: 'items', label: 'Mặt hàng', render: (order) => `${order.items?.length ?? 0} nguyên liệu` },
    { key: 'totalAmount', label: 'Tổng tiền', render: (order) => <span className="whitespace-nowrap font-bold text-rosewood">{currency.format(Number(order.totalAmount ?? 0))}đ</span> },
    { key: 'status', label: 'Trạng thái', render: (order) => <StatusBadge status={getStatusLabel(order.status)} /> },
    {
      key: 'actions',
      label: 'Thao tác',
      headerClassName: 'text-right',
      cellClassName: 'text-right',
      render: (order) => (
        <div className="inline-flex items-center gap-1">
          <button type="button" onClick={() => setDetail(order)} className="rounded-lg px-2 py-1.5 text-[10px] font-semibold text-rosewood transition hover:bg-petal">Chi tiết</button>
          {order.status === 'PENDING' && (
            <>
              <button type="button" onClick={() => setPendingAction({ order, action: 'receive' })} className="rounded-lg px-2 py-1.5 text-[10px] font-semibold text-success transition hover:bg-success-soft">Nhận</button>
              <button type="button" onClick={() => setPendingAction({ order, action: 'cancel' })} className="rounded-lg px-2 py-1.5 text-[10px] font-semibold text-danger transition hover:bg-danger-soft">Hủy</button>
            </>
          )}
        </div>
      ),
    },
  ]

  const pendingCount = orders.filter((order) => order.status === 'PENDING').length
  const receivedCount = orders.filter((order) => order.status === 'RECEIVED').length
  const totalValue = orders.reduce((total, order) => total + Number(order.totalAmount ?? 0), 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-[11px] font-semibold tracking-wide text-muted">Nhập hàng & cập nhật kho</p>
          <h2 className="font-display mt-1 text-[28px] text-rosewood sm:text-[32px]">Phiếu nhập hàng</h2>
        </div>
        <Button onClick={openCreate} disabled={!activeSuppliers.length || !activeIngredients.length}>
          <Icon name="plus" size={16} /> Tạo phiếu nhập
        </Button>
      </div>

      {loadError && <div role="alert" className="flex flex-col gap-3 rounded-xl border border-danger-line bg-danger-soft px-4 py-3 text-xs text-danger sm:flex-row sm:items-center sm:justify-between"><span>{loadError}</span><Button size="sm" variant="secondary" onClick={() => void loadData()}>Tải lại</Button></div>}
      {!isLoading && !loadError && (!activeSuppliers.length || !activeIngredients.length) && (
        <p role="status" className="rounded-xl border border-warning-line bg-warning-soft px-4 py-3 text-xs text-rosewood">
          Muốn tạo phiếu cần có nhà cung cấp và nguyên liệu đang hoạt động.
        </p>
      )}

      {isLoading ? (
        <section role="status" className="soft-shadow rounded-2xl border border-border bg-paper px-5 py-16 text-center text-sm text-muted">Đang tải phiếu nhập và dữ liệu liên quan...</section>
      ) : (
        <>
          <section aria-label="Tổng quan phiếu nhập" className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-3">
            {[
              { label: 'Chờ xử lý', value: pendingCount, icon: 'clock' },
              { label: 'Đã nhận hàng', value: receivedCount, icon: 'check' },
              { label: 'Tổng giá trị phiếu', value: `${currency.format(totalValue)}đ`, icon: 'creditCard' },
            ].map((stat) => (
              <article key={stat.label} className="soft-shadow flex items-center justify-between rounded-2xl border border-border bg-paper p-4 sm:p-5">
                <div className="min-w-0"><p className="text-[11px] font-semibold text-muted">{stat.label}</p><p className="font-display mt-2 truncate text-xl font-semibold text-rosewood sm:text-2xl">{stat.value}</p></div>
                <span className="ml-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-caramel-soft text-rosewood"><Icon name={stat.icon} size={18} /></span>
              </article>
            ))}
          </section>

          <section className="soft-shadow overflow-hidden rounded-2xl border border-border bg-paper">
            <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
              <div><h3 className="font-display text-lg font-semibold text-rosewood">Danh sách phiếu</h3><p className="mt-1 text-[11px] text-muted">{filteredOrders.length} phiếu phù hợp</p></div>
              <div className="grid gap-2 sm:grid-cols-[minmax(220px,1fr)_190px]">
                <label className="relative"><span className="sr-only">Tìm phiếu nhập</span><Icon name="search" size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-rosewood" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Mã phiếu hoặc nhà cung cấp..." className="h-10 w-full rounded-xl border border-border bg-white pl-9 pr-3 text-[11px] text-rosewood outline-none focus:border-caramel-hover" /></label>
                <select aria-label="Lọc trạng thái phiếu nhập" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-10 rounded-xl border border-border bg-white px-3 text-[11px] text-rosewood outline-none focus:border-caramel-hover"><option>Tất cả trạng thái</option><option>Chờ xử lý</option><option>Đã nhận</option><option>Đã hủy</option></select>
              </div>
            </div>
            <DataTable columns={columns} rows={filteredOrders} rowKey={(order) => order.id} emptyTitle={orders.length ? 'Không tìm thấy phiếu nhập' : 'Chưa có phiếu nhập'} emptyDescription={orders.length ? 'Thử từ khóa hoặc trạng thái khác.' : 'Tạo phiếu nhập để ghi nhận đơn hàng với nhà cung cấp.'} />
          </section>
        </>
      )}

      <Modal open={formOpen} title="Tạo phiếu nhập hàng" onClose={() => { if (!isSaving) setFormOpen(false) }} size="max-w-3xl">
        <form className="space-y-5" onSubmit={savePurchaseOrder}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="block"><span className="mb-1.5 block text-[11px] font-semibold text-rosewood">Nhà cung cấp</span><select required value={form.supplierId} onChange={(event) => setForm({ ...form, supplierId: event.target.value })} className={inputClass}><option value="">Chọn nhà cung cấp có sẵn</option>{activeSuppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.supplierCode} · {supplier.name}</option>)}</select></label>
            <label className="block"><span className="mb-1.5 block text-[11px] font-semibold text-rosewood">Người lập phiếu (tài khoản đang đăng nhập)</span><input type="text" readOnly disabled={!currentEmployee} value={currentEmployee?.fullName ?? ''} className={inputClass} placeholder="Tài khoản chưa có hồ sơ nhân viên" /></label>
          </div>
          {!currentEmployee && <p role="alert" className="text-xs text-danger">Tài khoản chưa được liên kết với hồ sơ nhân viên đang hoạt động. Vui lòng nhờ quản trị viên liên kết trước khi tạo phiếu.</p>}
          <div className="space-y-3">
            <div className="flex items-center justify-between"><h3 className="font-display font-semibold text-rosewood">Nguyên liệu nhập</h3><Button size="sm" variant="secondary" onClick={addLine} disabled={form.items.length >= activeIngredients.length}><Icon name="plus" size={14} /> Thêm dòng</Button></div>
            {form.items.map((item, index) => {
              const selectedIds = form.items.filter((_, lineIndex) => lineIndex !== index).map((line) => line.ingredientId)
              const ingredient = activeIngredients.find((entry) => String(entry.id) === item.ingredientId)
              return (
                <div key={`purchase-line-${index}`} className="grid grid-cols-1 items-end gap-2 rounded-xl border border-border bg-cream/60 p-3 sm:grid-cols-[minmax(180px,2fr)_1fr_1fr_auto]">
                  <label className="block"><span className="mb-1 block text-[10px] font-semibold text-muted">Nguyên liệu</span><select required value={item.ingredientId} onChange={(event) => {
                    const selectedIngredient = activeIngredients.find((entry) => String(entry.id) === event.target.value)
                    setForm((current) => ({ ...current, items: current.items.map((line, lineIndex) => lineIndex === index ? { ...line, ingredientId: event.target.value, unitCost: line.unitCost || String(selectedIngredient?.unitPrice ?? '') } : line) }))
                  }} className={inputClass}><option value="">Chọn nguyên liệu có sẵn</option>{activeIngredients.filter((entry) => !selectedIds.includes(String(entry.id))).map((entry) => <option key={entry.id} value={entry.id}>{entry.ingredientCode} · {entry.name}</option>)}</select></label>
                  <label className="block"><span className="mb-1 block text-[10px] font-semibold text-muted">Số lượng{ingredient ? ` (${ingredient.unit})` : ''}</span><input required type="number" min="0.001" step="0.001" value={item.quantity} onChange={(event) => updateLine(index, 'quantity', event.target.value)} className={inputClass} placeholder="Ví dụ: 10" /></label>
                  <label className="block"><span className="mb-1 block text-[10px] font-semibold text-muted">Đơn giá nhập</span><input required type="number" min="0" step="0.01" value={item.unitCost} onChange={(event) => updateLine(index, 'unitCost', event.target.value)} className={inputClass} placeholder="Ví dụ: 25000" /></label>
                  <Button aria-label="Xóa dòng nguyên liệu" variant="subtle" className="h-10 px-3 text-danger" disabled={form.items.length <= 1} onClick={() => removeLine(index)}><Icon name="trash" size={15} /></Button>
                </div>
              )
            })}
          </div>
          <div className="flex items-center justify-between rounded-xl border border-border bg-petal px-4 py-3"><span className="text-xs font-semibold text-rosewood">Tạm tính</span><strong className="text-sm text-rosewood">{currency.format(estimatedTotal)}đ</strong></div>
          {formError && <p role="alert" className="rounded-xl border border-danger-line bg-danger-soft px-3 py-2 text-xs text-danger">{formError}</p>}
          <div className="flex justify-end gap-2 border-t border-border pt-4"><Button variant="secondary" disabled={isSaving} onClick={() => setFormOpen(false)}>Hủy</Button><Button type="submit" disabled={isSaving || !currentEmployee}>{isSaving ? 'Đang tạo...' : 'Tạo phiếu nhập'}</Button></div>
        </form>
      </Modal>

      <Modal open={Boolean(detail)} title={`Chi tiết phiếu ${detail?.purchaseCode ?? ''}`} onClose={() => setDetail(null)} size="max-w-2xl">
        {detail && (
          <div className="space-y-4">
            <dl className="grid grid-cols-1 gap-3 rounded-xl border border-border bg-cream/60 p-4 text-xs sm:grid-cols-2">
              <div><dt className="text-muted">Nhà cung cấp</dt><dd className="mt-1 font-semibold text-rosewood">{detail.supplierName || '—'}</dd></div>
              <div><dt className="text-muted">Nhân viên</dt><dd className="mt-1 font-semibold text-rosewood">{employeeName(detail.employeeId)}</dd></div>
              <div><dt className="text-muted">Ngày lập</dt><dd className="mt-1 font-semibold text-rosewood">{formatDateTime(detail.orderDate)}</dd></div>
              <div><dt className="text-muted">Trạng thái</dt><dd className="mt-1"><StatusBadge status={getStatusLabel(detail.status)} /></dd></div>
            </dl>
            <div className="overflow-x-auto rounded-xl border border-border"><table className="w-full min-w-[520px] text-left text-xs"><thead className="bg-petal text-rosewood"><tr><th className="px-3 py-2.5">Nguyên liệu</th><th className="px-3 py-2.5 text-right">Số lượng</th><th className="px-3 py-2.5 text-right">Đơn giá</th><th className="px-3 py-2.5 text-right">Thành tiền</th></tr></thead><tbody>{detailPagination.pageItems.map((item, index) => <tr key={`${item.ingredientId}-${index}`} className="border-t border-border"><td className="px-3 py-2.5 font-semibold text-rosewood">{item.ingredientName}</td><td className="px-3 py-2.5 text-right">{quantityFormat.format(Number(item.quantity))}</td><td className="px-3 py-2.5 text-right">{currency.format(Number(item.unitCost))}đ</td><td className="px-3 py-2.5 text-right font-semibold">{currency.format(Number(item.lineTotal))}đ</td></tr>)}</tbody></table></div>
            <Pagination currentPage={detailPagination.currentPage} pageSize={detailPagination.pageSize} totalItems={detailPagination.totalItems} onPageChange={detailPagination.setCurrentPage} onPageSizeChange={detailPagination.setPageSize} />
            <div className="flex justify-end border-t border-border pt-3 text-sm"><span className="mr-4 text-muted">Tổng tiền</span><strong className="text-rosewood">{currency.format(Number(detail.totalAmount ?? 0))}đ</strong></div>
          </div>
        )}
      </Modal>

      <Modal open={Boolean(pendingAction)} title={pendingAction?.action === 'receive' ? 'Xác nhận nhận hàng?' : 'Xác nhận hủy phiếu?'} onClose={() => { if (!isWorkflowSaving) setPendingAction(null) }} size="max-w-md">
        {pendingAction && <><p className="text-sm leading-6 text-rosewood">{pendingAction.action === 'receive' ? <>Nhận phiếu <strong>{pendingAction.order.purchaseCode}</strong>. Tồn kho sẽ được cập nhật theo các nguyên liệu trong phiếu.</> : <>Hủy phiếu <strong>{pendingAction.order.purchaseCode}</strong>. Phiếu phải đang chờ xử lý; tồn kho sẽ không thay đổi.</>}</p><div className="mt-5 flex justify-end gap-2"><Button variant="secondary" disabled={isWorkflowSaving} onClick={() => setPendingAction(null)}>Quay lại</Button><Button variant={pendingAction.action === 'receive' ? 'primary' : 'danger'} disabled={isWorkflowSaving} onClick={() => void runWorkflow()}>{isWorkflowSaving ? 'Đang xử lý...' : pendingAction.action === 'receive' ? 'Xác nhận nhận hàng' : 'Xác nhận hủy'}</Button></div></>}
      </Modal>
    </div>
  )
}
