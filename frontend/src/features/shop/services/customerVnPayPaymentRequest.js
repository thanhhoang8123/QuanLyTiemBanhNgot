export function buildCustomerVnPayPaymentRequest(orderId) {
  if (!Number.isInteger(Number(orderId)) || Number(orderId) <= 0) {
    throw new Error('Mã đơn hàng không hợp lệ để khởi tạo thanh toán.')
  }
  return { orderId: Number(orderId) }
}
