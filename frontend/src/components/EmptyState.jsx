import Icon from './Icon.jsx'

export default function EmptyState({
  title = 'Chưa có dữ liệu',
  description,
  descriptionClassName = 'text-sm',
  icon = 'search',
  action,
  className = '',
}) {
  return (
    <div className={`flex flex-col items-center px-5 py-12 text-center ${className}`}>
      <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-caramel-soft text-rosewood">
        <Icon name={icon} size={19} />
      </span>
      <p className="font-display text-base font-semibold text-rosewood">{title}</p>
      {description && (
        <p className={`mt-1 max-w-md leading-6 text-muted ${descriptionClassName}`}>
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
