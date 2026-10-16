import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './app/Sidebar.jsx'
import Topbar from './app/Topbar.jsx'

const pageTitles = {
  '/admin': 'Tổng quan',
  '/pos': 'Bán hàng tại quầy',
  '/admin/products': 'Sản phẩm',
  '/admin/inventory': 'Kho nguyên liệu',
  '/admin/suppliers': 'Nhà cung cấp',
  '/admin/purchase-orders': 'Phiếu nhập hàng',
  '/admin/orders': 'Đơn hàng',
}

export default function AppLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { pathname } = useLocation()
  const currentPath = pathname.replace(/\/+$/, '') || '/'

  useEffect(() => {
    if (!mobileMenuOpen) return undefined

    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setMobileMenuOpen(false)
    }

    document.addEventListener('keydown', closeOnEscape)
    return () => document.removeEventListener('keydown', closeOnEscape)
  }, [mobileMenuOpen])

  return (
    <div className="min-h-screen bg-cream lg:flex">
      <Sidebar
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />
      <div className="min-w-0 flex-1">
        <Topbar
          title={pageTitles[currentPath] ?? 'Quản lý cửa hàng'}
          onMenuClick={() => setMobileMenuOpen(true)}
          menuExpanded={mobileMenuOpen}
        />
        <main className="mx-auto w-full max-w-[1600px] p-4 sm:p-7 xl:p-10">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
