import { useEffect, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import AppLayout from './layouts/AppLayout.jsx'
import DashboardPage from './features/dashboard/pages/DashboardPage.jsx'
import PosPage from './features/pos/pages/PosPage.jsx'
import ProductsPage from './features/products/pages/ProductsPage.jsx'
import InventoryPage from './features/inventory/pages/InventoryPage.jsx'
import SuppliersPage from './features/suppliers/pages/SuppliersPage.jsx'
import PurchaseOrdersPage from './features/purchase-orders/pages/PurchaseOrdersPage.jsx'
import OrdersPage from './features/orders/pages/OrdersPage.jsx'
import CustomersPage from './features/customers/pages/CustomersPage.jsx'
import PromotionsPage from './features/promotions/pages/PromotionsPage.jsx'
import PromotionProductsPage from './features/promotion-products/pages/PromotionProductsPage.jsx'
import CustomOrdersPage from './features/custom-orders/pages/CustomOrdersPage.jsx'
import PaymentsPage from './features/payments/pages/PaymentsPage.jsx'
import NotFoundPage from './pages/NotFoundPage.jsx'
import ShopLayout from './layouts/ShopLayout.jsx'
import ShopHomePage from './features/shop/pages/ShopHomePage.jsx'
import ShopProductsPage from './features/shop/pages/ShopProductsPage.jsx'
import Icon from './components/Icon.jsx'

export default function App() {
  const [toast, setToast] = useState('')
  const [posCart, setPosCart] = useState([])
  const [posPromotionCode, setPosPromotionCode] = useState('')
  const [posNote, setPosNote] = useState('')

  const showToast = (message) => {
    setToast(message)
  }

  useEffect(() => {
    if (!toast) return undefined

    const timeoutId = window.setTimeout(() => setToast(''), 2800)
    return () => window.clearTimeout(timeoutId)
  }, [toast])

  return (
    <>
      <Routes>
        <Route path="shop" element={<ShopLayout />}>
          <Route index element={<ShopHomePage />} />
          <Route path="products" element={<ShopProductsPage />} />
        </Route>
        <Route element={<AppLayout />}>
          <Route path="admin" element={<DashboardPage onToast={showToast} />} />
          <Route path="admin/products" element={<ProductsPage onToast={showToast} />} />
          <Route path="admin/inventory" element={<InventoryPage onToast={showToast} />} />
          <Route path="admin/suppliers" element={<SuppliersPage onToast={showToast} />} />
          <Route path="admin/purchase-orders" element={<PurchaseOrdersPage onToast={showToast} />} />
          <Route path="admin/orders" element={<OrdersPage onToast={showToast} />} />
          <Route path="admin/customers" element={<CustomersPage onToast={showToast} />} />
          <Route path="admin/custom-orders" element={<CustomOrdersPage onToast={showToast} />} />
          <Route path="admin/payments" element={<PaymentsPage onToast={showToast} />} />
          <Route path="admin/promotions" element={<PromotionsPage onToast={showToast} />} />
          <Route path="admin/promotion-products" element={<PromotionProductsPage onToast={showToast} />} />
          <Route
            path="pos"
            element={(
              <PosPage
                onToast={showToast}
                cart={posCart}
                onCartChange={setPosCart}
                promotionCode={posPromotionCode}
                onPromotionCodeChange={setPosPromotionCode}
                note={posNote}
                onNoteChange={setPosNote}
              />
            )}
          />
        </Route>
        <Route path="/" element={<Navigate to="/admin" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      {toast && (
        <div role="status" className="fixed bottom-5 left-1/2 z-[60] flex max-w-[calc(100%-2rem)] -translate-x-1/2 items-center gap-2 rounded-xl bg-rosewood px-4 py-3 text-xs text-white shadow-xl">
          <Icon name="check" size={16} className="shrink-0 text-caramel" />
          <span>{toast}</span>
        </div>
      )}
    </>
  )
}
