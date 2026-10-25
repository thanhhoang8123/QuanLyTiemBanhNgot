export const CUSTOMER_ORDER_ATTEMPT_STORAGE_KEY = 'wa-customer-order-request'

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function isValidPayload(payload) {
  return payload
    && Array.isArray(payload.items)
    && payload.items.length > 0
    && payload.items.every((item) => (
      Number.isInteger(item.productId)
      && item.productId > 0
      && Number.isInteger(item.quantity)
      && item.quantity > 0
    ))
    && (payload.deliveryAddress === null || typeof payload.deliveryAddress === 'string')
    && (payload.promotionCode === null || typeof payload.promotionCode === 'string')
    && (payload.note === null || typeof payload.note === 'string')
}

export function readCustomerOrderAttempt(storage, owner) {
  let stored
  try {
    stored = storage.getItem(CUSTOMER_ORDER_ATTEMPT_STORAGE_KEY)
  } catch {
    return { status: 'unavailable' }
  }

  if (stored === null) return { status: 'none' }

  let attempt
  try {
    attempt = JSON.parse(stored)
  } catch {
    return { status: 'invalid' }
  }

  if (
    attempt?.version !== 1
    || typeof attempt.owner !== 'string'
    || !uuidPattern.test(attempt.key || '')
    || !isValidPayload(attempt.payload)
  ) {
    return { status: 'invalid' }
  }

  if (!owner || attempt.owner !== owner) return { status: 'owner-mismatch' }
  return { status: 'pending', attempt }
}

export function createCustomerOrderAttempt(owner, payload, key) {
  if (!owner || !uuidPattern.test(key || '') || !isValidPayload(payload)) {
    throw new Error('Không thể lưu yêu cầu đặt hàng hợp lệ.')
  }
  return { version: 1, owner, key, payload }
}

export function saveCustomerOrderAttempt(storage, attempt) {
  try {
    if (storage.getItem(CUSTOMER_ORDER_ATTEMPT_STORAGE_KEY) !== null) return false
    storage.setItem(CUSTOMER_ORDER_ATTEMPT_STORAGE_KEY, JSON.stringify(attempt))
    return true
  } catch {
    return false
  }
}

export function clearCustomerOrderAttempt(storage, key) {
  try {
    const stored = storage.getItem(CUSTOMER_ORDER_ATTEMPT_STORAGE_KEY)
    if (stored !== null) {
      const current = JSON.parse(stored)
      if (current?.key !== key) return false
    }
    storage.removeItem(CUSTOMER_ORDER_ATTEMPT_STORAGE_KEY)
    return true
  } catch {
    return false
  }
}

export function createCustomerOrderRequestKey(cryptoApi = globalThis.crypto) {
  if (cryptoApi?.randomUUID) return cryptoApi.randomUUID()
  if (!cryptoApi?.getRandomValues) {
    throw new Error('Trình duyệt không hỗ trợ tạo khóa đặt hàng an toàn.')
  }

  const bytes = cryptoApi.getRandomValues(new Uint8Array(16))
  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  const hex = [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

export function cartMatchesCustomerOrder(items, payloadItems) {
  if (items.length !== payloadItems.length) return false
  const cartQuantities = new Map(items.map(({ productId, quantity }) => [productId, quantity]))
  return payloadItems.every(({ productId, quantity }) => cartQuantities.get(productId) === quantity)
}
