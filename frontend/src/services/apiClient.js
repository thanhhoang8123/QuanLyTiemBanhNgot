
const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api'
const apiBaseUrl = configuredBaseUrl.replace(/\/+$/, '')
const GENERIC_ERROR_MESSAGE = 'Chưa thể hoàn tất thao tác. Vui lòng thử lại.'
const TECHNICAL_ERROR_PATTERN =
  /\b(api|backend|frontend|request|response|sql|stack trace|json|typeerror|referenceerror|syntaxerror)\b|\w*exception|org\.[\w.]+|http\s*\d{3}|lỗi nội bộ|cannot read (?:properties|property)|is not a function|failed to fetch/i

function getSafeErrorMessage(message, status) {
  if (status === 401) return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'
  if (status === 403) return 'Bạn không có quyền thực hiện thao tác này.'
  if (status === 404 && /^(not found|404)$/i.test(message?.trim() || '')) {
    return 'Không tìm thấy thông tin cần thiết.'
  }
  if (status === 409 && /^(conflict|409)$/i.test(message?.trim() || '')) {
    return 'Thông tin đã tồn tại hoặc đang được sử dụng. Vui lòng kiểm tra lại.'
  }
  if (status === 400 && /^(bad request|400)$/i.test(message?.trim() || '')) {
    return 'Vui lòng kiểm tra lại thông tin đã nhập.'
  }
  if (status >= 500 || typeof message !== 'string' || !message.trim()) {
    return GENERIC_ERROR_MESSAGE
  }
  if (TECHNICAL_ERROR_PATTERN.test(message)) {
    return GENERIC_ERROR_MESSAGE
  }
  return message
}

export function getUserFacingErrorMessage(error, fallback = GENERIC_ERROR_MESSAGE) {
  if (!error) return fallback
  const message = typeof error === 'string' ? error : error.message
  if (typeof error === 'object' && error.status != null) {
    return getSafeErrorMessage(message, error.status)
  }
  if (typeof message !== 'string' || !message.trim() || TECHNICAL_ERROR_PATTERN.test(message)) {
    return fallback
  }
  return message
}

export class ApiError extends Error {
  constructor(message, status = null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

function readCookie(name) {
  if (typeof document === 'undefined') return ''

  const prefix = `${name}=`
  const cookie = document.cookie
    .split('; ')
    .find((entry) => entry.startsWith(prefix))

  return cookie ? decodeURIComponent(cookie.slice(prefix.length)) : ''
}

async function getCsrfCookieToken() {
  let token = readCookie('XSRF-TOKEN')
  if (token) return token

  const response = await fetch(`${apiBaseUrl}/auth/csrf`, {
    headers: { Accept: 'application/json' },
    credentials: 'include',
  })

  if (!response.ok) {
    throw new ApiError('Phiên làm việc đã hết hạn. Vui lòng tải lại trang.', response.status)
  }

  token = readCookie('XSRF-TOKEN')
  if (!token) {
    throw new ApiError('Không thể bắt đầu phiên làm việc. Vui lòng tải lại trang.')
  }

  return token
}

export async function apiRequest(
  path,
  { method = 'GET', body, signal, headers: customHeaders } = {}
) {
  const requestMethod = method.toUpperCase()
  const headers = new Headers({
    Accept: 'application/json',
    ...Object.fromEntries(
      customHeaders instanceof Headers
        ? customHeaders.entries()
        : Object.entries(customHeaders || {})
    ),
  })

  if (!['GET', 'HEAD', 'OPTIONS', 'TRACE'].includes(requestMethod)
        && (!headers.has('X-XSRF-TOKEN') || !headers.has('X-CSRF-Token'))) {
    try {
        const csrfToken = await getCsrfCookieToken()
        if (!headers.has('X-XSRF-TOKEN')) headers.set('X-XSRF-TOKEN', csrfToken)
        if (!headers.has('X-CSRF-Token')) headers.set('X-CSRF-Token', csrfToken)
    } catch (error) {
      if (error instanceof ApiError) throw error
      throw new ApiError('Không thể kết nối. Vui lòng kiểm tra mạng và thử lại.')
    }
  }

  const options = {
    method: requestMethod,
    headers,
    signal,
    credentials: 'include',
  }

  if (body !== undefined) {
    if (typeof FormData !== 'undefined' && body instanceof FormData) {
      options.body = body
    } else {
      headers.set('Content-Type', 'application/json')
      options.body = JSON.stringify(body)
    }
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`

  let response

  try {
    response = await fetch(`${apiBaseUrl}${normalizedPath}`, options)
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw error
    }

    throw new ApiError(
      'Không thể kết nối. Vui lòng kiểm tra mạng và thử lại.'
    )
  }

  if (response.status === 204) {
    return null
  }

  const responseText = await response.text()
  let data = null

  if (responseText) {
    try {
      data = JSON.parse(responseText)
    } catch {
      if (response.ok) {
        throw new ApiError(
          'Chưa thể tải dữ liệu lúc này. Vui lòng thử lại.',
          response.status
        )
      }
    }
  }

  if (!response.ok) {
    const serverMessage =
      typeof data?.message === 'string'
        ? data.message
        : typeof data?.detail === 'string'
          ? data.detail
          : ''

    throw new ApiError(
      getSafeErrorMessage(serverMessage, response.status),
      response.status,
    )
  }

  return data
}
