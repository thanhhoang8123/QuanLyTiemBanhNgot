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
import {
  createPromotion,
  deletePromotion,
  getPromotionById,
  getPromotions,
  searchPromotions,
  updatePromotion,
} from '../services/promotionService.js'
import { getUserFacingErrorMessage } from '../../../services/apiClient.js'

const emptyForm = {
  promotionCode: '',
  name: '',
  discountPercent: '',
  maxDiscount: '',
  minOrderValue: '',
  startDate: '',
  endDate: '',
  status: 'true',
}

const inputClass = 'h-10 w-full rounded-xl border border-border bg-white px-3 text-sm text-rosewood outline-none transition placeholder:text-muted/70 focus:border-caramel'
const currencyFormat = new Intl.NumberFormat('vi-VN')
const percentFormat = new Intl.NumberFormat('vi-VN', {
  maximumFractionDigits: 2,
})

function getErrorMessage(error) {
  return getUserFacingErrorMessage(error)
}

function toPromotionRequest(form) {
  return {
    promotionCode: form.promotionCode.trim(),
    name: form.name.trim(),
    discountPercent: Number(form.discountPercent),
    maxDiscount: form.maxDiscount.trim() === '' ? null : Number(form.maxDiscount),
    minOrderValue: form.minOrderValue.trim() === '' ? null : Number(form.minOrderValue),
    startDate: form.startDate,
    endDate: form.endDate,
    status: form.status === 'true',
  }
}

function isMoneyInput(value) {
  return /^\d{1,13}(\.\d{1,2})?$/.test(value)
}

function validateForm(form) {
  const code = form.promotionCode.trim()
  const name = form.name.trim()
  const percentText = form.discountPercent.trim()
  const discountPercent = Number(percentText)

  if (!code) return 'Vui lòng nhập mã khuyến mãi.'
  if (code.length > 30) return 'Mã khuyến mãi không được vượt quá 30 ký tự.'
  if (!name) return 'Vui lòng nhập tên chương trình.'
  if (name.length > 100) return 'Tên chương trình không được vượt quá 100 ký tự.'
  if (!/^\d{1,3}(\.\d{1,2})?$/.test(percentText)
    || !Number.isFinite(discountPercent)
    || discountPercent <= 0
    || discountPercent > 100) {
    return 'Phần trăm giảm phải lớn hơn 0 và không vượt quá 100, tối đa 2 chữ số thập phân.'
  }

  for (const [value, label] of [
    [form.maxDiscount.trim(), 'Giảm giá tối đa'],
    [form.minOrderValue.trim(), 'Giá trị đơn hàng tối thiểu'],
  ]) {
    if (value && (!isMoneyInput(value) || Number(value) < 0)) {
      return `${label} phải không âm và có tối đa 2 chữ số thập phân.`
    }
  }

  if (!form.startDate || !form.endDate) return 'Vui lòng chọn ngày bắt đầu và ngày kết thúc.'
  if (form.startDate > form.endDate) return 'Ngày bắt đầu phải trước hoặc bằng ngày kết thúc.'
  if (form.status !== 'true' && form.status !== 'false') return 'Trạng thái chương trình không hợp lệ.'
  return ''
}

function formatMoney(value) {
  if (value == null) return 'Không giới hạn'
  return `${currencyFormat.format(value)} ₫`
}

function formatDateRange(startDate, endDate) {
  if (!startDate || !endDate) return '—'
  return `${startDate} – ${endDate}`
}

function statusLabel(status) {
  return status === true ? 'Đang bật' : 'Đã tắt'
}

export default function PromotionsPage({ onToast }) {
  const [promotions, setPromotions] = useState([])
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [filterStartDate, setFilterStartDate] = useState('')
  const [filterEndDate, setFilterEndDate] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [reloadVersion, setReloadVersion] = useState(0)
  const [formOpen, setFormOpen] = useState(false)
  const [editingPromotion, setEditingPromotion] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [formError, setFormError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [promotionToDelete, setPromotionToDelete] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [listError, setListError] = useState('')
  const [selectedPromotion, setSelectedPromotion] = useState(null)
  const [selectedPromotionId, setSelectedPromotionId] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState('')
  const [detailReloadVersion, setDetailReloadVersion] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    const timeoutId = window.setTimeout(async () => {
      setIsLoading(true)
      setLoadError('')
      try {
        const result = query.trim()
          ? await searchPromotions(query.trim(), { signal: controller.signal })
          : await getPromotions({ signal: controller.signal })
        if (!Array.isArray(result)) {
          throw new Error('Chưa thể tải danh sách khuyến mãi. Vui lòng thử lại.')
        }
        setPromotions(result)
      } catch (error) {
        if (error.name !== 'AbortError') setLoadError(getErrorMessage(error))
      } finally {
        if (!controller.signal.aborted) setIsLoading(false)
      }
    }, query.trim() ? 250 : 0)

    return () => {
      window.clearTimeout(timeoutId)
      controller.abort()
    }
  }, [query, reloadVersion])

  useEffect(() => {
    if (selectedPromotionId === null) return undefined

    const controller = new AbortController()
    setSelectedPromotion(null)
    setDetailError('')
    setDetailLoading(true)
    getPromotionById(selectedPromotionId, { signal: controller.signal })
      .then(setSelectedPromotion)
      .catch((error) => {
        if (error.name !== 'AbortError') setDetailError(getErrorMessage(error))
      })
      .finally(() => {
        if (!controller.signal.aborted) setDetailLoading(false)
      })

    return () => controller.abort()
  }, [selectedPromotionId, detailReloadVersion])

  const filteredPromotions = useMemo(() => {
    const start = filterStartDate
    const end = filterEndDate
    if (start && end && start > end) return []

    return promotions.filter((promotion) => {
      const matchesStatus = statusFilter === 'all'
        || String(promotion.status) === statusFilter
      const overlapsStart = !end || promotion.startDate <= end
      const overlapsEnd = !start || promotion.endDate >= start
      return matchesStatus && overlapsStart && overlapsEnd
    })
  }, [promotions, statusFilter, filterStartDate, filterEndDate])

  const openCreate = () => {
    setEditingPromotion(null)
    setForm({ ...emptyForm })
    setFormError('')
    setFormOpen(true)
  }

  const openEdit = (promotion) => {
    setEditingPromotion(promotion)
    setForm({
      promotionCode: promotion.promotionCode ?? '',
      name: promotion.name ?? '',
      discountPercent: promotion.discountPercent == null ? '' : String(promotion.discountPercent),
      maxDiscount: promotion.maxDiscount == null ? '' : String(promotion.maxDiscount),
      minOrderValue: promotion.minOrderValue == null ? '' : String(promotion.minOrderValue),
      startDate: promotion.startDate ?? '',
      endDate: promotion.endDate ?? '',
      status: String(promotion.status),
    })
    setFormError('')
    setFormOpen(true)
  }

  const closeForm = () => {
    if (isSaving) return
    setFormOpen(false)
    setEditingPromotion(null)
    setFormError('')
  }

  const savePromotion = async (event) => {
    event.preventDefault()
    const validationError = validateForm(form)
    if (validationError) {
      setFormError(validationError)
      return
    }

    setIsSaving(true)
    setFormError('')
    try {
      const request = toPromotionRequest(form)
      if (editingPromotion) {
        await updatePromotion(editingPromotion.id, request)
        onToast('Đã cập nhật chương trình khuyến mãi.')
      } else {
        await createPromotion(request)
        onToast('Đã tạo chương trình khuyến mãi.')
      }
      setFormOpen(false)
      setEditingPromotion(null)
      setReloadVersion((version) => version + 1)
    } catch (error) {
      setFormError(getErrorMessage(error))
    } finally {
      setIsSaving(false)
    }
  }

  const confirmDelete = async () => {
    if (!promotionToDelete) return

    setIsDeleting(true)
    setListError('')
    try {
      await deletePromotion(promotionToDelete.id)
      onToast('Đã xóa chương trình khuyến mãi.')
      setPromotionToDelete(null)
      setReloadVersion((version) => version + 1)
    } catch (error) {
      setListError(getErrorMessage(error))
      setPromotionToDelete(null)
    } finally {
      setIsDeleting(false)
    }
  }

  const columns = [
    {
      key: 'promotionCode',
      label: 'Mã / chương trình',
      render: (promotion) => (
        <div className="min-w-[180px]">
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-lg border border-caramel/50 bg-caramel-soft px-2.5 py-0.5 font-mono text-xs font-bold text-rosewood shadow-xs">
              <Icon name="tag" size={12} />
              {promotion.promotionCode}
            </span>
          </div>
          <p className="mt-1 text-xs font-medium text-rosewood">{promotion.name}</p>
        </div>
      ),
    },
    {
      key: 'discountPercent',
      label: 'Mức giảm',
      render: (promotion) => (
        <div className="whitespace-nowrap">
          <p className="font-semibold text-rosewood">
            {percentFormat.format(promotion.discountPercent)}%
          </p>
          <p className="mt-1 text-[10px] text-muted">
            Tối đa {formatMoney(promotion.maxDiscount)}
          </p>
        </div>
      ),
    },
    {
      key: 'minOrderValue',
      label: 'Đơn tối thiểu',
      render: (promotion) => formatMoney(promotion.minOrderValue),
    },
    {
      key: 'dates',
      label: 'Thời hạn',
      render: (promotion) => (
        <span className="whitespace-nowrap">
          {formatDateRange(promotion.startDate, promotion.endDate)}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Trạng thái',
      render: (promotion) => <StatusBadge status={statusLabel(promotion.status)} />,
    },
    {
      key: 'actions',
      label: 'Thao tác',
      headerClassName: 'text-right',
      cellClassName: 'text-right',
      render: (promotion) => (
        <div className="flex justify-end gap-1">
          <Button
            size="sm"
            variant="subtle"
            aria-label={`Xem khuyến mãi ${promotion.promotionCode}`}
            onClick={() => setSelectedPromotionId(promotion.id)}
          >
            <Icon name="search" size={15} />
          </Button>
          <Button
            size="sm"
            variant="subtle"
            aria-label={`Sửa khuyến mãi ${promotion.promotionCode}`}
            onClick={() => openEdit(promotion)}
          >
            <Icon name="edit" size={15} />
          </Button>
          <Button
            size="sm"
            variant="subtle"
            aria-label={`Xóa khuyến mãi ${promotion.promotionCode}`}
            onClick={() => setPromotionToDelete(promotion)}
          >
            <Icon name="trash" size={15} />
          </Button>
        </div>
      ),
    },
  ]

  const activeCount = useMemo(() => promotions.filter((p) => p.status === true).length, [promotions])
  const maxDiscount = useMemo(() => promotions.reduce((max, p) => Math.max(max, Number(p.discountPercent ?? 0)), 0), [promotions])
  const today = new Date().toISOString().slice(0, 10)
  const expiringSoonCount = useMemo(() => promotions.filter((p) => {
    if (p.status !== true || !p.endDate) return false
    const diff = (new Date(p.endDate) - new Date(today)) / (1000 * 60 * 60 * 24)
    return diff >= 0 && diff <= 7
  }).length, [promotions, today])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Chương trình khuyến mãi"
        actions={(
          <Button onClick={openCreate} disabled={isLoading || Boolean(loadError)}>
            <Icon name="plus" size={16} /> Thêm khuyến mãi
          </Button>
        )}
      />

      <section aria-label="Tổng quan khuyến mãi" className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Tổng chương trình', value: promotions.length, icon: 'tag' },
          { label: 'Đang áp dụng', value: activeCount, icon: 'check' },
          { label: 'Mức giảm cao nhất', value: `${maxDiscount}%`, icon: 'sparkles' },
          {
            label: 'Sắp hết hạn (≤ 7 ngày)',
            value: expiringSoonCount,
            icon: 'clock',
            highlight: expiringSoonCount > 0,
          },
        ].map((stat) => (
          <article
            key={stat.label}
            className={`soft-shadow flex items-center justify-between rounded-2xl border p-4 sm:p-5 transition hover:shadow-md ${
              stat.highlight
                ? 'border-amber-300 bg-amber-50/80'
                : 'border-border bg-paper'
            }`}
          >
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-muted">{stat.label}</p>
              <p className="font-display mt-2 truncate text-2xl font-bold text-rosewood">
                {stat.value}
              </p>
            </div>
            <span className="ml-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-caramel-soft text-rosewood">
              <Icon name={stat.icon} size={18} />
            </span>
          </article>
        ))}
      </section>

      {listError && (
        <div role="alert" className="rounded-xl border border-danger-line bg-danger-soft px-4 py-3 text-sm text-danger">
          {listError}
        </div>
      )}

      <SearchFilter
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        label="Tìm theo mã hoặc tên khuyến mãi"
        placeholder="Nhập mã hoặc tên chương trình..."
      >
        <select
          aria-label="Lọc theo trạng thái khuyến mãi"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className={`${inputClass} sm:w-auto`}
        >
          <option value="all">Mọi trạng thái</option>
          <option value="true">Đang bật</option>
          <option value="false">Đã tắt</option>
        </select>
        <input
          type="date"
          aria-label="Lọc thời hạn bắt đầu từ"
          value={filterStartDate}
          onChange={(event) => {
            setFilterStartDate(event.target.value)
          }}
          className={`${inputClass} sm:w-auto`}
        />
        <input
          type="date"
          aria-label="Lọc thời hạn đến"
          value={filterEndDate}
          onChange={(event) => {
            setFilterEndDate(event.target.value)
          }}
          className={`${inputClass} sm:w-auto`}
        />
      </SearchFilter>

      {filterStartDate && filterEndDate && filterStartDate > filterEndDate && (
        <p role="alert" className="text-sm text-danger">
          Ngày lọc bắt đầu phải trước hoặc bằng ngày kết thúc.
        </p>
      )}

      {isLoading ? (
        <LoadingState label="Đang tải chương trình khuyến mãi..." />
      ) : loadError ? (
        <ErrorState
          description={loadError}
          onRetry={() => setReloadVersion((version) => version + 1)}
        />
      ) : (
        <section className="soft-shadow overflow-hidden rounded-2xl border border-border bg-paper">
          <div className="border-b border-border px-5 py-4">
            <p className="text-xs text-muted">
              Hiển thị {filteredPromotions.length} / {promotions.length} chương trình
            </p>
          </div>
          <DataTable
            columns={columns}
            rows={filteredPromotions}
            rowKey={(promotion) => promotion.id}
            ariaLabel="Danh sách chương trình khuyến mãi"
            emptyTitle={promotions.length ? 'Không tìm thấy khuyến mãi' : 'Chưa có chương trình khuyến mãi'}
            emptyDescription={promotions.length
              ? 'Thử thay đổi từ khóa hoặc điều kiện lọc.'
              : 'Tạo chương trình khuyến mãi để bắt đầu quản lý.'}
          />
        </section>
      )}

      <Modal
        open={formOpen}
        title={editingPromotion ? 'Cập nhật khuyến mãi' : 'Tạo khuyến mãi'}
        onClose={closeForm}
        closeOnEscape={!isSaving}
        closeOnBackdrop={!isSaving}
        closeDisabled={isSaving}
        size="max-w-2xl"
      >
        <form className="space-y-4" onSubmit={savePromotion} noValidate>
          {formError && (
            <div role="alert" className="rounded-xl border border-danger-line bg-danger-soft px-4 py-3 text-sm text-danger">
              {formError}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField id="promotion-code" label="Mã khuyến mãi" required>
              {(fieldProps) => (
                <input
                  {...fieldProps}
                  required
                  maxLength={30}
                  value={form.promotionCode}
                  onChange={(event) => setForm((current) => ({ ...current, promotionCode: event.target.value }))}
                  className={inputClass}
                  placeholder="VD: TET2027"
                />
              )}
            </FormField>
            <FormField id="promotion-name" label="Tên chương trình" required>
              {(fieldProps) => (
                <input
                  {...fieldProps}
                  required
                  maxLength={100}
                  value={form.name}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                  className={inputClass}
                  placeholder="Tên chương trình khuyến mãi"
                />
              )}
            </FormField>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <FormField id="promotion-discount-percent" label="Giảm (%)" required>
              {(fieldProps) => (
                <input
                  {...fieldProps}
                  required
                  type="number"
                  min="0.01"
                  max="100"
                  step="0.01"
                  value={form.discountPercent}
                  onChange={(event) => setForm((current) => ({ ...current, discountPercent: event.target.value }))}
                  className={inputClass}
                  placeholder="10"
                />
              )}
            </FormField>
            <FormField id="promotion-max-discount" label="Giảm tối đa (₫)">
              {(fieldProps) => (
                <input
                  {...fieldProps}
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.maxDiscount}
                  onChange={(event) => setForm((current) => ({ ...current, maxDiscount: event.target.value }))}
                  className={inputClass}
                  placeholder="Để trống nếu không giới hạn"
                />
              )}
            </FormField>
            <FormField id="promotion-min-order-value" label="Đơn tối thiểu (₫)">
              {(fieldProps) => (
                <input
                  {...fieldProps}
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.minOrderValue}
                  onChange={(event) => setForm((current) => ({ ...current, minOrderValue: event.target.value }))}
                  className={inputClass}
                  placeholder="Để trống nếu không yêu cầu"
                />
              )}
            </FormField>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <FormField id="promotion-start-date" label="Ngày bắt đầu" required>
              {(fieldProps) => (
                <input
                  {...fieldProps}
                  required
                  type="date"
                  value={form.startDate}
                  onChange={(event) => setForm((current) => ({ ...current, startDate: event.target.value }))}
                  className={inputClass}
                />
              )}
            </FormField>
            <FormField id="promotion-end-date" label="Ngày kết thúc" required>
              {(fieldProps) => (
                <input
                  {...fieldProps}
                  required
                  type="date"
                  min={form.startDate || undefined}
                  value={form.endDate}
                  onChange={(event) => setForm((current) => ({ ...current, endDate: event.target.value }))}
                  className={inputClass}
                />
              )}
            </FormField>
            <FormField id="promotion-status" label="Trạng thái" required>
              {(fieldProps) => (
                <select
                  {...fieldProps}
                  required
                  value={form.status}
                  onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}
                  className={inputClass}
                >
                  <option value="true">Đang bật</option>
                  <option value="false">Đã tắt</option>
                </select>
              )}
            </FormField>
          </div>

          <p className="text-xs leading-5 text-muted">
            Mã khuyến mãi phải duy nhất. Giới hạn giảm tối đa và giá trị đơn tối thiểu có thể để trống.
          </p>

          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <Button variant="secondary" disabled={isSaving} onClick={closeForm}>
              Hủy
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Đang lưu...' : editingPromotion ? 'Lưu thay đổi' : 'Tạo khuyến mãi'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={selectedPromotionId !== null}
        title="Chi tiết khuyến mãi"
        onClose={() => {
          setSelectedPromotionId(null)
          setSelectedPromotion(null)
          setDetailError('')
        }}
      >
        {detailLoading ? (
          <LoadingState label="Đang tải chi tiết khuyến mãi..." className="py-8" />
        ) : detailError ? (
          <ErrorState
            description={detailError}
            onRetry={() => setDetailReloadVersion((version) => version + 1)}
          />
        ) : selectedPromotion ? (
          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs text-muted">Mã khuyến mãi</dt>
              <dd className="mt-1 font-semibold text-rosewood">{selectedPromotion.promotionCode}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Tên chương trình</dt>
              <dd className="mt-1 font-semibold text-rosewood">{selectedPromotion.name}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Mức giảm</dt>
              <dd className="mt-1 text-sm text-rosewood">
                {percentFormat.format(selectedPromotion.discountPercent)}%
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Giảm tối đa</dt>
              <dd className="mt-1 text-sm text-rosewood">{formatMoney(selectedPromotion.maxDiscount)}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Đơn tối thiểu</dt>
              <dd className="mt-1 text-sm text-rosewood">{formatMoney(selectedPromotion.minOrderValue)}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Thời hạn</dt>
              <dd className="mt-1 text-sm text-rosewood">
                {formatDateRange(selectedPromotion.startDate, selectedPromotion.endDate)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Trạng thái</dt>
              <dd className="mt-1"><StatusBadge status={statusLabel(selectedPromotion.status)} /></dd>
            </div>
          </dl>
        ) : null}
      </Modal>

      <ConfirmDialog
        open={Boolean(promotionToDelete)}
        title="Xóa chương trình khuyến mãi?"
        description={promotionToDelete
          ? `Bạn có chắc muốn xóa ${promotionToDelete.promotionCode}? Không thể xóa chương trình khi vẫn còn liên kết với sản phẩm.`
          : ''}
        confirmLabel="Xóa khuyến mãi"
        onConfirm={confirmDelete}
        onClose={() => {
          if (!isDeleting) setPromotionToDelete(null)
        }}
        busy={isDeleting}
      />
    </div>
  )
}
