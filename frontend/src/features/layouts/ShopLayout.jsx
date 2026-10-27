
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import Icon from '../components/Icon.jsx'

const navClass = ({ isActive }) =>
  `rounded-full px-4 py-2 text-xs font-semibold transition ${
    isActive
      ? 'bg-[#FAF0EE] text-[#76534D]'
      : 'text-[#806B65] hover:bg-[#FAF0EE] hover:text-[#4A302B]'
  }`

const AUTH_PATHS = new Set([
  '/shop/login',
  '/shop/register',
  '/shop/verify-email',
  '/shop/logout',
])

export default function ShopLayout() {
  const { pathname } = useLocation()
  const normalizedPath = pathname.replace(/\/+$/, '') || '/'
  const isAuthPage = AUTH_PATHS.has(normalizedPath)

  return (
    <div className="min-h-screen bg-[#FCF9F3] text-[#4A302B]">
      {!isAuthPage && (
        <header className="sticky top-0 z-40 border-b border-[#EAE3DA]/80 bg-[#FCF9F3]/95 backdrop-blur">
          <div className="mx-auto flex min-h-[76px] max-w-7xl items-center justify-between gap-4 px-4 sm:px-7 lg:px-10">
            <Link
              to="/shop"
              className="group flex shrink-0 items-center gap-3"
              aria-label="Daily Fresh - Trang chủ"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-full border border-[#D0A263]/60 bg-white font-display text-xl text-[#76534D] transition group-hover:bg-[#FAF0EE]">
                W
              </span>

              <span>
                <span className="block font-display text-[15px] font-semibold tracking-wide text-[#4A302B] sm:text-base">
                  Daily Fresh
                </span>
                <span className="mt-0.5 block text-[8px] font-semibold uppercase tracking-[0.22em] text-[#9A7972]">
                  Bánh ngọt thủ công
                </span>
              </span>
            </Link>

            <nav
              aria-label="Điều hướng cửa hàng"
              className="hidden items-center gap-1 sm:flex"
            >
              <NavLink to="/shop" end className={navClass}>
                Trang chủ
              </NavLink>
              <NavLink to="/shop/products" className={navClass}>
                Sản phẩm
              </NavLink>
              <NavLink to="/shop/login" className={navClass}>
                Đăng nhập
              </NavLink>
            </nav>

            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
              <Link
                to="/shop/register"
                className="hidden h-10 items-center rounded-full border border-[#DDCDB8] bg-white px-4 text-xs font-semibold text-[#76534D] transition hover:bg-[#FAF0EE] sm:inline-flex"
              >
                Tạo tài khoản
              </Link>

              <Link
                to="/shop/login"
                className="hidden h-10 items-center rounded-full border border-[#EAE3DA] bg-white px-4 text-xs font-semibold text-[#76534D] transition hover:bg-[#FAF0EE] sm:inline-flex"
              >
                Đăng nhập
              </Link>

              <Link
                to="/shop/products"
                className="hidden h-10 items-center rounded-full bg-[#76534D] px-5 text-xs font-semibold text-white transition hover:bg-[#4A302B] sm:inline-flex"
              >
                Khám phá bánh
              </Link>

              <button
                type="button"
                disabled
                aria-label="Giỏ hàng, sẽ sớm ra mắt"
                title="Giỏ hàng sẽ sớm ra mắt"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-[#EAE3DA] bg-white text-[#76534D] opacity-80"
              >
                <Icon name="cart" size={18} />
              </button>
            </div>
          </div>

          <nav
            aria-label="Điều hướng cửa hàng trên thiết bị nhỏ"
            className="flex justify-center gap-2 border-t border-[#EAE3DA]/70 px-3 py-2 sm:hidden"
          >
            <NavLink to="/shop" end className={navClass}>
              Trang chủ
            </NavLink>
            <NavLink to="/shop/products" className={navClass}>
              Sản phẩm
            </NavLink>
            <NavLink to="/shop/register" className={navClass}>
              Đăng ký
            </NavLink>
          </nav>
        </header>
      )}

      <main className={isAuthPage ? 'min-h-screen' : 'min-h-[60vh]'}>
        <Outlet />
      </main>

      {!isAuthPage && (
        <footer className="mt-16 border-t border-[#EAE3DA] bg-[#FAF0EE]/55">
          <div className="mx-auto flex max-w-7xl flex-col gap-7 px-4 py-10 sm:px-7 md:flex-row md:items-end md:justify-between lg:px-10">
            <div>
              <p className="font-display text-xl font-semibold text-[#4A302B]">
                Daily Fresh
              </p>
              <p className="mt-2 max-w-md text-xs leading-6 text-[#806B65]">
                Bánh ngọt được làm bằng sự chăm chút, dành cho những khoảnh khắc thật dịu dàng.
              </p>
            </div>

            <div className="flex flex-wrap gap-x-6 gap-y-3 text-xs font-medium text-[#76534D]">
              <Link
                className="transition hover:text-[#4A302B]"
                to="/shop"
              >
                Trang chủ
              </Link>
              <Link
                className="transition hover:text-[#4A302B]"
                to="/shop/products"
              >
                Sản phẩm
              </Link>
              <span className="text-[#9A7972]">
                Thông tin liên hệ sẽ được cập nhật
              </span>
            </div>

            <p className="text-[10px] text-[#9A7972]">
              © {new Date().getFullYear()} Daily Fresh
            </p>
          </div>
        </footer>
      )}
    </div>
  )
}
