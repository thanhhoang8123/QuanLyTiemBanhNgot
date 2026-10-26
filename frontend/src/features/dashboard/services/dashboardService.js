import { apiRequest } from '../../../services/apiClient.js'

export function getDashboardSummary(period, { signal } = {}) {
  const params = new URLSearchParams({ period })
  return apiRequest(`/dashboard?${params.toString()}`, { signal })
}
