import assert from 'node:assert/strict'
import test from 'node:test'
import { addPosProductToCart } from './posCart.js'

const product = {
  id: 8,
  name: 'Bánh kem',
  price: 100000,
  stock: 5,
  imageUrl: 'https://example.test/cake.jpg',
}

test('one click adds exactly one unit at the stable catalog price', () => {
  const cart = addPosProductToCart([], product)

  assert.equal(cart.length, 1)
  assert.equal(cart[0].quantity, 1)
  assert.equal(cart[0].price, product.price)
  assert.equal(cart[0].originalPrice, product.price)
  assert.equal(cart[0].imageUrl, product.imageUrl)
})

test('repeated clicks increment only the selected product without reusing a quoted price', () => {
  const first = addPosProductToCart([], product)
  const cartWithOtherProduct = [...first, { id: 9, quantity: 1, price: 25000 }]
  const next = addPosProductToCart(cartWithOtherProduct, {
    ...product,
    price: 100000,
    salePrice: 85000,
  })

  assert.deepEqual(next.map(({ id, quantity }) => ({ id, quantity })), [
    { id: 8, quantity: 2 },
    { id: 9, quantity: 1 },
  ])
  assert.equal(next[0].price, product.price)
  assert.equal(next[0].originalPrice, product.price)
})

test('does not add beyond the latest available stock', () => {
  const cart = [{ id: 8, quantity: 5, price: product.price }]

  assert.equal(addPosProductToCart(cart, product), cart)
})
