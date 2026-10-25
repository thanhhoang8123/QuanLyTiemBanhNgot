function requireOrder(order) {
  if (!order || order.id == null) {
    throw new Error('API chưa trả về mã đơn hợp lệ để xác nhận kết quả.')
  }
  return order
}

export async function resolveCustomerOrderAttempt(
  attempt,
  { findByRequestKey, createOrder },
) {
  let existingOrder
  let found = false
  try {
    existingOrder = await findByRequestKey(attempt.key)
    found = true
  } catch (error) {
    if (error?.status !== 404) throw error
  }

  if (found) return requireOrder(existingOrder)
  return requireOrder(await createOrder(attempt.payload, attempt.key))
}
