import { apiRequest } from '../../../services/apiClient.js'

export function getOrders({ signal } = {}) {
  return apiRequest('/orders', { signal })
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

export function updateOrderItemQuantity(id, quantity) {
  return apiRequest(`/order-items/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: { quantity },
  })
}

export function getEmployees({ signal } = {}) {
  return apiRequest('/employees', { signal })
}
