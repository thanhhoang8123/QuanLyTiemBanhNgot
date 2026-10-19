import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Icon from '../../../components/Icon.jsx'
import { apiRequest } from '../../../services/apiClient.js'

const initialForm = { fullName: '', username: '', email: '', phone: '', address: '', password: '', confirmPassword: '' }

export default function RegisterPage() {
  const [form, setForm] = useState(initialForm)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const navigate = useNavigate()

  const update = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }))

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    if (form.password !== form.confirmPassword) {
      setError('Mật khẩu xác nhận chưa khớp.')
      return
    }
    setIsSubmitting(true)
    try {
      await apiRequest('/auth/register', {
        method: 'POST',
        body: {
          fullName: form.fullName.trim(), username: form.username.trim(), email: form.email.trim(),
          phone: form.phone.trim() || null, address: form.address.trim() || null, password: form.password,
        },
      })
      setSubmitted(true)
    } catch (requestError) {
      setError(requestError.message || 'Chưa thể tạo tài khoản. Vui lòng thử lại.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="mx-auto grid min-h-[70vh] max-w-6xl items-center gap-8 px-4 py-10 sm:px-7 lg:grid-cols-[0.85fr_1.15fr] lg:gap-14 lg:px-10 lg:py-16">
      <aside className="relative hidden min-h-[570px] overflow-hidden rounded-[32px] bg-[#76534D] p-10 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -right-16 -top-10 h-64 w-64 rounded-full bg-[#D0A263]/25 blur-2xl" />
        <div className="relative">
          <span className="flex h-14 w-14 items-center justify-center rounded-full border border-white/30 font-display text-3xl">W</span>
          <p className="mt-10 text-[10px] font-semibold uppercase tracking-[0.24em] text-[#E8C89D]">Welcome to WA Pâtisserie</p>
          <h1 className="font-display mt-4 text-5xl leading-tight">Niềm vui nhỏ, bắt đầu từ một chiếc bánh.</h1>
          <p className="mt-5 max-w-sm text-sm leading-7 text-white/75">Tạo tài khoản để chuẩn bị cho những chiếc bánh ngọt ngào và đơn hàng dành riêng cho bạn.</p>
        </div>
        <p className="relative text-xs text-white/60">Bánh ngọt thủ công · Chăm chút trong từng chi tiết</p>
      </aside>

      <div className="mx-auto w-full max-w-xl rounded-[28px] border border-[#EAE3DA] bg-white p-5 shadow-[0_18px_60px_rgba(91,61,53,0.07)] sm:p-8 lg:p-10">
        {submitted ? (
          <div className="py-8 text-center">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#EAF0E8] text-[#536B50]"><Icon name="mail" size={28} /></span>
            <p className="mt-6 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#A97668]">Kiểm tra hộp thư</p>
            <h2 className="font-display mt-3 text-3xl text-[#4A302B]">Bạn sắp hoàn tất rồi!</h2>
            <p className="mt-4 text-sm leading-7 text-[#806B65]">Nếu email được gửi thành công, hãy mở email xác minh từ WA Pâtisserie. Liên kết xác minh có hiệu lực trong 30 phút.</p>
            <button type="button" onClick={() => navigate('/shop')} className="mt-7 rounded-full bg-[#76534D] px-6 py-3 text-sm font-semibold text-white hover:bg-[#4A302B]">Quay lại cửa hàng</button>
          </div>
        ) : (
          <>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#A97668]">Tài khoản khách hàng</p>
            <h2 className="font-display mt-2 text-3xl font-medium text-[#4A302B] sm:text-4xl">Tạo tài khoản</h2>
            <p className="mt-3 text-sm leading-6 text-[#806B65]">Điền thông tin bên dưới. Email của bạn cần được xác minh trước khi đăng nhập.</p>
            {error && <div role="alert" className="mt-5 rounded-xl border border-[#E2C5BF] bg-[#F6E9E6] px-4 py-3 text-sm text-[#914E46]">{error}</div>}
            <form onSubmit={handleSubmit} className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="grid gap-1.5 text-xs font-semibold text-[#675650] sm:col-span-2">Họ và tên *<input required maxLength={100} name="fullName" value={form.fullName} onChange={update} autoComplete="name" className="h-11 rounded-xl border border-[#EAE3DA] bg-[#FCF9F3]/60 px-3 text-sm font-normal outline-none focus:border-[#D0A263]" placeholder="Nguyễn Thị An" /></label>
              <label className="grid gap-1.5 text-xs font-semibold text-[#675650]">Tên đăng nhập *<input required minLength={4} maxLength={50} pattern="[A-Za-z0-9._-]+" name="username" value={form.username} onChange={update} autoComplete="username" className="h-11 rounded-xl border border-[#EAE3DA] bg-[#FCF9F3]/60 px-3 text-sm font-normal outline-none focus:border-[#D0A263]" placeholder="an.nguyen" /></label>
              <label className="grid gap-1.5 text-xs font-semibold text-[#675650]">Số điện thoại<input name="phone" value={form.phone} onChange={update} autoComplete="tel" maxLength={15} className="h-11 rounded-xl border border-[#EAE3DA] bg-[#FCF9F3]/60 px-3 text-sm font-normal outline-none focus:border-[#D0A263]" placeholder="09xx xxx xxx" /></label>
              <label className="grid gap-1.5 text-xs font-semibold text-[#675650] sm:col-span-2">Email *<input required type="email" maxLength={100} name="email" value={form.email} onChange={update} autoComplete="email" className="h-11 rounded-xl border border-[#EAE3DA] bg-[#FCF9F3]/60 px-3 text-sm font-normal outline-none focus:border-[#D0A263]" placeholder="ban@example.com" /></label>
              <label className="grid gap-1.5 text-xs font-semibold text-[#675650] sm:col-span-2">Địa chỉ giao hàng<input name="address" value={form.address} onChange={update} autoComplete="street-address" maxLength={255} className="h-11 rounded-xl border border-[#EAE3DA] bg-[#FCF9F3]/60 px-3 text-sm font-normal outline-none focus:border-[#D0A263]" placeholder="Số nhà, đường, quận/huyện" /></label>
              <label className="grid gap-1.5 text-xs font-semibold text-[#675650]">Mật khẩu *<input required type="password" minLength={8} maxLength={72} name="password" value={form.password} onChange={update} autoComplete="new-password" className="h-11 rounded-xl border border-[#EAE3DA] bg-[#FCF9F3]/60 px-3 text-sm font-normal outline-none focus:border-[#D0A263]" placeholder="Ít nhất 8 ký tự" /></label>
              <label className="grid gap-1.5 text-xs font-semibold text-[#675650]">Nhập lại mật khẩu *<input required type="password" minLength={8} maxLength={72} name="confirmPassword" value={form.confirmPassword} onChange={update} autoComplete="new-password" className="h-11 rounded-xl border border-[#EAE3DA] bg-[#FCF9F3]/60 px-3 text-sm font-normal outline-none focus:border-[#D0A263]" placeholder="Nhập lại mật khẩu" /></label>
              <button disabled={isSubmitting} type="submit" className="mt-2 inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#76534D] px-5 text-sm font-semibold text-white transition hover:bg-[#4A302B] disabled:opacity-60 sm:col-span-2">{isSubmitting ? 'Đang tạo tài khoản…' : 'Đăng ký và xác minh email'} <Icon name="arrowUpRight" size={16} /></button>
            </form>
            <p className="mt-6 text-center text-xs text-[#806B65]">Đã có tài khoản? <Link to="/shop/login" className="font-semibold text-[#76534D] underline underline-offset-4">Đăng nhập</Link></p>
          </>
        )}
      </div>
    </section>
  )
}
