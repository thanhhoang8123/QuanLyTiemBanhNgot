import { apiRequest } from '../../../services/apiClient.js'

export function getAccounts({ signal } = {}) {
  return apiRequest('/accounts', { signal })
}

export function getRoles({ signal } = {}) {
  return apiRequest('/roles', { signal })
}

export function createAccount(account) {
  return apiRequest('/accounts', { method: 'POST', body: account })
}

export function updateAccount(id, account) {
  return apiRequest(`/accounts/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: account,
  })
}

export function deleteAccount(id) {
  return apiRequest(`/accounts/${encodeURIComponent(id)}`, { method: 'DELETE' })
}
