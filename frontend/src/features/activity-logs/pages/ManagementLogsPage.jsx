import { useCallback, useEffect, useMemo, useState } from 'react'
import Button from '../../../components/Button.jsx'
import DataTable from '../../../components/DataTable.jsx'
import ErrorState from '../../../components/ErrorState.jsx'
import LoadingState from '../../../components/LoadingState.jsx'
import PageHeader from '../../../components/PageHeader.jsx'
import SearchFilter from '../../../components/SearchFilter.jsx'
import { getActivityLogs, getOrderStatusHistory } from '../services/managementLogsService.js'
import { getUserFacingErrorMessage } from '../../../services/apiClient.js'

const tabs = [
  { id: 'activity', label: 'Nhật ký hoạt động' },
  { id: 'order-status', label: 'Lịch sử trạng thái đơn' },
]

function formatDateTime(value) {
  if (!value) return '—'
  const date = new Date(value.endsWith('Z') ? value : `${value}Z`)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

function getErrorMessage(error) {
  return getUserFacingErrorMessage(error, 'Không thể tải nhật ký.')
}

export default function ManagementLogsPage() {
  const [tab, setTab] = useState('activity')
  const [records, setRecords] = useState([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refreshVersion, setRefreshVersion] = useState(0)

  const loadRecords = useCallback(async (signal) => {
    setLoading(true)
    setError('')
    try {
      const result = tab === 'activity'
        ? await getActivityLogs({ limit: 100, signal })
        : await getOrderStatusHistory({ limit: 100, signal })
      if (!Array.isArray(result)) throw new Error('Chưa thể tải nhật ký. Vui lòng thử lại.')
      setRecords(result)
    } catch (loadError) {
      if (signal?.aborted || loadError.name === 'AbortError') return
      setError(getErrorMessage(loadError))
    } finally {
      if (!signal?.aborted) setLoading(false)
    }
  }, [tab])

  useEffect(() => {
    const controller = new AbortController()
    loadRecords(controller.signal)
    return () => controller.abort()
  }, [loadRecords, refreshVersion])

  const filteredRecords = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('vi')
    if (!normalizedQuery) return records
    return records.filter((record) => Object.values(record)
      .filter((value) => value !== null && value !== undefined)
      .join(' ')
      .toLocaleLowerCase('vi')
      .includes(normalizedQuery))
  }, [query, records])

  const columns = tab === 'activity'
    ? [
      { key: 'createdAt', label: 'Thời gian', render: (record) => formatDateTime(record.createdAt) },
      { key: 'username', label: 'Người thực hiện', render: (record) => record.username || 'Hệ thống' },
      { key: 'action', label: 'Thao tác' },
      { key: 'entity', label: 'Đối tượng', render: (record) => `${record.entityType || '—'} #${record.entityId || '—'}` },
      { key: 'description', label: 'Chi tiết', render: (record) => record.description || '—' },
    ]
    : [
      { key: 'createdAt', label: 'Thời gian', render: (record) => formatDateTime(record.createdAt) },
      { key: 'orderId', label: 'Mã đơn', render: (record) => `#${record.orderId}` },
      { key: 'status', label: 'Thay đổi', render: (record) => `${record.oldStatus || 'Mới'} → ${record.newStatus || '—'}` },
      { key: 'changedBy', label: 'Người thực hiện', render: (record) => record.changedBy || 'Hệ thống' },
      { key: 'note', label: 'Ghi chú', render: (record) => record.note || '—' },
    ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Nhật ký hoạt động & lịch sử đơn hàng"
        description="Tra cứu gần đây các hoạt động và thay đổi trạng thái đơn. Dữ liệu chỉ đọc để bảo toàn dấu vết kiểm toán."
        actions={(
          <Button variant="secondary" onClick={() => setRefreshVersion((version) => version + 1)}>
            Tải lại
          </Button>
        )}
      />

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Loại nhật ký">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            onClick={() => {
              setTab(item.id)
              setQuery('')
            }}
            className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
              tab === item.id ? 'bg-rosewood text-white' : 'border border-border bg-white text-rosewood hover:bg-petal'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <section className="soft-shadow overflow-hidden rounded-2xl border border-border bg-paper">
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div>
            <h2 className="font-display text-lg font-semibold text-rosewood">
              {tab === 'activity' ? 'Hoạt động gần đây' : 'Lịch sử trạng thái đơn'}
            </h2>
            <p className="mt-1 text-[11px] text-muted">
              Hiển thị tối đa 100 bản ghi mới nhất; tìm kiếm trong dữ liệu đã tải.
            </p>
          </div>
          <div className="w-full sm:max-w-xs">
            <SearchFilter
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Tìm trong nhật ký..."
            />
          </div>
        </div>

        {loading
          ? <LoadingState label="Đang tải nhật ký..." />
          : error
            ? (
              <ErrorState
                description={error}
                onRetry={() => setRefreshVersion((version) => version + 1)}
              />
            )
            : (
              <DataTable
                columns={columns}
                rows={filteredRecords}
                rowKey={(record) => record.id}
                ariaLabel={tab === 'activity' ? 'Nhật ký hoạt động' : 'Lịch sử trạng thái đơn'}
                emptyTitle="Chưa có bản ghi"
                emptyDescription="Chưa có dữ liệu phù hợp trong 100 bản ghi gần nhất."
              />
            )}
      </section>
    </div>
  )
}
