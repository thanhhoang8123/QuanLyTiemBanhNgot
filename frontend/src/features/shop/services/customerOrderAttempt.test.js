import assert from 'node:assert/strict'
import test from 'node:test'
import {
  CUSTOMER_ORDER_ATTEMPT_STORAGE_KEY,
  cartMatchesCustomerOrder,
  clearCustomerOrderAttempt,
  createCustomerOrderAttempt,
  readCustomerOrderAttempt,
  saveCustomerOrderAttempt,
} from './customerOrderAttempt.js'
import { resolveCustomerOrderAttempt } from './customerOrderRecovery.js'

const key = 'a25edbd5-501f-4972-a1d4-70da11372e8c'
const payload = {
  items: [{ productId: 7, quantity: 2 }],
  deliveryAddress: '10 Bánh Ngọt',
  promotionCode: null,
  note: 'Gọi khi đến',
}

function createStorage() {
  const values = new Map()
  return {
    getItem(name) { return values.get(name) ?? null },
    setItem(name, value) { values.set(name, value) },
    removeItem(name) { values.delete(name) },
  }
}

test('restores the exact key and request payload after checkout reload', () => {
  const storage = createStorage()
  const attempt = createCustomerOrderAttempt('customer-a', payload, key)

  assert.equal(saveCustomerOrderAttempt(storage, attempt), true)
  assert.deepEqual(readCustomerOrderAttempt(storage, 'customer-a'), {
    status: 'pending',
    attempt,
  })
})

test('retries a request after a lost response with the same key and payload', async () => {
  const storage = createStorage()
  const attempt = createCustomerOrderAttempt('42', payload, key)
  saveCustomerOrderAttempt(storage, attempt)
  const serverOrders = new Map()
  const requests = []
  const postOrder = async (request, idempotencyKey) => {
    requests.push({ request, idempotencyKey })
    if (!serverOrders.has(idempotencyKey)) {
      serverOrders.set(idempotencyKey, { id: 101 })
      throw new Error('client lost response after commit')
    }
    return serverOrders.get(idempotencyKey)
  }

  const firstAttempt = readCustomerOrderAttempt(storage, '42').attempt
  await assert.rejects(postOrder(firstAttempt.payload, firstAttempt.key))

  const restoredAttempt = readCustomerOrderAttempt(storage, '42').attempt
  const order = await postOrder(restoredAttempt.payload, restoredAttempt.key)

  assert.deepEqual(order, { id: 101 })
  assert.equal(requests.length, 2)
  assert.equal(requests[0].idempotencyKey, requests[1].idempotencyKey)
  assert.deepEqual(requests[0].request, requests[1].request)
  assert.equal(serverOrders.size, 1)
})

test('does not expose a pending request to a different signed-in customer', () => {
  const storage = createStorage()
  saveCustomerOrderAttempt(storage, createCustomerOrderAttempt('customer-a', payload, key))

  assert.deepEqual(readCustomerOrderAttempt(storage, 'customer-b'), { status: 'owner-mismatch' })
})

test('keeps the pending request when storage is malformed or unavailable', () => {
  const storage = createStorage()
  storage.setItem(CUSTOMER_ORDER_ATTEMPT_STORAGE_KEY, '{')
  assert.deepEqual(readCustomerOrderAttempt(storage, 'customer-a'), { status: 'invalid' })

  const blockedStorage = {
    getItem() { throw new Error('storage blocked') },
  }
  assert.deepEqual(readCustomerOrderAttempt(blockedStorage, 'customer-a'), { status: 'unavailable' })
})

test('clears only the matching request key after a successful response', () => {
  const storage = createStorage()
  saveCustomerOrderAttempt(storage, createCustomerOrderAttempt('customer-a', payload, key))

  assert.equal(clearCustomerOrderAttempt(storage, 'different-key'), false)
  assert.equal(readCustomerOrderAttempt(storage, 'customer-a').status, 'pending')
  assert.equal(clearCustomerOrderAttempt(storage, key), true)
  assert.deepEqual(readCustomerOrderAttempt(storage, 'customer-a'), { status: 'none' })
})

test('does not overwrite an unresolved attempt with a new request', () => {
  const storage = createStorage()
  const firstAttempt = createCustomerOrderAttempt('customer-a', payload, key)
  saveCustomerOrderAttempt(storage, firstAttempt)

  const secondAttempt = createCustomerOrderAttempt(
    'customer-a',
    { ...payload, note: 'different request' },
    '0c9a3dd8-e70c-4a5c-b2cd-1781c80b6650',
  )
  assert.equal(saveCustomerOrderAttempt(storage, secondAttempt), false)
  assert.deepEqual(readCustomerOrderAttempt(storage, 'customer-a').attempt, firstAttempt)
})

test('matches the persisted order cart before clearing the current cart', () => {
  assert.equal(cartMatchesCustomerOrder(
    [{ productId: 7, quantity: 2 }],
    payload.items,
  ), true)
  assert.equal(cartMatchesCustomerOrder(
    [{ productId: 7, quantity: 1 }],
    payload.items,
  ), false)
})

test('uses the order found by the old request key without creating another order', async () => {
  const attempt = createCustomerOrderAttempt('42', payload, key)
  const expectedOrder = { id: 101 }
  let createCalls = 0

  const order = await resolveCustomerOrderAttempt(attempt, {
    async findByRequestKey(requestKey) {
      assert.equal(requestKey, key)
      return expectedOrder
    },
    async createOrder() {
      createCalls += 1
    },
  })

  assert.equal(order, expectedOrder)
  assert.equal(createCalls, 0)
})

test('posts the original payload and key only when lookup confirms not found', async () => {
  const attempt = createCustomerOrderAttempt('42', payload, key)
  const expectedOrder = { id: 101 }
  let createRequest

  const order = await resolveCustomerOrderAttempt(attempt, {
    async findByRequestKey() {
      const error = new Error('not found')
      error.status = 404
      throw error
    },
    async createOrder(request, idempotencyKey) {
      createRequest = { request, idempotencyKey }
      return expectedOrder
    },
  })

  assert.equal(order, expectedOrder)
  assert.deepEqual(createRequest, { request: payload, idempotencyKey: key })
})

test('does not create an order when lookup fails due to network or authorization', async () => {
  const attempt = createCustomerOrderAttempt('42', payload, key)

  for (const error of [new Error('network failure'), Object.assign(new Error('unauthorized'), { status: 401 })]) {
    let createCalls = 0
    await assert.rejects(
      resolveCustomerOrderAttempt(attempt, {
        async findByRequestKey() { throw error },
        async createOrder() { createCalls += 1 },
      }),
      error,
    )
    assert.equal(createCalls, 0)
  }
})

test('after a committed POST loses its response, the next attempt finds the order without another POST', async () => {
  const attempt = createCustomerOrderAttempt('42', payload, key)
  let committedOrder = null
  let postCalls = 0

  await assert.rejects(resolveCustomerOrderAttempt(attempt, {
    async findByRequestKey() {
      if (!committedOrder) {
        const error = new Error('not found')
        error.status = 404
        throw error
      }
      return committedOrder
    },
    async createOrder(request, idempotencyKey) {
      assert.deepEqual(request, payload)
      assert.equal(idempotencyKey, key)
      postCalls += 1
      committedOrder = { id: 101 }
      throw new Error('response lost after commit')
    },
  }))

  const recoveredOrder = await resolveCustomerOrderAttempt(attempt, {
    async findByRequestKey(requestKey) {
      assert.equal(requestKey, key)
      return committedOrder
    },
    async createOrder() {
      postCalls += 1
    },
  })

  assert.deepEqual(recoveredOrder, { id: 101 })
  assert.equal(postCalls, 1)
})
