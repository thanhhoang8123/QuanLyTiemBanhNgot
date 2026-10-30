import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Icon from '../../../components/Icon.jsx'
import { apiRequest, getUserFacingErrorMessage } from '../../../services/apiClient.js'

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState('loading')
  const [message, setMessage] = useState('Đang xác minh email của bạn…')
  const token = searchParams.get('token')

  useEffect(() => {
    let active = true
    if (!token) {
      setStatus('error')
      setMessage('Liên kết xác minh không có token hợp lệ.')
      return () => { active = false }
    }
    apiRequest('/auth/verify-email', { method: 'POST', body: { token } })
      .then((result) => {
        if (!active) return
        setStatus('success')
        setMessage(result?.message || 'Email đã được xác minh. Bạn có thể đăng nhập.')
      })
      .catch((error) => {
        if (!active) return
        setStatus('error')
        setMessage(getUserFacingErrorMessage(error, 'Không thể xác minh email. Vui lòng thử lại.'))
      })
    return () => { active = false }
  }, [token])

  const success = status === 'success'
  return (
    <section className="mx-auto flex min-h-[65vh] max-w-2xl items-center px-4 py-14 sm:px-7">
      <div className="w-full rounded-[28px] border border-[#EAE3DA] bg-white px-6 py-10 text-center shadow-[0_18px_60px_rgba(91,61,53,0.07)] sm:px-12 sm:py-14">
        <span className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${status === 'error' ? 'bg-[#F6E9E6] text-[#914E46]' : success ? 'bg-[#EAF0E8] text-[#536B50]' : 'bg-[#F6EEDF] text-[#80602F]'}`}>
          <Icon name={status === 'loading' ? 'mail' : success ? 'check' : 'alertCircle'} size={28} />
        </span>
        <p className="mt-6 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#A97668]">WA Patisserie</p>
        <h1 className="font-display mt-3 text-3xl text-[#4A302B]">{status === 'loading' ? 'Đang xác minh' : success ? 'Xác minh thành công' : 'Chưa thể xác minh'}</h1>
        <p role="status" className="mx-auto mt-4 max-w-md text-sm leading-7 text-[#806B65]">{message}</p>
        {status !== 'loading' && <div className="mt-7 flex flex-wrap justify-center gap-3"><Link to="/shop" className="rounded-full border border-[#DDCDB8] px-5 py-3 text-sm font-semibold text-[#76534D] hover:bg-[#FCF9F3]">Về cửa hàng</Link>{success && <Link to="/shop/login" className="rounded-full bg-[#76534D] px-5 py-3 text-sm font-semibold text-white hover:bg-[#4A302B]">Đăng nhập</Link>}</div>}
      </div>
    </section>
  )
}
