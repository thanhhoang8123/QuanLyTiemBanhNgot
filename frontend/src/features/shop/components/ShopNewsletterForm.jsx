import { useState } from 'react'
import { apiRequest, getUserFacingErrorMessage } from '../../../services/apiClient.js'

export default function ShopNewsletterForm() {
  const [email, setEmail] = useState('')
  const [consent, setConsent] = useState(false)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const submit = async (event) => {
    event.preventDefault()
    setStatus('')
    setError('')
    setIsSubmitting(true)
    try {
      const response = await apiRequest('/shop/newsletter', {
        method: 'POST',
        body: { email: email.trim(), consent },
      })
      setStatus(response.message)
      setEmail('')
      setConsent(false)
    } catch (requestError) {
      setError(getUserFacingErrorMessage(requestError, 'Chưa thể đăng ký nhận tin. Vui lòng thử lại.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section aria-labelledby="newsletter-title" className="rounded-2xl border border-[#EAE3DA] bg-white p-4 sm:p-5">
      <h2 id="newsletter-title" className="font-display text-lg font-semibold text-[#4A302B]">Một chút ngọt ngào trong hộp thư</h2>
      <p className="mt-1 text-[11px] leading-5 text-[#806B65]">Lưu email để nhận các cập nhật của WA Patisserie sau này.</p>
      <form onSubmit={submit} className="mt-3">
        <label className="sr-only" htmlFor="shop-newsletter-email">Email nhận tin</label>
        <div className="flex gap-2">
          <input
            id="shop-newsletter-email"
            type="email"
            autoComplete="email"
            required
            maxLength={100}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Email của bạn"
            className="h-10 min-w-0 flex-1 rounded-full border border-[#EAE3DA] bg-[#FCF9F3] px-4 text-xs outline-none focus:border-[#B7835E]"
          />
          <button type="submit" disabled={isSubmitting || !consent} className="h-10 shrink-0 rounded-full bg-[#76534D] px-4 text-[10px] font-bold text-white transition hover:bg-[#4A302B] disabled:cursor-not-allowed disabled:opacity-50">
            {isSubmitting ? 'Đang gửi…' : 'Đăng ký'}
          </button>
        </div>
        <label className="mt-3 flex items-start gap-2 text-[10px] leading-4 text-[#806B65]">
          <input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} className="mt-0.5 accent-[#76534D]" />
          Tôi đồng ý nhận email cập nhật từ WA Patisserie.
        </label>
      </form>
      {status && <p role="status" className="mt-2 text-[10px] text-[#536B50]">{status} Hiện chưa gửi email chiến dịch tự động.</p>}
      {error && <p role="alert" className="mt-2 text-[10px] text-[#914E46]">{error}</p>}
    </section>
  )
}
