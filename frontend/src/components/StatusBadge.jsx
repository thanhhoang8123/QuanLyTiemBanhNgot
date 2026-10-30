const statusConfigs = {
  'Đang bán': { bg: 'border-emerald-200/80 bg-emerald-50 text-emerald-800', dot: 'bg-emerald-500' },
  'Đang hoạt động': { bg: 'border-emerald-200/80 bg-emerald-50 text-emerald-800', dot: 'bg-emerald-500' },
  'Hoàn tất': { bg: 'border-emerald-200/80 bg-emerald-50 text-emerald-800', dot: 'bg-emerald-500' },
  'Đã nhận': { bg: 'border-emerald-200/80 bg-emerald-50 text-emerald-800', dot: 'bg-emerald-500' },
  'Còn hàng': { bg: 'border-emerald-200/80 bg-emerald-50 text-emerald-800', dot: 'bg-emerald-500' },
  'Đã thanh toán': { bg: 'border-emerald-200/80 bg-emerald-50 text-emerald-800', dot: 'bg-emerald-500' },
  'Thành công': { bg: 'border-emerald-200/80 bg-emerald-50 text-emerald-800', dot: 'bg-emerald-500' },
  'Đã xử lý': { bg: 'border-emerald-200/80 bg-emerald-50 text-emerald-800', dot: 'bg-emerald-500' },

  'Chờ xử lý': { bg: 'border-amber-200/80 bg-amber-50 text-amber-800', dot: 'bg-amber-500' },
  'Chờ xác nhận': { bg: 'border-amber-200/80 bg-amber-50 text-amber-800', dot: 'bg-amber-500' },
  'Chờ thanh toán': { bg: 'border-amber-200/80 bg-amber-50 text-amber-800', dot: 'bg-amber-500' },
  'Đang chuẩn bị': { bg: 'border-amber-200/80 bg-amber-50 text-amber-800', dot: 'bg-amber-500' },
  'Đang xử lý': { bg: 'border-amber-200/80 bg-amber-50 text-amber-800', dot: 'bg-amber-500' },
  'Sắp hết': { bg: 'border-amber-200/80 bg-amber-50 text-amber-800', dot: 'bg-amber-500' },
  'Chưa thanh toán': { bg: 'border-amber-200/80 bg-amber-50 text-amber-800', dot: 'bg-amber-500' },

  'Hết hàng': { bg: 'border-rose-200/80 bg-rose-50 text-rose-800', dot: 'bg-rose-500' },
  'Đã hủy': { bg: 'border-rose-200/80 bg-rose-50 text-rose-800', dot: 'bg-rose-500' },
  'Thất bại': { bg: 'border-rose-200/80 bg-rose-50 text-rose-800', dot: 'bg-rose-500' },
  'Mới': { bg: 'border-sky-200/80 bg-sky-50 text-sky-800', dot: 'bg-sky-500' },

  'Tạm ẩn': { bg: 'border-border bg-paper text-muted', dot: 'bg-stone-400' },
  'Ngừng hoạt động': { bg: 'border-border bg-paper text-muted', dot: 'bg-stone-400' },
  'Sẵn sàng': { bg: 'border-caramel/40 bg-caramel-soft text-rosewood', dot: 'bg-caramel' },
}

export default function StatusBadge({ status, className = '' }) {
  const config = statusConfigs[status] ?? {
    bg: 'border-border bg-paper text-muted',
    dot: 'bg-stone-400',
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${config.bg} ${className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
      <span>{status}</span>
    </span>
  )
}
