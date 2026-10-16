import { ApiError, apiRequest } from '../../../services/apiClient.js'

export async function uploadProductImage(file) {
  const formData = new FormData()
  formData.append('file', file)

  const response = await apiRequest('/uploads/products', {
    method: 'POST',
    body: formData,
  })
  if (typeof response?.imageUrl !== 'string' || !response.imageUrl.trim()) {
    throw new ApiError('API tải ảnh không trả về imageUrl hợp lệ.')
  }

  return response.imageUrl.trim()
}

export function getProducts({ signal } = {}) {
  return apiRequest('/products', { signal })
}

export function createProduct(product) {
  return apiRequest('/products', { method: 'POST', body: product })
}

export function updateProduct(id, product) {
  return apiRequest(`/products/${encodeURIComponent(id)}`, { method: 'PUT', body: product })
}

export function deactivateProduct(id) {
  return apiRequest(`/products/${encodeURIComponent(id)}`, { method: 'DELETE' })
}
