import { apiRequest } from '../../../services/apiClient.js'

export function getPromotions({ signal } = {}) {
  return apiRequest('/promotions', { signal })
}

export function searchPromotions(keyword, { signal } = {}) {
  const query = new URLSearchParams({ keyword })
  return apiRequest(`/promotions/search?${query.toString()}`, { signal })
}

export function getPromotionById(id, { signal } = {}) {
  return apiRequest(`/promotions/${encodeURIComponent(id)}`, { signal })
}

export function createPromotion(promotion) {
  return apiRequest('/promotions', { method: 'POST', body: promotion })
}

export function updatePromotion(id, promotion) {
  return apiRequest(`/promotions/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: promotion,
  })
}

export function deletePromotion(id) {
  return apiRequest(`/promotions/${encodeURIComponent(id)}`, { method: 'DELETE' })
}
