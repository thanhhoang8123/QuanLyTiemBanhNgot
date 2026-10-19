
const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api'
const apiBaseUrl = configuredBaseUrl.replace(/\/+$/, '')

export class ApiError extends Error {
  constructor(message, status = null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export async function apiRequest(
  path,
  { method = 'GET', body, signal, headers: customHeaders } = {}
) {
  const headers = new Headers({
    Accept: 'application/json',
    ...Object.fromEntries(
      customHeaders instanceof Headers
        ? customHeaders.entries()
        : Object.entries(customHeaders || {})
    ),
  })

  const options = {
    method,
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
