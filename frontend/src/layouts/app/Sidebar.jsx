import { useEffect, useState } from 'react'
import Icon from '../../components/Icon.jsx'
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
      { path: '/admin/logs', label: 'Nhật ký NoSQL', icon: 'receipt' },
    ],
  },
]

export default function Sidebar({ account, open, onClose }) {
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
          <div className="font-display flex h-11 w-11 items-center justify-center rounded-full border border-caramel bg-paper text-lg text-rosewood shadow-sm">
            W
          </div>
          <div>
            <p className="font-display text-[19px] leading-tight tracking-wide text-rosewood">WA Pâtisserie</p>
            <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.24em] text-muted">Sweet moments</p>
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
                ? 'bg-caramel font-semibold text-action-ink shadow-sm'
                : 'text-rosewood hover:bg-paper hover:text-rosewood'
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
                            ? 'bg-caramel font-semibold text-action-ink shadow-sm'
                            : 'text-rosewood hover:bg-paper hover:text-rosewood'
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
                  ? 'bg-caramel font-semibold text-action-ink shadow-sm'
                  : 'text-rosewood hover:bg-paper hover:text-rosewood'
              }`}
            >
              <Icon name="receipt" size={16} />
              <span>Quản lý tài khoản</span>
            </NavLink>
          )}
        </nav>

        <div className="mt-auto rounded-2xl border border-border bg-paper p-4">
          <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-caramel-soft text-rosewood">
            <Icon name="sparkles" size={18} />
          </div>
          <p className="font-display text-[15px] text-rosewood">Một ngày ngọt ngào</p>
          <p className="mt-1 text-[11px] leading-5 text-muted">Chúc bạn có một ngày kinh doanh thật rực rỡ.</p>
          <div className="mt-3 h-1 overflow-hidden rounded-full bg-border">
            <div className="h-full w-2/3 rounded-full bg-caramel" />
          </div>
        </div>
        <div className="mt-4 flex items-center gap-3 border-t border-border px-2 pt-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-rosewood text-xs font-semibold text-white">
            {(account?.username?.slice(0, 2) || 'AC').toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-rosewood">{account?.username || 'Đang tải...'}</p>
            <p className="mt-0.5 text-[10px] text-muted">{account?.roleName || account?.roleCode || ''}</p>
          </div>
        </div>
      </aside>
    </>
  )
}
