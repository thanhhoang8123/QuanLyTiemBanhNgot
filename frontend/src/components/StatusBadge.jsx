const statusStyles = {
  'Đang bán': 'border-success-line bg-success-soft text-success',
  'Tạm ẩn': 'border-border bg-neutral-soft text-neutral-ink',
  'Đang hoạt động': 'border-success-line bg-success-soft text-success',
  'Ngừng hoạt động': 'border-border bg-neutral-soft text-neutral-ink',
  'Chờ xử lý': 'border-warning-line bg-warning-soft text-warning',
  'Đã nhận': 'border-success-line bg-success-soft text-success',
  'Còn hàng': 'border-success-line bg-success-soft text-success',
  'Sắp hết': 'border-warning-line bg-warning-soft text-warning',
  'Hết hàng': 'border-danger-line bg-danger-soft text-danger',
  'Mới': 'border-border bg-caramel-soft text-rosewood',
  'Chờ xác nhận': 'border-danger-line bg-danger-soft text-danger',
  'Đang chuẩn bị': 'border-warning-line bg-warning-soft text-warning',
  'Sẵn sàng': 'border-border bg-caramel-soft text-rosewood',
  'Hoàn tất': 'border-success-line bg-success-soft text-success',
  'Đã hủy': 'border-danger-line bg-danger-soft text-danger',
  'Đã thanh toán': 'border-success-line bg-success-soft text-success',
  'Chưa thanh toán': 'border-warning-line bg-warning-soft text-warning',
}

export default function StatusBadge({ status, className = '' }) {
  return (
    <span className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-1 text-[10px] font-bold ${statusStyles[status] ?? 'border-border bg-neutral-soft text-neutral-ink'} ${className}`}>
      {status}
    </span>
  )
}
