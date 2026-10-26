import { apiRequest } from '../../../services/apiClient.js'

export function getOrders({ signal } = {}) {
  return apiRequest('/orders', { signal })
}

export function getOrderPage({
  page = 0,
  size = 20,
  keyword = '',
  status = '',
  dateFrom = '',
  dateTo = '',
  sort = 'orderDate',
  direction = 'DESC',
  signal,
} = {}) {
  const params = new URLSearchParams({
    page: String(page),
    size: String(size),
    sort,
    direction,
  })
  if (keyword.trim()) params.set('keyword', keyword.trim())
  if (status) params.set('status', status)
  if (dateFrom) params.set('dateFrom', dateFrom)
  if (dateTo) params.set('dateTo', dateTo)
  return apiRequest(`/orders/page?${params}`, { signal })
}

export function getOrderById(id, { signal } = {}) {
  return apiRequest(`/orders/${encodeURIComponent(id)}`, { signal })
}

export function createOrder(order) {
  return apiRequest('/orders', { method: 'POST', body: order })
}

export function quoteOrder(order, { signal } = {}) {
  return apiRequest('/orders/quote', { method: 'POST', body: order, signal })
}

export function cancelOrder(id) {
  return apiRequest(`/orders/${encodeURIComponent(id)}/cancel`, { method: 'POST' })
}

export function markOrderDelivered(id) {
  return apiRequest(`/orders/${encodeURIComponent(id)}/deliver`, { method: 'POST' })
}

export function completeOrder(id) {
  return apiRequest(`/orders/${encodeURIComponent(id)}/complete`, { method: 'POST' })
}

export function updateOrderItemQuantity(id, quantity) {
  return apiRequest(`/order-items/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: { quantity },
  })
}

export function getEmployees({ signal } = {}) {
  return apiRequest('/employees/options', { signal })
}
