import Icon from '../../components/Icon.jsx'
import { NavLink } from 'react-router-dom'

const navigation = [
  { path: '/admin', label: 'Tổng quan', icon: 'dashboard' },
  { path: '/pos', label: 'Bán hàng POS', icon: 'bag' },
  { path: '/admin/products', label: 'Sản phẩm', icon: 'package' },
  { path: '/admin/inventory', label: 'Kho nguyên liệu', icon: 'package' },
  { path: '/admin/suppliers', label: 'Nhà cung cấp', icon: 'receipt' },
  { path: '/admin/purchase-orders', label: 'Phiếu nhập hàng', icon: 'receipt' },
  { path: '/admin/orders', label: 'Đơn hàng', icon: 'receipt' },
]

export default function Sidebar({ open, onClose }) {
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
        className={`fixed inset-y-0 left-0 z-40 flex w-[248px] flex-col border-r border-border bg-petal px-5 py-6 transition-transform duration-200 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="mb-10 flex items-center gap-3 px-2">
          <div className="font-display flex h-11 w-11 items-center justify-center rounded-full border border-caramel bg-paper text-lg text-rosewood shadow-sm">
            W
          </div>
          <div>
            <p className="font-display text-[19px] leading-tight tracking-wide text-rosewood">WA Pâtisserie</p>
            <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.24em] text-muted">Sweet moments</p>
          </div>
        </div>

        <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-muted">Không gian làm việc</p>
        <nav aria-label="Điều hướng chính" className="space-y-1">
          {navigation.map((item) => {
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/admin'}
                onClick={onClose}
                className={({ isActive }) => `flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-[13px] transition ${
                  isActive
                    ? 'bg-caramel font-semibold text-action-ink shadow-sm'
                    : 'text-rosewood hover:bg-paper hover:text-rosewood'
                }`}
              >
                {({ isActive }) => (
                  <>
                    <Icon name={item.icon} size={18} />
                    <span>{item.label}</span>
                    {isActive && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-paper" />}
                  </>
                )}
              </NavLink>
            )
          })}
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
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-rosewood text-xs font-semibold text-white">MA</div>
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-rosewood">Minh Anh</p>
            <p className="mt-0.5 text-[10px] text-muted">Quản lý cửa hàng</p>
          </div>
        </div>
      </aside>
    </>
  )
}
