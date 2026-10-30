import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../../components/Icon.jsx'
import Modal from '../../components/Modal.jsx'
import { getProducts } from '../../features/products/services/productService.js'
import { getExpiryStatus, isExpiringWithinDays, formatDate } from '../../features/products/services/productExpiry.js'
import { getContactMessages, updateContactMessageStatus } from '../../features/contact-messages/services/contactMessageService.js'
import { getOrderPage } from '../../features/orders/services/orderService.js'
import { getCustomOrders } from '../../features/custom-orders/services/customOrderService.js'
import { getCustomers } from '../../features/customers/services/customerService.js'

const roleLabels = {
  ADMIN: 'Quản trị viên',
  MANAGER: 'Quản lý',
  STAFF: 'Nhân viên',
  CUSTOMER: 'Khách hàng',
}

function formatCurrency(amount) {
  if (amount == null) return '0 đ'
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
}

function formatDateTime(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export default function Topbar({
  title,
  account,
  isLoggingOut = false,
  onLogout,
  onMenuClick,
  menuExpanded = false,
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('orders') // 'orders' | 'messages' | 'expiry'
  const [alerts, setAlerts] = useState([])
  const [contactMessages, setContactMessages] = useState([])
  const [pendingOrders, setPendingOrders] = useState([])
  const [pendingCustomOrders, setPendingCustomOrders] = useState([])
  const [customersById, setCustomersById] = useState({})
  const [loading, setLoading] = useState(true)
  const [selectedMessage, setSelectedMessage] = useState(null)
  const [updatingId, setUpdatingId] = useState(null)
  const [actionSuccess, setActionSuccess] = useState('')
  const dropdownRef = useRef(null)

  const today = new Intl.DateTimeFormat('vi-VN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date())

  const loadNotifications = useCallback(async (signal) => {
    setLoading(true)
    try {
      const [productsRes, messagesRes, ordersRes, customOrdersRes, customersRes] = await Promise.allSettled([
        getProducts({ signal }),
        getContactMessages({ page: 0, size: 20, status: 'NEW', signal }),
        getOrderPage({ page: 0, size: 20, status: 'PENDING', sort: 'orderDate', direction: 'DESC', signal }),
        getCustomOrders({ signal }),
        getCustomers({ signal }),
      ])

      if (productsRes.status === 'fulfilled' && Array.isArray(productsRes.value)) {
        const expiring = productsRes.value
          .filter((p) => p.status === true && isExpiringWithinDays(p.expiryDate, 1))
          .map((p) => ({
            ...p,
            expiryInfo: getExpiryStatus(p.expiryDate),
          }))
        setAlerts(expiring)
      }

      if (messagesRes.status === 'fulfilled' && Array.isArray(messagesRes.value?.content)) {
        setContactMessages(messagesRes.value.content)
      }

      if (ordersRes.status === 'fulfilled' && Array.isArray(ordersRes.value?.content)) {
        setPendingOrders(ordersRes.value.content)
      }

      if (customOrdersRes.status === 'fulfilled' && Array.isArray(customOrdersRes.value)) {
        setPendingCustomOrders(customOrdersRes.value.filter((o) => o.status === 'PENDING'))
      }

      if (customersRes.status === 'fulfilled' && Array.isArray(customersRes.value)) {
        const map = {}
        for (const c of customersRes.value) {
          map[c.id] = c
        }
        setCustomersById(map)
      }
    } finally {
      if (!signal?.aborted) setLoading(false)
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    loadNotifications(controller.signal)

    // Periodic check every 12 seconds for fast notifications
    const timer = setInterval(() => {
      loadNotifications(controller.signal)
    }, 12000)

    return () => {
      controller.abort()
      clearInterval(timer)
    }
  }, [loadNotifications])

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false)
      }
    }
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [dropdownOpen])

  const orderAlertsCount = pendingOrders.length + pendingCustomOrders.length
  const totalCount = orderAlertsCount + contactMessages.length + alerts.length

  // Automatically select tab with items when opening dropdown
  const handleOpenDropdown = () => {
    setDropdownOpen((current) => {
      const next = !current
      if (next) {
        if (orderAlertsCount > 0) {
          setActiveTab('orders')
        } else if (contactMessages.length > 0) {
          setActiveTab('messages')
        } else if (alerts.length > 0) {
          setActiveTab('expiry')
        }
      }
      return next
    })
  }

  const handleUpdateStatus = async (status) => {
    if (!selectedMessage) return
    setUpdatingId(selectedMessage.id)
    try {
      await updateContactMessageStatus(selectedMessage.id, status)
      // Remove from unread notification list
      setContactMessages((prev) => prev.filter((m) => m.id !== selectedMessage.id))
      setActionSuccess(status === 'RESOLVED' ? 'Đã giải quyết tin nhắn thành công!' : 'Đã chuyển tin nhắn sang Đang xử lý.')
      setTimeout(() => {
        setSelectedMessage(null)
        setActionSuccess('')
      }, 900)
    } catch {
      // Keep modal open on error
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <>
      <header className="sticky top-0 z-20 flex h-[76px] items-center justify-between border-b border-border bg-cream/95 px-4 backdrop-blur-md sm:px-7 xl:px-10">
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="Mở menu"
            aria-expanded={menuExpanded}
            aria-controls="admin-sidebar"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-paper text-rosewood transition hover:bg-petal lg:hidden"
            onClick={onMenuClick}
          >
            <Icon name="menu" size={19} />
          </button>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-caramel">Hệ thống quản trị</p>
            <p className="font-display text-base font-bold text-rosewood sm:text-lg">WA Patisserie</p>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="hidden items-center gap-2 rounded-full border border-border bg-petal px-3 py-2 text-[11px] font-medium text-rosewood sm:flex">
            <Icon name="clock" size={15} />
            <span>{today}</span>
          </div>

          {/* Unified Notification Bell with Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              aria-label={`Thông báo (${totalCount} thông báo)`}
              aria-expanded={dropdownOpen}
              onClick={handleOpenDropdown}
              className={`relative flex h-10 w-10 items-center justify-center rounded-full border border-border bg-paper text-rosewood transition hover:border-caramel hover:bg-petal ${
                totalCount > 0 ? 'border-amber-300 ring-2 ring-caramel/20' : ''
              }`}
            >
              <Icon name="bell" size={18} />
              {totalCount > 0 ? (
                <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white shadow-md animate-pulse">
                  {totalCount}
                </span>
              ) : (
                <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-muted/40" />
              )}
            </button>

            {dropdownOpen && (
              <div className="soft-shadow absolute right-0 top-12 z-50 w-84 sm:w-96 rounded-2xl border border-border bg-paper p-4 text-xs shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-caramel-soft text-rosewood">
                      <Icon name="bell" size={14} />
                    </span>
                    <div>
                      <h3 className="font-display text-sm font-bold text-rosewood">Trung tâm thông báo</h3>
                      <p className="text-[10px] text-muted">Đơn hàng, tin nhắn & cảnh báo</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    title="Làm mới"
                    onClick={() => loadNotifications()}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-muted transition hover:bg-petal hover:text-rosewood"
                  >
                    <Icon name="refresh" size={13} />
                  </button>
                </div>

                {/* Tabs */}
                <div className="mt-3 flex rounded-xl bg-petal/80 p-1 border border-border/60 gap-1">
                  <button
                    type="button"
                    onClick={() => setActiveTab('orders')}
                    className={`flex flex-1 items-center justify-center gap-1 rounded-lg py-1.5 text-[11px] font-semibold transition ${
                      activeTab === 'orders'
                        ? 'bg-paper text-rosewood shadow-sm font-bold'
                        : 'text-muted hover:text-rosewood'
                    }`}
                  >
                    <Icon name="bag" size={13} />
                    <span>Đơn mới</span>
                    {orderAlertsCount > 0 && (
                      <span className="rounded-full bg-rose-600 px-1.5 py-0.2 text-[10px] font-bold text-white">
                        {orderAlertsCount}
                      </span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('messages')}
                    className={`flex flex-1 items-center justify-center gap-1 rounded-lg py-1.5 text-[11px] font-semibold transition ${
                      activeTab === 'messages'
                        ? 'bg-paper text-rosewood shadow-sm font-bold'
                        : 'text-muted hover:text-rosewood'
                    }`}
                  >
                    <Icon name="messageCircle" size={13} />
                    <span>Tin nhắn</span>
                    {contactMessages.length > 0 && (
                      <span className="rounded-full bg-rose-600 px-1.5 py-0.2 text-[10px] font-bold text-white">
                        {contactMessages.length}
                      </span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('expiry')}
                    className={`flex flex-1 items-center justify-center gap-1 rounded-lg py-1.5 text-[11px] font-semibold transition ${
                      activeTab === 'expiry'
                        ? 'bg-paper text-rosewood shadow-sm font-bold'
                        : 'text-muted hover:text-rosewood'
                    }`}
                  >
                    <Icon name="package" size={13} />
                    <span>Hạn bánh</span>
                    {alerts.length > 0 && (
                      <span className="rounded-full bg-amber-600 px-1.5 py-0.2 text-[10px] font-bold text-white">
                        {alerts.length}
                      </span>
                    )}
                  </button>
                </div>

                {/* Tab Content: Orders & Custom Orders */}
                {activeTab === 'orders' && (
                  <div className="mt-2 max-h-80 overflow-y-auto divide-y divide-border/60">
                    {loading ? (
                      <p className="py-6 text-center text-muted">Đang tải đơn hàng...</p>
                    ) : orderAlertsCount === 0 ? (
                      <div className="py-7 text-center">
                        <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                          <Icon name="check" size={18} />
                        </div>
                        <p className="font-semibold text-rosewood">Không có đơn hàng mới cần xử lý</p>
                        <p className="mt-1 text-[11px] text-muted">Tất cả đơn hàng và yêu cầu làm bánh đã được tiếp nhận.</p>
                      </div>
                    ) : (
                      <>
                        {/* Đơn đặt hàng tiêu chuẩn */}
                        {pendingOrders.length > 0 && (
                          <div className="pt-1 pb-2">
                            <div className="flex items-center justify-between px-1 pb-1">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-rosewood/80">
                                🛒 Đơn đặt hàng mới ({pendingOrders.length})
                              </span>
                              <Link
                                to="/admin/orders"
                                onClick={() => setDropdownOpen(false)}
                                className="text-[10px] font-semibold text-caramel hover:underline"
                              >
                                Xem tất cả
                              </Link>
                            </div>
                            <div className="space-y-1">
                              {pendingOrders.map((order) => {
                                const customerName = customersById[order.customerId]?.fullName || 'Khách #' + order.customerId
                                return (
                                  <Link
                                    key={order.id}
                                    to="/admin/orders"
                                    onClick={() => setDropdownOpen(false)}
                                    className="group block rounded-xl p-2.5 transition hover:bg-caramel-soft/40 cursor-pointer"
                                  >
                                    <div className="flex items-start justify-between gap-2">
                                      <div className="min-w-0">
                                        <div className="flex items-center gap-1.5">
                                          <span className="font-bold text-rosewood text-[12px] group-hover:text-caramel">
                                            Đơn #{order.id} {order.orderCode ? `(${order.orderCode})` : ''}
                                          </span>
                                          <span className="rounded bg-rose-100 px-1.5 py-0.5 text-[9px] font-bold text-rose-700">
                                            Mới
                                          </span>
                                        </div>
                                        <p className="text-[11px] text-muted mt-0.5 truncate">
                                          Khách: <strong className="text-rosewood">{customerName}</strong>
                                        </p>
                                      </div>
                                      <div className="text-right shrink-0">
                                        <p className="font-bold text-[12px] text-emerald-700">
                                          {formatCurrency(order.finalAmount || order.totalAmount)}
                                        </p>
                                        <span className="text-[10px] text-muted">
                                          {formatDateTime(order.orderDate || order.createdAt)}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="mt-1 flex items-center justify-between text-[10px]">
                                      <span className="text-muted truncate max-w-[200px]">
                                        {order.deliveryAddress ? `Giao: ${order.deliveryAddress}` : 'Mua tại tiệm'}
                                      </span>
                                      <span className="font-bold text-caramel group-hover:underline shrink-0">
                                        Xử lý đơn →
                                      </span>
                                    </div>
                                  </Link>
                                )
                              })}
                            </div>
                          </div>
                        )}

                        {/* Yêu cầu làm bánh riêng */}
                        {pendingCustomOrders.length > 0 && (
                          <div className="pt-2 pb-1">
                            <div className="flex items-center justify-between px-1 pb-1">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-rosewood/80">
                                🎂 Yêu cầu làm bánh ({pendingCustomOrders.length})
                              </span>
                              <Link
                                to="/admin/custom-orders"
                                onClick={() => setDropdownOpen(false)}
                                className="text-[10px] font-semibold text-caramel hover:underline"
                              >
                                Xem tất cả
                              </Link>
                            </div>
                            <div className="space-y-1">
                              {pendingCustomOrders.map((order) => {
                                const customerName = customersById[order.customerId]?.fullName || 'Khách #' + order.customerId
                                return (
                                  <Link
                                    key={order.id}
                                    to="/admin/custom-orders"
                                    onClick={() => setDropdownOpen(false)}
                                    className="group block rounded-xl p-2.5 transition hover:bg-caramel-soft/40 cursor-pointer"
                                  >
                                    <div className="flex items-start justify-between gap-2">
                                      <div className="min-w-0">
                                        <div className="flex items-center gap-1.5">
                                          <span className="font-bold text-rosewood text-[12px] group-hover:text-caramel truncate">
                                            {order.cakeName || `Bánh đặt riêng #${order.id}`}
                                          </span>
                                          <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold text-amber-800 shrink-0">
                                            Chờ duyệt
                                          </span>
                                        </div>
                                        <p className="text-[11px] text-muted mt-0.5 truncate">
                                          Khách: <strong className="text-rosewood">{customerName}</strong>
                                        </p>
                                        {order.requestDescription && (
                                          <p className="text-[10px] text-muted line-clamp-1 italic mt-0.5">
                                            "{order.requestDescription}"
                                          </p>
                                        )}
                                      </div>
                                      <div className="text-right shrink-0">
                                        <p className="font-bold text-[12px] text-rosewood">
                                          {order.estimatedPrice ? formatCurrency(order.estimatedPrice) : 'Chờ báo giá'}
                                        </p>
                                        <span className="text-[10px] text-muted">
                                          Giao: {formatDate(order.deliveryDate)}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="mt-1 flex items-center justify-end text-[10px]">
                                      <span className="font-bold text-caramel group-hover:underline">
                                        Duyệt yêu cầu →
                                      </span>
                                    </div>
                                  </Link>
                                )
                              })}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}

                {/* Tab Content: Messages */}
                {activeTab === 'messages' && (
                  <div className="mt-2 max-h-80 overflow-y-auto divide-y divide-border/60">
                    {loading ? (
                      <p className="py-6 text-center text-muted">Đang tải tin nhắn...</p>
                    ) : contactMessages.length === 0 ? (
                      <div className="py-7 text-center">
                        <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                          <Icon name="check" size={18} />
                        </div>
                        <p className="font-semibold text-rosewood">Không có tin nhắn chưa đọc</p>
                        <p className="mt-1 text-[11px] text-muted">Mọi thắc mắc của khách đã được phản hồi.</p>
                      </div>
                    ) : (
                      contactMessages.map((msg) => (
                        <div
                          key={msg.id}
                          role="button"
                          tabIndex={0}
                          onClick={() => {
                            setSelectedMessage(msg)
                            setDropdownOpen(false)
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              setSelectedMessage(msg)
                              setDropdownOpen(false)
                            }
                          }}
                          className="group block w-full rounded-xl p-2.5 text-left transition hover:bg-caramel-soft/40 cursor-pointer"
                        >
                          <div className="flex items-start gap-2.5">
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-caramel-soft font-bold text-xs text-rosewood shadow-xs">
                              {(msg.name || 'KH').trim()[0].toUpperCase()}
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-1">
                                <p className="font-bold text-rosewood truncate text-[12px] group-hover:text-caramel transition-colors">
                                  {msg.name}
                                </p>
                                <span className="shrink-0 text-[10px] text-muted">
                                  {formatDateTime(msg.createdAt)}
                                </span>
                              </div>
                              <p className="truncate font-semibold text-[11px] text-rosewood/90">
                                {msg.subject}
                              </p>
                              <p className="mt-0.5 line-clamp-2 text-[11px] leading-relaxed text-muted">
                                {msg.message}
                              </p>
                              <div className="mt-1 flex items-center justify-between">
                                <span className="rounded bg-rose-100 px-1.5 py-0.5 text-[9px] font-bold text-rose-700">
                                  Mới
                                </span>
                                <span className="text-[10px] font-semibold text-caramel group-hover:underline">
                                  Xem & xử lý →
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* Tab Content: Expiry Alerts */}
                {activeTab === 'expiry' && (
                  <div className="mt-2 max-h-80 overflow-y-auto divide-y divide-border/60">
                    {loading ? (
                      <p className="py-6 text-center text-muted">Đang tải cảnh báo...</p>
                    ) : alerts.length === 0 ? (
                      <div className="py-7 text-center">
                        <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                          <Icon name="check" size={18} />
                        </div>
                        <p className="font-semibold text-rosewood">Tất cả bánh còn hạn</p>
                        <p className="mt-1 text-[11px] text-muted">Không có sản phẩm nào sắp hết hạn trong 24h tới.</p>
                      </div>
                    ) : (
                      alerts.map((item) => (
                        <Link
                          key={item.id}
                          to={`/admin/products?editId=${item.id}&search=${encodeURIComponent(item.name)}`}
                          onClick={() => setDropdownOpen(false)}
                          className="group block rounded-xl p-2.5 transition hover:bg-caramel-soft/50 first:pt-2 last:pb-2"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-bold text-rosewood group-hover:text-caramel transition-colors">{item.name}</p>
                            <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold ${
                              item.expiryInfo.status === 'expired'
                                ? 'bg-danger-soft text-danger'
                                : 'bg-amber-100 text-amber-900'
                            }`}>
                              {item.expiryInfo.shortLabel}
                            </span>
                          </div>
                          <p className="mt-0.5 text-[11px] text-muted">
                            Mã: {item.productCode} · Tồn kho: <strong className="text-rosewood">{item.quantity}</strong> {item.unit || 'chiếc'}
                          </p>
                          <div className="mt-1 flex items-center justify-between text-[10px]">
                            <span className="text-amber-900 font-medium">
                              HSD: {formatDate(item.expiryDate)} ({item.expiryInfo.label})
                            </span>
                            <span className="font-bold text-caramel group-hover:underline">Xử lý ngay →</span>
                          </div>
                        </Link>
                      ))
                    )}
                  </div>
                )}

                {/* Footer link */}
                <div className="mt-2 border-t border-border pt-2.5">
                  {activeTab === 'orders' ? (
                    <div className="flex gap-2">
                      <Link
                        to="/admin/orders"
                        onClick={() => setDropdownOpen(false)}
                        className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-border bg-caramel-soft py-2 text-[11px] font-semibold text-rosewood transition hover:bg-caramel/20"
                      >
                        <Icon name="bag" size={13} /> Đơn đặt hàng
                      </Link>
                      <Link
                        to="/admin/custom-orders"
                        onClick={() => setDropdownOpen(false)}
                        className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-border bg-caramel-soft py-2 text-[11px] font-semibold text-rosewood transition hover:bg-caramel/20"
                      >
                        <Icon name="sparkles" size={13} /> Đặt bánh riêng
                      </Link>
                    </div>
                  ) : activeTab === 'messages' ? (
                    <Link
                      to="/admin/live-chat"
                      onClick={() => setDropdownOpen(false)}
                      className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-border bg-caramel-soft py-2 text-[11px] font-semibold text-rosewood transition hover:bg-caramel/20"
                    >
                      <Icon name="messageCircle" size={13} /> Mở Chat & Hỗ trợ khách
                    </Link>
                  ) : (
                    <Link
                      to="/admin/products"
                      onClick={() => setDropdownOpen(false)}
                      className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-border bg-caramel-soft py-2 text-[11px] font-semibold text-rosewood transition hover:bg-caramel/20"
                    >
                      <Icon name="package" size={13} /> Quản lý sản phẩm & hạn dùng
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="hidden h-8 border-l border-border sm:block" />
          <Link
            to="/shop"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-border bg-paper px-3 py-2 text-[11px] font-semibold text-rosewood transition hover:border-caramel hover:bg-petal"
            title="Mở xem cửa hàng khách hàng"
          >
            <Icon name="arrowUpRight" size={13} className="text-caramel" />
            <span>Xem shop</span>
          </Link>
          <div className="hidden min-w-0 text-right sm:block">
            <p className="max-w-32 truncate text-xs font-semibold text-rosewood">
              {account?.username || 'Tài khoản'}
            </p>
            <p className="text-[10px] text-muted">
              {account?.roleName || roleLabels[account?.roleCode] || ''}
            </p>
          </div>
          <button
            type="button"
            onClick={onLogout}
            disabled={isLoggingOut}
            className="rounded-xl border border-border bg-paper px-3 py-2 text-[11px] font-semibold text-rosewood transition hover:border-caramel hover:bg-petal disabled:cursor-wait disabled:opacity-60"
          >
            {isLoggingOut ? 'Đang thoát...' : 'Đăng xuất'}
          </button>
        </div>
      </header>

      {/* Quick message reading & handling modal */}
      <Modal
        open={Boolean(selectedMessage)}
        title={selectedMessage?.subject || 'Chi tiết tin nhắn hỗ trợ'}
        onClose={() => {
          setSelectedMessage(null)
          setActionSuccess('')
        }}
        size="max-w-lg"
      >
        {selectedMessage && (
          <div className="space-y-4 text-xs sm:text-sm">
            {actionSuccess && (
              <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                <Icon name="check" size={16} />
                <span>{actionSuccess}</span>
              </div>
            )}

            {/* Sender summary */}
            <div className="rounded-xl border border-border bg-petal/50 p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-caramel-soft font-bold text-xs text-rosewood">
                    {(selectedMessage.name || 'KH').trim()[0].toUpperCase()}
                  </span>
                  <div>
                    <p className="font-bold text-rosewood">{selectedMessage.name}</p>
                    <p className="text-[11px] text-muted">{formatDateTime(selectedMessage.createdAt)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {selectedMessage.customerId ? (
                    <span className="rounded-full bg-caramel-soft border border-caramel/40 px-2 py-0.5 text-[10px] font-bold text-rosewood">
                      ⭐ Khách thành viên (ID: #{selectedMessage.customerId})
                    </span>
                  ) : null}
                  <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-[10px] font-bold text-rose-700">
                    Tin nhắn mới
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-muted border-t border-border/50">
                <a
                  href={`mailto:${selectedMessage.email}`}
                  className="font-medium text-caramel underline underline-offset-2 hover:text-caramel-hover"
                >
                  ✉ {selectedMessage.email}
                </a>
                {selectedMessage.phone && (
                  <span>📞 {selectedMessage.phone}</span>
                )}
              </div>
            </div>

            {/* Message Body */}
            <div>
              <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-muted">Nội dung thắc mắc / yêu cầu:</p>
              <div className="whitespace-pre-wrap rounded-xl border border-border bg-paper p-4 text-xs leading-relaxed text-rosewood font-normal">
                {selectedMessage.message}
              </div>
            </div>

            {/* Actions */}
            <div className="border-t border-border pt-4 flex flex-col gap-2.5">
              <a
                href="https://dashboard.tawk.to/#/chat"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-caramel px-4 text-xs font-bold text-action-ink shadow-sm transition hover:bg-caramel-hover"
              >
                <Icon name="messageCircle" size={16} />
                <span>💬 Vào tawk.to chat với {selectedMessage.name}</span>
                <Icon name="externalLink" size={13} />
              </a>

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  disabled={Boolean(updatingId)}
                  onClick={() => handleUpdateStatus('IN_PROGRESS')}
                  className="inline-flex h-9 items-center justify-center rounded-xl border border-amber-300 bg-amber-50 px-3 text-xs font-semibold text-amber-900 transition hover:bg-amber-100 disabled:opacity-60"
                >
                  Đang xử lý
                </button>
                <button
                  type="button"
                  disabled={Boolean(updatingId)}
                  onClick={() => handleUpdateStatus('RESOLVED')}
                  className="inline-flex h-9 items-center justify-center rounded-xl bg-emerald-600 px-3.5 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60 shadow-sm"
                >
                  ✓ Đã giải quyết
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}
