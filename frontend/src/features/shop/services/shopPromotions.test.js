import test from 'node:test'
import assert from 'node:assert/strict'
import {
  calculateShopPromotionDiscount,
  findBestShopPromotion,
  getActiveShopPromotions,
} from './shopPromotions.js'

const now = new Date('2026-10-29T08:00:00.000Z')

function promotion(overrides = {}) {
  return {
    status: true,
    startDate: '2026-10-01',
    endDate: '2026-10-31',
    discountPercent: 20,
    maxDiscount: null,
    minOrderValue: 0,
    ...overrides,
  }
}

test('applies the maximum discount cap to the line subtotal', () => {
  assert.equal(
    calculateShopPromotionDiscount(
      promotion({ maxDiscount: 15000 }),
      200000,
    ),
    15000,
  )
})

test('does not apply a promotion before its minimum order value is met', () => {
  assert.equal(
    calculateShopPromotionDiscount(
      promotion({ minOrderValue: 100000 }),
      99999,
    ),
    0,
  )
})

test('chooses the promotion with the greatest actual saving, not the highest percent', () => {
  const cappedTwentyPercent = promotion({ discountPercent: 20, maxDiscount: 5000 })
  const uncappedTenPercent = promotion({ discountPercent: 10, maxDiscount: null })
  const best = findBestShopPromotion(
    [cappedTwentyPercent, uncappedTenPercent],
    100000,
    now,
  )

  assert.equal(best.promotion, uncappedTenPercent)
  assert.equal(best.discountAmount, 10000)
})

test('excludes inactive and out-of-date promotions', () => {
  const active = promotion()
  const results = getActiveShopPromotions([
    active,
    promotion({ status: false }),
    promotion({ startDate: '2026-10-30' }),
    promotion({ endDate: '2026-10-28' }),
    promotion({ startDate: null }),
  ], now)

  assert.deepEqual(results, [active])
})
