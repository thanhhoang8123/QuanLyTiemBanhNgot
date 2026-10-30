import { useCallback, useEffect, useMemo, useState } from 'react'
import Button from '../../../components/Button.jsx'
import Icon from '../../../components/Icon.jsx'
import EmptyState from '../../../components/EmptyState.jsx'
import ErrorState from '../../../components/ErrorState.jsx'
import LoadingState from '../../../components/LoadingState.jsx'
import Modal from '../../../components/Modal.jsx'
import PageHeader from '../../../components/PageHeader.jsx'
import PaginationControls from '../../../components/PaginationControls.jsx'
import StatusBadge from '../../../components/StatusBadge.jsx'
import { getUserFacingErrorMessage } from '../../../services/apiClient.js'
import { getContactMessages, updateContactMessageStatus } from '../services/contactMessageService.js'

const messageStatuses = [
  { value: 'NEW', label: 'Mới' },
  { value: 'IN_PROGRESS', label: 'Đang xử lý' },
  { value: 'RESOLVED', label: 'Đã xử lý' },
]

function formatDateTime(value) {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

function statusLabel(status) {
  return messageStatuses.find((item) => item.value === status)?.label ?? 'Không xác định'
}

export default function ContactMessagesPage({ onToast }) {
  const [messages, setMessages] = useState([])
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(20)
  const [pageInfo, setPageInfo] = useState({ totalElements: 0, totalPages: 0 })
  const [keyword, setKeyword] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedMessage, setSelectedMessage] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [updatingId, setUpdatingId] = useState(null)
  const [reloadVersion, setReloadVersion] = useState(0)

  const loadMessages = useCallback(async (signal) => {
    setIsLoading(true)
    setLoadError('')
    try {
      const result = await getContactMessages({ page, size, keyword, status: statusFilter, signal })
      if (!result || !Array.isArray(result.content)) {
        throw new Error('Dữ liệu hộp thư không hợp lệ. Vui lòng tải lại.')
      }
      if (result.totalPages > 0 && page >= result.totalPages) {
        setPage(result.totalPages - 1)
        return
      }
      setMessages(result.content)
      setPageInfo({ totalElements: result.totalElements, totalPages: result.totalPages })
    } catch (error) {
      if (error.name !== 'AbortError') {
        setLoadError(getUserFacingErrorMessage(error, 'Không thể tải hộp thư hỗ trợ. Vui lòng thử lại.'))
      }
    } finally {
      if (!signal?.aborted) setIsLoading(false)
    }
  }, [keyword, page, reloadVersion, size, statusFilter])

  useEffect(() => {
    const controller = new AbortController()
    void loadMessages(controller.signal)
    return () => controller.abort()
  }, [loadMessages])

  const submitSearch = (event) => {
    event.preventDefault()
    setPage(0)
    setKeyword(search.trim())
  }

  const updateStatus = async (message, status) => {
    if (message.status === status) return
    setUpdatingId(message.id)
    try {
      const updatedMessage = await updateContactMessageStatus(message.id, status)
      setMessages((current) => current.map((item) => item.id === message.id ? updatedMessage : item))
      setSelectedMessage((current) => current?.id === message.id ? updatedMessage : current)
      onToast(`Đã chuyển tin nhắn sang "${statusLabel(status)}".`)
      setReloadVersion((version) => version + 1)
    } catch (error) {
      setLoadError(getUserFacingErrorMessage(error, 'Không thể cập nhật trạng thái tin nhắn.'))
    } finally {
      setUpdatingId(null)
    }
  }

  const changeFilter = (value) => {
    setPage(0)
    setStatusFilter(value)
  }

  const changePageSize = (value) => {
    setPage(0)
    setSize(value)
  }

  const newCount = useMemo(() => messages.filter((m) => m.status === 'NEW').length, [messages])
  const inProgressCount = useMemo(() => messages.filter((m) => m.status === 'IN_PROGRESS').length, [messages])
  const resolvedCount = useMemo(() => messages.filter((m) => m.status === 'RESOLVED').length, [messages])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tin nhắn hỗ trợ"
        actions={(
          <Button variant="secondary" onClick={() => setReloadVersion((version) => version + 1)}>
            <Icon name="refresh" size={15} /> Tải lại
          </Button>
        )}
      />

      <section aria-label="Tổng quan tin nhắn" className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Tổng tin nhắn', value: pageInfo.totalElements, icon: 'receipt' },
          { label: 'Tin nhắn mới', value: newCount, icon: 'bell', highlight: newCount > 0 },
          { label: 'Đang xử lý', value: inProgressCount, icon: 'clock' },
          { label: 'Đã giải quyết', value: resolvedCount, icon: 'check' },
        ].map((stat) => (
          <article
            key={stat.label}
            className={`soft-shadow flex items-center justify-between rounded-2xl border p-4 sm:p-5 transition hover:shadow-md ${
              stat.highlight
                ? 'border-amber-300 bg-amber-50/80'
                : 'border-border bg-paper'
            }`}
          >
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-muted">{stat.label}</p>
              <p className="font-display mt-2 truncate text-2xl font-bold text-rosewood">
                {stat.value}
              </p>
            </div>
            <span className="ml-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-caramel-soft text-rosewood">
              <Icon name={stat.icon} size={18} />
            </span>
          </article>
        ))}
      </section>

      <section className="soft-shadow rounded-2xl border border-border bg-paper p-4 sm:p-5">
        <form onSubmit={submitSearch} className="flex flex-col gap-3 sm:flex-row">
          <label className="min-w-0 flex-1 relative">
            <span className="sr-only">Tìm tin nhắn</span>
            <input
              type="search"
              maxLength={120}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Tìm tên, email, chủ đề hoặc nội dung..."
              className="h-10 w-full rounded-xl border border-border bg-white px-3 text-xs text-rosewood outline-none focus:border-caramel placeholder:text-muted"
            />
          </label>
          <label className="sm:w-48">
            <span className="sr-only">Lọc theo trạng thái</span>
            <select value={statusFilter} onChange={(event) => changeFilter(event.target.value)} className="h-10 w-full rounded-xl border border-border bg-white px-3 text-xs text-rosewood outline-none focus:border-caramel">
              <option value="">Tất cả trạng thái</option>
              {messageStatuses.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
            </select>
          </label>
          <Button type="submit">
            <Icon name="search" size={15} /> Tìm kiếm
          </Button>
        </form>
      </section>

      {loadError && <ErrorState title="Hộp thư chưa cập nhật" description={loadError} onRetry={() => setReloadVersion((version) => version + 1)} />}
      {isLoading ? (
        <LoadingState label="Đang tải tin nhắn hỗ trợ…" />
      ) : !loadError && messages.length === 0 ? (
        <EmptyState title="Chưa có tin nhắn" description="Tin khách gửi qua form liên hệ sẽ xuất hiện tại đây." />
      ) : !loadError ? (
        <section className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
          <ul className="divide-y divide-border">
            {messages.map((message) => (
              <li key={message.id}>
                <button type="button" onClick={() => setSelectedMessage(message)} className="flex w-full flex-col gap-3 px-4 py-4 text-left transition hover:bg-petal/60 sm:flex-row sm:items-center sm:px-5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-caramel-soft font-bold text-xs text-rosewood shadow-sm">
                    {(message.name || 'KH').trim()[0].toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <strong className="truncate text-sm text-rosewood font-bold">{message.subject}</strong>
                      <StatusBadge status={statusLabel(message.status)} />
                    </span>
                    <span className="mt-1 block text-xs text-muted font-medium">{message.name} · {message.email}</span>
                    <span className="mt-1.5 block line-clamp-2 text-xs leading-5 text-rosewood/80">{message.message}</span>
                  </span>
                  <time className="shrink-0 text-xs text-muted">{formatDateTime(message.createdAt)}</time>
                </button>
              </li>
            ))}
          </ul>
          <PaginationControls
            page={page}
            size={size}
            totalElements={pageInfo.totalElements}
            totalPages={pageInfo.totalPages}
            onPageChange={setPage}
            onSizeChange={changePageSize}
          />
        </section>
      ) : null}

      <Modal
        open={Boolean(selectedMessage)}
        title={selectedMessage?.subject ?? ''}
        onClose={() => setSelectedMessage(null)}
        size="max-w-2xl"
      >
        {selectedMessage && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-rosewood">{selectedMessage.name}</p>
                <a href={`mailto:${selectedMessage.email}`} className="mt-1 inline-block text-xs font-medium text-caramel-hover underline underline-offset-2">{selectedMessage.email}</a>
              </div>
              <time className="text-[10px] text-muted">{formatDateTime(selectedMessage.createdAt)}</time>
            </div>
            <div className="whitespace-pre-wrap rounded-xl border border-border bg-cream p-4 text-sm leading-6 text-rosewood">{selectedMessage.message}</div>
            <label className="block text-xs font-semibold text-rosewood" htmlFor="contact-message-status">Trạng thái xử lý</label>
            <select
              id="contact-message-status"
              value={selectedMessage.status}
              disabled={updatingId === selectedMessage.id}
              onChange={(event) => void updateStatus(selectedMessage, event.target.value)}
              className="h-10 w-full rounded-xl border border-border bg-white px-3 text-sm text-rosewood outline-none focus:border-caramel disabled:opacity-60 sm:w-56"
            >
              {messageStatuses.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
            </select>
          </div>
        )}
      </Modal>
    </div>
  )
}
