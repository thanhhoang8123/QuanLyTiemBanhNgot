export function addPosProductToCart(cart, product) {
  const selected = cart.find((item) => Number(item.id) === Number(product.id))
  if ((selected?.quantity ?? 0) >= Number(product.stock)) return cart

  const unitPrice = Number(product.price)
  if (selected) {
    return cart.map((item) => Number(item.id) === Number(product.id)
      ? {
          ...item,
          price: unitPrice,
          originalPrice: Number(item.originalPrice ?? unitPrice),
          quantity: item.quantity + 1,
        }
      : item)
  }

  return [
    ...cart,
    {
      ...product,
      price: unitPrice,
      originalPrice: unitPrice,
      quantity: 1,
    },
  ]
}
