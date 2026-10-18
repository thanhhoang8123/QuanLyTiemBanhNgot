import { apiRequest } from '../../../services/apiClient.js'

export function getCustomOrders({ signal } = {}) {
  return apiRequest('/custom-orders', { signal })
}

export function getCustomOrderById(id, { signal } = {}) {
  return apiRequest(`/custom-orders/${encodeURIComponent(id)}`, { signal })
}

export function createCustomOrder(order) {
  return apiRequest('/custom-orders', { method: 'POST', body: order })
}

export function updateCustomOrder(id, order) {
  return apiRequest(`/custom-orders/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: order,
  })
}

export function updateCustomOrderStatus(id, status) {
  return apiRequest(`/custom-orders/${encodeURIComponent(id)}/status`, {
    method: 'PATCH',
    body: { status },
  })
}

export function deleteCustomOrder(id) {
  return apiRequest(`/custom-orders/${encodeURIComponent(id)}`, { method: 'DELETE' })
}

export function getEmployees({ signal } = {}) {
  return apiRequest('/employees', { signal })
}
