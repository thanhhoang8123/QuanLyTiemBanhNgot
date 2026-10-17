import { apiRequest } from '../../../services/apiClient.js'

export function getPromotionProducts({ signal } = {}) {
  return apiRequest('/promotion-products', { signal })
}

export function createPromotionProduct(link) {
  return apiRequest('/promotion-products', { method: 'POST', body: link })
}

export function deletePromotionProduct(promotionId, productId) {
  return apiRequest(
    `/promotion-products/${encodeURIComponent(promotionId)}/${encodeURIComponent(productId)}`,
    { method: 'DELETE' },
  )
}
