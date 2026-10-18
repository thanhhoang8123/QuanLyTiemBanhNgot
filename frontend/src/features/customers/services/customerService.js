import { apiRequest } from '../../../services/apiClient.js'

export function getCustomers({ signal } = {}) {
  return apiRequest('/customers', { signal })
}

export function getCustomerById(id, { signal } = {}) {
  return apiRequest(`/customers/${encodeURIComponent(id)}`, { signal })
}

export function createCustomer(customer) {
  return apiRequest('/customers', { method: 'POST', body: customer })
}

export function updateCustomer(id, customer) {
  return apiRequest(`/customers/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: customer,
  })
}

export function deleteCustomer(id) {
  return apiRequest(`/customers/${encodeURIComponent(id)}`, { method: 'DELETE' })
}
