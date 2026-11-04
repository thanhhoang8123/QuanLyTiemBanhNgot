import { ApiError, apiRequest } from '../../../services/apiClient.js'

export const PRODUCT_CATALOG_UPDATED_EVENT = 'product-catalog-updated'
const PRODUCT_CATALOG_UPDATED_STORAGE_KEY = 'wa_cake_product_catalog_updated'

function notifyProductCatalogUpdated() {
  if (typeof window === 'undefined') return

  window.dispatchEvent(new Event(PRODUCT_CATALOG_UPDATED_EVENT))
  try {
    window.localStorage.setItem(PRODUCT_CATALOG_UPDATED_STORAGE_KEY, String(Date.now()))
  } catch (error) {
    console.warn('Could not notify other tabs about product changes.', error)
  }
}

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

export async function createProduct(product) {
  const createdProduct = await apiRequest('/products', { method: 'POST', body: product })
  notifyProductCatalogUpdated()
  return createdProduct
}

export async function updateProduct(id, product, expectedQuantity) {
  const updatedProduct = await apiRequest(`/products/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: product,
    headers: { 'X-Expected-Quantity': String(expectedQuantity) },
  })
  notifyProductCatalogUpdated()
  return updatedProduct
}

export async function deactivateProduct(id) {
  const product = await apiRequest(`/products/${encodeURIComponent(id)}/deactivate`, { method: 'POST' })
  notifyProductCatalogUpdated()
  return product
}

export async function deleteProduct(id) {
  await apiRequest(`/products/${encodeURIComponent(id)}`, { method: 'DELETE' })
  notifyProductCatalogUpdated()
}
