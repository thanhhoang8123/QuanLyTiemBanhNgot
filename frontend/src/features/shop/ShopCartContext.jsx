import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const CART_STORAGE_KEY = 'wa-shop-cart'
const ShopCartContext = createContext(null)

function readStoredCart() {
  if (typeof window === 'undefined') return []

  try {
    const stored = window.localStorage.getItem(CART_STORAGE_KEY)
    if (!stored) return []
    const parsed = JSON.parse(stored)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((item) => (
      Number.isInteger(Number(item.productId))
      && Number(item.productId) > 0
      && Number.isInteger(Number(item.quantity))
      && Number(item.quantity) > 0
    )).map((item) => ({
      productId: Number(item.productId),
      quantity: Number(item.quantity),
    }))
  } catch (error) {
    console.warn('Không thể đọc giỏ hàng đã lưu trên thiết bị.', error)
    return []
  }
}

export function ShopCartProvider({ children }) {
  const [items, setItems] = useState(readStoredCart)

  useEffect(() => {
    try {
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items))
    } catch (error) {
      console.warn('Không thể lưu giỏ hàng trên thiết bị.', error)
    }
  }, [items])

  const value = useMemo(() => ({
    items,
    add(productId, quantity = 1) {
      setItems((current) => {
        const existing = current.find((item) => item.productId === Number(productId))
        return existing
          ? current.map((item) => item.productId === Number(productId)
            ? { ...item, quantity: item.quantity + quantity }
            : item)
          : [...current, { productId: Number(productId), quantity }]
      })
    },
    setQuantity(productId, quantity) {
      setItems((current) => current
        .map((item) => item.productId === Number(productId) ? { ...item, quantity } : item)
        .filter((item) => item.quantity > 0))
    },
    remove(productId) {
      setItems((current) => current.filter((item) => item.productId !== Number(productId)))
    },
    clear() {
      setItems([])
    },
  }), [items])

  return <ShopCartContext.Provider value={value}>{children}</ShopCartContext.Provider>
}

export function useShopCart() {
  const context = useContext(ShopCartContext)
  if (!context) throw new Error('useShopCart phải được gọi bên trong ShopCartProvider.')
  return context
}
