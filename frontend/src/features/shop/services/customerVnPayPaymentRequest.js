export function buildCustomerVnPayPaymentRequest(orderId) {
  if (!Number.isInteger(Number(orderId)) || Number(orderId) <= 0) {
    throw new Error('Không thể xác định đơn hàng cần thanh toán. Vui lòng kiểm tra lại đơn.')
  }
  return { orderId: Number(orderId) }
}
