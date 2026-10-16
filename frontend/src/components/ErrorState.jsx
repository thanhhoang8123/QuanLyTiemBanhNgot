import Button from './Button.jsx'

export default function ErrorState({
  title = 'Không thể tải dữ liệu',
  description = 'Đã xảy ra lỗi khi xử lý yêu cầu.',
  onRetry,
  retryLabel = 'Thử lại',
  className = '',
}) {
  return (
    <div
      role="alert"
      className={`flex flex-col items-center rounded-2xl border border-danger-line bg-danger-soft/50 px-5 py-8 text-center ${className}`}
    >
      <p className="font-display text-base font-semibold text-danger">{title}</p>
      <p className="mt-1 max-w-lg text-sm leading-6 text-muted">{description}</p>
      {onRetry && (
        <Button variant="secondary" className="mt-4" onClick={onRetry}>
          {retryLabel}
        </Button>
      )}
    </div>
  )
}
