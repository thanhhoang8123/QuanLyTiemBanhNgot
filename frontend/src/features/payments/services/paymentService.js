import { apiRequest } from '../../../services/apiClient.js'

export function getPayments({ signal } = {}) {
  return apiRequest('/payments', { signal })
}

export function createPayment(payment) {
  return apiRequest('/payments', { method: 'POST', body: payment })
}

export function simulatePayment(id, result) {
  return apiRequest(`/payments/${encodeURIComponent(id)}/simulate`, {
    method: 'POST',
    body: { result },
  })
}
