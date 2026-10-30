import { useCallback, useContext, useEffect, useState } from 'react'
import Icon from '../../../components/Icon.jsx'
import Modal from '../../../components/Modal.jsx'
import PageHeader from '../../../components/PageHeader.jsx'
import StatusBadge from '../../../components/StatusBadge.jsx'
import { AuthContext } from '../../auth/AuthContext.js'
import { getContactMessages, updateContactMessageStatus } from '../../contact-messages/services/contactMessageService.js'

const TAWK_DASHBOARD_URL = 'https://dashboard.tawk.to/'
const TAWK_INBOX_URL = 'https://dashboard.tawk.to/#/chat'

function formatDateTime(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date)
}

export default function LiveChatPage({ onToast }) {
  const { account } = useContext(AuthContext)
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [keyword, setKeyword] = useState('')
  const [selectedMessage, setSelectedMessage] = useState(null)
  const [updatingId, setUpdatingId] = useState(null)

  const loadMessages = useCallback(async (signal) => {
    setLoading(true)
    try {
      const res = await getContactMessages({
        page: 0,
        size: 50,
        status: statusFilter,
        keyword,
        signal,
      })
      if (Array.isArray(res?.content)) {
        setMessages(res.content)
      }
    } catch {
      // Non-critical background fetch
    } finally {
      if (!signal?.aborted) setLoading(false)
    }
  }, [statusFilter, keyword])

  useEffect(() => {
    const controller = new AbortController()
    loadMessages(controller.signal)
    return () => controller.abort()
  }, [loadMessages])

  const handleUpdateStatus = async (msgId, newStatus) => {
    setUpdatingId(msgId)
    try {
      const updated = await updateContactMessageStatus(msgId, newStatus)
      setMessages((prev) => prev.map((m) => (m.id === msgId ? updated : m)))
      if (selectedMessage?.id === msgId) {
        setSelectedMessage(updated)
      }
      onToast?.(newStatus === 'RESOLVED' ? 'Đã đánh dấu đã giải quyết.' : 'Đã chuyển sang đang xử lý.')
    } catch {
      onToast?.('Chưa thể cập nhật trạng thái. Vui lòng thử lại.')
    } finally {
      setUpdatingId(null)
    }
  }

  const newMessagesCount = messages.filter((m) => m.status === 'NEW').length

  return (
    <div className="space-y-6">
      {/* Tiêu đề trang */}
      <PageHeader
        title="Chat & Hỗ trợ khách hàng"
        actions={
          <a
            href={TAWK_INBOX_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-caramel px-4 py-2.5 text-xs font-bold text-action-ink shadow-md shadow-caramel/25 transition hover:bg-caramel-hover active:scale-[0.99]"
          >
            <Icon name="messageCircle" size={16} />
            <span>Mở hộp thư Chat tawk.to</span>
            <Icon name="externalLink" size={13} />
          </a>
        }
      />

      {/* Thẻ điều khiển Live Chat tawk.to */}
      <section className="soft-shadow rounded-2xl border border-border bg-paper p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <Icon name="headset" size={22} />
            </span>
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h3 className="font-display text-base font-bold text-rosewood">
                tawk.to Live Chat · Đang hoạt động
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <a
              href={TAWK_INBOX_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-caramel px-4 py-2.5 text-xs font-bold text-action-ink shadow-sm transition hover:bg-caramel-hover"
            >
              <Icon name="messageCircle" size={15} />
              <span>Vào trả lời chat</span>
              <Icon name="externalLink" size={13} />
            </a>
            <a
              href={TAWK_DASHBOARD_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-white px-3.5 py-2.5 text-xs font-semibold text-rosewood transition hover:bg-petal"
            >
              <span>Quản trị</span>
              <Icon name="externalLink" size={12} />
            </a>
          </div>
        </div>
      </section>

      {/* Danh sách tin nhắn gửi từ website */}
      <section className="space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="font-display text-base font-bold text-rosewood">
              Tin nhắn gửi từ website ({messages.length})
            </h3>
            {newMessagesCount > 0 && (
              <span className="rounded-full bg-rose-600 px-2 py-0.5 text-[10px] font-bold text-white">
                {newMessagesCount} mới
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Bộ lọc trạng thái */}
            {[
              { value: '', label: 'Tất cả' },
              { value: 'NEW', label: 'Mới' },
              { value: 'IN_PROGRESS', label: 'Đang xử lý' },
              { value: 'RESOLVED', label: 'Đã giải quyết' },
            ].map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => setStatusFilter(f.value)}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                  statusFilter === f.value
                    ? 'bg-caramel text-action-ink font-bold shadow-xs'
                    : 'bg-paper text-rosewood border border-border hover:bg-petal'
                }`}
              >
                {f.label}
              </button>
            ))}

            <input
              type="search"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Tìm tin nhắn..."
              className="h-8 rounded-xl border border-border bg-white px-3 text-xs outline-none focus:border-caramel w-44"
            />
          </div>
        </div>

        {/* Danh sách */}
        {loading ? (
          <p className="py-12 text-center text-xs text-muted">Đang tải tin nhắn…</p>
        ) : messages.length === 0 ? (
          <div className="rounded-2xl border border-border bg-paper py-10 text-center">
            <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <Icon name="check" size={18} />
            </div>
            <p className="font-bold text-xs text-rosewood">Không có tin nhắn nào</p>
            <p className="mt-0.5 text-[11px] text-muted">Hộp thư hỗ trợ hiện đang trống.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className="soft-shadow rounded-2xl border border-border bg-paper p-4 text-xs transition hover:border-caramel/70 space-y-2"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 border-b border-border/50 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-caramel-soft font-bold text-xs text-rosewood">
                      {(msg.name || 'KH').trim()[0].toUpperCase()}
                    </span>
                    <span className="font-bold text-rosewood text-xs">{msg.name}</span>
                    {msg.customerId && (
                      <span className="rounded bg-caramel-soft px-1.5 py-0.2 text-[10px] font-bold text-rosewood">
                        Thành viên #{msg.customerId}
                      </span>
                    )}
                    <span className="text-[11px] text-muted">· {msg.email}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <StatusBadge
                      status={
                        msg.status === 'NEW'
                          ? 'Mới'
                          : msg.status === 'IN_PROGRESS'
                          ? 'Đang xử lý'
                          : 'Đã giải quyết'
                      }
                    />
                    <span className="text-[10px] text-muted">{formatDateTime(msg.createdAt)}</span>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-xs text-rosewood">{msg.subject}</h4>
                  <p className="mt-0.5 text-[11px] text-stone-600 line-clamp-2 leading-relaxed">
                    {msg.message}
                  </p>
                </div>

                <div className="flex items-center justify-between border-t border-border/40 pt-2 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setSelectedMessage(msg)}
                    className="font-bold text-caramel hover:underline"
                  >
                    Xem chi tiết →
                  </button>

                  <div className="flex items-center gap-2">
                    {msg.status !== 'RESOLVED' && (
                      <button
                        type="button"
                        disabled={updatingId === msg.id}
                        onClick={() => handleUpdateStatus(msg.id, 'RESOLVED')}
                        className="rounded-lg bg-emerald-600 px-2.5 py-1 text-white font-bold hover:bg-emerald-700 transition"
                      >
                        ✓ Đã giải quyết
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Modal xem chi tiết tin nhắn */}
      <Modal
        open={Boolean(selectedMessage)}
        title={selectedMessage?.subject || 'Chi tiết tin nhắn'}
        onClose={() => setSelectedMessage(null)}
        size="max-w-lg"
      >
        {selectedMessage && (
          <div className="space-y-4 text-xs">
            <div className="rounded-xl border border-border bg-petal/40 p-3 space-y-1.5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-rosewood text-sm">{selectedMessage.name}</p>
                  <p className="text-[11px] text-muted">
                    ✉ {selectedMessage.email} {selectedMessage.phone ? `· 📞 ${selectedMessage.phone}` : ''}
                  </p>
                </div>
                <StatusBadge
                  status={
                    selectedMessage.status === 'NEW'
                      ? 'Mới'
                      : selectedMessage.status === 'IN_PROGRESS'
                      ? 'Đang xử lý'
                      : 'Đã giải quyết'
                  }
                />
              </div>
              <p className="text-[10px] text-muted">Thời gian gửi: {formatDateTime(selectedMessage.createdAt)}</p>
            </div>

            <div>
              <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-muted">Nội dung tin nhắn:</p>
              <div className="whitespace-pre-wrap rounded-xl border border-border bg-paper p-3.5 text-xs leading-relaxed text-rosewood">
                {selectedMessage.message}
              </div>
            </div>

            <div className="border-t border-border pt-3 flex flex-wrap items-center justify-between gap-2">
              <a
                href={TAWK_INBOX_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-caramel px-3.5 font-bold text-action-ink hover:bg-caramel-hover transition"
              >
                <Icon name="messageCircle" size={15} />
                <span>Mở chat tawk.to</span>
              </a>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={updatingId === selectedMessage.id}
                  onClick={() => handleUpdateStatus(selectedMessage.id, 'IN_PROGRESS')}
                  className="h-9 rounded-xl border border-amber-300 bg-amber-50 px-3 font-semibold text-amber-900 hover:bg-amber-100 transition"
                >
                  Đang xử lý
                </button>
                <button
                  type="button"
                  disabled={updatingId === selectedMessage.id}
                  onClick={() => handleUpdateStatus(selectedMessage.id, 'RESOLVED')}
                  className="h-9 rounded-xl bg-emerald-600 px-3 font-semibold text-white hover:bg-emerald-700 transition"
                >
                  ✓ Đã giải quyết
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
