const defaultArtworkBackground = 'from-[#e7d1bb] to-[#b9855f]'

export function toProductViewModel(product) {
  const category = product.category && typeof product.category === 'object'
    ? product.category
    : null

  return {
    id: product.id,
    code: product.productCode ?? '',
    name: product.name ?? '',
    description: product.description ?? '',
    imageUrl: product.imageUrl ?? '',
    category: category?.name ?? '',
    categoryId: category?.id == null ? '' : String(category.id),
    price: Number(product.price ?? 0),
    stock: Number(product.quantity ?? 0),
    unit: product.unit ?? '',
    createdAt: product.createdAt ? String(product.createdAt).slice(0, 10) : '',
    expiryDate: product.expiryDate ?? '',
    status: product.status === true ? 'Đang bán' : 'Tạm ẩn',
    background: defaultArtworkBackground,
  }
}

export function toProductRequest(form) {
  return {
    category: { id: Number(form.categoryId) },
    productCode: form.code.trim(),
    name: form.name.trim(),
    description: form.description.trim() || null,
    imageUrl: form.imageUrl.trim() || null,
    price: Number(form.price),
    quantity: Number(form.stock),
    unit: form.unit.trim() || null,
    createdAt: form.createdAt ? `${form.createdAt}T00:00:00` : null,
    expiryDate: form.expiryDate || null,
    status: form.status === 'Đang bán',
  }
}
