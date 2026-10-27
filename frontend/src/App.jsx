import { lazy, Suspense, useContext, useEffect, useState } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import AppLayout from './layouts/AppLayout.jsx'
import NotFoundPage from './pages/NotFoundPage.jsx'
import ShopLayout from './layouts/ShopLayout.jsx'
import Icon from './components/Icon.jsx'
import { apiRequest } from './services/apiClient.js'
import { ADMIN_ROLES, MANAGER_ROLES, STAFF_ROLES } from './features/auth/permissions.js'
import { AuthContext } from './features/auth/AuthContext.js'

const DashboardPage = lazy(() => import('./features/dashboard/pages/DashboardPage.jsx'))
const PosPage = lazy(() => import('./features/pos/pages/PosPage.jsx'))
const ProductsPage = lazy(() => import('./features/products/pages/ProductsPage.jsx'))
const InventoryPage = lazy(() => import('./features/inventory/pages/InventoryPage.jsx'))
const SuppliersPage = lazy(() => import('./features/suppliers/pages/SuppliersPage.jsx'))
const PurchaseOrdersPage = lazy(() => import('./features/purchase-orders/pages/PurchaseOrdersPage.jsx'))
const OrdersPage = lazy(() => import('./features/orders/pages/OrdersPage.jsx'))
const CustomersPage = lazy(() => import('./features/customers/pages/CustomersPage.jsx'))
const PromotionsPage = lazy(() => import('./features/promotions/pages/PromotionsPage.jsx'))
const PromotionProductsPage = lazy(() => import('./features/promotion-products/pages/PromotionProductsPage.jsx'))
const CustomOrdersPage = lazy(() => import('./features/custom-orders/pages/CustomOrdersPage.jsx'))
const PaymentsPage = lazy(() => import('./features/payments/pages/PaymentsPage.jsx'))
const ShopHomePage = lazy(() => import('./features/shop/pages/ShopHomePage.jsx'))
const ShopProductsPage = lazy(() => import('./features/shop/pages/ShopProductsPage.jsx'))
const ShopProductDetailPage = lazy(() => import('./features/shop/pages/ShopProductDetailPage.jsx'))
const ShopCartPage = lazy(() => import('./features/shop/pages/ShopCartPage.jsx'))
const ShopCheckoutPage = lazy(() => import('./features/shop/pages/ShopCheckoutPage.jsx'))
const ShopOrderResultPage = lazy(() => import('./features/shop/pages/ShopOrderResultPage.jsx'))
const ShopOrdersPage = lazy(() => import('./features/shop/pages/ShopOrdersPage.jsx'))
const ShopOrderDetailPage = lazy(() => import('./features/shop/pages/ShopOrderDetailPage.jsx'))

const RegisterPage = lazy(() => import('./features/auth/pages/RegisterPage.jsx'))
const VerifyEmailPage = lazy(() => import('./features/auth/pages/VerifyEmailPage.jsx'))
const LoginPage = lazy(() => import('./features/auth/pages/LoginPage.jsx'))
const AccountsPage = lazy(() => import('./features/accounts/pages/AccountsPage.jsx'))
const ManagementLogsPage = lazy(() => import('./features/activity-logs/pages/ManagementLogsPage.jsx'))

function RequireAuth({ children, allowedRoles = STAFF_ROLES }) {
  const location = useLocation()
  const inheritedAuth = useContext(AuthContext)
  const [account, setAccount] = useState(null)
  const [status, setStatus] = useState('checking')

  useEffect(() => {
    if (inheritedAuth) return undefined
    let active = true

    apiRequest('/auth/me')
      .then((currentAccount) => {
        if (!active) return
        setAccount(currentAccount)
        setStatus('authorized')
      })
      .catch(() => {
        if (!active) return
        setStatus('unauthenticated')
      })

    return () => {
      active = false
    }
  }, [inheritedAuth])

  if (inheritedAuth) {
    const roleCode = (inheritedAuth.account?.roleCode || '').toUpperCase()
    return allowedRoles.includes(roleCode)
      ? children
      : <Navigate to="/shop" replace />
  }

  if (status === 'checking') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FCF9F3] text-sm font-semibold text-[#76534D]">
        Đang xác thực phiên đăng nhập...
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return <Navigate to="/shop/login" replace state={{ from: location }} />
  }

  const roleCode = (account?.roleCode || '').toUpperCase()
  if (!allowedRoles.includes(roleCode)) {
    return <Navigate to="/shop" replace />
  }

  return (
    <AuthContext.Provider value={{ account, setAccount }}>
      {children}
    </AuthContext.Provider>
  )
}

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
      <Suspense fallback={(
        <div role="status" className="flex min-h-screen items-center justify-center bg-[#FCF9F3] text-sm font-semibold text-[#76534D]">
          Đang tải trang...
        </div>
      )}>
      <Routes>
        <Route path="shop" element={<ShopLayout />}>
          <Route path="login" element={<LoginPage />} />
          <Route index element={<ShopHomePage />} />
          <Route path="products" element={<ShopProductsPage />} />
          <Route path="products/:productId" element={<ShopProductDetailPage />} />
          <Route path="cart" element={<ShopCartPage />} />
          
          <Route path="checkout" element={<RequireAuth allowedRoles={['CUSTOMER']}><ShopCheckoutPage /></RequireAuth>} />
          <Route path="order-result" element={<RequireAuth allowedRoles={['CUSTOMER']}><ShopOrderResultPage /></RequireAuth>} />
          <Route path="orders" element={<RequireAuth allowedRoles={['CUSTOMER']}><ShopOrdersPage /></RequireAuth>} />
          <Route path="orders/:orderId" element={<RequireAuth allowedRoles={['CUSTOMER']}><ShopOrderDetailPage /></RequireAuth>} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="verify-email" element={<VerifyEmailPage />} />
        </Route>
        <Route element={<RequireAuth><AppLayout /></RequireAuth>}>
          <Route path="admin" element={<DashboardPage onToast={showToast} />} />
          <Route
            path="admin/accounts"
            element={<RequireAuth allowedRoles={ADMIN_ROLES}><AccountsPage onToast={showToast} /></RequireAuth>}
          />
          <Route path="admin/products" element={<RequireAuth allowedRoles={MANAGER_ROLES}><ProductsPage onToast={showToast} /></RequireAuth>} />
          <Route path="admin/inventory" element={<RequireAuth allowedRoles={MANAGER_ROLES}><InventoryPage onToast={showToast} /></RequireAuth>} />
          <Route path="admin/suppliers" element={<RequireAuth allowedRoles={MANAGER_ROLES}><SuppliersPage onToast={showToast} /></RequireAuth>} />
          <Route path="admin/purchase-orders" element={<RequireAuth allowedRoles={MANAGER_ROLES}><PurchaseOrdersPage onToast={showToast} /></RequireAuth>} />
          <Route path="admin/orders" element={<RequireAuth allowedRoles={STAFF_ROLES}><OrdersPage onToast={showToast} /></RequireAuth>} />
          <Route path="admin/customers" element={<RequireAuth allowedRoles={STAFF_ROLES}><CustomersPage onToast={showToast} /></RequireAuth>} />
          <Route path="admin/custom-orders" element={<RequireAuth allowedRoles={STAFF_ROLES}><CustomOrdersPage onToast={showToast} /></RequireAuth>} />
          <Route path="admin/payments" element={<RequireAuth allowedRoles={STAFF_ROLES}><PaymentsPage onToast={showToast} /></RequireAuth>} />
          <Route path="admin/promotions" element={<RequireAuth allowedRoles={MANAGER_ROLES}><PromotionsPage onToast={showToast} /></RequireAuth>} />
          <Route path="admin/promotion-products" element={<RequireAuth allowedRoles={MANAGER_ROLES}><PromotionProductsPage onToast={showToast} /></RequireAuth>} />
          <Route path="admin/logs" element={<RequireAuth allowedRoles={MANAGER_ROLES}><ManagementLogsPage /></RequireAuth>} />
          <Route
            path="pos"
            element={(
              <RequireAuth allowedRoles={STAFF_ROLES}>
                <PosPage
                  onToast={showToast}
                  cart={posCart}
                  onCartChange={setPosCart}
                  promotionCode={posPromotionCode}
                  onPromotionCodeChange={setPosPromotionCode}
                  note={posNote}
                  onNoteChange={setPosNote}
                />
              </RequireAuth>
            )}
          />
        </Route>
        <Route path="/" element={<Navigate to="/admin" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      </Suspense>
      {toast && (
        <div role="status" className="fixed bottom-5 left-1/2 z-[60] flex max-w-[calc(100%-2rem)] -translate-x-1/2 items-center gap-2 rounded-xl bg-rosewood px-4 py-3 text-xs text-white shadow-xl">
          <Icon name="check" size={16} className="shrink-0 text-caramel" />
          <span>{toast}</span>
        </div>
      )}
    </>
  )
}
