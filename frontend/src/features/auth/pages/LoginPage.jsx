import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { apiRequest } from '../../../services/apiClient.js'

export default function LoginPage() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { csrfToken } = await apiRequest('/auth/csrf')
      await apiRequest('/auth/login', {
        method: 'POST',
        body: { username: username.trim(), password },
        headers: { 'X-CSRF-Token': csrfToken },
      })
      navigate('/shop', { replace: true })
    } catch (err) {
      setError(err.message || 'Đăng nhập chưa thành công. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="mx-auto flex min-h-[65vh] max-w-6xl items-center justify-center px-4 py-12 sm:px-7">
      <div className="grid w-full max-w-4xl overflow-hidden rounded-[2rem] border border-[#EAE3DA] bg-white shadow-[0_24px_70px_rgba(74,48,43,0.08)] md:grid-cols-2">
        <div className="flex flex-col justify-center bg-[#FAF0EE] p-8 sm:p-10">
          <span className="mb-5 flex h-12 w-12 items-center justify-center rounded-full border border-[#D0A263]/70 bg-white font-display text-2xl text-[#76534D]">W</span>
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#9A7972]">Welcome back</p>
          <h1 className="mt-3 font-display text-3xl font-semibold leading-tight text-[#4A302B]">Chào mừng bạn trở lại</h1>
          <p className="mt-4 text-sm leading-7 text-[#806B65]">Đăng nhập để tiếp tục hành trình thưởng thức những chiếc bánh ngọt thủ công từ WA Pâtisserie.</p>
        </div>
        <form onSubmit={handleSubmit} className="p-8 sm:p-10">
          <h2 className="font-display text-2xl font-semibold text-[#4A302B]">Đăng nhập</h2>
          <p className="mt-2 text-xs leading-5 text-[#806B65]">Dùng tài khoản đã xác minh email để đăng nhập.</p>
          {error && <div role="alert" className="mt-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs leading-5 text-rose-800">{error}</div>}
          <label className="mt-6 block text-xs font-semibold text-[#5F4039]" htmlFor="username">Tên đăng nhập</label>
          <input id="username" autoComplete="username" required value={username} onChange={(e) => setUsername(e.target.value)} className="mt-2 h-11 w-full rounded-xl border border-[#EAE3DA] bg-[#FCF9F3] px-4 text-sm outline-none transition focus:border-[#B98A63] focus:ring-2 focus:ring-[#D0A263]/20" />
          <label className="mt-5 block text-xs font-semibold text-[#5F4039]" htmlFor="password">Mật khẩu</label>
          <input id="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} className="mt-2 h-11 w-full rounded-xl border border-[#EAE3DA] bg-[#FCF9F3] px-4 text-sm outline-none transition focus:border-[#B98A63] focus:ring-2 focus:ring-[#D0A263]/20" />
          <button type="submit" disabled={loading} className="mt-7 flex h-11 w-full items-center justify-center rounded-full bg-[#76534D] px-5 text-sm font-semibold text-white transition hover:bg-[#4A302B] disabled:cursor-not-allowed disabled:opacity-60">{loading ? 'Đang đăng nhập…' : 'Đăng nhập'}</button>
          <p className="mt-5 text-center text-xs text-[#806B65]">Chưa có tài khoản? <Link to="/shop/register" className="font-semibold text-[#76534D] underline underline-offset-4 hover:text-[#4A302B]">Đăng ký ngay</Link></p>
          <Link to="/shop" className="mt-5 block text-center text-xs text-[#9A7972] hover:text-[#4A302B]">← Quay lại cửa hàng</Link>
        </form>
      </div>
    </section>
  )
}
