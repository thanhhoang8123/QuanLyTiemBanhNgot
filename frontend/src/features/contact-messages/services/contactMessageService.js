import { apiRequest } from '../../../services/apiClient.js'

export function getContactMessages({ page = 0, size = 20, keyword = '', status = '', signal } = {}) {
  const params = new URLSearchParams({ page: String(page), size: String(size) })
  if (keyword.trim()) params.set('keyword', keyword.trim())
  if (status) params.set('status', status)
  return apiRequest(`/contact-messages/page?${params}`, { signal })
}

export function updateContactMessageStatus(id, status) {
  return apiRequest(`/contact-messages/${encodeURIComponent(id)}/status`, {
    method: 'PUT',
    body: { status },
  })
}

export function getMyContactMessages(options = {}) {
  return apiRequest('/shop/contact/my-messages', options)
}

export function sendContactMessage(data, options = {}) {
  return apiRequest('/shop/contact', {
    method: 'POST',
    body: data,
    ...options,
  })
}
