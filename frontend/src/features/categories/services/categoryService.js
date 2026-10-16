import { apiRequest } from '../../../services/apiClient.js'

export function getCategories({ signal } = {}) {
  return apiRequest('/categories', { signal })
}
