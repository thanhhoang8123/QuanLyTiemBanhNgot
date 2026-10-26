function requireOrder(order) {
  if (!order || order.id == null) {
    throw new Error('Chưa thể xác nhận đơn hàng. Vui lòng kiểm tra lại lịch sử đơn.')
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
