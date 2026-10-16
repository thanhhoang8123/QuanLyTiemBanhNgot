import Icon from './Icon.jsx'

export default function SearchFilter({
  value,
  onChange,
  label = 'Tìm kiếm',
  placeholder = 'Nhập từ khóa...',
  children,
  className = '',
}) {
  return (
    <div className={`flex flex-col gap-3 sm:flex-row sm:items-center ${className}`}>
      <label className="relative block min-w-0 flex-1">
        <span className="sr-only">{label}</span>
        <Icon
          name="search"
          size={17}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
        />
        <input
          type="search"
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="h-10 w-full rounded-xl border border-border bg-paper pl-10 pr-3 text-sm text-rosewood placeholder:text-muted/75 focus:border-caramel focus:outline-none"
        />
      </label>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  )
}
