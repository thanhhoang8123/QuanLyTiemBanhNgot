import assert from 'node:assert/strict'
import test from 'node:test'
import { reconcilePosCartWithCatalog } from './posCatalog.js'

test('refreshes cart product data and restores the current catalog price', () => {
  const cart = [{
    id: 1,
    name: 'Tên cũ',
    price: 80,
    quantity: 2,
    stock: 3,
    category: 'Cũ',
  }]
  const products = [{
    id: 1,
    name: 'Tên mới',
    price: 100,
    quantity: 5,
    stock: 5,
    status: true,
    category: 'Mới',
  }]

  assert.deepEqual(reconcilePosCartWithCatalog(cart, products), [{
    ...products[0],
    id: 1,
    price: 100,
    quantity: 2,
    stock: 5,
  }])
})

test('marks missing or inactive catalog products unavailable in the cart', () => {
  const cart = [
    { id: 1, name: 'Đã xóa', price: 100, quantity: 1, stock: 4 },
    { id: 2, name: 'Ngừng bán', price: 200, quantity: 1, stock: 2 },
  ]
  const products = [{
    id: 2,
    name: 'Ngừng bán',
    price: 200,
    stock: 2,
    status: false,
  }]

  assert.deepEqual(
    reconcilePosCartWithCatalog(cart, products).map(({ stock, status }) => ({ stock, status })),
    [{ stock: 0, status: false }, { stock: 0, status: false }],
  )
})
