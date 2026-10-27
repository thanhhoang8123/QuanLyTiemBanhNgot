import assert from 'node:assert/strict'
import test from 'node:test'
import { getBestPromotionSuggestion } from './promotionSuggestions.js'

test('selects the greatest actual saving after a promotion cap', () => {
  const suggestions = [
    { eligible: true, promotionCode: 'PERCENT10', discountAmount: '30000.00', minOrderValue: '0' },
    { eligible: true, promotionCode: 'PERCENT20', discountAmount: '20000.00', minOrderValue: '0' },
  ]

  assert.equal(getBestPromotionSuggestion(suggestions).promotionCode, 'PERCENT10')
})

test('breaks equal-saving ties in favor of the lower minimum order', () => {
  const suggestions = [
    { eligible: true, promotionCode: 'HARDER', discountAmount: '20000', minOrderValue: '500000' },
    { eligible: true, promotionCode: 'EASIER', discountAmount: '20000', minOrderValue: '100000' },
    { eligible: false, promotionCode: 'INVALID', discountAmount: '50000', minOrderValue: '0' },
  ]

  assert.equal(getBestPromotionSuggestion(suggestions).promotionCode, 'EASIER')
})

test('does not recommend an offer with no actual monetary saving', () => {
  assert.equal(getBestPromotionSuggestion([
    { eligible: true, promotionCode: 'NO_SAVING', discountAmount: '0' },
  ]), null)
  assert.equal(getBestPromotionSuggestion([]), null)
})
