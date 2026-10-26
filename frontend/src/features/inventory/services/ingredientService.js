import { apiRequest } from '../../../services/apiClient.js'

export function getIngredients({ signal } = {}) {
  return apiRequest('/ingredients', { signal })
}

export function createIngredient(ingredient) {
  return apiRequest('/ingredients', { method: 'POST', body: ingredient })
}

export function updateIngredient(id, ingredient) {
  return apiRequest(`/ingredients/${encodeURIComponent(id)}`, { method: 'PUT', body: ingredient })
}

export function deleteIngredient(id) {
  return apiRequest(`/ingredients/${encodeURIComponent(id)}`, { method: 'DELETE' })
}
