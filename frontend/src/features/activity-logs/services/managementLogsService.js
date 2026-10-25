import { apiRequest } from '../../../services/apiClient.js'

export function getActivityLogs({ limit = 100, signal } = {}) {
  return apiRequest(`/management/logs/activity?limit=${encodeURIComponent(limit)}`, { signal })
}

export function getOrderStatusHistory({ limit = 100, signal } = {}) {
  return apiRequest(`/management/logs/order-status?limit=${encodeURIComponent(limit)}`, { signal })
}
