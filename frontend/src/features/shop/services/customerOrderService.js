import { apiRequest } from '../../../services/apiClient.js'
import { buildCustomerVnPayPaymentRequest } from './customerVnPayPaymentRequest.js'

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

export function createCustomerVnPayPayment(orderId) {
  const body = buildCustomerVnPayPaymentRequest(orderId)
  return apiRequest('/customer/payments/vnpay', {
    method: 'POST',
    body,
  })
}

export function getCustomerVnPayPaymentStatus(transactionReference, { signal } = {}) {
  return apiRequest(
    `/customer/payments/vnpay/${encodeURIComponent(transactionReference)}`,
    { signal },
  )
}

export function reconcileCustomerVnPayPayment(transactionReference, { signal } = {}) {
  return apiRequest(
    `/customer/payments/vnpay/${encodeURIComponent(transactionReference)}/reconcile`,
    { method: 'POST', signal },
  )
}

export function getCustomerVnPayPaymentStatusByOrderId(orderId, { signal } = {}) {
  return apiRequest(
    `/customer/payments/vnpay/by-order/${encodeURIComponent(orderId)}`,
    { signal },
  )
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
