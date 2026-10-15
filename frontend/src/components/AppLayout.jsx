import { useState } from 'react'
import Sidebar from './Sidebar.jsx'
import Topbar from './Topbar.jsx'

const pageTitles = {
  dashboard: 'Tổng quan',
  pos: 'Bán hàng tại quầy',
  products: 'Sản phẩm',
  inventory: 'Kho nguyên liệu',
  orders: 'Đơn hàng',
}

export default function AppLayout({ activePage, onNavigate, children }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-cream lg:flex">
      <Sidebar
        activePage={activePage}
        onNavigate={onNavigate}
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />
      <div className="min-w-0 flex-1">
        <Topbar title={pageTitles[activePage]} onMenuClick={() => setMobileMenuOpen(true)} />
        <main className="mx-auto w-full max-w-[1600px] p-4 sm:p-7 xl:p-10">{children}</main>
      </div>
    </div>
  )
}
