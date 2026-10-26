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
    return 'Đơn đã tồn tại và backend báo giao dịch trước đó đang chờ/đối soát. Không thử tạo giao dịch mới; hãy kiểm tra đơn hàng của bạn.'
  }
  if (error?.status === 401 || error?.status === 403) {
    return `Không thể khởi tạo thanh toán do phiên đăng nhập hoặc quyền truy cập. Đơn vẫn được giữ để đối soát. ${error.message || ''}`.trim()
  }
  return 'Chưa rõ backend đã tạo giao dịch VNPay hay chưa. Đơn hàng được giữ lại; không tự gửi lại để tránh tạo lần thanh toán khác. Hãy kiểm tra đơn hàng của bạn.'
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
