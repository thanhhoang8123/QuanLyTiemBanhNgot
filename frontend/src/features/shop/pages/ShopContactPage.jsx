import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Icon from '../../../components/Icon.jsx'
import { apiRequest, getUserFacingErrorMessage } from '../../../services/apiClient.js'
import { getMyContactMessages, sendContactMessage } from '../../contact-messages/services/contactMessageService.js'

function formatDateTime(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date)
}

export default function ShopContactPage() {
  const navigate = useNavigate()
  const [customer, setCustomer] = useState(null)
  const [isCheckingSession, setIsCheckingSession] = useState(true)
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [myMessages, setMyMessages] = useState([])

  useEffect(() => {
    const controller = new AbortController()

    apiRequest('/customer/profile', { signal: controller.signal })
      .then((profile) => {
        setCustomer(profile)
        setForm((prev) => ({
          ...prev,
          name: profile?.fullName || '',
          email: profile?.email || '',
        }))
        // Load history
        getMyContactMessages({ signal: controller.signal })
          .then((msgs) => {
            if (Array.isArray(msgs)) setMyMessages(msgs)
          })
          .catch(() => {})
      })
      .catch(() => {
        setCustomer(null)
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsCheckingSession(false)
        }
      })

    return () => controller.abort()
  }, [])

  const updateField = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }))
  }

  const handleSendMessage = async (event) => {
    event.preventDefault()
    setError('')
    setSuccess('')
    setIsSending(true)

    try {
      const emailToSend = form.email.trim() || customer?.email || 'khachhang@dailyfresh.local'
      const nameToSend = form.name.trim() || customer?.fullName || 'Khách hàng'

      const newMsg = await sendContactMessage({
        name: nameToSend,
        email: emailToSend,
        subject: form.subject.trim(),
        message: form.message.trim(),
      })

      setSuccess('Cảm ơn bạn! WA Patisserie đã tiếp nhận tin nhắn và sẽ phản hồi sớm nhất.')
      setForm((prev) => ({
        ...prev,
        subject: '',
        message: '',
      }))
      setMyMessages((prev) => [newMsg, ...prev])
    } catch (requestError) {
      setError(getUserFacingErrorMessage(requestError, 'Chưa thể gửi tin nhắn. Vui lòng thử lại sau.'))
    } finally {
      setIsSending(false)
    }
  }

  return (
    <section className="mx-auto max-w-5xl px-4 py-10 sm:px-7 sm:py-14">
      <h1 className="font-display text-2xl font-bold text-[#4A302B] sm:text-3xl">Liên hệ WA Patisserie</h1>
      <p className="mt-2 text-xs sm:text-sm text-[#806B65]">
        Gửi câu hỏi về sản phẩm, đơn hàng hoặc đóng góp ý kiến cho tiệm bánh.
      </p>

      <div className="mt-7 grid gap-6 md:grid-cols-[0.8fr_1.2fr]">
        {/* Left: Thông tin tiệm */}
        <aside className="rounded-2xl bg-[#F8F0E6] p-5 sm:p-6 space-y-4 text-xs">
          <div>
            <h2 className="font-display text-base font-bold text-[#4A302B]">Tiệm bánh WA Patisserie</h2>
            <p className="mt-2 text-[#806B65] leading-relaxed">
              Đường Lê Văn Việt, TP. Thủ Đức, TP. Hồ Chí Minh
            </p>
            <a
              href="https://www.google.com/maps/search/?api=1&query=Le+Van+Viet%2C+Thu+Duc%2C+Ho+Chi+Minh+City"
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex items-center gap-1 font-semibold text-[#A45B46] underline"
            >
              <span>Xem bản đồ</span>
              <Icon name="externalLink" size={12} />
            </a>
          </div>

          <div className="border-t border-[#EAE3DA] pt-3 space-y-1.5 text-[#806B65]">
            <p><strong>Giờ mở cửa:</strong> 07:00 – 22:00 hàng ngày</p>
            <p><strong>Hotline:</strong> 0900 000 000</p>
          </div>

          <div className="rounded-xl border border-white/80 bg-white/70 p-3.5 space-y-2.5">
            <p className="font-bold text-[#4A302B] flex items-center gap-1.5">
              <Icon name="messageCircle" size={14} />
              <span>Live Chat trực tuyến</span>
            </p>
            <p className="text-[11px] leading-relaxed text-[#806B65]">
              {customer
                ? 'Cần tư vấn nhanh hoặc đặt bánh gấp? Trò chuyện trực tiếp ngay với nhân viên tiệm.'
                : 'Vui lòng đăng nhập tài khoản khách hàng để trò chuyện trực tiếp với nhân viên tiệm.'}
            </p>
            {customer ? (
              <button
                type="button"
                onClick={() => {
                  if (typeof window.Tawk_API?.maximize === 'function') {
                    window.Tawk_API.showWidget?.()
                    window.Tawk_API.maximize()
                  } else {
                    alert('Khung chat đang khởi động, vui lòng thử lại sau vài giây.')
                  }
                }}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#76534D] px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#4A302B] active:scale-[0.99]"
              >
                <Icon name="messageCircle" size={15} />
                <span>Bắt đầu Chat ngay</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => navigate('/shop/login')}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#76534D] px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#4A302B] active:scale-[0.99]"
              >
                <Icon name="messageCircle" size={15} />
                <span>Đăng nhập để Chat</span>
              </button>
            )}
          </div>
        </aside>

        {/* Right: Form gửi tin nhắn hoặc Yêu cầu đăng nhập */}
        <div className="rounded-2xl border border-[#EAE3DA] bg-white p-5 sm:p-6 shadow-sm">
          {isCheckingSession ? (
            <div className="py-14 text-center text-xs text-muted">
              Đang kiểm tra phiên đăng nhập...
            </div>
          ) : !customer ? (
            <div className="py-10 px-4 text-center">
              <div className="mx-auto mb-3.5 flex h-14 w-14 items-center justify-center rounded-full bg-[#FAF0EE] text-[#76534D]">
                <Icon name="messageCircle" size={26} />
              </div>
              <h2 className="font-display text-base font-bold text-[#4A302B]">
                Vui lòng đăng nhập để gửi tin nhắn hỗ trợ
              </h2>
              <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-[#806B65]">
                Để đảm bảo tin nhắn được lưu vào tài khoản và nhân viên WA Patisserie phản hồi trực tiếp đến bạn, bạn cần đăng nhập tài khoản trước khi gửi tin nhắn hoặc chat hỗ trợ.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Link
                  to="/shop/login"
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#76534D] px-6 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#4A302B]"
                >
                  Đăng nhập ngay
                </Link>
                <Link
                  to="/shop/register"
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#DDCDB8] bg-white px-5 py-2.5 text-xs font-semibold text-[#76534D] transition hover:bg-[#FAF0EE]"
                >
                  Tạo tài khoản mới
                </Link>
              </div>
            </div>
          ) : (
            <>
              <form onSubmit={handleSendMessage} className="space-y-3.5 text-xs">
                {error && <p role="alert" className="rounded-xl bg-[#FFF2EF] p-3 text-[#914E46]">{error}</p>}
                {success && <p role="status" className="rounded-xl bg-[#F0F6ED] p-3 text-[#536B50] font-medium">{success}</p>}

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block font-semibold text-[#5F4039]">
                    Họ và tên
                    <input
                      required
                      maxLength={100}
                      value={form.name}
                      onChange={updateField('name')}
                      placeholder="Họ và tên của bạn"
                      className="mt-1.5 h-10 w-full rounded-xl border border-[#EAE3DA] bg-[#FCF9F3] px-3 font-normal outline-none focus:border-[#B7835E]"
                    />
                  </label>

                  <label className="block font-semibold text-[#5F4039]">
                    Email
                    <input
                      type="email"
                      required
                      maxLength={100}
                      value={form.email}
                      onChange={updateField('email')}
                      placeholder="Địa chỉ email"
                      className="mt-1.5 h-10 w-full rounded-xl border border-[#EAE3DA] bg-[#FCF9F3] px-3 font-normal outline-none focus:border-[#B7835E]"
                    />
                  </label>
                </div>

                <label className="block font-semibold text-[#5F4039]">
                  Chủ đề
                  <input
                    required
                    maxLength={120}
                    value={form.subject}
                    onChange={updateField('subject')}
                    placeholder="VD: Hỏi về bánh sinh nhật, giao hàng..."
                    className="mt-1.5 h-10 w-full rounded-xl border border-[#EAE3DA] bg-[#FCF9F3] px-3 font-normal outline-none focus:border-[#B7835E]"
                  />
                </label>

                <label className="block font-semibold text-[#5F4039]">
                  Nội dung
                  <textarea
                    required
                    maxLength={3000}
                    rows={4}
                    value={form.message}
                    onChange={updateField('message')}
                    placeholder="Nhập nội dung cần hỗ trợ..."
                    className="mt-1.5 w-full rounded-xl border border-[#EAE3DA] bg-[#FCF9F3] px-3 py-2.5 font-normal outline-none focus:border-[#B7835E]"
                  />
                </label>

                <div className="pt-1 flex justify-end">
                  <button
                    type="submit"
                    disabled={isSending}
                    className="rounded-full bg-[#76534D] px-6 py-2.5 font-bold text-white transition hover:bg-[#4A302B] disabled:opacity-60 shadow-xs"
                  >
                    {isSending ? 'Đang gửi…' : 'Gửi tin nhắn'}
                  </button>
                </div>
              </form>

              {/* Lịch sử tin nhắn gần đây */}
              {myMessages.length > 0 && (
                <div className="mt-6 border-t border-[#EAE3DA] pt-4 space-y-2.5">
                  <h3 className="font-bold text-[#4A302B] text-xs">Tin nhắn đã gửi gần đây ({myMessages.length})</h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {myMessages.slice(0, 5).map((m) => (
                      <div key={m.id} className="rounded-xl border border-[#EAE3DA] bg-[#FCF9F3] p-2.5 text-[11px]">
                        <div className="flex items-center justify-between text-[#806B65]">
                          <span className="font-bold text-[#4A302B]">{m.subject}</span>
                          <span>{formatDateTime(m.createdAt)}</span>
                        </div>
                        <p className="mt-1 text-[#5F4039] line-clamp-2">{m.message}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  )
}
