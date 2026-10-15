import { useState } from 'react'
import AppLayout from './components/AppLayout.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import PosPage from './pages/PosPage.jsx'
import ProductsPage from './pages/ProductsPage.jsx'
import InventoryPage from './pages/InventoryPage.jsx'
import OrdersPage from './pages/OrdersPage.jsx'
import Icon from './components/Icon.jsx'
import { ingredients as initialIngredients, managedProducts as initialProducts, sampleOrders as initialOrders } from './data/mockData.js'

export default function App() {
  const [activePage, setActivePage] = useState('dashboard')
  const [toast, setToast] = useState('')
  const [products, setProducts] = useState(initialProducts)
  const [ingredients, setIngredients] = useState(initialIngredients)
  const [orders, setOrders] = useState(initialOrders)

  const showToast = (message) => {
    setToast(message)
    window.setTimeout(() => setToast(''), 2800)
  }

  const pages = {
    dashboard: <DashboardPage onNavigate={setActivePage} onToast={showToast} />,
    pos: <PosPage onToast={showToast} products={products} />,
    products: <ProductsPage onToast={showToast} products={products} onProductsChange={setProducts} />,
    inventory: <InventoryPage onToast={showToast} items={ingredients} onItemsChange={setIngredients} />,
    orders: <OrdersPage onToast={showToast} orders={orders} onOrdersChange={setOrders} onResetOrders={() => setOrders(initialOrders)} />,
  }

  return (
    <AppLayout activePage={activePage} onNavigate={setActivePage}>
      {pages[activePage] ?? pages.dashboard}
      {toast && (
        <div role="status" className="fixed bottom-5 left-1/2 z-[60] flex max-w-[calc(100%-2rem)] -translate-x-1/2 items-center gap-2 rounded-xl bg-rosewood px-4 py-3 text-xs text-white shadow-xl">
          <Icon name="check" size={16} className="shrink-0 text-caramel" />
          <span>{toast}</span>
        </div>
      )}
    </AppLayout>
  )
}
