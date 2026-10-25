
const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api'
const apiBaseUrl = configuredBaseUrl.replace(/\/+$/, '')

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
    throw new ApiError('Không thể khởi tạo bảo vệ CSRF. Vui lòng tải lại trang.', response.status)
  }

  token = readCookie('XSRF-TOKEN')
  if (!token) {
    throw new ApiError('Backend chưa cấp CSRF token. Vui lòng kiểm tra cấu hình bảo mật.')
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
        && !headers.has('X-XSRF-TOKEN')) {
    try {
        headers.set('X-XSRF-TOKEN', await getCsrfCookieToken())
    } catch (error) {
        if (error instanceof ApiError) throw error
        throw new ApiError('Không thể khởi tạo bảo vệ CSRF. Hãy kiểm tra kết nối backend.')
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
      'Không thể kết nối tới API. Hãy kiểm tra backend và cấu hình kết nối.'
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
          'API trả về dữ liệu JSON không hợp lệ.',
          response.status
        )
      }
    }
  }

  if (!response.ok) {
    const message =
      typeof data?.message === 'string'
        ? data.message
        : typeof data?.detail === 'string'
          ? data.detail
          : `Yêu cầu thất bại (HTTP ${response.status}).`

    throw new ApiError(message, response.status)
  }

  return data
}
