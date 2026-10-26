import { useCallback, useEffect, useMemo, useState } from 'react'
import Button from '../../../components/Button.jsx'
import ConfirmDialog from '../../../components/ConfirmDialog.jsx'
import DataTable from '../../../components/DataTable.jsx'
import ErrorState from '../../../components/ErrorState.jsx'
import FormField from '../../../components/FormField.jsx'
import Icon from '../../../components/Icon.jsx'
import LoadingState from '../../../components/LoadingState.jsx'
import Modal from '../../../components/Modal.jsx'
import PaginationControls from '../../../components/PaginationControls.jsx'
import StatusBadge from '../../../components/StatusBadge.jsx'
import { getCustomers } from '../../customers/services/customerService.js'
import { getProducts } from '../../products/services/productService.js'
import {
  createOrder,
  cancelOrder,
  getEmployees,
  getOrderById,
  markOrderDelivered,
  completeOrder,
  updateOrderItemQuantity,
  getOrderPage,
} from '../services/orderService.js'

const inputClass = 'h-10 w-full rounded-xl border border-border bg-white px-3 text-sm text-rosewood outline-none transition focus:border-caramel'
const moneyFormat = new Intl.NumberFormat('vi-VN', {
  maximumFractionDigits: 2,
})
const orderStatuses = ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED']
const statusLabels = {
  PENDING: 'Chờ xác nhận',
  CONFIRMED: 'Đã xác nhận',
  COMPLETED: 'Hoàn tất',
  CANCELLED: 'Đã hủy',
}
const deliveryLabels = {
  NOT_REQUIRED: 'Nhận tại quầy',
  PENDING: 'Chờ giao',
  DELIVERED: 'Đã giao',
}
const emptyForm = {
  customerId: '',
  employeeId: '',
  deliveryAddress: '',
  items: [{ productId: '', quantity: '1' }],
}

function getErrorMessage(error) {
  return error instanceof Error ? error.message : 'Đã xảy ra lỗi không xác định.'
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

function getStatusLabel(status) {
  return statusLabels[status] ?? status ?? 'Không rõ'
}

function getDeliveryLabel(status) {
  return deliveryLabels[status] ?? status ?? 'Không rõ'
}

function validateForm(form, productsById) {
  if (!form.customerId) return 'Vui lòng chọn khách hàng đang hoạt động.'
  if (!form.employeeId) return 'Vui lòng chọn nhân viên đang hoạt động.'
  if (form.deliveryAddress.trim().length > 255) {
    return 'Địa chỉ giao hàng không được vượt quá 255 ký tự.'
  }
  if (form.items.length === 0) return 'Đơn hàng phải có ít nhất một sản phẩm.'

  const productIds = new Set()
  for (const item of form.items) {
    if (!item.productId) return 'Vui lòng chọn sản phẩm cho từng dòng hàng.'
    if (productIds.has(item.productId)) {
      return 'Mỗi sản phẩm chỉ được xuất hiện một lần trong đơn hàng.'
    }
    productIds.add(item.productId)

    const quantity = Number(item.quantity)
    if (!Number.isInteger(quantity) || quantity <= 0) {
      return 'Số lượng mỗi sản phẩm phải là số nguyên lớn hơn 0.'
    }
    const product = productsById.get(Number(item.productId))
    if (!product || quantity > Number(product.quantity)) {
      return `Sản phẩm ${product?.name ?? ''} không đủ tồn kho cho số lượng đã chọn.`
    }
  }

  return ''
}

export default function OrdersPage({ onToast }) {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [catalogs, setCatalogs] = useState({
    customers: [],
    employees: [],
    products: [],
  })
  const [catalogLoading, setCatalogLoading] = useState(true)
  const [catalogError, setCatalogError] = useState('')
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [sort, setSort] = useState('orderDate')
  const [direction, setDirection] = useState('DESC')
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(20)
  const [pageInfo, setPageInfo] = useState({ totalElements: 0, totalPages: 0 })
  const [createOpen, setCreateOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')
  const [form, setForm] = useState(emptyForm)
  const [selectedOrderId, setSelectedOrderId] = useState(null)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState('')
  const [editingOrderItemId, setEditingOrderItemId] = useState(null)
  const [quantityDraft, setQuantityDraft] = useState('')
  const [updatingOrderItem, setUpdatingOrderItem] = useState(false)
  const [orderItemError, setOrderItemError] = useState('')
  const [cancelTarget, setCancelTarget] = useState(null)
  const [cancellingOrder, setCancellingOrder] = useState(false)
  const [cancelError, setCancelError] = useState('')
  const [updatingOrderStatus, setUpdatingOrderStatus] = useState(false)
  const [orderStatusError, setOrderStatusError] = useState('')

  const loadOrders = useCallback(async ({ signal, requestedPage = page } = {}) => {
    setLoading(true)
    setLoadError('')
    try {
      const result = await getOrderPage({
        page: requestedPage,
        size: pageSize,
        keyword: query,
        status: statusFilter,
        dateFrom,
        dateTo,
        sort,
        direction,
        signal,
      })
      if (!Array.isArray(result?.content)
        || !Number.isInteger(result.page)
        || !Number.isInteger(result.size)
        || !Number.isInteger(result.totalPages)
        || !Number.isInteger(result.totalElements)) {
        throw new Error('API danh sách đơn hàng trả về dữ liệu không đúng định dạng.')
      }
      if (result.totalPages === 0 ? requestedPage > 0 : requestedPage >= result.totalPages) {
        setPage(result.totalPages === 0 ? 0 : result.totalPages - 1)
        return
      }
      setOrders(result.content)
      setPageInfo(result)
    } catch (error) {
      if (signal?.aborted || error.name === 'AbortError') return
      setLoadError(getErrorMessage(error))
    } finally {
      if (!signal?.aborted) setLoading(false)
    }
  }, [dateFrom, dateTo, direction, page, pageSize, query, sort, statusFilter])

  const loadCatalogs = useCallback(async ({ signal } = {}) => {
    setCatalogLoading(true)
    setCatalogError('')
    try {
      const [customers, employees, products] = await Promise.all([
        getCustomers({ signal }),
        getEmployees({ signal }),
        getProducts({ signal }),
      ])
      if (![customers, employees, products].every(Array.isArray)) {
        throw new Error('API khách hàng, nhân viên hoặc sản phẩm trả về dữ liệu không đúng định dạng.')
      }
      setCatalogs({
        customers,
        employees,
        products,
      })
    } catch (error) {
      if (signal?.aborted || error.name === 'AbortError') return
      setCatalogError(getErrorMessage(error))
    } finally {
      if (!signal?.aborted) setCatalogLoading(false)
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    loadOrders({ signal: controller.signal })
    return () => controller.abort()
  }, [loadOrders])

  useEffect(() => {
    const controller = new AbortController()
    loadCatalogs({ signal: controller.signal })
    return () => controller.abort()
  }, [loadCatalogs])

  useEffect(() => {
    if (selectedOrderId == null) return undefined

    const controller = new AbortController()
    setSelectedOrder(null)
    setDetailLoading(true)
    setDetailError('')
    setEditingOrderItemId(null)
    setQuantityDraft('')
    setOrderItemError('')
    getOrderById(selectedOrderId, { signal: controller.signal })
      .then(setSelectedOrder)
      .catch((error) => {
        if (!controller.signal.aborted && error.name !== 'AbortError') {
          setDetailError(getErrorMessage(error))
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setDetailLoading(false)
      })

    return () => controller.abort()
  }, [selectedOrderId])

  const activeCustomers = useMemo(
    () => catalogs.customers.filter((customer) => customer.status === true),
    [catalogs.customers],
  )
  const activeEmployees = useMemo(
    () => catalogs.employees.filter((employee) => employee.status === true),
    [catalogs.employees],
  )
  const customersById = useMemo(
    () => new Map(catalogs.customers.map((customer) => [customer.id, customer])),
    [catalogs.customers],
  )
  const currentEmployee = useMemo(
    () => activeEmployees.find((employee) => employee.currentUser === true),
    [activeEmployees],
  )
  const activeProducts = useMemo(
    () => catalogs.products.filter(
      (product) => product.status === true && Number(product.quantity) > 0,
    ),
    [catalogs.products],
  )
  const employeesById = useMemo(
    () => new Map(catalogs.employees.map((employee) => [employee.id, employee])),
    [catalogs.employees],
  )
  const productsById = useMemo(
    () => new Map(catalogs.products.map((product) => [product.id, product])),
    [catalogs.products],
  )

  const filteredOrders = orders
  const activeOrders = orders.filter((order) => (
    order.status === 'PENDING' || order.status === 'CONFIRMED'
  ))
  const completedOrders = orders.filter((order) => order.status === 'COMPLETED')
  const cancelledOrders = orders.filter((order) => order.status === 'CANCELLED')

  const estimatedTotal = form.items.reduce((sum, item) => {
    const product = productsById.get(Number(item.productId))
    const quantity = Number(item.quantity)
    if (!product || !Number.isInteger(quantity) || quantity <= 0) return sum
    return sum + Number(product.price ?? 0) * quantity
  }, 0)

  const updateItem = (index, key, value) => {
    setForm((current) => ({
      ...current,
      items: current.items.map((item, itemIndex) => (
        itemIndex === index ? { ...item, [key]: value } : item
      )),
    }))
  }

  const openCreateForm = () => {
    setCreateError('')
    setForm({
      ...emptyForm,
      employeeId: currentEmployee ? String(currentEmployee.id) : '',
    })
    setCreateOpen(true)
  }

  const submitOrder = async (event) => {
    event.preventDefault()
    const validationError = validateForm(form, productsById)
    if (validationError) {
      setCreateError(validationError)
      return
    }

    setCreating(true)
    setCreateError('')
    try {
      const createdOrder = await createOrder({
        customerId: Number(form.customerId),
        employeeId: Number(form.employeeId),
        deliveryAddress: form.deliveryAddress.trim() || null,
        // Client chỉ gửi mã sản phẩm và số lượng; backend tự lấy giá và tính tiền.
        items: form.items.map((item) => ({
          productId: Number(item.productId),
          quantity: Number(item.quantity),
        })),
      })
      setPage(0)
      await loadOrders({ requestedPage: 0 })
      setCreateOpen(false)
      setForm(emptyForm)
      await loadCatalogs()
      onToast(`Đã tạo đơn hàng ${createdOrder.orderCode}.`)
    } catch (error) {
      setCreateError(getErrorMessage(error))
    } finally {
      setCreating(false)
    }
  }

  const saveOrderItemQuantity = async (item) => {
    const quantity = Number(quantityDraft)
    if (!Number.isInteger(quantity) || quantity <= 0) {
      setOrderItemError('Số lượng phải là số nguyên lớn hơn 0.')
      return
    }

    if (!selectedOrder || selectedOrder.status !== 'PENDING') {
      setOrderItemError('Chỉ có thể sửa chi tiết khi đơn hàng còn PENDING.')
      return
    }

    setUpdatingOrderItem(true)
    setOrderItemError('')
    let updateSucceeded = false
    try {
      await updateOrderItemQuantity(item.id, quantity)
      updateSucceeded = true
      const refreshedOrder = await getOrderById(selectedOrder.id)
      setSelectedOrder(refreshedOrder)
      setOrders((current) => current.map((order) => (
        order.id === refreshedOrder.id ? refreshedOrder : order
      )))
      await loadOrders()
      await loadCatalogs()
      setEditingOrderItemId(null)
      setQuantityDraft('')
      onToast(`Đã cập nhật số lượng và đồng bộ tổng tiền đơn ${refreshedOrder.orderCode}.`)
    } catch (error) {
      setOrderItemError(updateSucceeded
        ? `Số lượng đã được lưu nhưng không tải lại được tổng tiền: ${getErrorMessage(error)}`
        : getErrorMessage(error))
    } finally {
      setUpdatingOrderItem(false)
    }
  }

  const confirmCancelOrder = async () => {
    if (!cancelTarget) return
    setCancellingOrder(true)
    setCancelError('')
    try {
      const cancelledOrder = await cancelOrder(cancelTarget.id)
      setOrders((current) => current.map((order) => (
        order.id === cancelledOrder.id ? cancelledOrder : order
      )))
      setSelectedOrder(cancelledOrder)
      setCancelTarget(null)
      await loadOrders()
      await loadCatalogs()
      onToast(`Đơn ${cancelledOrder.orderCode} đã hủy; tồn kho được hoàn lại.`)
    } catch (error) {
      setCancelError(getErrorMessage(error))
      setCancelTarget(null)
    } finally {
      setCancellingOrder(false)
    }
  }

  const applyOrderStatusChange = async (updateOrder, successMessage) => {
    if (!displayedOrder || updatingOrderStatus) return
    setUpdatingOrderStatus(true)
    setOrderStatusError('')
    try {
      const updatedOrder = await updateOrder(displayedOrder.id)
      setSelectedOrder(updatedOrder)
      setOrders((current) => current.map((order) => (
        order.id === updatedOrder.id ? updatedOrder : order
      )))
      await loadOrders()
      onToast(successMessage)
    } catch (error) {
      setOrderStatusError(getErrorMessage(error))
    } finally {
      setUpdatingOrderStatus(false)
    }
  }

  const columns = [
    {
      key: 'orderCode',
      label: 'Mã đơn',
      render: (order) => (
        <span className="whitespace-nowrap font-bold text-rosewood">{order.orderCode || `#${order.id}`}</span>
      ),
    },
    {
      key: 'customer',
      label: 'Khách hàng',
      render: (order) => {
        const customer = customersById.get(order.customerId)
        return (
          <div className="min-w-[145px]">
            <p className="font-semibold text-rosewood">{customer?.fullName || `Khách hàng #${order.customerId ?? '—'}`}</p>
            <p className="mt-1 text-[10px] text-muted">{customer?.phone || '—'}</p>
          </div>
        )
      },
    },
    {
      key: 'orderDate',
      label: 'Thời gian',
      render: (order) => <span className="whitespace-nowrap">{formatDateTime(order.orderDate)}</span>,
    },
    {
      key: 'items',
      label: 'Số món',
      render: (order) => (
        <span className="whitespace-nowrap">
          {(order.items ?? []).reduce((count, item) => count + Number(item.quantity ?? 0), 0)} món
        </span>
      ),
    },
    {
      key: 'finalAmount',
      label: 'Tổng thanh toán',
      render: (order) => (
        <span className="whitespace-nowrap font-bold text-rosewood">{formatMoney(order.finalAmount)}</span>
      ),
    },
    {
      key: 'deliveryStatus',
      label: 'Giao hàng',
      render: (order) => <StatusBadge status={getDeliveryLabel(order.deliveryStatus)} />,
    },
    {
      key: 'status',
      label: 'Trạng thái đơn',
      render: (order) => <StatusBadge status={getStatusLabel(order.status)} />,
    },
    {
      key: 'details',
      label: '',
      headerClassName: 'text-right',
      cellClassName: 'text-right',
      render: (order) => (
        <button
          type="button"
          aria-label={`Xem chi tiết ${order.orderCode || order.id}`}
          onClick={(event) => {
            event.stopPropagation()
            setSelectedOrderId(order.id)
          }}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-rosewood transition hover:bg-petal"
        >
          <Icon name="chevronRight" size={15} />
        </button>
      ),
    },
  ]

  const displayedOrder = selectedOrder
    ?? orders.find((order) => order.id === selectedOrderId)

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-[11px] font-semibold tracking-wide text-muted">Theo dõi bán hàng</p>
          <h2 className="font-display mt-1 text-[28px] text-rosewood sm:text-[32px]">Đơn hàng</h2>
          <p className="mt-1 text-xs text-muted">Tạo đơn, tra cứu chi tiết và kiểm tra số tiền do hệ thống tính.</p>
        </div>
        <Button
          onClick={openCreateForm}
          disabled={catalogLoading || Boolean(catalogError) || activeProducts.length === 0}
        >
          <Icon name="plus" size={16} /> Tạo đơn hàng
        </Button>
      </div>

      <section aria-label="Tổng quan đơn hàng phù hợp" className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 2xl:grid-cols-4">
        {[
          { label: 'Đơn phù hợp', value: pageInfo.totalElements, icon: 'receipt' },
          { label: 'Đang xử lý trên trang', value: activeOrders.length, icon: 'clock' },
          { label: 'Hoàn tất trên trang', value: completedOrders.length, icon: 'check' },
          { label: 'Đã hủy trên trang', value: cancelledOrders.length, icon: 'receipt' },
        ].map((stat) => (
          <article key={stat.label} className="soft-shadow flex items-center justify-between rounded-2xl border border-border bg-paper p-4 sm:p-5">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-muted">{stat.label}</p>
              <p className={`font-display mt-2 truncate font-semibold text-rosewood ${stat.label.startsWith('Doanh thu') ? 'text-lg sm:text-xl' : 'text-2xl'}`}>{stat.value}</p>
            </div>
            <span className="ml-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-caramel-soft text-rosewood">
              <Icon name={stat.icon} size={18} />
            </span>
          </article>
        ))}
      </section>

      {catalogError && (
        <ErrorState
          title="Không tải được dữ liệu tạo đơn"
          description={catalogError}
          onRetry={() => loadCatalogs()}
          retryLabel="Tải lại dữ liệu"
        />
      )}

      <section className="soft-shadow overflow-hidden rounded-2xl border border-border bg-paper">
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:p-5">
          <div>
            <h3 className="font-display text-lg font-semibold text-rosewood">Danh sách đơn hàng</h3>
            <p className="mt-1 text-[11px] text-muted">{pageInfo.totalElements} đơn hàng phù hợp</p>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-6">
            <label className="relative">
              <span className="sr-only">Tìm mã đơn hoặc khách hàng</span>
              <Icon name="search" size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-rosewood" />
              <input
                value={query}
                onChange={(event) => { setQuery(event.target.value); setPage(0) }}
                placeholder="Mã đơn hoặc khách hàng..."
                className={`${inputClass} pl-9 text-[11px]`}
              />
            </label>
            <select
              aria-label="Lọc trạng thái đơn hàng"
              value={statusFilter}
              onChange={(event) => { setStatusFilter(event.target.value); setPage(0) }}
              className={`${inputClass} text-[11px]`}
            >
              <option value="">Tất cả trạng thái</option>
              {orderStatuses.map((status) => <option key={status} value={status}>{getStatusLabel(status)}</option>)}
            </select>
            <label className="flex items-center gap-2 rounded-xl border border-border bg-white px-3">
              <span className="whitespace-nowrap text-[10px] font-semibold text-rosewood">Từ</span>
              <input
                aria-label="Từ ngày"
                type="date"
                value={dateFrom}
                max={dateTo || undefined}
                onChange={(event) => { setDateFrom(event.target.value); setPage(0) }}
                className="min-w-0 flex-1 bg-transparent text-[10px] text-rosewood outline-none"
              />
            </label>
            <label className="flex items-center gap-2 rounded-xl border border-border bg-white px-3">
              <span className="whitespace-nowrap text-[10px] font-semibold text-rosewood">Đến</span>
              <input
                aria-label="Đến ngày"
                type="date"
                value={dateTo}
                min={dateFrom || undefined}
                onChange={(event) => { setDateTo(event.target.value); setPage(0) }}
                className="min-w-0 flex-1 bg-transparent text-[10px] text-rosewood outline-none"
              />
            </label>
            <select aria-label="Sắp xếp đơn hàng theo" value={sort} onChange={(event) => { setSort(event.target.value); setPage(0) }} className={`${inputClass} text-[11px]`}>
              <option value="orderDate">Ngày đặt</option>
              <option value="orderCode">Mã đơn</option>
              <option value="totalAmount">Tổng tiền</option>
              <option value="status">Trạng thái</option>
            </select>
            <select aria-label="Chiều sắp xếp đơn hàng" value={direction} onChange={(event) => { setDirection(event.target.value); setPage(0) }} className={`${inputClass} text-[11px]`}>
              <option value="ASC">Tăng dần</option>
              <option value="DESC">Giảm dần</option>
            </select>
          </div>
        </div>
        {loading
          ? <LoadingState label="Đang tải đơn hàng..." />
          : loadError
            ? <ErrorState
                title="Không thể tải danh sách đơn hàng"
                description={loadError}
                onRetry={() => loadOrders()}
              />
            : (
              <DataTable
                columns={columns}
                rows={filteredOrders}
                rowKey={(order) => order.id}
                onRowClick={(order) => setSelectedOrderId(order.id)}
                emptyTitle="Chưa có đơn hàng phù hợp"
                emptyDescription="Thử thay đổi bộ lọc hoặc tạo đơn hàng mới."
              />
            )}
        {!loading && !loadError && (
          <PaginationControls
            page={page}
            size={pageSize}
            totalElements={pageInfo.totalElements}
            totalPages={pageInfo.totalPages}
            onPageChange={setPage}
            onSizeChange={(value) => { setPageSize(value); setPage(0) }}
          />
        )}
      </section>

      <Modal
        open={createOpen}
        title="Tạo đơn hàng"
        onClose={() => !creating && setCreateOpen(false)}
        size="max-w-3xl"
        closeDisabled={creating}
      >
        {catalogLoading
          ? <LoadingState label="Đang tải khách hàng, nhân viên và sản phẩm..." />
          : catalogError
            ? <ErrorState
                title="Không thể tải dữ liệu tạo đơn"
                description={catalogError}
                onRetry={() => loadCatalogs()}
              />
            : (
              <form onSubmit={submitOrder} className="space-y-5">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField id="order-customer" label="Khách hàng" required>
                    <select
                      id="order-customer"
                      required
                      value={form.customerId}
                      onChange={(event) => setForm((current) => ({ ...current, customerId: event.target.value }))}
                      className={inputClass}
                    >
                      <option value="">Chọn khách hàng</option>
                      {activeCustomers.map((customer) => (
                        <option key={customer.id} value={customer.id}>
                          {customer.fullName} · {customer.phone}
                        </option>
                      ))}
                    </select>
                  </FormField>
                  <FormField id="order-employee" label="Người lập đơn (tài khoản đang đăng nhập)" required>
                    <input
                      id="order-employee"
                      type="text"
                      readOnly
                      value={currentEmployee?.fullName ?? ''}
                      placeholder="Tài khoản chưa có hồ sơ nhân viên"
                      disabled={!currentEmployee}
                      className={inputClass}
                    />
                  </FormField>
                </div>
                {!currentEmployee && (
                  <p role="alert" className="text-xs text-danger">
                    Tài khoản chưa được liên kết với hồ sơ nhân viên đang hoạt động. Vui lòng nhờ quản trị viên liên kết trước khi tạo đơn.
                  </p>
                )}

                <FormField id="order-address" label="Địa chỉ giao hàng">
                  <input
                    id="order-address"
                    maxLength={255}
                    value={form.deliveryAddress}
                    onChange={(event) => setForm((current) => ({ ...current, deliveryAddress: event.target.value }))}
                    placeholder="Để trống nếu khách nhận tại quầy"
                    className={inputClass}
                  />
                </FormField>

                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold text-rosewood">Sản phẩm</h3>
                      <p className="mt-1 text-[11px] text-muted">Giá bên dưới chỉ để tham khảo; server tự lấy giá chính thức.</p>
                    </div>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setForm((current) => ({
                        ...current,
                        items: [...current.items, { productId: '', quantity: '1' }],
                      }))}
                    >
                      <Icon name="plus" size={15} /> Thêm dòng
                    </Button>
                  </div>

                  {form.items.map((item, index) => {
                    const selectedProduct = productsById.get(Number(item.productId))
                    return (
                      <div key={`order-item-${index}`} className="grid grid-cols-[minmax(0,1fr)_100px_40px] items-end gap-2">
                        <FormField id={`order-product-${index}`} label={`Sản phẩm ${index + 1}`} required>
                          <select
                            id={`order-product-${index}`}
                            required
                            value={item.productId}
                            onChange={(event) => updateItem(index, 'productId', event.target.value)}
                            className={inputClass}
                          >
                            <option value="">Chọn sản phẩm</option>
                            {activeProducts.map((product) => (
                              <option key={product.id} value={product.id}>
                                {product.name} · {formatMoney(product.price)} · Tồn {product.quantity}
                              </option>
                            ))}
                          </select>
                        </FormField>
                        <FormField id={`order-quantity-${index}`} label="Số lượng" required>
                          <input
                            id={`order-quantity-${index}`}
                            type="number"
                            min="1"
                            max={selectedProduct?.quantity ?? undefined}
                            step="1"
                            required
                            value={item.quantity}
                            onChange={(event) => updateItem(index, 'quantity', event.target.value)}
                            className={inputClass}
                          />
                        </FormField>
                        <button
                          type="button"
                          aria-label={`Xóa dòng sản phẩm ${index + 1}`}
                          onClick={() => setForm((current) => ({
                            ...current,
                            items: current.items.filter((_, itemIndex) => itemIndex !== index),
                          }))}
                          className="flex h-10 w-10 items-center justify-center rounded-xl text-danger transition hover:bg-danger-soft"
                        >
                          <Icon name="trash" size={16} />
                        </button>
                        {selectedProduct && (
                          <p className="col-span-3 -mt-1 text-right text-[10px] text-muted">
                            Giá tham khảo: {formatMoney(selectedProduct.price)} / {selectedProduct.unit || 'đơn vị'}
                          </p>
                        )}
                      </div>
                    )
                  })}
                </div>

                <div className="flex flex-col gap-1 rounded-xl border border-border bg-petal px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                  <span className="text-muted">Tổng tạm tính (không gửi lên server)</span>
                  <strong className="text-rosewood">{formatMoney(estimatedTotal)}</strong>
                </div>

                {createError && <p role="alert" className="text-sm text-danger">{createError}</p>}

                <div className="flex justify-end gap-2 border-t border-border pt-4">
                  <Button type="button" variant="secondary" disabled={creating} onClick={() => setCreateOpen(false)}>
                    Hủy
                  </Button>
                  <Button type="submit" disabled={creating || activeCustomers.length === 0 || !currentEmployee || activeProducts.length === 0}>
                    {creating ? 'Đang tạo...' : 'Tạo đơn'}
                  </Button>
                </div>
              </form>
            )}
      </Modal>

      <Modal
        open={selectedOrderId != null}
        title={displayedOrder ? `Chi tiết đơn ${displayedOrder.orderCode || displayedOrder.id}` : 'Chi tiết đơn hàng'}
        onClose={() => setSelectedOrderId(null)}
        size="max-w-2xl"
      >
        {detailLoading
          ? <LoadingState label="Đang tải chi tiết đơn hàng..." />
          : detailError
            ? <ErrorState title="Không thể tải chi tiết đơn" description={detailError} />
            : displayedOrder && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 gap-3 rounded-2xl border border-border bg-petal p-4 sm:grid-cols-2">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">Khách hàng</p>
                    <p className="mt-1 text-xs font-bold text-rosewood">
                      {customersById.get(displayedOrder.customerId)?.fullName ?? `Khách hàng #${displayedOrder.customerId ?? '—'}`}
                    </p>
                    <p className="mt-1 text-[10px] text-rosewood">
                      {customersById.get(displayedOrder.customerId)?.phone ?? '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">Nhân viên lập đơn</p>
                    <p className="mt-1 text-xs font-bold text-rosewood">
                      {employeesById.get(displayedOrder.employeeId)?.fullName ?? `Nhân viên #${displayedOrder.employeeId ?? '—'}`}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">Thời gian</p>
                    <p className="mt-1 text-xs font-bold text-rosewood">{formatDateTime(displayedOrder.orderDate)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">Trạng thái</p>
                    <div className="mt-1"><StatusBadge status={getStatusLabel(displayedOrder.status)} /></div>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">Giao hàng</p>
                    <div className="mt-1"><StatusBadge status={getDeliveryLabel(displayedOrder.deliveryStatus)} /></div>
                  </div>
                  {displayedOrder.deliveryAddress && (
                    <div className="sm:col-span-2">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">Địa chỉ giao</p>
                      <p className="mt-1 text-xs text-rosewood">{displayedOrder.deliveryAddress}</p>
                    </div>
                  )}
                  {displayedOrder.promotionCode && (
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">Mã khuyến mãi</p>
                      <p className="mt-1 text-xs text-rosewood">{displayedOrder.promotionCode}</p>
                    </div>
                  )}
                  {displayedOrder.note && (
                    <div className="sm:col-span-2">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">Ghi chú</p>
                      <p className="mt-1 whitespace-pre-wrap text-xs text-rosewood">{displayedOrder.note}</p>
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="font-display text-base font-semibold text-rosewood">Sản phẩm trong đơn</h3>
                  <div className="mt-2 divide-y divide-border rounded-xl border border-border bg-white px-4">
                    {(displayedOrder.items ?? []).map((item) => (
                      <div key={item.id} className="flex flex-col gap-2 py-3 text-[11px] sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <p className="font-semibold text-rosewood">
                            {item.productName || `Sản phẩm #${item.productId ?? '—'}`}
                          </p>
                          <p className="mt-1 text-[10px] text-muted">
                            {item.quantity} × {formatMoney(item.unitPrice)}
                          </p>
                        </div>
                        <div className="flex items-center justify-between gap-3 sm:justify-end">
                          <span className="whitespace-nowrap font-bold text-rosewood">{formatMoney(item.lineTotal)}</span>
                          {displayedOrder.status === 'PENDING' && (
                            editingOrderItemId === item.id
                              ? (
                                <div className="flex items-center gap-2">
                                  <input
                                    aria-label={`Số lượng ${item.productName || item.productId}`}
                                    type="number"
                                    min="1"
                                    step="1"
                                    value={quantityDraft}
                                    onChange={(event) => setQuantityDraft(event.target.value)}
                                    disabled={updatingOrderItem}
                                    className="h-8 w-20 rounded-lg border border-border px-2 text-xs text-rosewood outline-none focus:border-caramel"
                                  />
                                  <button
                                    type="button"
                                    disabled={updatingOrderItem}
                                    onClick={() => saveOrderItemQuantity(item)}
                                    className="rounded-lg bg-rosewood px-3 py-2 font-semibold text-white disabled:opacity-50"
                                  >
                                    {updatingOrderItem ? 'Đang lưu' : 'Lưu'}
                                  </button>
                                  <button
                                    type="button"
                                    disabled={updatingOrderItem}
                                    onClick={() => {
                                      setEditingOrderItemId(null)
                                      setOrderItemError('')
                                    }}
                                    className="rounded-lg border border-border px-3 py-2 font-semibold text-rosewood disabled:opacity-50"
                                  >
                                    Hủy
                                  </button>
                                </div>
                              )
                              : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingOrderItemId(item.id)
                                    setQuantityDraft(String(item.quantity))
                                    setOrderItemError('')
                                  }}
                                  className="rounded-lg border border-border px-3 py-2 font-semibold text-rosewood transition hover:bg-petal"
                                >
                                  Sửa số lượng
                                </button>
                              )
                          )}
                        </div>
                      </div>
                    ))}
                    {orderItemError && (
                      <p role="alert" className="border-t border-border py-3 text-xs text-danger">
                        {orderItemError}
                      </p>
                    )}
                    <div className="space-y-2 py-3 text-xs">
                      <div className="flex justify-between">
                        <span>Tổng trước giảm</span><span>{formatMoney(displayedOrder.totalAmount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Giảm giá</span><span>- {formatMoney(displayedOrder.discountAmount)}</span>
                      </div>
                      <div className="flex justify-between border-t border-border pt-2 font-bold text-rosewood">
                        <span>Tổng thanh toán</span><span>{formatMoney(displayedOrder.finalAmount)}</span>
                      </div>
                    </div>
                  </div>
                </div>
                {displayedOrder.status === 'PENDING' && (
                  <div className="flex justify-end border-t border-border pt-4">
                    <Button
                      variant="danger"
                      onClick={() => {
                        setCancelError('')
                        setCancelTarget(displayedOrder)
                      }}
                    >
                      Hủy đơn và hoàn tồn kho
                    </Button>
                  </div>
                )}
                {displayedOrder.status === 'CONFIRMED' && (
                  <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-4">
                    {displayedOrder.deliveryStatus === 'PENDING' && (
                      <Button
                        disabled={updatingOrderStatus}
                        onClick={() => applyOrderStatusChange(
                          markOrderDelivered,
                          `Đơn ${displayedOrder.orderCode} đã được đánh dấu giao thành công.`,
                        )}
                      >
                        {updatingOrderStatus ? 'Đang cập nhật...' : 'Xác nhận đã giao'}
                      </Button>
                    )}
                    {(displayedOrder.deliveryStatus === 'DELIVERED'
                      || displayedOrder.deliveryStatus === 'NOT_REQUIRED') && (
                      <Button
                        disabled={updatingOrderStatus}
                        onClick={() => applyOrderStatusChange(
                          completeOrder,
                          `Đơn ${displayedOrder.orderCode} đã hoàn tất.`,
                        )}
                      >
                        {updatingOrderStatus ? 'Đang cập nhật...' : 'Hoàn tất đơn'}
                      </Button>
                    )}
                  </div>
                )}
                {orderStatusError && <p role="alert" className="text-sm text-danger">{orderStatusError}</p>}
                {cancelError && <p role="alert" className="text-sm text-danger">{cancelError}</p>}
              </div>
            )}
      </Modal>
      <ConfirmDialog
        open={cancelTarget != null}
        title="Hủy đơn hàng?"
        description={cancelTarget
          ? `Đơn ${cancelTarget.orderCode} sẽ chuyển sang CANCELLED. Nếu đơn đã giữ tồn kho, số lượng sẽ được hoàn lại. Payment chưa thành công sẽ bị xóa.`
          : ''}
        confirmLabel="Hủy đơn"
        onConfirm={confirmCancelOrder}
        onClose={() => !cancellingOrder && setCancelTarget(null)}
        busy={cancellingOrder}
      />
    </div>
  )
}
