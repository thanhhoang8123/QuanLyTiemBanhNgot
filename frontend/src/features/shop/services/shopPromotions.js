function toUtcDate(value) {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10)
}

export function isShopPromotionActive(promotion, now = new Date()) {
  if (promotion?.status !== true || !promotion.startDate || !promotion.endDate) {
    return false
  }

  const today = toUtcDate(now)
  const startDate = String(promotion.startDate).slice(0, 10)
  const endDate = String(promotion.endDate).slice(0, 10)
  return Boolean(today && startDate <= today && endDate >= today)
}

export function getActiveShopPromotions(promotions, now = new Date()) {
  if (!Array.isArray(promotions)) return []
  return promotions.filter((promotion) => isShopPromotionActive(promotion, now))
}

export function calculateShopPromotionDiscount(promotion, subtotal) {
  const amount = Number(subtotal)
  const percent = Number(promotion?.discountPercent)
  const minimum = promotion?.minOrderValue == null
    ? 0
    : Number(promotion.minOrderValue)
  const maximum = promotion?.maxDiscount == null
    ? Infinity
    : Number(promotion.maxDiscount)

  if (!Number.isFinite(amount) || amount <= 0
      || !Number.isFinite(percent) || percent <= 0 || percent > 100
      || !Number.isFinite(minimum) || minimum < 0
      || (maximum !== Infinity && (!Number.isFinite(maximum) || maximum < 0))
      || amount < minimum) {
    return 0
  }

  const percentageDiscount = Math.round(
    (amount * percent / 100 + Number.EPSILON) * 100,
  ) / 100
  return Math.min(amount, maximum, percentageDiscount)
}

export function findBestShopPromotion(promotions, subtotal, now = new Date()) {
  let best = null
  for (const promotion of getActiveShopPromotions(promotions, now)) {
    const discountAmount = calculateShopPromotionDiscount(promotion, subtotal)
    if (discountAmount > (best?.discountAmount ?? 0)) {
      best = { promotion, discountAmount }
    }
  }
  return best
}
