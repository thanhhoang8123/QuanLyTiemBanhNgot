import assert from 'node:assert/strict'
import test from 'node:test'
import {
  containsVnPayReturnParameters,
  getVnPayReturnTransactionReference,
  getVnPayInitiationErrorMessage,
  isVnPayReturn,
  requireVnPayPaymentUrl,
} from './customerVnPayPayment.js'

test('accepts a complete HTTPS VNPay Sandbox response', () => {
  assert.equal(requireVnPayPaymentUrl({
    paymentId: 41,
    transactionReference: 'attempt-reference',
    paymentUrl: 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?token=example',
  }), 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?token=example')
})

test('rejects incomplete payment initiation responses', () => {
  assert.throws(() => requireVnPayPaymentUrl({
    paymentId: 41,
    paymentUrl: 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
  }))
})

test('rejects non-HTTPS or non-VNPay destinations', () => {
  for (const paymentUrl of [
    'http://sandbox.vnpayment.vn/payment',
    'https://vnpayment.vn/payment',
    'https://sandbox.vnpayment.vn.attacker.example/payment',
    'https://user@sandbox.vnpayment.vn/payment',
    'https://sandbox.vnpayment.vn:8443/payment',
  ]) {
    assert.throws(() => requireVnPayPaymentUrl({
      paymentId: 41,
      transactionReference: 'attempt-reference',
      paymentUrl,
    }))
  }
})

test('recognizes VNPay return query parameters without interpreting them as payment status', () => {
  assert.equal(containsVnPayReturnParameters('?vnp_TxnRef=abc&vnp_ResponseCode=00'), true)
  assert.equal(containsVnPayReturnParameters('?orderId=123&paymentStatus=SUCCESS'), false)
})

test('reads only the backend redirect reference as a status lookup key', () => {
  assert.equal(
    getVnPayReturnTransactionReference('?vnpayReturn=1&transactionReference=abc123'),
    'abc123',
  )
  assert.equal(
    getVnPayReturnTransactionReference('?vnp_TxnRef=untrusted&vnp_ResponseCode=00'),
    null,
  )
  assert.equal(isVnPayReturn('?vnpayReturn=1'), true)
  assert.equal(isVnPayReturn('?vnp_ResponseCode=00'), true)
})

test('provides safe guidance for authorization, conflict, and uncertain network errors', () => {
  assert.match(getVnPayInitiationErrorMessage({ status: 409 }), /kiểm tra.*trước khi thanh toán lại/i)
  assert.match(getVnPayInitiationErrorMessage({ status: 401 }), /phiên đăng nhập/i)
  assert.match(getVnPayInitiationErrorMessage({ status: 403 }), /liên hệ cửa hàng/)
  assert.match(getVnPayInitiationErrorMessage(new Error('network failure')), /kiểm tra trạng thái trước khi thử lại/)
})
