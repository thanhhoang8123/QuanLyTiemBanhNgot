import assert from 'node:assert/strict'
import test from 'node:test'
import { isValidVietnamesePhone, normalizeVietnamesePhone } from './vietnamesePhone.js'

test('normalizes supported Vietnamese mobile numbers to the national format', () => {
  assert.equal(normalizeVietnamesePhone('0912 345 678'), '0912345678')
  assert.equal(normalizeVietnamesePhone('+84 912-345-678'), '0912345678')
  assert.equal(normalizeVietnamesePhone('84912345678'), '0912345678')
})

test('rejects invalid lengths, unsupported prefixes, and landline numbers', () => {
  assert.equal(normalizeVietnamesePhone('091234567'), null)
  assert.equal(normalizeVietnamesePhone('0212345678'), null)
  assert.equal(normalizeVietnamesePhone('0123456789'), null)
  assert.equal(normalizeVietnamesePhone(null), null)
})

test('validates only normalized Vietnamese mobile numbers for saved attempts', () => {
  assert.equal(isValidVietnamesePhone('0987654321'), true)
  assert.equal(isValidVietnamesePhone('+84987654321'), false)
})
