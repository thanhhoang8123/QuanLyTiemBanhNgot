import { apiRequest } from '../../../services/apiClient.js'

export function getMyCustomOrders({ signal } = {}) {
  return apiRequest('/custom-orders/customer/my-orders', { signal })
}

export function createShopCustomOrder(data, { signal } = {}) {
  return apiRequest('/custom-orders/customer/create', {
    method: 'POST',
    body: data,
    signal,
  })
}

export function payCustomOrderDeposit(id, paymentMethod = 'VNPAY', { signal } = {}) {
  const method = encodeURIComponent(paymentMethod)
  return apiRequest(`/custom-orders/customer/${encodeURIComponent(id)}/pay-deposit?paymentMethod=${method}`, {
    method: 'POST',
    signal,
  })
}
