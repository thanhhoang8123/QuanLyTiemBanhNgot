export function reconcilePosCartWithCatalog(cart, products) {
  const productsById = new Map(products.map((product) => [Number(product.id), product]))

  return cart.map((item) => {
    const product = productsById.get(Number(item.id))
    if (!product) {
      return { ...item, stock: 0, status: false }
    }

    return {
      ...item,
      ...product,
      id: Number(product.id),
      price: Number(product.price),
      quantity: item.quantity,
      stock: product.status === true ? product.stock : 0,
    }
  })
}
