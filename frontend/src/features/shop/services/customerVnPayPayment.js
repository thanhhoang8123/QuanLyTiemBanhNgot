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
    return 'Đơn hàng đã có giao dịch đang chờ xác minh. Vui lòng kiểm tra trạng thái; không thử tạo giao dịch mới trước khi có kết quả.'
  }
  if (error?.status === 401 || error?.status === 403) {
    return error.status === 401
      ? 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại rồi kiểm tra đơn hàng.'
      : 'Bạn không có quyền truy cập chức năng thanh toán này.'
  }
  return 'Chưa xác định được trạng thái thanh toán. Đơn hàng vẫn được giữ; vui lòng kiểm tra trạng thái trước, không tự gửi lại yêu cầu.'
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
    throw new Error('Chưa thể bắt đầu thanh toán. Vui lòng kiểm tra đơn hàng và thử lại.')
  }

  let paymentUrl
  try {
    paymentUrl = new URL(response.paymentUrl)
  } catch {
    throw new Error('Chưa thể mở trang thanh toán. Vui lòng thử lại sau.')
  }
  if (
    paymentUrl.protocol !== 'https:'
    || paymentUrl.hostname !== SANDBOX_PAYMENT_HOST
    || paymentUrl.username
    || paymentUrl.password
    || paymentUrl.port
  ) {
    throw new Error('Không thể mở trang thanh toán an toàn. Vui lòng liên hệ cửa hàng.')
  }
  return paymentUrl.href
}
