import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import Icon from '../components/Icon.jsx'
import { ShopCartProvider, useShopCart } from '../features/shop/ShopCartContext.jsx'
import ShopNewsletterForm from '../features/shop/components/ShopNewsletterForm.jsx'
import { apiRequest, getUserFacingErrorMessage } from '../services/apiClient.js'

const roleLabels = {
  ADMIN: 'Quản trị viên',
  MANAGER: 'Quản lý',
  STAFF: 'Nhân viên',
  CUSTOMER: 'Khách hàng',
}

const navLinkClass = ({ isActive }) =>
  `relative flex items-center px-3.5 py-1.5 text-[13px] font-semibold tracking-wide transition-colors ${
    isActive ? 'text-[#3E2723] font-bold' : 'text-[#7D6B64] hover:text-[#3E2723]'
  }`

function ShopLayoutContent() {
  const cart = useShopCart()
  const location = useLocation()
  const navigate = useNavigate()
  const previousPath = useRef(location.pathname)
  const [cartMessage, setCartMessage] = useState('')
  const [account, setAccount] = useState(null)
  const [isCheckingSession, setIsCheckingSession] = useState(true)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [authError, setAuthError] = useState('')
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const userDropdownRef = useRef(null)

  const roleCode = (account?.roleCode || '').toUpperCase()
  const isCustomer = roleCode === 'CUSTOMER'
  const isManagement = ['ADMIN', 'MANAGER', 'STAFF'].includes(roleCode)
  const roleName = account?.roleName || roleLabels[roleCode] || 'Khách hàng'
  const totalCartItems = cart.items.reduce((sum, item) => sum + item.quantity, 0)

  // Close menus on page navigation
  useEffect(() => {
    setUserMenuOpen(false)
    setMobileMenuOpen(false)
  }, [location.pathname])

  // Close user dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
        setUserMenuOpen(false)
      }
    }
    if (userMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [userMenuOpen])

  useEffect(() => {
    window.Tawk_API = window.Tawk_API || {}
    window.Tawk_LoadStart = new Date()

    if (isCheckingSession) {
      return undefined
    }

    if (!isCustomer) {
      try {
        window.Tawk_API?.hideWidget?.()
      } catch {
        // ignore
      }
      return undefined
    }

    const customerName = account?.fullName || account?.username || ''
    const customerEmail = account?.email || ''
    const customerPhone = account?.phone || ''

    if (customerName) {
      window.Tawk_API.visitor = {
        name: customerName,
        ...(customerEmail && customerEmail.includes('@') ? { email: customerEmail } : {}),
      }
    }

    const applyVisitorAttributes = () => {
      try {
        if (typeof window.Tawk_API?.setAttributes === 'function' && customerName) {
          const attrs = {
            name: customerName,
          }
          if (customerEmail && customerEmail.includes('@')) {
            attrs.email = customerEmail
          }
          if (customerPhone) {
            attrs.phone = customerPhone
          }
          window.Tawk_API.setAttributes(attrs, () => {})
        }
      } catch {
        // ignore
      }
    }

    const existingScript = document.querySelector('script[src*="embed.tawk.to"]')
    if (existingScript) {
      try {
        window.Tawk_API?.showWidget?.()
      } catch {
        // ignore
      }
      applyVisitorAttributes()
    } else {
      window.Tawk_API.onLoad = () => {
        try {
          window.Tawk_API?.showWidget?.()
        } catch {
          // ignore
        }
        applyVisitorAttributes()
      }
      const script = document.createElement('script')
      script.async = true
      script.src = 'https://embed.tawk.to/6ae2c14c2afdd33474271125/1k62s658i'
      script.charset = 'UTF-8'
      script.setAttribute('crossorigin', '*')
      document.head.appendChild(script)
    }

    const retryTimer = setTimeout(applyVisitorAttributes, 1200)

    return () => {
      clearTimeout(retryTimer)
    }
  }, [account, isCheckingSession, isCustomer])

  const refreshAccount = useCallback(async (signal) => {
    setIsCheckingSession(true)
    setAuthError('')
    try {
      const currentAccount = await apiRequest('/auth/me', { signal })
      const roleCode = (currentAccount?.roleCode || '').toUpperCase()

      if (roleCode === 'CUSTOMER') {
        try {
          const profile = await apiRequest('/customer/profile', { signal })
          if (profile) {
            currentAccount.fullName = profile.fullName || currentAccount.fullName
            currentAccount.phone = profile.phone || currentAccount.phone
            currentAccount.address = profile.address || currentAccount.address
            currentAccount.loyaltyPoints = profile.loyaltyPoints ?? currentAccount.loyaltyPoints
          }
        } catch {
          // If profile fetch fails, still keep basic account
        }
      }
      setAccount(currentAccount)
    } catch (error) {
      if (error.name === 'AbortError') return
      if (error.status === 401 || error.status === 403) {
        setAccount(null)
      } else {
        setAuthError(getUserFacingErrorMessage(error, 'Không thể kiểm tra phiên đăng nhập.'))
      }
    } finally {
      if (!signal?.aborted) setIsCheckingSession(false)
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    refreshAccount(controller.signal)
    return () => controller.abort()
  }, [refreshAccount])

  useEffect(() => {
    const wasLoginPage = previousPath.current === '/shop/login'
    previousPath.current = location.pathname
    if (!wasLoginPage || location.pathname === '/shop/login') return undefined

    const controller = new AbortController()
    refreshAccount(controller.signal)
    return () => controller.abort()
  }, [location.pathname, refreshAccount])

  const logout = async () => {
    if (isLoggingOut) return
    setIsLoggingOut(true)
    setAuthError('')
    try {
      try {
        window.Tawk_API?.endChat?.()
        window.Tawk_API?.hideWidget?.()
      } catch {
        // ignore
      }
      const { csrfToken } = await apiRequest('/auth/csrf')
      await apiRequest('/auth/logout', {
        method: 'POST',
        headers: {
          'X-CSRF-Token': csrfToken,
          'X-XSRF-TOKEN': csrfToken,
        },
      })
      setAccount(null)
      navigate('/shop', { replace: true })
    } catch (error) {
      setAuthError(getUserFacingErrorMessage(error, 'Không thể đăng xuất. Vui lòng thử lại.'))
    } finally {
      setIsLoggingOut(false)
    }
  }

  const addToCart = (productId, quantity = 1) => {
    cart.add(productId, quantity)
    setCartMessage('Đã cập nhật giỏ hàng.')
    window.setTimeout(() => setCartMessage(''), 2200)
  }

  return (
    <div className="min-h-screen bg-[#FCF9F3] text-[#4A302B]">
      {/* Modern, elegant, compact navigation header */}
      <header className="sticky top-0 z-40 border-b border-[#EAE3DA]/80 bg-[#FCF9F3]/95 backdrop-blur-md transition-all">
        <div className="mx-auto flex h-[68px] max-w-7xl items-center justify-between gap-4 px-4 sm:px-7 lg:px-10">
          
          {/* Brand & Monogram Logo */}
          <Link to="/shop" className="group flex shrink-0 items-center gap-2.5" aria-label="WA Patisserie - Trang chủ">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#76534D] to-[#4A302B] font-display text-sm font-bold text-white shadow-xs transition duration-200 group-hover:scale-105 group-hover:shadow-md">
              WA
            </span>
            <div className="flex flex-col">
              <span className="font-display text-[17px] font-bold tracking-tight text-[#3E2723] leading-none transition group-hover:text-[#76534D]">
                WA Patisserie
              </span>
              <span className="text-[8px] font-bold uppercase tracking-[0.24em] text-[#A07040] mt-1">
                Bánh ngọt thủ công
              </span>
            </div>
          </Link>

          {/* Center Navigation Links (Desktop) */}
          <nav aria-label="Điều hướng chính" className="hidden items-center gap-1 lg:flex">
            <NavLink to="/shop" end className={navLinkClass}>
              {({ isActive }) => (
                <>
                  <span>Trang chủ</span>
                  {isActive && <span className="absolute bottom-[-10px] left-3 right-3 h-[2px] rounded-full bg-[#A07040]" />}
                </>
              )}
            </NavLink>
            <NavLink to="/shop/products" className={navLinkClass}>
              {({ isActive }) => (
                <>
                  <span>Sản phẩm</span>
                  {isActive && <span className="absolute bottom-[-10px] left-3 right-3 h-[2px] rounded-full bg-[#A07040]" />}
                </>
              )}
            </NavLink>
            <NavLink to="/shop/custom-order" className={navLinkClass}>
              {({ isActive }) => (
                <>
                  <span>Đặt bánh riêng</span>
                  {isActive && <span className="absolute bottom-[-10px] left-3 right-3 h-[2px] rounded-full bg-[#A07040]" />}
                </>
              )}
            </NavLink>
            <NavLink to="/shop/articles" className={navLinkClass}>
              {({ isActive }) => (
                <>
                  <span>Bài viết</span>
                  {isActive && <span className="absolute bottom-[-10px] left-3 right-3 h-[2px] rounded-full bg-[#A07040]" />}
                </>
              )}
            </NavLink>
            <NavLink to="/shop/contact" className={navLinkClass}>
              {({ isActive }) => (
                <>
                  <span>Liên hệ</span>
                  {isActive && <span className="absolute bottom-[-10px] left-3 right-3 h-[2px] rounded-full bg-[#A07040]" />}
                </>
              )}
            </NavLink>
            {isCustomer && (
              <NavLink to="/shop/orders" className={navLinkClass}>
                {({ isActive }) => (
                  <>
                    <span>Đơn hàng</span>
                    {isActive && <span className="absolute bottom-[-10px] left-3 right-3 h-[2px] rounded-full bg-[#A07040]" />}
                  </>
                )}
              </NavLink>
            )}
          </nav>

          {/* Right Action Icons & Auth */}
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            {/* Direct Admin quick link button if management */}
            {isManagement && (
              <Link
                to="/admin"
                className="hidden md:inline-flex items-center gap-1.5 rounded-full border border-caramel/30 bg-caramel-soft px-3 py-1.5 text-xs font-bold text-rosewood shadow-2xs transition hover:bg-caramel hover:text-white"
                title="Vào Trang quản trị"
              >
                <Icon name="dashboard" size={13} />
                <span>Vào Quản trị</span>
              </Link>
            )}

            {/* Cart Icon Button */}
            <Link
              to="/shop/cart"
              aria-label={`Giỏ hàng, ${totalCartItems} sản phẩm`}
              className="relative flex h-10 w-10 items-center justify-center rounded-full border border-[#EAE3DA] bg-white text-[#4A302B] shadow-2xs transition hover:border-[#A07040] hover:text-[#A07040] hover:scale-105"
            >
              <Icon name="cart" size={18} />
              {totalCartItems > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#A07040] px-1 text-[10px] font-bold text-white shadow-xs">
                  {totalCartItems}
                </span>
              )}
            </Link>

            {/* Account / Auth */}
            {account ? (
              <div className="relative" ref={userDropdownRef}>
                <button
                  type="button"
                  onClick={() => setUserMenuOpen((prev) => !prev)}
                  className={`flex h-10 items-center gap-2 rounded-full border bg-white pl-1.5 pr-3 text-xs font-semibold text-[#4A302B] shadow-2xs transition hover:border-caramel hover:shadow-xs ${
                    userMenuOpen ? 'border-caramel ring-2 ring-caramel/15' : 'border-[#EAE3DA]'
                  }`}
                >
                  <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white shadow-xs ${
                    isManagement
                      ? 'bg-gradient-to-br from-[#3E2723] to-[#76534D]'
                      : 'bg-gradient-to-br from-caramel to-amber-600'
                  }`}>
                    {(account.fullName || account.username || 'U').charAt(0).toUpperCase()}
                  </span>
                  <div className="hidden max-w-[120px] text-left sm:block">
                    <p className="truncate text-xs font-bold text-[#4A302B] leading-tight">
                      {account.fullName || account.username}
                    </p>
                    <p className="text-[10px] font-medium text-muted leading-none">
                      {roleName}
                    </p>
                  </div>
                  <Icon
                    name="chevronDown"
                    size={12}
                    className={`text-muted transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2.5 w-64 sm:w-72 overflow-hidden rounded-2xl border border-stone-200/90 bg-white/98 p-1.5 shadow-2xl shadow-stone-900/15 backdrop-blur-md z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    {/* User Card Header */}
                    <div className="flex items-center gap-3 rounded-xl bg-gradient-to-br from-[#FAF5F0] to-[#F5ECE2] p-3 border border-[#EAE3DA]/60">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white shadow-sm ${
                        isManagement
                          ? 'bg-gradient-to-br from-[#3E2723] to-[#76534D]'
                          : 'bg-gradient-to-br from-caramel to-amber-600'
                      }`}>
                        {(account.fullName || account.username || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-bold text-[#4A302B]">
                          {account.fullName || account.username}
                        </p>
                        <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                          <span className={`inline-block rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                            isManagement ? 'bg-amber-100 text-amber-900' : 'bg-caramel-soft text-rosewood'
                          }`}>
                            {roleName}
                          </span>
                          {account.email && (
                            <span className="truncate text-[10px] text-[#9A7972]">
                              {account.email}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Management Navigation Options */}
                    {isManagement && (
                      <div className="mt-1.5 space-y-0.5 border-b border-stone-100 pb-1.5">
                        <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-muted">
                          Không gian làm việc
                        </div>
                        <Link
                          to="/admin"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center justify-between rounded-xl px-2.5 py-2 text-xs font-semibold text-[#4A302B] transition hover:bg-caramel-soft group"
                        >
                          <span className="flex items-center gap-2.5">
                            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white shadow-2xs text-caramel group-hover:scale-105 transition">
                              <Icon name="dashboard" size={14} />
                            </span>
                            <span>Trang quản trị (Admin)</span>
                          </span>
                          <Icon name="arrowUpRight" size={13} className="text-muted group-hover:text-caramel transition" />
                        </Link>
                        <Link
                          to="/pos"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center justify-between rounded-xl px-2.5 py-2 text-xs font-semibold text-[#4A302B] transition hover:bg-caramel-soft group"
                        >
                          <span className="flex items-center gap-2.5">
                            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white shadow-2xs text-caramel group-hover:scale-105 transition">
                              <Icon name="bag" size={14} />
                            </span>
                            <span>Bán hàng tại quầy (POS)</span>
                          </span>
                          <Icon name="arrowUpRight" size={13} className="text-muted group-hover:text-caramel transition" />
                        </Link>
                        <Link
                          to="/admin/orders"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center justify-between rounded-xl px-2.5 py-2 text-xs font-semibold text-[#4A302B] transition hover:bg-caramel-soft group"
                        >
                          <span className="flex items-center gap-2.5">
                            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white shadow-2xs text-caramel group-hover:scale-105 transition">
                              <Icon name="receipt" size={14} />
                            </span>
                            <span>Quản lý đơn hàng</span>
                          </span>
                          <Icon name="arrowUpRight" size={13} className="text-muted group-hover:text-caramel transition" />
                        </Link>
                        <Link
                          to="/admin/custom-orders"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center justify-between rounded-xl px-2.5 py-2 text-xs font-semibold text-[#4A302B] transition hover:bg-caramel-soft group"
                        >
                          <span className="flex items-center gap-2.5">
                            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white shadow-2xs text-caramel group-hover:scale-105 transition">
                              <Icon name="sparkles" size={14} />
                            </span>
                            <span>Đơn đặt bánh riêng</span>
                          </span>
                          <Icon name="arrowUpRight" size={13} className="text-muted group-hover:text-caramel transition" />
                        </Link>
                        {roleCode === 'ADMIN' && (
                          <Link
                            to="/admin/accounts"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center justify-between rounded-xl px-2.5 py-2 text-xs font-semibold text-[#4A302B] transition hover:bg-caramel-soft group"
                          >
                            <span className="flex items-center gap-2.5">
                              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white shadow-2xs text-caramel group-hover:scale-105 transition">
                                <Icon name="user" size={14} />
                              </span>
                              <span>Quản lý tài khoản</span>
                            </span>
                            <Icon name="arrowUpRight" size={13} className="text-muted group-hover:text-caramel transition" />
                          </Link>
                        )}
                      </div>
                    )}

                    {/* Customer Account Links */}
                    {isCustomer && (
                      <div className="mt-1.5 space-y-0.5 border-b border-stone-100 pb-1.5">
                        <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-muted">
                          Tài khoản của bạn
                        </div>
                        <Link
                          to="/shop/account"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-medium text-[#4A302B] hover:bg-caramel-soft transition"
                        >
                          <Icon name="user" size={15} className="text-caramel" />
                          <span>Thông tin tài khoản</span>
                        </Link>
                        <Link
                          to="/shop/orders"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-medium text-[#4A302B] hover:bg-caramel-soft transition"
                        >
                          <Icon name="receipt" size={15} className="text-caramel" />
                          <span>Đơn hàng của tôi</span>
                        </Link>
                        <Link
                          to="/shop/custom-order"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-medium text-[#4A302B] hover:bg-caramel-soft transition"
                        >
                          <Icon name="sparkles" size={15} className="text-caramel" />
                          <span>Đặt bánh theo yêu cầu</span>
                        </Link>
                      </div>
                    )}

                    {/* Logout Footer */}
                    <div className="pt-1 mt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setUserMenuOpen(false)
                          void logout()
                        }}
                        disabled={isLoggingOut}
                        className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-50"
                      >
                        <Icon name="logOut" size={15} />
                        <span>{isLoggingOut ? 'Đang thoát...' : 'Đăng xuất'}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : !isCheckingSession && !authError ? (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Link
                  to="/shop/login"
                  className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[#DDCDB8] bg-white px-3.5 text-xs font-semibold text-[#4A302B] shadow-2xs transition hover:border-[#76534D] hover:bg-[#FAF0EE]"
                >
                  <Icon name="user" size={14} />
                  <span>Đăng nhập</span>
                </Link>
                <Link
                  to="/shop/register"
                  className="hidden sm:inline-flex h-9 items-center rounded-full bg-[#4A302B] px-3.5 text-xs font-semibold text-white shadow-xs transition hover:bg-[#2B1D19]"
                >
                  Đăng ký
                </Link>
              </div>
            ) : null}

            {/* Mobile Hamburger Toggle Button */}
            <button
              type="button"
              aria-label="Mở danh mục điều hướng"
              aria-expanded={mobileMenuOpen}
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[#EAE3DA] bg-white text-[#4A302B] transition hover:bg-[#FAF0EE] lg:hidden"
            >
              <Icon name={mobileMenuOpen ? 'close' : 'menu'} size={19} />
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu Drawer */}
        {mobileMenuOpen && (
          <div className="border-t border-[#EAE3DA]/80 bg-[#FCF9F3] px-4 py-4 lg:hidden shadow-lg animate-in slide-in-from-top-2 duration-200">
            <nav aria-label="Điều hướng mobile" className="flex flex-col gap-1">
              <NavLink
                to="/shop"
                end
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) => `rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                  isActive ? 'bg-[#FAF0EE] text-[#4A302B] font-bold' : 'text-[#7D6B64] hover:bg-white'
                }`}
              >
                Trang chủ
              </NavLink>
              <NavLink
                to="/shop/products"
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) => `rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                  isActive ? 'bg-[#FAF0EE] text-[#4A302B] font-bold' : 'text-[#7D6B64] hover:bg-white'
                }`}
              >
                Sản phẩm
              </NavLink>
              <NavLink
                to="/shop/custom-order"
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) => `rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                  isActive ? 'bg-[#FAF0EE] text-[#4A302B] font-bold' : 'text-[#7D6B64] hover:bg-white'
                }`}
              >
                Đặt bánh riêng
              </NavLink>
              <NavLink
                to="/shop/articles"
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) => `rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                  isActive ? 'bg-[#FAF0EE] text-[#4A302B] font-bold' : 'text-[#7D6B64] hover:bg-white'
                }`}
              >
                Bài viết
              </NavLink>
              <NavLink
                to="/shop/contact"
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) => `rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                  isActive ? 'bg-[#FAF0EE] text-[#4A302B] font-bold' : 'text-[#7D6B64] hover:bg-white'
                }`}
              >
                Liên hệ
              </NavLink>
              {isCustomer && (
                <NavLink
                  to="/shop/orders"
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) => `rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                    isActive ? 'bg-[#FAF0EE] text-[#4A302B] font-bold' : 'text-[#7D6B64] hover:bg-white'
                  }`}
                >
                  Đơn hàng của tôi
                </NavLink>
              )}
            </nav>
            {account ? (
              <div className="mt-4 border-t border-[#EAE3DA] pt-4">
                <div className="flex items-center gap-3 rounded-xl bg-gradient-to-br from-[#FAF5F0] to-[#F5ECE2] p-3 border border-[#EAE3DA]/60">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white shadow-sm ${
                    isManagement
                      ? 'bg-gradient-to-br from-[#3E2723] to-[#76534D]'
                      : 'bg-gradient-to-br from-caramel to-amber-600'
                  }`}>
                    {(account.fullName || account.username || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold text-[#4A302B]">
                      {account.fullName || account.username}
                    </p>
                    <span className={`inline-block mt-0.5 rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                      isManagement ? 'bg-amber-100 text-amber-900' : 'bg-caramel-soft text-rosewood'
                    }`}>
                      {roleName}
                    </span>
                  </div>
                </div>

                {isManagement && (
                  <div className="mt-3 space-y-1">
                    <p className="px-2 text-[10px] font-bold uppercase tracking-wider text-muted">
                      Không gian làm việc
                    </p>
                    <Link
                      to="/admin"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-2.5 rounded-xl bg-caramel-soft px-3.5 py-2.5 text-xs font-bold text-rosewood"
                    >
                      <Icon name="dashboard" size={15} />
                      <span>Trang quản trị (Admin)</span>
                    </Link>
                    <Link
                      to="/pos"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-2.5 rounded-xl bg-petal px-3.5 py-2.5 text-xs font-bold text-rosewood"
                    >
                      <Icon name="bag" size={15} />
                      <span>Bán hàng tại quầy (POS)</span>
                    </Link>
                    <Link
                      to="/admin/orders"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-2.5 rounded-xl px-3.5 py-2 text-xs font-semibold text-rosewood hover:bg-white"
                    >
                      <Icon name="receipt" size={15} />
                      <span>Quản lý đơn hàng</span>
                    </Link>
                  </div>
                )}

                {isCustomer && (
                  <div className="mt-3 space-y-1">
                    <p className="px-2 text-[10px] font-bold uppercase tracking-wider text-muted">
                      Tài khoản của bạn
                    </p>
                    <Link
                      to="/shop/account"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-2.5 rounded-xl px-3.5 py-2 text-xs font-semibold text-[#4A302B] hover:bg-white"
                    >
                      <Icon name="user" size={15} />
                      <span>Thông tin tài khoản</span>
                    </Link>
                    <Link
                      to="/shop/orders"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-2.5 rounded-xl px-3.5 py-2 text-xs font-semibold text-[#4A302B] hover:bg-white"
                    >
                      <Icon name="receipt" size={15} />
                      <span>Đơn hàng của tôi</span>
                    </Link>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false)
                    void logout()
                  }}
                  disabled={isLoggingOut}
                  className="mt-3 flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                >
                  <Icon name="logOut" size={15} />
                  <span>{isLoggingOut ? 'Đang thoát...' : 'Đăng xuất tài khoản'}</span>
                </button>
              </div>
            ) : !isCheckingSession && (
              <div className="mt-3 flex gap-2 border-t border-[#EAE3DA] pt-3">
                <Link
                  to="/shop/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 rounded-xl border border-[#DDCDB8] bg-white py-2.5 text-center text-xs font-semibold text-[#4A302B]"
                >
                  Đăng nhập
                </Link>
                <Link
                  to="/shop/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 rounded-xl bg-[#4A302B] py-2.5 text-center text-xs font-semibold text-white"
                >
                  Đăng ký
                </Link>
              </div>
            )}
          </div>
        )}
      </header>

      {authError && (
        <p role="alert" className="border-b border-[#E2C5BF] bg-white px-4 py-2 text-center text-xs text-[#914E46]">
          {authError}
        </p>
      )}

      <main className="min-h-[60vh]">
        <Outlet context={{ addToCart }} />
      </main>
      {cartMessage && <p role="status" className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-[#536B50] px-4 py-3 text-xs font-semibold text-white shadow-xl">{cartMessage}</p>}

      <footer className="mt-20 border-t border-[#EAE3DA] bg-[#FAF5F0] text-[#4A302B]">
        {/* Top Feature Highlights Bar */}
        <div className="border-b border-[#EAE3DA]/80 bg-white/70 py-6">
          <div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-4 sm:px-7 md:grid-cols-4 lg:px-10">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#FAF0EE] text-[#76534D]">
                <Icon name="sparkles" size={18} />
              </span>
              <div>
                <p className="text-xs font-bold text-[#4A302B]">Tươi mới mỗi ngày</p>
                <p className="text-[11px] text-[#806B65]">Bánh nướng ra lò liên tục</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#FAF0EE] text-[#76534D]">
                <Icon name="bag" size={18} />
              </span>
              <div>
                <p className="text-xs font-bold text-[#4A302B]">Giao hàng hỏa tốc</p>
                <p className="text-[11px] text-[#806B65]">Bảo quản lạnh tận nơi</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#FAF0EE] text-[#76534D]">
                <Icon name="check" size={18} />
              </span>
              <div>
                <p className="text-xs font-bold text-[#4A302B]">100% Tự nhiên</p>
                <p className="text-[11px] text-[#806B65]">Không chất bảo quản</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#FAF0EE] text-[#76534D]">
                <Icon name="headset" size={18} />
              </span>
              <div>
                <p className="text-xs font-bold text-[#4A302B]">Hỗ trợ tận tâm</p>
                <p className="text-[11px] text-[#806B65]">Hotline & Chat trực tuyến</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Footer Content */}
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-7 lg:px-10">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-12">
            {/* Cột 1: Thông tin tiệm bánh tại TP. HCM */}
            <div className="space-y-4 lg:col-span-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#4A302B] to-[#76534D] text-white font-extrabold text-sm shadow-md shadow-[#4A302B]/20">
                  WA
                </div>
                <div>
                  <h3 className="font-display text-xl font-bold tracking-tight text-[#4A302B]">WA Patisserie</h3>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#A45B46]">Bánh Ngọt Thủ Công</p>
                </div>
              </div>
              <p className="text-xs leading-6 text-[#705851]">
                Tiệm bánh ngọt Pháp thủ công tại TP. Hồ Chí Minh. Mang đến những chiếc bánh kem, bánh mì nướng và món tráng miệng thượng hạng với nguyên liệu tuyển chọn.
              </p>

              {/* Thông tin liên hệ TP. HCM */}
              <div className="space-y-2.5 pt-1 text-xs text-[#5D4641]">
                <div className="flex items-start gap-2.5">
                  <span className="mt-0.5 text-caramel shrink-0">📍</span>
                  <span className="leading-relaxed">
                    <strong>Cửa hàng:</strong> 128 Hai Bà Trưng, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="text-caramel shrink-0">📞</span>
                  <span>
                    <strong>Hotline:</strong> <a href="tel:0909234567" className="font-semibold hover:text-[#A45B46] hover:underline">0909 234 567</a> · <a href="tel:02838226789" className="hover:underline">(028) 3822 6789</a>
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="text-caramel shrink-0">✉️</span>
                  <span>
                    <strong>Email:</strong> <a href="mailto:contact@wapatisserie.vn" className="font-semibold hover:text-[#A45B46] hover:underline">contact@wapatisserie.vn</a>
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="text-caramel shrink-0">⏰</span>
                  <span>
                    <strong>Mở cửa:</strong> 07:30 – 21:30 (Tất cả các ngày trong tuần)
                  </span>
                </div>
              </div>
            </div>

            {/* Cột 2: Thực đơn & Khám phá */}
            <div className="space-y-3 lg:col-span-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#4A302B]">Khám phá</h4>
              <ul className="space-y-2 text-xs text-[#705851]">
                <li><Link to="/shop" className="hover:text-[#A45B46] transition">Trang chủ</Link></li>
                <li><Link to="/shop/products" className="hover:text-[#A45B46] transition">Bộ sưu tập bánh</Link></li>
                <li><Link to="/shop/custom-order" className="hover:text-[#A45B46] transition">Đặt bánh theo yêu cầu</Link></li>
                <li><Link to="/shop/articles" className="hover:text-[#A45B46] transition">Chuyện bánh & Bí quyết</Link></li>
                <li><Link to="/shop/contact" className="hover:text-[#A45B46] transition">Liên hệ & Đóng góp</Link></li>
                {isManagement && (
                  <li>
                    <Link to="/admin" className="font-bold text-[#A45B46] hover:underline flex items-center gap-1">
                      <span>Trang quản trị</span>
                      <Icon name="arrowUpRight" size={12} />
                    </Link>
                  </li>
                )}
              </ul>
            </div>

            {/* Cột 3: Hỗ trợ & Chính sách */}
            <div className="space-y-3 lg:col-span-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#4A302B]">Chính sách</h4>
              <ul className="space-y-2 text-xs text-[#705851]">
                <li><Link to="/shop/contact" className="hover:text-[#A45B46] transition">Hướng dẫn mua hàng</Link></li>
                <li><Link to="/shop/contact" className="hover:text-[#A45B46] transition">Giao hàng & Bảo quản</Link></li>
                <li><Link to="/shop/contact" className="hover:text-[#A45B46] transition">Đổi trả & Hoàn tiền</Link></li>
                <li><Link to="/shop/contact" className="hover:text-[#A45B46] transition">Bảo mật thông tin</Link></li>
                {isCustomer && (
                  <>
                    <li><Link to="/shop/account" className="hover:text-[#A45B46] transition">Hồ sơ khách hàng</Link></li>
                    <li><Link to="/shop/orders" className="hover:text-[#A45B46] transition">Tra cứu đơn hàng</Link></li>
                  </>
                )}
              </ul>
            </div>

            {/* Cột 4: Đăng ký nhận tin */}
            <div className="space-y-3 lg:col-span-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#4A302B]">Nhận ưu đãi ngọt ngào</h4>
              <ShopNewsletterForm />
            </div>
          </div>

          {/* Dòng đáy Footer */}
          <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-[#EAE3DA] pt-6 text-center text-xs text-[#9A7972] sm:flex-row sm:text-left">
            <p>© {new Date().getFullYear()} WA Patisserie. Tiệm bánh ngọt thủ công tại TP. Hồ Chí Minh. Mọi quyền được bảo lưu.</p>
            <p className="text-[11px] text-[#A68F87]">
              Hỗ trợ khách hàng thời gian thực qua Chatbox tawk.to
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default function ShopLayout() {
  return (
    <ShopCartProvider>
      <ShopLayoutContent />
    </ShopCartProvider>
  )
}
