export default function LoadingState({ label = 'Đang tải dữ liệu...', className = '' }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex items-center justify-center gap-3 px-5 py-12 text-sm text-muted ${className}`}
    >
      <span
        aria-hidden="true"
        className="h-5 w-5 animate-spin rounded-full border-2 border-caramel/30 border-t-caramel motion-reduce:animate-none"
      />
      <span>{label}</span>
    </div>
  )
}
