import { useEffect, useMemo, useState } from 'react'
import Button from '../../../components/Button.jsx'
import ConfirmDialog from '../../../components/ConfirmDialog.jsx'
import DataTable from '../../../components/DataTable.jsx'
import ErrorState from '../../../components/ErrorState.jsx'
import FormField from '../../../components/FormField.jsx'
import Icon from '../../../components/Icon.jsx'
import LoadingState from '../../../components/LoadingState.jsx'
import Modal from '../../../components/Modal.jsx'
import PageHeader from '../../../components/PageHeader.jsx'
import SearchFilter from '../../../components/SearchFilter.jsx'
import StatusBadge from '../../../components/StatusBadge.jsx'
import { getCustomers } from '../../customers/services/customerService.js'
import {
  createCustomOrder,
  deleteCustomOrder,
  getCustomOrderById,
  getCustomOrders,
  getEmployees,
  updateCustomOrder,
  updateCustomOrderStatus,
} from '../services/customOrderService.js'

const inputClass = 'h-10 w-full rounded-xl border border-border bg-white px-3 text-sm text-rosewood outline-none transition placeholder:text-muted/70 focus:border-caramel'
const moneyFormat = new Intl.NumberFormat('vi-VN')

const statusLabels = {
  PENDING: 'Chờ xác nhận',
  CONFIRMED: 'Đã nhận',
  IN_PROGRESS: 'Đang chuẩn bị',
  COMPLETED: 'Hoàn tất',
  CANCELLED: 'Đã hủy',
}

const nextStatuses = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['COMPLETED'],
}

const emptyForm = {
  customerId: '',
  employeeId: '',
  cakeName: '',
  requestDescription: '',
  deliveryDate: '',
  estimatedPrice: '',
  deposit: '',
}

function getErrorMessage(error) {
  return error instanceof Error ? error.message : 'Đã xảy ra lỗi không xác định.'
}

function formatMoney(value) {
  return value == null ? '—' : `${moneyFormat.format(Number(value))} ₫`
}

function formatDateTime(value) {
  if (!value) return '—'
  const date = new Date(`${value}Z`)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

function toLocalDateTimeInput(value) {
  if (!value) return ''
  const date = new Date(`${value}Z`)
  if (Number.isNaN(date.getTime())) return ''
  const pad = (part) => String(part).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function toUtcLocalDateTime(value) {
  return new Date(value).toISOString().slice(0, 19)
}

function validateForm(form) {
  if (!form.customerId) return 'Vui lòng chọn khách hàng đang hoạt động.'
  if (!form.employeeId) return 'Vui lòng chọn nhân viên đang hoạt động tiếp nhận đơn.'
  if (!form.cakeName.trim()) return 'Vui lòng nhập tên bánh theo yêu cầu.'
  if (form.cakeName.trim().length > 150) return 'Tên bánh không được vượt quá 150 ký tự.'
  if (form.requestDescription.trim()
    && new TextEncoder().encode(form.requestDescription).length > 65535) {
    return 'Mô tả yêu cầu vượt quá giới hạn lưu trữ.'
  }
  if (!form.deliveryDate) return 'Vui lòng chọn thời điểm giao bánh.'
  if (new Date(form.deliveryDate).getTime() <= Date.now()) {
    return 'Thời điểm giao bánh phải ở trong tương lai.'
  }
  if (!/^\d{1,13}(\.\d{1,2})?$/.test(form.estimatedPrice)
    || Number(form.estimatedPrice) <= 0) {
    return 'Giá dự kiến phải lớn hơn 0 và có tối đa 2 chữ số thập phân.'
  }
  if (!/^\d{1,13}(\.\d{1,2})?$/.test(form.deposit)
    || Number(form.deposit) < 0) {
    return 'Tiền cọc phải không âm và có tối đa 2 chữ số thập phân.'
  }
  if (Number(form.deposit) > Number(form.estimatedPrice)) {
    return 'Tiền cọc không được lớn hơn giá dự kiến.'
  }
  return ''
}

function toRequest(form) {
  return {
    customerId: Number(form.customerId),
    employeeId: Number(form.employeeId),
    cakeName: form.cakeName.trim(),
    requestDescription: form.requestDescription.trim() || null,
    deliveryDate: toUtcLocalDateTime(form.deliveryDate),
    estimatedPrice: Number(form.estimatedPrice),
    deposit: Number(form.deposit),
  }
}

function statusLabel(status) {
  return statusLabels[status] ?? 'Không xác định'
}

function customerLabel(customer) {
  return `${customer.fullName || `Khách hàng #${customer.id}`}${customer.phone ? ` — ${customer.phone}` : ''}`
}

function employeeLabel(employee) {
  return `${employee.fullName || `Nhân viên #${employee.id}`}${employee.phone ? ` — ${employee.phone}` : ''}`
}

export default function CustomOrdersPage({ onToast }) {
  const [orders, setOrders] = useState([])
  const [customers, setCustomers] = useState([])
  const [employees, setEmployees] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [reloadVersion, setReloadVersion] = useState(0)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [formOpen, setFormOpen] = useState(false)
  const [editingOrder, setEditingOrder] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [formError, setFormError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [orderToDelete, setOrderToDelete] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [statusChange, setStatusChange] = useState(null)
  const [statusTarget, setStatusTarget] = useState('')
  const [statusError, setStatusError] = useState('')
  const [isChangingStatus, setIsChangingStatus] = useState(false)
  const [listError, setListError] = useState('')
  const [detailId, setDetailId] = useState(null)
  const [detailOrder, setDetailOrder] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState('')
  const [detailReloadVersion, setDetailReloadVersion] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    async function loadData() {
      setIsLoading(true)
      setLoadError('')
      try {
        const [loadedOrders, loadedCustomers, loadedEmployees] = await Promise.all([
          getCustomOrders({ signal: controller.signal }),
          getCustomers({ signal: controller.signal }),
          getEmployees({ signal: controller.signal }),
        ])
        if (!Array.isArray(loadedOrders)
          || !Array.isArray(loadedCustomers)
          || !Array.isArray(loadedEmployees)) {
          throw new Error('API không trả về danh sách đơn, khách hàng hoặc nhân viên hợp lệ.')
        }
        setOrders(loadedOrders)
        setCustomers(loadedCustomers)
        setEmployees(loadedEmployees)
      } catch (error) {
        if (error.name !== 'AbortError') setLoadError(getErrorMessage(error))
      } finally {
        if (!controller.signal.aborted) setIsLoading(false)
      }
    }

    void loadData()
    return () => controller.abort()
  }, [reloadVersion])

  useEffect(() => {
    if (detailId === null) return undefined

    const controller = new AbortController()
    setDetailOrder(null)
    setDetailError('')
    setDetailLoading(true)
    getCustomOrderById(detailId, { signal: controller.signal })
      .then(setDetailOrder)
      .catch((error) => {
        if (error.name !== 'AbortError') setDetailError(getErrorMessage(error))
      })
      .finally(() => {
        if (!controller.signal.aborted) setDetailLoading(false)
      })
    return () => controller.abort()
  }, [detailId, detailReloadVersion])

  const customerById = useMemo(
    () => new Map(customers.map((customer) => [Number(customer.id), customer])),
    [customers],
  )
  const employeeById = useMemo(
    () => new Map(employees.map((employee) => [Number(employee.id), employee])),
    [employees],
  )
  const activeCustomers = useMemo(
    () => customers.filter((customer) => customer.status === true),
    [customers],
  )
  const activeEmployees = useMemo(
    () => employees.filter((employee) => employee.status === true),
    [employees],
  )
  const filteredOrders = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('vi')
    return orders.filter((order) => {
      const customer = customerById.get(Number(order.customerId))
      const employee = employeeById.get(Number(order.employeeId))
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter
      const text = [
        order.id,
        order.cakeName,
        order.requestDescription,
        customer?.fullName,
        customer?.phone,
        employee?.fullName,
        statusLabel(order.status),
      ].filter(Boolean).join(' ').toLocaleLowerCase('vi')
      return matchesStatus && (!normalizedQuery || text.includes(normalizedQuery))
    })
  }, [orders, customerById, employeeById, query, statusFilter])

  const refreshData = () => setReloadVersion((version) => version + 1)

  const openCreateForm = () => {
    setEditingOrder(null)
    setForm({ ...emptyForm })
    setFormError('')
    setFormOpen(true)
  }

  const openEditForm = (order) => {
    setEditingOrder(order)
    setForm({
      customerId: String(order.customerId ?? ''),
      employeeId: String(order.employeeId ?? ''),
      cakeName: order.cakeName ?? '',
      requestDescription: order.requestDescription ?? '',
      deliveryDate: toLocalDateTimeInput(order.deliveryDate),
      estimatedPrice: String(order.estimatedPrice ?? ''),
      deposit: String(order.deposit ?? ''),
    })
    setFormError('')
    setFormOpen(true)
  }

  const closeForm = () => {
    if (isSaving) return
    setFormOpen(false)
    setEditingOrder(null)
    setFormError('')
  }

  const saveOrder = async (event) => {
    event.preventDefault()
    const validationError = validateForm(form)
    if (validationError) {
      setFormError(validationError)
      return
    }

    setIsSaving(true)
    setFormError('')
    try {
      const request = toRequest(form)
      if (editingOrder) {
        await updateCustomOrder(editingOrder.id, request)
        onToast('Đã cập nhật đơn đặt bánh riêng.')
      } else {
        await createCustomOrder(request)
        onToast('Đã tạo đơn đặt bánh riêng ở trạng thái chờ xác nhận.')
      }
      setFormOpen(false)
      setEditingOrder(null)
      setFormError('')
      refreshData()
      if (detailId !== null) setDetailReloadVersion((version) => version + 1)
    } catch (error) {
      setFormError(getErrorMessage(error))
    } finally {
      setIsSaving(false)
    }
  }

  const confirmDelete = async () => {
    if (!orderToDelete) return

    setDeletingId(orderToDelete.id)
    setListError('')
    try {
      await deleteCustomOrder(orderToDelete.id)
      onToast('Đã xóa đơn đặt bánh đang chờ xác nhận.')
      setOrderToDelete(null)
      if (detailId === orderToDelete.id) setDetailId(null)
      refreshData()
    } catch (error) {
      setListError(getErrorMessage(error))
      setOrderToDelete(null)
    } finally {
      setDeletingId(null)
    }
  }

  const confirmStatusChange = async () => {
    if (!statusChange || !statusTarget) return

    setIsChangingStatus(true)
    setStatusError('')
    try {
      await updateCustomOrderStatus(statusChange.id, statusTarget)
      onToast(`Đã chuyển đơn #${statusChange.id} sang "${statusLabel(statusTarget)}".`)
      setStatusChange(null)
      setStatusTarget('')
      refreshData()
      if (detailId === statusChange.id) setDetailReloadVersion((version) => version + 1)
    } catch (error) {
      setStatusError(getErrorMessage(error))
    } finally {
      setIsChangingStatus(false)
    }
  }

  const columns = [
    {
      key: 'cakeName',
      label: 'Đơn bánh',
      render: (order) => (
        <div className="min-w-[165px]">
          <p className="font-semibold text-rosewood">{order.cakeName || 'Chưa có tên bánh'}</p>
          <p className="mt-1 text-[10px] text-muted">Mã đơn #{order.id}</p>
        </div>
      ),
    },
    {
      key: 'customerId',
      label: 'Khách hàng',
      render: (order) => {
        const customer = customerById.get(Number(order.customerId))
        return (
          <div className="min-w-[145px]">
            <p>{customer?.fullName ?? `Khách hàng #${order.customerId}`}</p>
            <p className="mt-1 text-[10px] text-muted">{customer?.phone ?? '—'}</p>
          </div>
        )
      },
    },
    {
      key: 'deliveryDate',
      label: 'Hẹn giao',
      render: (order) => formatDateTime(order.deliveryDate),
    },
    {
      key: 'estimatedPrice',
      label: 'Giá dự kiến / cọc',
      render: (order) => (
        <div className="whitespace-nowrap">
          <p>{formatMoney(order.estimatedPrice)}</p>
          <p className="mt-1 text-[10px] text-muted">Cọc: {formatMoney(order.deposit)}</p>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Trạng thái',
      render: (order) => <StatusBadge status={statusLabel(order.status)} />,
    },
    {
      key: 'actions',
      label: 'Thao tác',
      headerClassName: 'text-right',
      cellClassName: 'text-right',
      render: (order) => (
        <div className="flex justify-end gap-1">
          <Button
            size="sm"
            variant="subtle"
            aria-label={`Xem đơn đặt bánh ${order.id}`}
            onClick={() => setDetailId(order.id)}
          >
            <Icon name="search" size={15} />
          </Button>
          {!['COMPLETED', 'CANCELLED'].includes(order.status) && (
            <>
              <Button
                size="sm"
                variant="subtle"
                aria-label={`Sửa đơn đặt bánh ${order.id}`}
                onClick={() => openEditForm(order)}
              >
                <Icon name="edit" size={15} />
              </Button>
              {nextStatuses[order.status]?.length > 0 && (
                <Button
                  size="sm"
                  variant="subtle"
                  aria-label={`Đổi trạng thái đơn ${order.id}`}
                  onClick={() => {
                    setStatusChange(order)
                    setStatusTarget('')
                    setStatusError('')
                  }}
                >
                  Trạng thái
                </Button>
              )}
            </>
          )}
          {order.status === 'PENDING' && (
            <Button
              size="sm"
              variant="subtle"
              aria-label={`Xóa đơn đặt bánh ${order.id}`}
              disabled={deletingId === order.id}
              onClick={() => setOrderToDelete(order)}
            >
              <Icon name="trash" size={15} />
            </Button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Đơn đặt bánh riêng"
        description="Tiếp nhận yêu cầu bánh thiết kế riêng, theo dõi tiền cọc và tiến độ giao. Đơn được quản lý độc lập với bán hàng POS."
        actions={(
          <Button
            onClick={openCreateForm}
            disabled={isLoading || Boolean(loadError) || activeCustomers.length === 0 || activeEmployees.length === 0}
          >
            <Icon name="plus" size={16} /> Tạo đơn đặt bánh
          </Button>
        )}
      />

      {listError && (
        <div role="alert" className="rounded-xl border border-danger-line bg-danger-soft px-4 py-3 text-sm text-danger">
          {listError}
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        <SearchFilter
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          label="Tìm đơn, bánh, khách hàng hoặc nhân viên"
          placeholder="Nhập mã đơn, tên bánh, tên hoặc số điện thoại khách..."
          className="flex-1"
        />
        <label className="flex items-center gap-2 text-xs text-muted">
          <span>Trạng thái</span>
          <select
            aria-label="Lọc theo trạng thái"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className={`${inputClass} min-w-[180px] bg-paper`}
          >
            <option value="all">Tất cả trạng thái</option>
            {Object.entries(statusLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </label>
      </div>

      {isLoading ? (
        <LoadingState label="Đang tải đơn đặt bánh và danh sách khách hàng, nhân viên..." />
      ) : loadError ? (
        <ErrorState description={loadError} onRetry={refreshData} />
      ) : (
        <section className="soft-shadow overflow-hidden rounded-2xl border border-border bg-paper">
          <div className="border-b border-border px-5 py-4">
            <p className="text-xs text-muted">
              Hiển thị {filteredOrders.length} / {orders.length} đơn đặt bánh
            </p>
          </div>
          <DataTable
            columns={columns}
            rows={filteredOrders}
            rowKey={(order) => order.id}
            ariaLabel="Danh sách đơn đặt bánh riêng"
            emptyTitle={orders.length ? 'Không tìm thấy đơn đặt bánh' : 'Chưa có đơn đặt bánh'}
            emptyDescription={orders.length
              ? 'Thử từ khóa hoặc trạng thái khác.'
              : 'Tạo đơn để tiếp nhận yêu cầu bánh thiết kế riêng.'}
          />
        </section>
      )}

      {!isLoading && !loadError && (activeCustomers.length === 0 || activeEmployees.length === 0) && (
        <p role="status" className="rounded-xl border border-border bg-cream px-4 py-3 text-sm text-muted">
          Chưa thể tạo đơn: cần có ít nhất một khách hàng và một nhân viên đang hoạt động.
        </p>
      )}

      <Modal
        open={formOpen}
        title={editingOrder ? `Cập nhật đơn #${editingOrder.id}` : 'Tạo đơn đặt bánh riêng'}
        onClose={closeForm}
        closeOnEscape={!isSaving}
        closeOnBackdrop={!isSaving}
        closeDisabled={isSaving}
      >
        <form className="space-y-4" onSubmit={saveOrder} noValidate>
          {formError && (
            <div role="alert" className="rounded-xl border border-danger-line bg-danger-soft px-4 py-3 text-sm text-danger">
              {formError}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField id="custom-order-customer" label="Khách hàng đang hoạt động" required>
              {(fieldProps) => (
                <select
                  {...fieldProps}
                  value={form.customerId}
                  onChange={(event) => setForm((current) => ({ ...current, customerId: event.target.value }))}
                  className={inputClass}
                >
                  <option value="">Chọn khách hàng</option>
                  {activeCustomers.map((customer) => (
                    <option key={customer.id} value={customer.id}>{customerLabel(customer)}</option>
                  ))}
                </select>
              )}
            </FormField>
            <FormField id="custom-order-employee" label="Nhân viên tiếp nhận đang hoạt động" required>
              {(fieldProps) => (
                <select
                  {...fieldProps}
                  value={form.employeeId}
                  onChange={(event) => setForm((current) => ({ ...current, employeeId: event.target.value }))}
                  className={inputClass}
                >
                  <option value="">Chọn nhân viên</option>
                  {activeEmployees.map((employee) => (
                    <option key={employee.id} value={employee.id}>{employeeLabel(employee)}</option>
                  ))}
                </select>
              )}
            </FormField>
          </div>

          <FormField id="custom-order-cake-name" label="Tên bánh" required>
            {(fieldProps) => (
              <input
                {...fieldProps}
                autoFocus
                maxLength={150}
                value={form.cakeName}
                onChange={(event) => setForm((current) => ({ ...current, cakeName: event.target.value }))}
                className={inputClass}
                placeholder="Ví dụ: Bánh sinh nhật chủ đề hoa"
              />
            )}
          </FormField>

          <FormField id="custom-order-description" label="Mô tả yêu cầu">
            {(fieldProps) => (
              <textarea
                {...fieldProps}
                rows={4}
                value={form.requestDescription}
                onChange={(event) => setForm((current) => ({ ...current, requestDescription: event.target.value }))}
                className={`${inputClass} h-auto min-h-24 resize-y py-2.5`}
                placeholder="Kích thước, hình dáng, màu sắc, trang trí, nội dung chữ..."
              />
            )}
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField id="custom-order-delivery-date" label="Thời điểm hẹn giao" required>
              {(fieldProps) => (
                <input
                  {...fieldProps}
                  type="datetime-local"
                  value={form.deliveryDate}
                  onChange={(event) => setForm((current) => ({ ...current, deliveryDate: event.target.value }))}
                  className={inputClass}
                />
              )}
            </FormField>
            <FormField id="custom-order-estimated-price" label="Giá dự kiến (₫)" required>
              {(fieldProps) => (
                <input
                  {...fieldProps}
                  type="number"
                  min="0.01"
                  max="9999999999999.99"
                  step="0.01"
                  value={form.estimatedPrice}
                  onChange={(event) => setForm((current) => ({ ...current, estimatedPrice: event.target.value }))}
                  className={inputClass}
                  placeholder="0"
                />
              )}
            </FormField>
          </div>

          <FormField
            id="custom-order-deposit"
            label="Tiền đặt cọc (₫)"
            hint="Tiền cọc không được lớn hơn giá dự kiến."
            required
          >
            {(fieldProps) => (
              <input
                {...fieldProps}
                type="number"
                min="0"
                max="9999999999999.99"
                step="0.01"
                value={form.deposit}
                onChange={(event) => setForm((current) => ({ ...current, deposit: event.target.value }))}
                className={inputClass}
                placeholder="0"
              />
            )}
          </FormField>

          <p className="text-xs leading-5 text-muted">
            Thời điểm tạo đơn và trạng thái ban đầu PENDING do backend quản lý. Giá dự kiến và tiền cọc là thông tin báo giá/ghi nhận cho đơn bánh thiết kế riêng.
          </p>

          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <Button variant="secondary" disabled={isSaving} onClick={closeForm}>Hủy</Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Đang lưu...' : editingOrder ? 'Lưu thay đổi' : 'Tạo đơn'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={detailId !== null}
        title={`Chi tiết đơn đặt bánh${detailId === null ? '' : ` #${detailId}`}`}
        onClose={() => setDetailId(null)}
      >
        {detailLoading ? (
          <LoadingState label="Đang tải chi tiết đơn..." className="py-8" />
        ) : detailError ? (
          <ErrorState
            description={detailError}
            onRetry={() => setDetailReloadVersion((version) => version + 1)}
          />
        ) : detailOrder ? (
          <dl className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <dt className="text-xs text-muted">Tên bánh</dt>
              <dd className="mt-1 font-semibold text-rosewood">{detailOrder.cakeName || '—'}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Khách hàng</dt>
              <dd className="mt-1 text-sm text-rosewood">
                {customerById.get(Number(detailOrder.customerId))?.fullName ?? `Khách hàng #${detailOrder.customerId}`}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Nhân viên tiếp nhận</dt>
              <dd className="mt-1 text-sm text-rosewood">
                {employeeById.get(Number(detailOrder.employeeId))?.fullName ?? `Nhân viên #${detailOrder.employeeId}`}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Ngày tiếp nhận</dt>
              <dd className="mt-1 text-sm text-rosewood">{formatDateTime(detailOrder.orderDate)}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Hẹn giao</dt>
              <dd className="mt-1 text-sm text-rosewood">{formatDateTime(detailOrder.deliveryDate)}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Giá dự kiến</dt>
              <dd className="mt-1 text-sm font-semibold text-rosewood">{formatMoney(detailOrder.estimatedPrice)}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Tiền cọc</dt>
              <dd className="mt-1 text-sm font-semibold text-rosewood">{formatMoney(detailOrder.deposit)}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Trạng thái</dt>
              <dd className="mt-1"><StatusBadge status={statusLabel(detailOrder.status)} /></dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs text-muted">Mô tả yêu cầu</dt>
              <dd className="mt-1 whitespace-pre-wrap text-sm leading-6 text-rosewood">
                {detailOrder.requestDescription || 'Không có mô tả.'}
              </dd>
            </div>
          </dl>
        ) : null}
      </Modal>

      <Modal
        open={Boolean(statusChange)}
        title={statusChange ? `Đổi trạng thái đơn #${statusChange.id}` : 'Đổi trạng thái đơn'}
        onClose={() => {
          if (!isChangingStatus) {
            setStatusChange(null)
            setStatusTarget('')
          }
        }}
        closeDisabled={isChangingStatus}
      >
        {statusChange && (
          <div className="space-y-4">
            <p className="text-sm leading-6 text-muted">
              Trạng thái hiện tại: <strong className="text-rosewood">{statusLabel(statusChange.status)}</strong>.
              Chỉ các bước chuyển hợp lệ theo quy trình đơn đặt bánh được hiển thị.
            </p>
            {statusError && (
              <p role="alert" className="rounded-xl border border-danger-line bg-danger-soft px-4 py-3 text-sm text-danger">
                {statusError}
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              {(nextStatuses[statusChange.status] ?? []).map((status) => (
                <Button
                  key={status}
                  variant={statusTarget === status ? 'primary' : 'secondary'}
                  aria-pressed={statusTarget === status}
                  onClick={() => setStatusTarget(status)}
                >
                  {statusLabel(status)}
                </Button>
              ))}
            </div>
            <div className="flex justify-end gap-2 border-t border-border pt-4">
              <Button
                variant="secondary"
                disabled={isChangingStatus}
                onClick={() => {
                  setStatusChange(null)
                  setStatusTarget('')
                }}
              >
                Hủy
              </Button>
              <Button
                disabled={isChangingStatus || !statusTarget}
                onClick={confirmStatusChange}
              >
                {isChangingStatus ? 'Đang lưu...' : 'Cập nhật trạng thái'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(orderToDelete)}
        title="Xóa đơn đặt bánh đang chờ?"
        description={orderToDelete
          ? `Bạn sắp xóa đơn #${orderToDelete.id} "${orderToDelete.cakeName}". Chỉ đơn PENDING mới được xóa.`
          : ''}
        confirmLabel="Xóa đơn"
        onConfirm={confirmDelete}
        onClose={() => {
          if (deletingId === null) setOrderToDelete(null)
        }}
        busy={deletingId !== null}
      />
    </div>
  )
}
