import assert from 'node:assert/strict'
import test from 'node:test'
import { resolveCustomerOrderAttempt } from './customerOrderRecovery.js'

const attempt = {
  key: 'request-key',
  payload: { items: [{ productId: 1, quantity: 1 }] },
}

test('recovers an order by request key before retrying creation', async () => {
  const existingOrder = { id: 110 }
  let createCalls = 0
  const result = await resolveCustomerOrderAttempt(attempt, {
    findByRequestKey: async () => existingOrder,
    createOrder: async () => {
      createCalls += 1
      return { id: 111 }
    },
  })

  assert.equal(result, existingOrder)
  assert.equal(createCalls, 0)
})

test('creates with the same request key only when recovery returns not found', async () => {
  let createdWith
  const result = await resolveCustomerOrderAttempt(attempt, {
    findByRequestKey: async () => {
      const error = new Error('not found')
      error.status = 404
      throw error
    },
    createOrder: async (payload, key) => {
      createdWith = { payload, key }
      return { id: 112 }
    },
  })

  assert.equal(result.id, 112)
  assert.deepEqual(createdWith, { payload: attempt.payload, key: attempt.key })
})
