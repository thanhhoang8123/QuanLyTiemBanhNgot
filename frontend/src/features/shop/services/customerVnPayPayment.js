const SANDBOX_PAYMENT_HOST = 'sandbox.vnpayment.vn'

export function containsVnPayReturnParameters(search) {
  return [...new URLSearchParams(search).keys()].some((name) => name.startsWith('vnp_'))
}

export function isVnPayReturn(search) {
  const parameters = new URLSearchParams(search)
  return parameters.get('vnpayReturn') === '1'
    || containsVnPayReturnParameters(search)
}

export function getVnPayReturnTransactionReference(search) {
  const parameters = new URLSearchParams(search)
  if (parameters.get('vnpayReturn') !== '1') return null
  const reference = parameters.get('transactionReference')
  return reference && /^[A-Za-z0-9]{1,100}$/.test(reference) ? reference : null
}

export function getVnPayInitiationErrorMessage(error) {
  if (error?.status === 409) {
    return 'Đơn hàng đang có giao dịch cần kiểm tra. Vui lòng xem trạng thái đơn trước khi thanh toán lại.'
  }
  if (error?.status === 401 || error?.status === 403) {
    return error.status === 401
      ? 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại rồi kiểm tra đơn hàng.'
      : 'Tài khoản chưa thể tiếp tục thanh toán. Vui lòng liên hệ cửa hàng.'
  }
  return 'Chưa thể mở trang thanh toán. Đơn hàng vẫn được lưu; vui lòng kiểm tra trạng thái trước khi thử lại.'
}

export function requireVnPayPaymentUrl(response) {
  if (
    !response
    || !Number.isInteger(Number(response.paymentId))
    || Number(response.paymentId) <= 0
    || typeof response.transactionReference !== 'string'
    || !response.transactionReference.trim()
    || typeof response.paymentUrl !== 'string'
  ) {
    throw new Error('Backend không trả về thông tin khởi tạo thanh toán hợp lệ.')
  }

  let paymentUrl
  try {
    paymentUrl = new URL(response.paymentUrl)
  } catch {
    throw new Error('Backend trả về URL thanh toán không hợp lệ.')
  }
  if (
    paymentUrl.protocol !== 'https:'
    || paymentUrl.hostname !== SANDBOX_PAYMENT_HOST
    || paymentUrl.username
    || paymentUrl.password
    || paymentUrl.port
  ) {
    throw new Error('URL thanh toán không thuộc VNPay Sandbox an toàn.')
  }
  return paymentUrl.href
}
