import { useEffect, useState } from 'react'
import Icon from '../../components/Icon.jsx'

const roleLabels = {
  ADMIN: 'Quản trị viên',
  MANAGER: 'Quản lý',
  STAFF: 'Nhân viên',
  CUSTOMER: 'Khách hàng',
}
import { NavLink, useLocation } from 'react-router-dom'
import { canAccessPath } from '../../features/auth/permissions.js'

const navigationGroups = [
  {
    id: 'sales',
    label: 'Bán hàng & đơn hàng',
    icon: 'bag',
    items: [
      { path: '/pos', label: 'Bán hàng POS', icon: 'bag' },
      { path: '/admin/orders', label: 'Đơn hàng', icon: 'receipt' },
      { path: '/admin/live-chat', label: 'Chat & Hỗ trợ khách', icon: 'messageCircle' },
      { path: '/admin/payments', label: 'Thanh toán', icon: 'creditCard' },
      { path: '/admin/customers', label: 'Khách hàng', icon: 'receipt' },
      { path: '/admin/custom-orders', label: 'Đơn đặt bánh riêng', icon: 'receipt' },
    ],
  },
  {
    id: 'catalog',
    label: 'Sản phẩm & kho',
    icon: 'package',
    items: [
      { path: '/admin/products', label: 'Sản phẩm', icon: 'package' },
      { path: '/admin/inventory', label: 'Kho nguyên liệu', icon: 'package' },
      { path: '/admin/suppliers', label: 'Nhà cung cấp', icon: 'receipt' },
      { path: '/admin/purchase-orders', label: 'Phiếu nhập hàng', icon: 'receipt' },
    ],
  },
  {
    id: 'promotions',
    label: 'Khuyến mãi',
    icon: 'tag',
    items: [
      { path: '/admin/promotions', label: 'Chương trình khuyến mãi', icon: 'tag' },
      { path: '/admin/promotion-products', label: 'Sản phẩm áp dụng', icon: 'package' },
    ],
  },
  {
    id: 'logs',
    label: 'Nhật ký & lịch sử',
    icon: 'receipt',
    items: [
      { path: '/admin/logs', label: 'Nhật ký hoạt động', icon: 'receipt' },
    ],
  },
]

export default function Sidebar({ account, open, onClose, onLogout, isLoggingOut }) {
  const { pathname } = useLocation()
  const [expandedGroup, setExpandedGroup] = useState(null)

  useEffect(() => {
    const activeGroup = navigationGroups.find((group) => (
      group.items.some((item) => item.path === pathname)
    ))
    setExpandedGroup(activeGroup?.id ?? null)
  }, [pathname])

  return (
    <>
      {open && (
        <button
          type="button"
          aria-label="Đóng menu"
          className="fixed inset-0 z-30 bg-rosewood/30 lg:hidden"
          onClick={onClose}
        />
      )}
      <aside
        id="admin-sidebar"
        className={`fixed inset-y-0 left-0 z-40 flex w-[248px] flex-col border-r border-border bg-petal px-4 py-5 transition-transform duration-200 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="mb-7 flex items-center gap-3 px-2">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-caramel to-amber-600 text-white font-extrabold text-base shadow-md shadow-caramel/25">
            WA
          </div>
          <div>
            <p className="font-bold text-base leading-tight tracking-wide text-rosewood">WA Patisserie</p>
            <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.2em] text-caramel">Tiệm Bánh Ngọt</p>
          </div>
        </div>

        <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-muted">Không gian làm việc</p>
        <nav aria-label="Điều hướng chính" className="min-h-0 flex-1 space-y-0.5 overflow-y-auto pb-2">
          <NavLink
            to="/admin"
            end
            onClick={onClose}
            className={({ isActive }) => `mb-1 flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs transition ${
              isActive
                ? 'bg-caramel font-bold text-white shadow-sm'
                : 'text-rosewood/90 hover:bg-paper hover:text-rosewood font-medium'
            }`}
          >
            {({ isActive }) => (
              <>
                <Icon name="dashboard" size={16} />
                <span>Tổng quan</span>
                {isActive && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-paper" />}
              </>
            )}
          </NavLink>

          {navigationGroups.map((group) => {
            const permittedItems = group.items.filter((item) => (
              canAccessPath(account?.roleCode, item.path)
            ))
            if (permittedItems.length === 0) return null

            const groupIsActive = permittedItems.some((item) => item.path === pathname)
            const isExpanded = expandedGroup === group.id

            return (
              <div key={group.id}>
                <button
                  type="button"
                  aria-expanded={isExpanded}
                  onClick={() => setExpandedGroup(isExpanded ? null : group.id)}
                  className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-semibold transition ${
                    groupIsActive
                      ? 'bg-caramel-soft text-rosewood'
                      : 'text-rosewood hover:bg-paper'
                  }`}
                >
                  <Icon name={group.icon} size={16} />
                  <span className="min-w-0 flex-1 truncate">{group.label}</span>
                  <Icon
                    name="chevronDown"
                    size={14}
                    className={`shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                  />
                </button>
                {isExpanded && (
                  <div className="ml-3 mt-0.5 space-y-0.5 border-l border-border pl-2">
                    {permittedItems.map((item) => (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        onClick={onClose}
                        className={({ isActive }) => `flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-[11px] transition ${
                          isActive
                            ? 'bg-caramel font-bold text-white shadow-sm'
                            : 'text-rosewood/80 hover:bg-paper hover:text-rosewood font-medium'
                        }`}
                      >
                        {({ isActive }) => (
                          <>
                            <Icon name={item.icon} size={14} className="shrink-0" />
                            <span className="min-w-0 flex-1 truncate">{item.label}</span>
                            {isActive && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-paper" />}
                          </>
                        )}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
          {account?.roleCode?.toUpperCase() === 'ADMIN' && (
            <NavLink
              to="/admin/accounts"
              onClick={onClose}
              className={({ isActive }) => `mt-1 flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs transition ${
                isActive
                  ? 'bg-caramel font-bold text-white shadow-sm'
                  : 'text-rosewood/90 hover:bg-paper hover:text-rosewood font-medium'
              }`}
            >
              <Icon name="receipt" size={16} />
              <span>Quản lý tài khoản</span>
            </NavLink>
          )}
        </nav>

        {/* Quick Store Link & Status */}
        <div className="mt-auto rounded-2xl border border-border/80 bg-paper/90 p-3 shadow-2xs backdrop-blur-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              <span className="text-[11px] font-bold text-rosewood">Cửa hàng trực tuyến</span>
            </div>
            <a
              href="/shop"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-lg bg-petal px-2 py-1 text-[10px] font-bold text-caramel transition hover:bg-caramel hover:text-white"
            >
              <span>Xem shop</span>
              <Icon name="arrowUpRight" size={11} />
            </a>
          </div>
        </div>

        {/* User Account / Profile Card */}
        <div className="mt-2.5 flex items-center justify-between rounded-2xl border border-border/70 bg-paper/80 p-2 shadow-2xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-rosewood to-stone-800 text-[11px] font-bold text-white shadow-2xs">
              {(account?.username?.slice(0, 2) || 'AC').toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-bold text-rosewood">{account?.username || 'Đang tải...'}</p>
              <p className="truncate text-[10px] font-medium text-muted">
                {account?.roleName || roleLabels[account?.roleCode] || 'Quản trị viên'}
              </p>
            </div>
          </div>
          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              disabled={isLoggingOut}
              title="Đăng xuất"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
            >
              <Icon name="logOut" size={14} />
            </button>
          )}
        </div>
      </aside>
    </>
  )
}
