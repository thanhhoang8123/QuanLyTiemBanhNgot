import { useCallback, useEffect, useState } from 'react'
import Button from '../../../components/Button.jsx'
import ConfirmDialog from '../../../components/ConfirmDialog.jsx'
import DataTable from '../../../components/DataTable.jsx'
import ErrorState from '../../../components/ErrorState.jsx'
import FormField from '../../../components/FormField.jsx'
import Icon from '../../../components/Icon.jsx'
import LoadingState from '../../../components/LoadingState.jsx'
import Modal from '../../../components/Modal.jsx'
import PaginationControls from '../../../components/PaginationControls.jsx'
import PageHeader from '../../../components/PageHeader.jsx'
import SearchFilter from '../../../components/SearchFilter.jsx'
import StatusBadge from '../../../components/StatusBadge.jsx'
import {
  createCustomer,
  deleteCustomer,
  getCustomerById,
  getCustomerPage,
  updateCustomer,
} from '../services/customerService.js'
import { getUserFacingErrorMessage } from '../../../services/apiClient.js'

const emptyForm = {
  fullName: '',
  phone: '',
  email: '',
  address: '',
}

const inputClass = 'h-10 w-full rounded-xl border border-border bg-white px-3 text-sm text-rosewood outline-none transition placeholder:text-muted/70 focus:border-caramel'
const pointsFormat = new Intl.NumberFormat('vi-VN')

function getErrorMessage(error) {
  return getUserFacingErrorMessage(error)
}

function getStatusLabel(status) {
  if (status === true) return 'Đang hoạt động'
  if (status === false) return 'Ngừng hoạt động'
  return 'Chưa xác định'
}

function toCustomerRequest(form) {
  return {
    fullName: form.fullName.trim(),
    phone: form.phone.trim() || null,
    email: form.email.trim() || null,
    address: form.address.trim() || null,
  }
}

function validateCustomerForm(form) {
  if (!form.fullName.trim()) return 'Vui lòng nhập họ và tên khách hàng.'
  if (form.fullName.trim().length > 100) return 'Họ và tên không được vượt quá 100 ký tự.'
  if (form.phone.trim().length > 15) return 'Số điện thoại không được vượt quá 15 ký tự.'
  if (form.email.trim().length > 100) return 'Email không được vượt quá 100 ký tự.'
  if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    return 'Email không đúng định dạng.'
  }
  if (form.address.trim().length > 255) return 'Địa chỉ không được vượt quá 255 ký tự.'
  return ''
}

export default function CustomersPage({ onToast }) {
  const [customers, setCustomers] = useState([])
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState('fullName')
  const [direction, setDirection] = useState('ASC')
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(20)
  const [pageInfo, setPageInfo] = useState({ totalElements: 0, totalPages: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [listError, setListError] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [formError, setFormError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [customerToDelete, setCustomerToDelete] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [detailId, setDetailId] = useState(null)
  const [detailCustomer, setDetailCustomer] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState('')
  const [detailReloadVersion, setDetailReloadVersion] = useState(0)

  const loadCustomers = useCallback(async (signal, requestedPage = page) => {
    setIsLoading(true)
    setLoadError('')
    try {
      const result = await getCustomers({ signal })
      if (!Array.isArray(result)) {
        throw new Error('Chưa thể tải danh sách khách hàng. Vui lòng thử lại.')
      }
      if (result.totalPages === 0 ? requestedPage > 0 : requestedPage >= result.totalPages) {
        setPage(result.totalPages === 0 ? 0 : result.totalPages - 1)
        return
      }
      setPage(requestedPage)
      setCustomers(result.content)
      setPageInfo(result)
    } catch (error) {
      if (error.name !== 'AbortError') setLoadError(getErrorMessage(error))
    } finally {
      if (!signal?.aborted) setIsLoading(false)
    }
  }, [direction, page, pageSize, query, sort])

  useEffect(() => {
    const controller = new AbortController()
    void loadCustomers(controller.signal)
    return () => controller.abort()
  }, [loadCustomers])

  useEffect(() => {
    if (detailId === null) return undefined

    const controller = new AbortController()
    setDetailCustomer(null)
    setDetailError('')
    setDetailLoading(true)

    getCustomerById(detailId, { signal: controller.signal })
      .then(setDetailCustomer)
      .catch((error) => {
        if (error.name !== 'AbortError') setDetailError(getErrorMessage(error))
      })
      .finally(() => {
        if (!controller.signal.aborted) setDetailLoading(false)
      })

    return () => controller.abort()
  }, [detailId, detailReloadVersion])

  const openCreate = () => {
    setEditingCustomer(null)
    setForm({ ...emptyForm })
    setFormError('')
    setFormOpen(true)
  }

  const openEdit = (customer) => {
    setEditingCustomer(customer)
    setForm({
      fullName: customer.fullName ?? '',
      phone: customer.phone ?? '',
      email: customer.email ?? '',
      address: customer.address ?? '',
    })
    setFormError('')
    setFormOpen(true)
  }

  const closeForm = () => {
    if (isSaving) return
    setFormOpen(false)
    setEditingCustomer(null)
    setFormError('')
  }

  const saveCustomer = async (event) => {
    event.preventDefault()
    const validationError = validateCustomerForm(form)
    if (validationError) {
      setFormError(validationError)
      return
    }

    setIsSaving(true)
    setFormError('')
    try {
      const request = toCustomerRequest(form)
      if (editingCustomer) {
        await updateCustomer(editingCustomer.id, request)
        onToast('Đã cập nhật thông tin khách hàng.')
      } else {
        await createCustomer(request)
        onToast('Đã thêm khách hàng.')
      }

      setFormOpen(false)
      setEditingCustomer(null)
      if (!editingCustomer) setPage(0)
      await loadCustomers(undefined, editingCustomer ? page : 0)
    } catch (error) {
      setFormError(getErrorMessage(error))
    } finally {
      setIsSaving(false)
    }
  }

  const confirmDelete = async () => {
    if (!customerToDelete) return

    setDeletingId(customerToDelete.id)
    setListError('')
    try {
      await deleteCustomer(customerToDelete.id)
      onToast('Đã xóa khách hàng.')
      setCustomerToDelete(null)
      await loadCustomers()
    } catch (error) {
      setListError(getErrorMessage(error))
      setCustomerToDelete(null)
    } finally {
      setDeletingId(null)
    }
  }

  const columns = [
    {
      key: 'fullName',
      label: 'Khách hàng',
      render: (customer) => (
        <div className="min-w-[160px]">
          <p className="font-semibold text-rosewood">{customer.fullName || 'Chưa có tên'}</p>
          <p className="mt-1 text-[10px] text-muted">{customer.phone || 'Chưa có số điện thoại'}</p>
        </div>
      ),
    },
    {
      key: 'email',
      label: 'Email',
      render: (customer) => customer.email || '—',
    },
    {
      key: 'loyaltyPoints',
      label: 'Điểm tích lũy',
      render: (customer) => customer.loyaltyPoints == null
        ? '—'
        : pointsFormat.format(customer.loyaltyPoints),
    },
    {
      key: 'status',
      label: 'Trạng thái',
      render: (customer) => <StatusBadge status={getStatusLabel(customer.status)} />,
    },
    {
      key: 'actions',
      label: 'Thao tác',
      headerClassName: 'text-right',
      cellClassName: 'text-right',
      render: (customer) => (
        <div className="flex justify-end gap-1">
          <Button
            size="sm"
            variant="subtle"
            aria-label={`Xem khách hàng ${customer.fullName ?? customer.id}`}
            onClick={() => setDetailId(customer.id)}
          >
            <Icon name="search" size={15} />
          </Button>
          <Button
            size="sm"
            variant="subtle"
            aria-label={`Sửa khách hàng ${customer.fullName ?? customer.id}`}
            onClick={() => openEdit(customer)}
          >
            <Icon name="edit" size={15} />
          </Button>
          <Button
            size="sm"
            variant="subtle"
            aria-label={`Xóa khách hàng ${customer.fullName ?? customer.id}`}
            disabled={deletingId === customer.id}
            onClick={() => setCustomerToDelete(customer)}
          >
            <Icon name="trash" size={15} />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Khách hàng"
        description="Tra cứu hồ sơ, thông tin liên hệ và điểm tích lũy khách hàng."
        actions={(
          <Button onClick={openCreate} disabled={isLoading || Boolean(loadError)}>
            <Icon name="plus" size={16} /> Thêm khách hàng
          </Button>
        )}
      />

      {listError && (
        <div role="alert" className="rounded-xl border border-danger-line bg-danger-soft px-4 py-3 text-sm text-danger">
          {listError}
        </div>
      )}

      <SearchFilter
        value={query}
        onChange={(event) => { setQuery(event.target.value); setPage(0) }}
        label="Tìm theo tên, số điện thoại hoặc email"
        placeholder="Nhập tên, số điện thoại hoặc email..."
      />
      <div className="flex flex-wrap gap-2">
        <label className="flex items-center gap-2 text-xs text-muted">
          <span>Sắp xếp theo</span>
          <select value={sort} onChange={(event) => { setSort(event.target.value); setPage(0) }} className="h-9 rounded-xl border border-border bg-white px-3 text-xs text-rosewood">
            <option value="fullName">Tên</option>
            <option value="phone">Điện thoại</option>
            <option value="email">Email</option>
            <option value="loyaltyPoints">Điểm tích lũy</option>
            <option value="status">Trạng thái</option>
          </select>
        </label>
        <select aria-label="Chiều sắp xếp khách hàng" value={direction} onChange={(event) => { setDirection(event.target.value); setPage(0) }} className="h-9 rounded-xl border border-border bg-white px-3 text-xs text-rosewood">
          <option value="ASC">Tăng dần</option>
          <option value="DESC">Giảm dần</option>
        </select>
      </div>

      {isLoading ? (
        <LoadingState label="Đang tải danh sách khách hàng..." />
      ) : loadError ? (
        <ErrorState description={loadError} onRetry={() => void loadCustomers()} />
      ) : (
        <section className="soft-shadow overflow-hidden rounded-2xl border border-border bg-paper">
          <div className="border-b border-border px-5 py-4">
            <p className="text-xs text-muted">
              Hiển thị {customers.length} / {pageInfo.totalElements} khách hàng
            </p>
          </div>
          <DataTable
            columns={columns}
            rows={customers}
            rowKey={(customer) => customer.id}
            ariaLabel="Danh sách khách hàng"
            emptyTitle={customers.length ? 'Không tìm thấy khách hàng' : 'Chưa có khách hàng'}
            emptyDescription={customers.length
              ? 'Thử tên, số điện thoại hoặc email khác.'
              : 'Thêm khách hàng để bắt đầu quản lý hồ sơ.'}
          />
          <PaginationControls
            page={page}
            size={pageSize}
            totalElements={pageInfo.totalElements}
            totalPages={pageInfo.totalPages}
            onPageChange={setPage}
            onSizeChange={(value) => { setPageSize(value); setPage(0) }}
          />
        </section>
      )}

      <Modal
        open={formOpen}
        title={editingCustomer ? 'Cập nhật khách hàng' : 'Thêm khách hàng'}
        onClose={closeForm}
        closeOnEscape={!isSaving}
        closeOnBackdrop={!isSaving}
        closeDisabled={isSaving}
      >
        <form className="space-y-4" onSubmit={saveCustomer} noValidate>
          {formError && (
            <div role="alert" className="rounded-xl border border-danger-line bg-danger-soft px-4 py-3 text-sm text-danger">
              {formError}
            </div>
          )}

          <FormField id="customer-full-name" label="Họ và tên" required>
            {(fieldProps) => (
              <input
                {...fieldProps}
                autoFocus
                maxLength={100}
                value={form.fullName}
                onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))}
                className={inputClass}
                placeholder="Nhập họ tên khách hàng"
              />
            )}
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField id="customer-phone" label="Số điện thoại">
              {(fieldProps) => (
                <input
                  {...fieldProps}
                  maxLength={15}
                  value={form.phone}
                  onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                  className={inputClass}
                  placeholder="Nhập số điện thoại"
                  autoComplete="tel"
                />
              )}
            </FormField>
            <FormField id="customer-email" label="Email">
              {(fieldProps) => (
                <input
                  {...fieldProps}
                  type="email"
                  maxLength={100}
                  value={form.email}
                  onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                  className={inputClass}
                  placeholder="name@example.com"
                  autoComplete="email"
                />
              )}
            </FormField>
          </div>

          <FormField id="customer-address" label="Địa chỉ">
            {(fieldProps) => (
              <textarea
                {...fieldProps}
                maxLength={255}
                rows={3}
                value={form.address}
                onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))}
                className={`${inputClass} h-auto min-h-24 resize-y py-2.5`}
                placeholder="Nhập địa chỉ khách hàng"
              />
            )}
          </FormField>

          <p className="text-xs leading-5 text-muted">
            Điểm tích lũy và trạng thái được quản lý tự động, không chỉnh sửa tại biểu mẫu này.
          </p>

          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <Button variant="secondary" disabled={isSaving} onClick={closeForm}>
              Hủy
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Đang lưu...' : editingCustomer ? 'Lưu thay đổi' : 'Thêm khách hàng'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={detailId !== null}
        title="Thông tin khách hàng"
        onClose={() => setDetailId(null)}
      >
        {detailLoading ? (
          <LoadingState label="Đang tải thông tin khách hàng..." className="py-8" />
        ) : detailError ? (
          <ErrorState
            description={detailError}
            onRetry={() => setDetailReloadVersion((version) => version + 1)}
          />
        ) : detailCustomer ? (
          <dl className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <dt className="text-xs text-muted">Họ và tên</dt>
              <dd className="mt-1 font-semibold text-rosewood">{detailCustomer.fullName || '—'}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Số điện thoại</dt>
              <dd className="mt-1 text-sm text-rosewood">{detailCustomer.phone || '—'}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Email</dt>
              <dd className="mt-1 break-all text-sm text-rosewood">{detailCustomer.email || '—'}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs text-muted">Địa chỉ</dt>
              <dd className="mt-1 whitespace-pre-wrap text-sm text-rosewood">{detailCustomer.address || '—'}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Điểm tích lũy</dt>
              <dd className="mt-1 text-sm font-semibold text-rosewood">
                {detailCustomer.loyaltyPoints == null ? '—' : pointsFormat.format(detailCustomer.loyaltyPoints)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Trạng thái</dt>
              <dd className="mt-1"><StatusBadge status={getStatusLabel(detailCustomer.status)} /></dd>
            </div>
          </dl>
        ) : null}
      </Modal>

      <ConfirmDialog
        open={Boolean(customerToDelete)}
        title="Xóa khách hàng?"
        description={customerToDelete
          ? `Bạn có chắc chắn muốn xóa hồ sơ "${customerToDelete.fullName || customerToDelete.id}" không? Không thể xóa khách hàng đang có đơn hàng liên quan.`
          : ''}
        confirmLabel="Xóa khách hàng"
        onConfirm={confirmDelete}
        onClose={() => {
          if (deletingId === null) setCustomerToDelete(null)
        }}
        busy={deletingId !== null}
      />
    </div>
  )
}
