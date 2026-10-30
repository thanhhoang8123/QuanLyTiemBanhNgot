import { apiRequest } from '../../../services/apiClient.js'

export function getPayments({ signal } = {}) {
  return apiRequest('/payments', { signal })
}

function validatePaymentResponse(payment, expected = {}) {
  const amount = Number(payment?.amount)
  if (!payment
      || !Number.isInteger(Number(payment.id))
      || Number(payment.id) <= 0
      || !Number.isInteger(Number(payment.orderId))
      || Number(payment.orderId) <= 0
      || !Number.isFinite(amount)
      || amount < 0
      || !['PENDING', 'SUCCESS', 'FAILED'].includes(payment.status)) {
    throw new Error('Chưa thể xác nhận thông tin thanh toán. Vui lòng tải lại trang.')
  }
  if (expected.id != null && Number(payment.id) !== Number(expected.id)) {
    throw new Error('Thông tin thanh toán chưa khớp. Vui lòng kiểm tra lại trạng thái đơn hàng.')
  }
  if (expected.orderId != null && Number(payment.orderId) !== Number(expected.orderId)) {
    throw new Error('Thông tin thanh toán chưa khớp với đơn hàng. Vui lòng tải lại dữ liệu.')
  }
  if (expected.status && payment.status !== expected.status) {
    throw new Error('Chưa thể xác nhận trạng thái thanh toán. Vui lòng tải lại dữ liệu.')
  }
  if (expected.paymentMethod && payment.paymentMethod !== expected.paymentMethod) {
    throw new Error('Thông tin phương thức thanh toán chưa khớp. Vui lòng kiểm tra lại.')
  }
  return payment
}

export async function createPayment(payment) {
  const result = await apiRequest('/payments', { method: 'POST', body: payment })
  return validatePaymentResponse(result, {
    orderId: payment.orderId,
    status: 'PENDING',
    paymentMethod: payment.paymentMethod,
  })
}

export async function simulatePayment(id, result) {
  const payment = await apiRequest(`/payments/${encodeURIComponent(id)}/simulate`, {
    method: 'POST',
    body: { result },
  })
  return validatePaymentResponse(payment, { id, status: result })
}
