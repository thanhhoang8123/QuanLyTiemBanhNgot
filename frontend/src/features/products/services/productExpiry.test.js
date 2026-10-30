import test from 'node:test'
import assert from 'node:assert/strict'
import {
  calculateDaysUntilExpiry,
  getExpiryStatus,
  isExpiringWithinDays,
  formatDate,
} from './productExpiry.js'

test('calculates days until expiry correctly', () => {
  const refDate = new Date(2026, 9, 30) // 2026-10-30

  assert.equal(calculateDaysUntilExpiry('2026-10-31', refDate), 1)
  assert.equal(calculateDaysUntilExpiry('2026-10-30', refDate), 0)
  assert.equal(calculateDaysUntilExpiry('2026-10-29', refDate), -1)
  assert.equal(calculateDaysUntilExpiry('2026-11-05', refDate), 6)
  assert.equal(calculateDaysUntilExpiry('', refDate), null)
  assert.equal(calculateDaysUntilExpiry(null, refDate), null)
})

test('identifies products expiring in 1 day', () => {
  const refDate = new Date(2026, 9, 30) // 2026-10-30

  const status1Day = getExpiryStatus('2026-10-31', refDate)
  assert.equal(status1Day.status, 'expiring_1_day')
  assert.equal(status1Day.isExpiringSoon, true)
  assert.equal(status1Day.days, 1)

  const statusToday = getExpiryStatus('2026-10-30', refDate)
  assert.equal(statusToday.status, 'expires_today')
  assert.equal(statusToday.isExpiringSoon, true)
  assert.equal(statusToday.days, 0)

  const statusExpired = getExpiryStatus('2026-10-25', refDate)
  assert.equal(statusExpired.status, 'expired')
  assert.equal(statusExpired.isExpired, true)
  assert.equal(statusExpired.isExpiringSoon, true)

  const statusValid = getExpiryStatus('2026-11-10', refDate)
  assert.equal(statusValid.status, 'valid')
  assert.equal(statusValid.isExpiringSoon, false)
})

test('isExpiringWithinDays accurately filters products within 1 day', () => {
  const refDate = new Date(2026, 9, 30) // 2026-10-30

  assert.equal(isExpiringWithinDays('2026-10-31', 1, refDate), true) // 1 day
  assert.equal(isExpiringWithinDays('2026-10-30', 1, refDate), true) // today
  assert.equal(isExpiringWithinDays('2026-10-29', 1, refDate), true) // expired
  assert.equal(isExpiringWithinDays('2026-11-01', 1, refDate), false) // 2 days
  assert.equal(isExpiringWithinDays('', 1, refDate), false)
})

test('formatDate formats YYYY-MM-DD to DD/MM/YYYY', () => {
  assert.equal(formatDate('2026-10-30'), '30/10/2026')
  assert.equal(formatDate('2026-05-09T14:30:00'), '09/05/2026')
  assert.equal(formatDate(''), '—')
  assert.equal(formatDate(null), '—')
})
