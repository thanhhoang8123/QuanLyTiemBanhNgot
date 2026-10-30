import { useEffect, useState } from 'react'
import { apiRequest, getUserFacingErrorMessage } from '../../../services/apiClient.js'

const emptyProfile = { fullName: '', phone: '', email: '', address: '', loyaltyPoints: 0 }

export default function ShopAccountPage() {
  const [profile, setProfile] = useState(emptyProfile)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    apiRequest('/customer/profile', { signal: controller.signal })
      .then(setProfile)
      .catch((requestError) => {
        if (requestError.name !== 'AbortError') {
          setError(getUserFacingErrorMessage(requestError, 'Không thể tải hồ sơ. Vui lòng thử lại.'))
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false)
      })
    return () => controller.abort()
  }, [])

  const updateField = (field) => (event) => {
    setProfile((current) => ({ ...current, [field]: event.target.value }))
  }

  const saveProfile = async (event) => {
    event.preventDefault()
    setError('')
    setNotice('')
    setIsSaving(true)
    try {
      const updated = await apiRequest('/customer/profile', {
        method: 'PUT',
        body: {
          fullName: profile.fullName.trim(),
          phone: profile.phone.trim(),
          address: profile.address.trim(),
        },
      })
      setProfile(updated)
      setNotice('Thông tin hồ sơ đã được cập nhật.')
    } catch (requestError) {
      setError(getUserFacingErrorMessage(requestError, 'Chưa thể lưu thay đổi. Vui lòng thử lại.'))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <section className="mx-auto max-w-3xl px-4 py-10 sm:px-7 sm:py-14">
      <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#A97668]">Tài khoản WA Patisserie</p>
      <h1 className="font-display mt-2 text-3xl font-semibold text-[#4A302B]">Thông tin của bạn</h1>
      <p className="mt-2 text-sm leading-6 text-[#806B65]">Cập nhật thông tin liên hệ để cửa hàng phục vụ bạn tốt hơn.</p>
      {isLoading ? (
        <div role="status" className="mt-6 rounded-2xl border border-[#EAE3DA] bg-white p-6 text-sm text-[#806B65]">Đang tải hồ sơ…</div>
      ) : (
        <form onSubmit={saveProfile} className="mt-6 rounded-2xl border border-[#EAE3DA] bg-white p-5 shadow-sm sm:p-7">
          {error && <p role="alert" className="mb-4 rounded-xl bg-[#FFF2EF] p-3 text-xs text-[#914E46]">{error}</p>}
          {notice && <p role="status" className="mb-4 rounded-xl bg-[#F0F6ED] p-3 text-xs text-[#536B50]">{notice}</p>}
          <label className="block text-xs font-semibold text-[#5F4039]" htmlFor="profile-name">Họ và tên</label>
          <input id="profile-name" required maxLength={100} value={profile.fullName} onChange={updateField('fullName')} className="mt-2 h-11 w-full rounded-xl border border-[#EAE3DA] bg-[#FCF9F3] px-4 text-sm outline-none focus:border-[#B7835E]" />
          <label className="mt-5 block text-xs font-semibold text-[#5F4039]" htmlFor="profile-phone">Số điện thoại</label>
          <input id="profile-phone" type="tel" maxLength={15} autoComplete="tel" value={profile.phone || ''} onChange={updateField('phone')} className="mt-2 h-11 w-full rounded-xl border border-[#EAE3DA] bg-[#FCF9F3] px-4 text-sm outline-none focus:border-[#B7835E]" />
          <label className="mt-5 block text-xs font-semibold text-[#5F4039]" htmlFor="profile-email">Email tài khoản</label>
          <input id="profile-email" type="email" value={profile.email || ''} readOnly className="mt-2 h-11 w-full cursor-not-allowed rounded-xl border border-[#EAE3DA] bg-[#F4F0EC] px-4 text-sm text-[#806B65]" />
          <p className="mt-1 text-[10px] text-[#9A7972]">Email được giữ cố định để bảo vệ tài khoản.</p>
          <label className="mt-5 block text-xs font-semibold text-[#5F4039]" htmlFor="profile-address">Địa chỉ</label>
          <textarea id="profile-address" rows={3} maxLength={255} value={profile.address || ''} onChange={updateField('address')} className="mt-2 w-full rounded-xl border border-[#EAE3DA] bg-[#FCF9F3] px-4 py-3 text-sm outline-none focus:border-[#B7835E]" />
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#F0E8DF] pt-4">
            <p className="text-xs text-[#806B65]">Điểm tích lũy: <strong className="text-[#76534D]">{profile.loyaltyPoints ?? 0}</strong></p>
            <button type="submit" disabled={isSaving} className="h-11 rounded-full bg-[#76534D] px-6 text-xs font-semibold text-white transition hover:bg-[#4A302B] disabled:opacity-60">{isSaving ? 'Đang lưu…' : 'Lưu thay đổi'}</button>
          </div>
        </form>
      )}

      <div className="mt-6 rounded-2xl border border-[#EAE3DA] bg-[#F8F0E6] p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="font-bold text-sm text-[#4A302B]">Hộp thư hỗ trợ khách hàng</h3>
            <p className="mt-0.5 text-xs text-[#806B65]">Xem lại tiến độ các câu hỏi và thắc mắc bạn đã gửi tới WA Patisserie.</p>
          </div>
          <a
            href="/shop/contact"
            className="inline-flex shrink-0 items-center justify-center rounded-full bg-white border border-[#EAE3DA] px-4 py-2 text-xs font-semibold text-[#76534D] shadow-xs transition hover:bg-[#FAF0EE]"
          >
            Mở hộp thư của tôi →
          </a>
        </div>
      </div>
    </section>
  )
}
