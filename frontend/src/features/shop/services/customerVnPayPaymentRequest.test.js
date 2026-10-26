import assert from 'node:assert/strict'
import test from 'node:test'
import { buildCustomerVnPayPaymentRequest } from './customerVnPayPaymentRequest.js'

test('VNPay initiation request contains only the validated order ID', () => {
  assert.deepEqual(buildCustomerVnPayPaymentRequest('42'), { orderId: 42 })
})

test('VNPay initiation request rejects non-positive or invalid order IDs', () => {
  for (const orderId of [0, -1, 'invalid', null]) {
    assert.throws(() => buildCustomerVnPayPaymentRequest(orderId))
  }
})
