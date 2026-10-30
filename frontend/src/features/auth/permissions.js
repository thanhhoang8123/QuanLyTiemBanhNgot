export const STAFF_ROLES = ['ADMIN', 'MANAGER', 'STAFF']
export const MANAGER_ROLES = ['ADMIN', 'MANAGER']
export const ADMIN_ROLES = ['ADMIN']

export const ROLE_LABELS = {
  ADMIN: 'Quản trị viên',
  MANAGER: 'Quản lý',
  STAFF: 'Nhân viên bán hàng',
  CUSTOMER: 'Khách hàng',
}

export function canAccessPath(roleCode, path) {
  const normalizedRole = (roleCode || '').toUpperCase()
  if (path === '/admin/accounts') return ADMIN_ROLES.includes(normalizedRole)
  if (path.startsWith('/admin/inventory')
      || path.startsWith('/admin/suppliers')
      || path.startsWith('/admin/purchase-orders')
      || path.startsWith('/admin/promotions')
      || path.startsWith('/admin/promotion-products')
      || path.startsWith('/admin/logs')) {
    return MANAGER_ROLES.includes(normalizedRole)
  }
  if (path === '/admin' || path === '/pos'
      || path.startsWith('/admin/products')
      || path.startsWith('/admin/orders')
      || path.startsWith('/admin/payments')
      || path.startsWith('/admin/contact-messages')
      || path.startsWith('/admin/live-chat')
      || path.startsWith('/admin/customers')
      || path.startsWith('/admin/custom-orders')) {
    return STAFF_ROLES.includes(normalizedRole)
  }
  return false
}
