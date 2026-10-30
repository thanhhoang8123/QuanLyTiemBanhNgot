import { ApiError, apiRequest } from '../../../services/apiClient.js'

export async function uploadProductImage(file) {
  const formData = new FormData()
  formData.append('file', file)

  const response = await apiRequest('/uploads/products', {
    method: 'POST',
    body: formData,
  })
  if (typeof response?.imageUrl !== 'string' || !response.imageUrl.trim()) {
    throw new ApiError('Chưa thể tải ảnh lên. Vui lòng chọn lại ảnh và thử lại.')
  }

  return response.imageUrl.trim()
}

export function getProducts({ signal } = {}) {
  return apiRequest('/products', { signal })
}

export function getExpiringProducts({ days = 1, status = '', signal } = {}) {
  const params = new URLSearchParams({ days: String(days) })
  if (status !== '') params.set('status', String(status))
  return apiRequest(`/products/expiring?${params}`, { signal })
}

export function getProductPage({
  page = 0,
  size = 20,
  keyword = '',
  categoryId = '',
  status = '',
  sort = 'name',
  direction = 'ASC',
  signal,
} = {}) {
  const params = new URLSearchParams({
    page: String(page),
    size: String(size),
    sort,
    direction,
  })
  if (keyword.trim()) params.set('keyword', keyword.trim())
  if (categoryId) params.set('categoryId', categoryId)
  if (status !== '') params.set('status', status)
  return apiRequest(`/products/page?${params}`, { signal })
}

export function getProductById(id, { signal } = {}) {
  return apiRequest(`/products/${encodeURIComponent(id)}`, { signal })
}

export function createProduct(product) {
  return apiRequest('/products', { method: 'POST', body: product })
}

export function updateProduct(id, product, expectedQuantity) {
  return apiRequest(`/products/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: product,
    headers: { 'X-Expected-Quantity': String(expectedQuantity) },
  })
}

export function deactivateProduct(id) {
  return apiRequest(`/products/${encodeURIComponent(id)}/deactivate`, { method: 'POST' })
}

export function deleteProduct(id) {
  return apiRequest(`/products/${encodeURIComponent(id)}`, { method: 'DELETE' })
}
