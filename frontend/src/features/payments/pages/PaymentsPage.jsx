import { useCallback, useEffect, useMemo, useState } from 'react'
import Button from '../../../components/Button.jsx'
import ConfirmDialog from '../../../components/ConfirmDialog.jsx'
import DataTable from '../../../components/DataTable.jsx'
import EmptyState from '../../../components/EmptyState.jsx'
import ErrorState from '../../../components/ErrorState.jsx'
import FormField from '../../../components/FormField.jsx'
import Icon from '../../../components/Icon.jsx'
import LoadingState from '../../../components/LoadingState.jsx'
import Modal from '../../../components/Modal.jsx'
import PageHeader from '../../../components/PageHeader.jsx'
import SearchFilter from '../../../components/SearchFilter.jsx'
import StatusBadge from '../../../components/StatusBadge.jsx'
import { getOrders } from '../../orders/services/orderService.js'
import {
  createPayment,
  getPayments,
  simulatePayment,
} from '../services/paymentService.js'
import { getUserFacingErrorMessage } from '../../../services/apiClient.js'

const inputClass = 'h-10 w-full rounded-xl border border-border bg-white px-3 text-sm text-rosewood outline-none transition focus:border-caramel'
const moneyFormat = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 })
const paymentMethods = [
  { value: 'CASH', label: 'Tiền mặt' },
  { value: 'CARD', label: 'Thẻ' },
  { value: 'EWALLET', label: 'Ví điện tử' },
]
const paymentMethodLabels = Object.fromEntries(
  paymentMethods.map(({ value, label }) => [value, label]),
)
const paymentStatusLabels = {
  PENDING: 'Chờ thanh toán',
  SUCCESS: 'Thành công',
  FAILED: 'Thất bại',
}
const orderStatusLabels = {
  PENDING: 'Chờ xác nhận',
  CONFIRMED: 'Đã xác nhận',
  COMPLETED: 'Hoàn tất',
  CANCELLED: 'Đã hủy',
}

function getErrorMessage(error) {
  return getUserFacingErrorMessage(error)
}

function formatMoney(value) {
  const amount = Number(value)
  return Number.isFinite(amount) ? `${moneyFormat.format(amount)} ₫` : '—'
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

function getPaymentStatusLabel(status) {
  return paymentStatusLabels[status] ?? 'Đang cập nhật'
}

function getOrderStatusLabel(status) {
  return orderStatusLabels[status] ?? 'Đang cập nhật'
}

export default function PaymentsPage({ onToast }) {
  const [payments, setPayments] = useState([])
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [methodFilter, setMethodFilter] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')
  const [orderId, setOrderId] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('CASH')
  const [simulation, setSimulation] = useState(null)
  const [simulating, setSimulating] = useState(false)

  const loadData = useCallback(async ({ signal } = {}) => {
    setLoading(true)
    setLoadError('')
    try {
      const [paymentResult, orderResult] = await Promise.all([
        getPayments({ signal }),
        getOrders({ signal }),
      ])
      if (!Array.isArray(paymentResult) || !Array.isArray(orderResult)) {
        throw new Error('Chưa thể tải thông tin thanh toán. Vui lòng thử lại.')
      }
      setPayments(paymentResult)
      setOrders(orderResult)
      return true
    } catch (error) {
      if (signal?.aborted || error.name === 'AbortError') return false
      setLoadError(getErrorMessage(error))
      return false
    } finally {
      if (!signal?.aborted) setLoading(false)
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    loadData({ signal: controller.signal })
    return () => controller.abort()
  }, [loadData])

  const paymentsByOrderId = useMemo(
    () => new Map(payments.map((payment) => [payment.orderId, payment])),
    [payments],
  )
  const ordersById = useMemo(
    () => new Map(orders.map((order) => [order.id, order])),
    [orders],
  )
  const payableOrders = useMemo(
    () => orders.filter((order) => (
      !paymentsByOrderId.has(order.id)
      && order.status !== 'CANCELLED'
      && order.status !== 'COMPLETED'
    )),
    [orders, paymentsByOrderId],
  )

  const filteredPayments = useMemo(() => payments.filter((payment) => {
    const order = ordersById.get(payment.orderId)
    const searchText = [
      order?.orderCode,
      payment.orderId,
      paymentMethodLabels[payment.paymentMethod],
    ].filter(Boolean).join(' ').toLocaleLowerCase('vi')

    return searchText.includes(query.trim().toLocaleLowerCase('vi'))
      && (!statusFilter || payment.status === statusFilter)
      && (!methodFilter || payment.paymentMethod === methodFilter)
  }), [payments, ordersById, query, statusFilter, methodFilter])

  const pendingCount = payments.filter((payment) => payment.status === 'PENDING').length
  const successfulAmount = payments
    .filter((payment) => payment.status === 'SUCCESS')
    .reduce((sum, payment) => sum + Number(payment.amount ?? 0), 0)
  const failedCount = payments.filter((payment) => payment.status === 'FAILED').length

  const submitPayment = async (event) => {
    event.preventDefault()
    if (!orderId) {
      setCreateError('Vui lòng chọn đơn hàng cần thanh toán.')
      return
    }
    if (!payableOrders.some((order) => order.id === Number(orderId))) {
      setCreateError('Đơn này không còn đủ điều kiện tạo thanh toán. Hãy tải lại dữ liệu.')
      return
    }

    setCreating(true)
    setCreateError('')
    try {
      const createdPayment = await createPayment({
        orderId: Number(orderId),
        paymentMethod,
      })
      setPayments((current) => [
        createdPayment,
        ...current.filter((payment) => payment.id !== createdPayment.id),
      ])
      setCreateOpen(false)
      setOrderId('')
      setPaymentMethod('CASH')
      onToast(`Đã tạo thanh toán chờ xử lý cho đơn #${createdPayment.orderId}.`)
    } catch (error) {
      setCreateError(getErrorMessage(error))
    } finally {
      setCreating(false)
    }
  }

  const applySimulation = async () => {
    if (!simulation) return
    setSimulating(true)
    try {
      const updatedPayment = await simulatePayment(simulation.payment.id, simulation.result)
      setPayments((current) => current.map((payment) => (
        payment.id === updatedPayment.id ? updatedPayment : payment
      )))
      const resultLoaded = await loadData()
      onToast(simulation.result === 'SUCCESS'
        ? resultLoaded
          ? `Giao dịch thử nghiệm của đơn #${updatedPayment.orderId} đã được ghi nhận thành công.`
          : 'Giao dịch thử nghiệm đã được ghi nhận; vui lòng tải lại trang để xem trạng thái đơn.'
        : 'Giao dịch thử nghiệm chưa thành công; trạng thái đơn hàng không thay đổi.')
      setSimulation(null)
    } catch (error) {
      onToast(`Chưa thể cập nhật kết quả thanh toán: ${getErrorMessage(error)}`)
    } finally {
      setSimulating(false)
    }
  }

  const columns = [
    {
      key: 'order',
      label: 'Đơn hàng',
      render: (payment) => {
        const order = ordersById.get(payment.orderId)
        return (
          <div>
            <p className="font-semibold text-rosewood">{order?.orderCode || `Đơn #${payment.orderId}`}</p>
            <p className="mt-1 text-[10px] text-muted">
              {formatDateTime(order?.orderDate)}
            </p>
          </div>
        )
      },
    },
    {
      key: 'amount',
      label: 'Số tiền',
      render: (payment) => <span className="whitespace-nowrap font-bold text-rosewood">{formatMoney(payment.amount)}</span>,
    },
    {
      key: 'paymentMethod',
      label: 'Phương thức',
      render: (payment) => paymentMethodLabels[payment.paymentMethod] ?? payment.paymentMethod,
    },
    {
      key: 'paymentStatus',
      label: 'Trạng thái thanh toán',
      render: (payment) => <StatusBadge status={getPaymentStatusLabel(payment.status)} />,
    },
    {
      key: 'orderStatus',
      label: 'Trạng thái đơn',
      render: (payment) => {
        const order = ordersById.get(payment.orderId)
        return <StatusBadge status={getOrderStatusLabel(order?.status)} />
      },
    },
    {
      key: 'paidAt',
      label: 'Thời điểm thanh toán',
      render: (payment) => formatDateTime(payment.paidAt),
    },
    {
      key: 'actions',
      label: 'Thanh toán thử nghiệm',
      render: (payment) => {
        const order = ordersById.get(payment.orderId)
        const canSimulate = (payment.status === 'PENDING' || payment.status === 'FAILED')
          && order
          && order.status !== 'CANCELLED'
          && order.status !== 'COMPLETED'

        return canSimulate
          ? (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation()
                  setSimulation({ payment, result: 'SUCCESS' })
                }}
                className="rounded-lg border border-success-line bg-success-soft px-2.5 py-2 text-[10px] font-semibold text-success transition hover:brightness-95"
              >
                Ghi nhận thành công
              </button>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation()
                  setSimulation({ payment, result: 'FAILED' })
                }}
                className="rounded-lg border border-danger-line bg-danger-soft px-2.5 py-2 text-[10px] font-semibold text-danger transition hover:brightness-95"
              >
                Ghi nhận chưa thành công
              </button>
            </div>
          )
          : <span className="text-[10px] text-muted">
              {payment.status === 'SUCCESS' ? 'Đã xử lý' : 'Không thể xử lý'}
            </span>
      },
    },
  ]

  const selectedOrder = payableOrders.find((order) => order.id === Number(orderId))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Thanh toán"
        actions={(
          <Button
            onClick={() => {
              setCreateError('')
              setCreateOpen(true)
            }}
            disabled={loading || Boolean(loadError) || payableOrders.length === 0}
          >
            <Icon name="plus" size={16} /> Tạo thanh toán
          </Button>
        )}
      />

      <section aria-label="Tổng quan thanh toán" className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-3">
        {[
          { label: 'Chờ xử lý', value: pendingCount, icon: 'clock' },
          { label: 'Giao dịch thử nghiệm đã xác nhận', value: formatMoney(successfulAmount), icon: 'check' },
          { label: 'Thất bại', value: failedCount, icon: 'close' },
        ].map((stat) => (
          <article key={stat.label} className="soft-shadow flex items-center justify-between rounded-2xl border border-border bg-paper p-4 sm:p-5">
            <div>
              <p className="text-[11px] font-semibold text-muted">{stat.label}</p>
              <p className="font-display mt-2 text-2xl font-semibold text-rosewood">{stat.value}</p>
            </div>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-caramel-soft text-rosewood">
              <Icon name={stat.icon} size={18} />
            </span>
          </article>
        ))}
      </section>

      <section className="soft-shadow overflow-hidden rounded-2xl border border-border bg-paper">
        <div className="flex flex-col gap-4 border-b border-border p-4 sm:p-5">
          <div>
            <h2 className="font-display text-lg font-semibold text-rosewood">Danh sách thanh toán</h2>
            <p className="mt-1 text-[11px] text-muted">{filteredPayments.length} trên {payments.length} thanh toán</p>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <SearchFilter
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Tìm mã đơn hoặc phương thức..."
            />
            <select
              aria-label="Lọc trạng thái thanh toán"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className={`${inputClass} text-xs`}
            >
              <option value="">Tất cả trạng thái</option>
              {Object.entries(paymentStatusLabels).map(([status, label]) => (
                <option key={status} value={status}>{label}</option>
              ))}
            </select>
            <select
              aria-label="Lọc phương thức thanh toán"
              value={methodFilter}
              onChange={(event) => setMethodFilter(event.target.value)}
              className={`${inputClass} text-xs`}
            >
              <option value="">Tất cả phương thức</option>
              {paymentMethods.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        </div>

        {loading
          ? <LoadingState label="Đang tải thông tin thanh toán..." />
          : loadError
            ? <ErrorState
                title="Không thể tải dữ liệu thanh toán"
                description={loadError}
                onRetry={() => loadData()}
              />
            : filteredPayments.length === 0
              ? (
                <EmptyState
                  title="Chưa có thanh toán phù hợp"
                  description="Tạo thanh toán từ một đơn hàng đủ điều kiện hoặc thay đổi bộ lọc."
                />
              )
              : <DataTable
                  columns={columns}
                  rows={filteredPayments}
                  rowKey={(payment) => payment.id}
                  ariaLabel="Danh sách thanh toán"
                />}
      </section>

      <p className="rounded-xl border border-warning-line bg-warning-soft px-4 py-3 text-xs leading-5 text-warning">
        Chế độ thanh toán thử nghiệm không kết nối ngân hàng, thẻ hoặc ví điện tử thật.
      </p>

      <Modal
        open={createOpen}
        title="Tạo thanh toán"
        onClose={() => !creating && setCreateOpen(false)}
        closeDisabled={creating}
      >
        <form onSubmit={submitPayment} className="space-y-4">
          <FormField id="payment-order" label="Đơn hàng" required>
            <select
              id="payment-order"
              required
              value={orderId}
              onChange={(event) => setOrderId(event.target.value)}
              className={inputClass}
            >
              <option value="">Chọn đơn hàng chưa có thanh toán</option>
              {payableOrders.map((order) => (
                <option key={order.id} value={order.id}>
                  {order.orderCode || `Đơn #${order.id}`} · {formatMoney(order.finalAmount)}
                </option>
              ))}
            </select>
          </FormField>

          {selectedOrder && (
            <div className="rounded-xl border border-border bg-petal px-4 py-3 text-xs">
              <div className="flex justify-between gap-3">
                <span className="text-muted">Số tiền dự kiến từ đơn hàng</span>
                <strong className="text-rosewood">{formatMoney(selectedOrder.finalAmount)}</strong>
              </div>
            </div>
          )}

          <FormField id="payment-method" label="Phương thức thanh toán" required>
            <select
              id="payment-method"
              required
              value={paymentMethod}
              onChange={(event) => setPaymentMethod(event.target.value)}
              className={inputClass}
            >
              {paymentMethods.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </FormField>

          <p className="text-[11px] leading-5 text-muted">
            Số tiền và trạng thái thanh toán được lấy từ đơn hàng; biểu mẫu này không thay đổi số tiền.
          </p>
          {createError && <p role="alert" className="text-sm text-danger">{createError}</p>}

          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <Button type="button" variant="secondary" disabled={creating} onClick={() => setCreateOpen(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={creating || payableOrders.length === 0}>
              {creating ? 'Đang tạo...' : 'Tạo thanh toán'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(simulation)}
        title={simulation?.result === 'SUCCESS' ? 'Ghi nhận giao dịch thử nghiệm thành công?' : 'Ghi nhận giao dịch thử nghiệm chưa thành công?'}
        description={simulation?.result === 'SUCCESS'
          ? `Giao dịch thử nghiệm của đơn #${simulation?.payment.orderId} sẽ được ghi nhận thành công; đơn đang chờ xác nhận sẽ được xác nhận.`
          : `Giao dịch thử nghiệm của đơn #${simulation?.payment.orderId} sẽ được ghi nhận chưa thành công; trạng thái đơn hàng không đổi.`}
        confirmLabel={simulation?.result === 'SUCCESS' ? 'Xác nhận thành công' : 'Xác nhận thất bại'}
        confirmVariant={simulation?.result === 'SUCCESS' ? 'primary' : 'danger'}
        busy={simulating}
        onClose={() => !simulating && setSimulation(null)}
        onConfirm={applySimulation}
      />
    </div>
  )
}
