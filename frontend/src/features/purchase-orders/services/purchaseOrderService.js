import { apiRequest } from '../../../services/apiClient.js'

export function getPurchaseOrders({ signal } = {}) {
  return apiRequest('/purchase-orders', { signal })
}

export function createPurchaseOrder(purchaseOrder) {
  return apiRequest('/purchase-orders', { method: 'POST', body: purchaseOrder })
}

export function receivePurchaseOrder(id) {
  return apiRequest(`/purchase-orders/${encodeURIComponent(id)}/receive`, { method: 'POST' })
}

export function cancelPurchaseOrder(id) {
  return apiRequest(`/purchase-orders/${encodeURIComponent(id)}/cancel`, { method: 'POST' })
}
