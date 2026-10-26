import { useCallback, useContext, useEffect, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import Sidebar from './app/Sidebar.jsx'
import Topbar from './app/Topbar.jsx'
import { apiRequest, getUserFacingErrorMessage } from '../services/apiClient.js'
import { AuthContext } from '../features/auth/AuthContext.js'

const pageTitles = {
  '/admin': 'Tổng quan',
  '/admin/accounts': 'Quản lý tài khoản',
  '/pos': 'Bán hàng tại quầy',
  '/admin/products': 'Sản phẩm',
  '/admin/inventory': 'Kho nguyên liệu',
  '/admin/suppliers': 'Nhà cung cấp',
  '/admin/purchase-orders': 'Phiếu nhập hàng',
  '/admin/orders': 'Đơn hàng',
  '/admin/customers': 'Khách hàng',
  '/admin/custom-orders': 'Đơn đặt bánh riêng',
  '/admin/promotions': 'Khuyến mãi',
  '/admin/promotion-products': 'Sản phẩm áp dụng khuyến mãi',
  '/admin/logs': 'Nhật ký hoạt động',
}

export default function AppLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [logoutError, setLogoutError] = useState('')
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const { account, setAccount } = useContext(AuthContext)
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const currentPath = pathname.replace(/\/+$/, '') || '/'

  const logout = useCallback(async () => {
    setIsLoggingOut(true)
    setLogoutError('')
    try {
      const { csrfToken } = await apiRequest('/auth/csrf')
      await apiRequest('/auth/logout', {
        method: 'POST',
        headers: {
          'X-CSRF-Token': csrfToken,
          'X-XSRF-TOKEN': csrfToken,
        },
      })
      setAccount(null)
      navigate('/shop/login', { replace: true })
    } catch (error) {
      setLogoutError(getUserFacingErrorMessage(error, 'Không thể đăng xuất. Vui lòng thử lại.'))
    } finally {
      setIsLoggingOut(false)
    }
  }, [navigate])

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
        account={account}
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />
      <div className="min-w-0 flex-1">
        <Topbar
          title={pageTitles[currentPath] ?? 'Quản lý cửa hàng'}
          account={account}
          isLoggingOut={isLoggingOut}
          onLogout={logout}
          onMenuClick={() => setMobileMenuOpen(true)}
          menuExpanded={mobileMenuOpen}
        />
        {logoutError && (
          <p role="alert" className="border-b border-danger-line bg-danger-soft px-4 py-2 text-center text-xs text-danger sm:px-7">
            {logoutError}
          </p>
        )}
        <main className="mx-auto w-full max-w-[1600px] p-4 sm:p-7 xl:p-10">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
