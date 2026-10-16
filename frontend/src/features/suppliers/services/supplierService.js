import { apiRequest } from '../../../services/apiClient.js'

export function getSuppliers({ signal } = {}) {
  return apiRequest('/suppliers', { signal })
}

export function createSupplier(supplier) {
  return apiRequest('/suppliers', { method: 'POST', body: supplier })
}

export function updateSupplier(id, supplier) {
  return apiRequest(`/suppliers/${encodeURIComponent(id)}`, { method: 'PUT', body: supplier })
}
