import Icon from '../../components/Icon.jsx'

const roleLabels = {
  ADMIN: 'Quản trị viên',
  MANAGER: 'Quản lý',
  STAFF: 'Nhân viên',
  CUSTOMER: 'Khách hàng',
}

export default function Topbar({
  title,
  account,
  isLoggingOut = false,
  onLogout,
  onMenuClick,
  menuExpanded = false,
}) {
  const today = new Intl.DateTimeFormat('vi-VN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date())

  return (
    <header className="sticky top-0 z-20 flex h-[76px] items-center justify-between border-b border-border bg-cream/95 px-4 backdrop-blur-md sm:px-7 xl:px-10">
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="Mở menu"
          aria-expanded={menuExpanded}
          aria-controls="admin-sidebar"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-paper text-rosewood transition hover:bg-petal lg:hidden"
          onClick={onMenuClick}
        >
          <Icon name="menu" size={19} />
        </button>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.17em] text-muted">Daily Fresh</p>
          <h1 className="font-display mt-0.5 text-lg font-semibold text-rosewood sm:text-xl">{title}</h1>
        </div>
      </div>
      <div className="flex items-center gap-2 sm:gap-4">
        <div className="hidden items-center gap-2 rounded-full border border-border bg-petal px-3 py-2 text-[11px] font-medium text-rosewood sm:flex">
          <Icon name="clock" size={15} />
          <span>{today}</span>
        </div>
        <button
          type="button"
          aria-label="Thông báo"
          className="relative flex h-10 w-10 items-center justify-center rounded-full border border-border bg-paper text-rosewood transition hover:border-caramel hover:bg-petal"
        >
          <Icon name="bell" size={18} />
          <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-blush" />
        </button>
        <div className="hidden h-8 border-l border-border sm:block" />
        <div className="hidden min-w-0 text-right sm:block">
          <p className="max-w-32 truncate text-xs font-semibold text-rosewood">
            {account?.username || 'Tài khoản'}
          </p>
          <p className="text-[10px] text-muted">
            {account?.roleName || roleLabels[account?.roleCode] || ''}
          </p>
        </div>
        <button
          type="button"
          onClick={onLogout}
          disabled={isLoggingOut}
          className="rounded-xl border border-border bg-paper px-3 py-2 text-[11px] font-semibold text-rosewood transition hover:border-caramel hover:bg-petal disabled:cursor-wait disabled:opacity-60"
        >
          {isLoggingOut ? 'Đang thoát...' : 'Đăng xuất'}
        </button>
      </div>
    </header>
  )
}
