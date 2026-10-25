import { apiRequest } from '../../../services/apiClient.js'

export function quoteCustomerOrder(order, { signal } = {}) {
  return apiRequest('/customer/orders/quote', {
    method: 'POST',
    body: order,
    signal,
  })
}

export function createCustomerOrder(order, idempotencyKey) {
  return apiRequest('/customer/orders', {
    method: 'POST',
    body: order,
    headers: { 'Idempotency-Key': idempotencyKey },
  })
}

export function getCustomerOrders({ signal } = {}) {
  return apiRequest('/customer/orders', { signal })
}

export function getCustomerOrderById(id, { signal } = {}) {
  return apiRequest(`/customer/orders/${encodeURIComponent(id)}`, { signal })
}

export function getCustomerOrderByRequestKey(key) {
  return apiRequest(`/customer/orders/by-request-key/${encodeURIComponent(key)}`)
}
