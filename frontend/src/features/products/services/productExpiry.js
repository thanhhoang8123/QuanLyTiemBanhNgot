export function calculateDaysUntilExpiry(expiryDateStr, referenceDate = new Date()) {
  if (!expiryDateStr) return null
  const [year, month, day] = expiryDateStr.split('T')[0].split('-').map(Number)
  if (!year || !month || !day) return null

  const expiry = new Date(year, month - 1, day).setHours(0, 0, 0, 0)
  const today = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate(),
  ).setHours(0, 0, 0, 0)

  const diffMs = expiry - today
  return Math.round(diffMs / (1000 * 60 * 60 * 24))
}

export function getExpiryStatus(expiryDateStr, referenceDate = new Date()) {
  const days = calculateDaysUntilExpiry(expiryDateStr, referenceDate)
  if (days === null) {
    return {
      status: 'none',
      label: 'Chưa có HSD',
      days: null,
      isExpiringSoon: false,
      isExpired: false,
      badgeVariant: 'muted',
    }
  }

  if (days < 0) {
    return {
      status: 'expired',
      label: `Đã hết hạn (${Math.abs(days)} ngày trước)`,
      shortLabel: 'Đã hết hạn',
      days,
      isExpiringSoon: true,
      isExpired: true,
      badgeVariant: 'danger',
    }
  }

  if (days === 0) {
    return {
      status: 'expires_today',
      label: 'Hết hạn hôm nay',
      shortLabel: 'Hết hạn hôm nay',
      days: 0,
      isExpiringSoon: true,
      isExpired: false,
      badgeVariant: 'warning',
    }
  }

  if (days === 1) {
    return {
      status: 'expiring_1_day',
      label: 'Sắp hết hạn (còn 1 ngày)',
      shortLabel: 'Sắp hết hạn (1 ngày)',
      days: 1,
      isExpiringSoon: true,
      isExpired: false,
      badgeVariant: 'alert',
    }
  }

  return {
    status: 'valid',
    label: `Còn ${days} ngày`,
    shortLabel: `Còn ${days} ngày`,
    days,
    isExpiringSoon: false,
    isExpired: false,
    badgeVariant: 'neutral',
  }
}

export function isExpiringWithinDays(expiryDateStr, maxDays = 1, referenceDate = new Date()) {
  const days = calculateDaysUntilExpiry(expiryDateStr, referenceDate)
  if (days === null) return false
  return days <= maxDays
}

export function formatDate(dateString) {
  if (!dateString) return '—'
  const clean = dateString.split('T')[0]
  const [year, month, day] = clean.split('-')
  if (!year || !month || !day) return dateString
  return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`
}
